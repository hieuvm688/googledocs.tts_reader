"""Web Server và REST API cho Google Docs Text-to-Speech Reader.

Tuân thủ nghiêm ngặt chuẩn Clean Architecture (Tầng Presentation).
Sử dụng aiohttp.web - thư viện bất đồng bộ mã nguồn mở (Apache-2.0).
"""
import asyncio
import os
import uuid
import webbrowser
from pathlib import Path
from typing import Optional, Tuple

from aiohttp import web
from rich.console import Console

from src.domain.exceptions.base import GDocsTtsException
from src.domain.entities.audio_track import AudioTrack
from src.infrastructure.document_sources.google_docs_url_adapter import GoogleDocsUrlAdapter
from src.infrastructure.document_sources.docx_file_adapter import DocxFileAdapter
from src.infrastructure.document_sources.raw_text_adapter import RawTextAdapter
from src.infrastructure.tts_engines.edge_tts_adapter import EdgeTtsAdapter
from src.infrastructure.audio_players.mac_afplay_adapter import MacAfplayAdapter
from src.application.dtos.tts_dtos import ReadAndSpeakRequest
from src.application.use_cases.read_and_speak_use_case import ReadAndSpeakUseCase
from src.application.use_cases.list_voices_use_case import ListVoicesUseCase

console = Console()

# Đường dẫn thư mục tĩnh và lưu trữ audio
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
OUTPUT_AUDIO_DIR = Path.cwd() / "output" / "audio"
UPLOAD_DIR = Path.cwd() / "output" / "uploads"

OUTPUT_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def create_web_container() -> Tuple[ReadAndSpeakUseCase, ListVoicesUseCase, MacAfplayAdapter]:
    """Dependency Injection Container cho tầng Web Presentation."""
    doc_sources = [
        GoogleDocsUrlAdapter(),
        DocxFileAdapter(),
        RawTextAdapter(),
    ]
    tts_engine = EdgeTtsAdapter()
    audio_player = MacAfplayAdapter()

    read_and_speak_uc = ReadAndSpeakUseCase(
        document_sources=doc_sources,
        tts_engine=tts_engine,
        audio_player=audio_player
    )
    list_voices_uc = ListVoicesUseCase(tts_engine=tts_engine)

    return read_and_speak_uc, list_voices_uc, audio_player


class WebTtsController:
    """Controller xử lý các HTTP request cho ứng dụng web."""

    def __init__(
        self,
        read_and_speak_uc: ReadAndSpeakUseCase,
        list_voices_uc: ListVoicesUseCase,
        audio_player: MacAfplayAdapter
    ):
        self._read_and_speak_uc = read_and_speak_uc
        self._list_voices_uc = list_voices_uc
        self._audio_player = audio_player

    async def get_index(self, request: web.Request) -> web.Response:
        """Phục vụ file index.html chính."""
        index_file = STATIC_DIR / "index.html"
        if not index_file.exists():
            return web.Response(text="Giao diện Web đang được khởi tạo...", status=200, content_type="text/html")
        return web.FileResponse(index_file)

    async def get_voices(self, request: web.Request) -> web.Response:
        """API lấy danh sách giọng đọc."""
        locale = request.query.get("locale", "vi")
        try:
            voices = await self._list_voices_uc.execute(locale_prefix=locale)
            data = [
                {
                    "voice_id": v.voice_id,
                    "name": v.name,
                    "locale": v.locale,
                    "gender": v.gender,
                    "is_default": v.is_default
                }
                for v in voices
            ]
            return web.json_response({"status": "success", "data": data})
        except Exception as exc:
            return web.json_response(
                {"status": "error", "message": f"Không thể lấy danh sách giọng đọc: {str(exc)}"},
                status=500
            )

    async def post_read(self, request: web.Request) -> web.Response:
        """API tiếp nhận yêu cầu chuyển đổi văn bản sang âm thanh."""
        content_type = request.content_type

        source_path_or_url: str = ""
        voice_id: str = "vi-VN-HoaiMyNeural"
        rate: str = "+0%"
        play_mac: bool = False

        if "multipart" in content_type:
            # Xử lý upload tệp
            reader = await request.multipart()
            uploaded_file_path: Optional[Path] = None

            while True:
                part = await reader.next()
                if part is None:
                    break

                field_name = part.name
                if field_name == "file":
                    filename = part.filename or "uploaded_doc.docx"
                    safe_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
                    uploaded_file_path = UPLOAD_DIR / safe_filename
                    with open(uploaded_file_path, "wb") as f:
                        while True:
                            chunk = await part.read_chunk()
                            if not chunk:
                                break
                            f.write(chunk)
                elif field_name == "voice":
                    voice_id = (await part.text()).strip() or voice_id
                elif field_name == "rate":
                    rate = (await part.text()).strip() or rate
                elif field_name == "play_mac":
                    val = (await part.text()).strip().lower()
                    play_mac = val in ["true", "1", "yes"]

            if not uploaded_file_path:
                return web.json_response(
                    {"status": "error", "message": "Vui lòng chọn tệp tin cần đọc!"},
                    status=400
                )
            source_path_or_url = str(uploaded_file_path)

        else:
            # Xử lý JSON payload
            try:
                body = await request.json()
            except Exception:
                return web.json_response(
                    {"status": "error", "message": "Dữ liệu JSON không hợp lệ!"},
                    status=400
                )

            input_type = body.get("type", "url")
            raw_value = body.get("source", "").strip()
            voice_id = body.get("voice", "vi-VN-HoaiMyNeural")
            rate = body.get("rate", "+0%")
            play_mac = bool(body.get("play_mac", False))

            if not raw_value:
                return web.json_response(
                    {"status": "error", "message": "Nội dung hoặc liên kết không được để trống!"},
                    status=400
                )

            if input_type == "text":
                # Nhập trực tiếp văn bản
                source_path_or_url = f"text://{raw_value}"
            else:
                source_path_or_url = raw_value

        # Tạo tên file output riêng biệt
        output_filename = f"tts_{uuid.uuid4().hex[:12]}.mp3"
        output_file_path = OUTPUT_AUDIO_DIR / output_filename

        tts_req = ReadAndSpeakRequest(
            source_path_or_url=source_path_or_url,
            voice_id=voice_id,
            rate=rate,
            export_path=str(output_file_path),
            play_audio=play_mac
        )

        try:
            result = await self._read_and_speak_uc.execute(tts_req)
            return web.json_response({
                "status": "success",
                "data": {
                    "document_title": result.document_title,
                    "character_count": result.character_count,
                    "word_count": result.word_count,
                    "voice_used": result.voice_used,
                    "audio_filename": output_filename,
                    "audio_url": f"/api/audio/{output_filename}",
                    "playback_mac": result.playback_successful,
                    "summary_message": result.summary_message
                }
            })
        except GDocsTtsException as err:
            return web.json_response(
                {
                    "status": "error",
                    "message": err.message,
                    "details": err.details
                },
                status=400
            )
        except Exception as exc:
            return web.json_response(
                {
                    "status": "error",
                    "message": f"Lỗi hệ thống: {str(exc)}",
                    "details": ""
                },
                status=500
            )

    async def get_audio(self, request: web.Request) -> web.Response:
        """API stream tệp âm thanh MP3 để trình duyệt phát hoặc tải về."""
        filename = request.match_info.get("filename", "")
        safe_filename = Path(filename).name  # Tránh path traversal
        file_path = OUTPUT_AUDIO_DIR / safe_filename

        if not file_path.exists() or not file_path.is_file():
            return web.Response(text="Không tìm thấy tệp âm thanh.", status=404)

        return web.FileResponse(file_path, headers={
            "Content-Type": "audio/mpeg",
            "Accept-Ranges": "bytes",
            "Content-Disposition": f'inline; filename="{safe_filename}"'
        })

    async def post_play_mac(self, request: web.Request) -> web.Response:
        """API phát âm thanh ra loa máy Mac thông qua afplay."""
        try:
            body = await request.json()
            filename = body.get("filename", "")
            safe_filename = Path(filename).name
            file_path = OUTPUT_AUDIO_DIR / safe_filename

            if not file_path.exists():
                return web.json_response({"status": "error", "message": "Tệp âm thanh không tồn tại."}, status=404)

            track = AudioTrack(file_path=file_path)
            self._audio_player.play(track)
            return web.json_response({"status": "success", "message": "Đang phát qua loa máy Mac."})
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def get_health(self, request: web.Request) -> web.Response:
        """Health check endpoint."""
        return web.json_response({"status": "ok", "service": "gdocs_tts_reader"})


def build_web_app() -> web.Application:
    """Xây dựng ứng dụng aiohttp web với đầy đủ router và DI."""
    read_and_speak_uc, list_voices_uc, audio_player = create_web_container()
    controller = WebTtsController(read_and_speak_uc, list_voices_uc, audio_player)

    app = web.Application(client_max_size=50 * 1024 * 1024)  # 50MB max file upload

    # API routes
    app.router.add_get("/api/health", controller.get_health)
    app.router.add_get("/api/voices", controller.get_voices)
    app.router.add_post("/api/read", controller.post_read)
    app.router.add_get("/api/audio/{filename}", controller.get_audio)
    app.router.add_post("/api/play-mac", controller.post_play_mac)

    # Static UI routes
    app.router.add_get("/", controller.get_index)
    if STATIC_DIR.exists():
        app.router.add_static("/static/", path=STATIC_DIR, name="static")

    return app


async def start_background_browser(url: str, delay: float = 0.8) -> None:
    """Mở trình duyệt sau khi server bắt đầu chạy."""
    await asyncio.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def run_web_server(host: str = "127.0.0.1", port: int = 8000, open_browser: bool = True) -> None:
    """Hàm khởi động web server cho Presentation layer."""
    app = build_web_app()
    url = f"http://{host}:{port}"

    console.print(f"\n[bold cyan]🚀 ĐANG KHỞI ĐỘNG GIAO DIỆN WEB REACT LOCAL...[/bold cyan]")
    console.print(f"[bold green]▶ Địa chỉ Web:[/bold green] [underline cyan]{url}[/underline cyan]")
    console.print(f"[dim]Bấm Ctrl+C trên terminal để dừng server bất kỳ lúc nào.[/dim]\n")

    if open_browser:
        loop = asyncio.get_event_loop()
        loop.create_task(start_background_browser(url))

    web.run_app(app, host=host, port=port, print=None)
