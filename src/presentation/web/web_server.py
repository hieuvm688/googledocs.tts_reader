"""Web Server và REST API cho Google Docs Text-to-Speech Reader.

Tuân thủ nghiêm ngặt chuẩn Clean Architecture (Tầng Presentation).
Sử dụng aiohttp.web - thư viện bất đồng bộ mã nguồn mở (Apache-2.0).
"""
import asyncio
import json
import os
import uuid
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

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
from src.application.use_cases.manage_playback_use_case import ManagePlaybackUseCase

console = Console()

# Đường dẫn thư mục tĩnh và lưu trữ audio
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
OUTPUT_AUDIO_DIR = Path.cwd() / "output" / "audio"
UPLOAD_DIR = Path.cwd() / "output" / "uploads"
METADATA_FILE = OUTPUT_AUDIO_DIR / "metadata.json"

OUTPUT_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _load_metadata() -> dict:
    """Đọc dữ liệu metadata từ metadata.json."""
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_metadata(data: dict) -> None:
    """Lưu dữ liệu metadata vào metadata.json."""
    try:
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        console.print(f"[yellow]Không thể lưu metadata.json: {exc}[/yellow]")


def create_web_container() -> Tuple[ReadAndSpeakUseCase, ListVoicesUseCase, ManagePlaybackUseCase, MacAfplayAdapter]:
    """Dependency Injection Container cho tầng Web Presentation."""
    doc_sources = [
        GoogleDocsUrlAdapter(),
        DocxFileAdapter(),
        RawTextAdapter(),
    ]
    tts_engine = EdgeTtsAdapter(max_concurrency=3)
    audio_player = MacAfplayAdapter()

    read_and_speak_uc = ReadAndSpeakUseCase(
        document_sources=doc_sources,
        tts_engine=tts_engine,
        audio_player=audio_player
    )
    list_voices_uc = ListVoicesUseCase(tts_engine=tts_engine)
    manage_playback_uc = ManagePlaybackUseCase(audio_player=audio_player)

    return read_and_speak_uc, list_voices_uc, manage_playback_uc, audio_player


class WebTtsController:
    """Controller xử lý các HTTP request cho ứng dụng web."""

    def __init__(
        self,
        read_and_speak_uc: ReadAndSpeakUseCase,
        list_voices_uc: ListVoicesUseCase,
        manage_playback_uc: ManagePlaybackUseCase,
        audio_player: MacAfplayAdapter
    ):
        self._read_and_speak_uc = read_and_speak_uc
        self._list_voices_uc = list_voices_uc
        self._manage_playback_uc = manage_playback_uc
        self._audio_player = audio_player
        self._active_jobs: Dict[str, asyncio.Task] = {}
        self._job_metadata: Dict[str, dict] = {}

    async def get_index(self, request: web.Request) -> web.Response:
        """Phục vụ file index.html chính."""
        index_file = STATIC_DIR / "index.html"
        if not index_file.exists():
            return web.Response(text="Giao diện Web đang được khởi tạo...", status=200, content_type="text/html")
        return web.FileResponse(index_file)

    async def get_voices(self, request: web.Request) -> web.Response:
        """API lấy danh sách giọng đọc theo locale."""
        locale = request.query.get("locale", "")
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
        job_id: str = uuid.uuid4().hex[:12]

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
                elif field_name == "job_id":
                    val = (await part.text()).strip()
                    if val:
                        job_id = val
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
            if body.get("job_id"):
                job_id = str(body["job_id"]).strip()

            if not raw_value:
                return web.json_response(
                    {"status": "error", "message": "Nội dung hoặc liên kết không được để trống!"},
                    status=400
                )

            if input_type == "text":
                source_path_or_url = f"text://{raw_value}"
            else:
                source_path_or_url = raw_value

        # Tạo tên file output riêng biệt
        output_filename = f"tts_{job_id}.mp3"
        output_file_path = OUTPUT_AUDIO_DIR / output_filename

        tts_req = ReadAndSpeakRequest(
            source_path_or_url=source_path_or_url,
            voice_id=voice_id,
            rate=rate,
            export_path=str(output_file_path),
            play_audio=play_mac
        )

        current_task = asyncio.current_task()
        if current_task:
            self._active_jobs[job_id] = current_task

        self._job_metadata[job_id] = {
            "audio_filename": output_filename,
            "document_title": "Tài liệu",
            "voice_used": voice_id
        }

        try:
            result = await self._read_and_speak_uc.execute(tts_req)
            self._job_metadata[job_id]["document_title"] = result.document_title

            # Lưu tiêu đề tài liệu vào metadata.json của thư viện
            meta_all = _load_metadata()
            meta_all[output_filename] = {"title": result.document_title}
            _save_metadata(meta_all)

            return web.json_response({
                "status": "partial" if result.is_partial else "success",
                "data": {
                    "job_id": job_id,
                    "document_title": result.document_title,
                    "character_count": result.character_count,
                    "word_count": result.word_count,
                    "voice_used": result.voice_used,
                    "audio_filename": output_filename,
                    "audio_url": f"/api/audio/{output_filename}",
                    "playback_mac": result.playback_successful,
                    "is_partial": result.is_partial,
                    "summary_message": result.summary_message
                }
            })
        except asyncio.CancelledError:
            # Khi bị hủy giữa chừng từ API stop
            if output_file_path.exists() and output_file_path.stat().st_size > 0:
                meta = self._job_metadata.get(job_id, {})
                partial_title = meta.get("document_title", "Tài liệu (Một phần)")
                meta_all = _load_metadata()
                meta_all[output_filename] = {"title": partial_title}
                _save_metadata(meta_all)

                return web.json_response({
                    "status": "partial",
                    "data": {
                        "job_id": job_id,
                        "document_title": partial_title,
                        "audio_filename": output_filename,
                        "audio_url": f"/api/audio/{output_filename}",
                        "is_partial": True,
                        "playback_mac": False,
                        "summary_message": "Đã dừng xử lý. Đoạn âm thanh thu được đã sẵn sàng để nghe hoặc tải về."
                    }
                })
            return web.json_response({
                "status": "stopped",
                "message": "Quá trình xử lý đã được dừng."
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
        finally:
            self._active_jobs.pop(job_id, None)

    async def post_stop(self, request: web.Request) -> web.Response:
        """API dừng tiến trình xử lý TTS giữa chừng."""
        try:
            body = await request.json()
            job_id = body.get("job_id", "")
        except Exception:
            return web.json_response({"status": "error", "message": "Dữ liệu không hợp lệ."}, status=400)

        if not job_id:
            return web.json_response({"status": "error", "message": "Thiếu mã job_id."}, status=400)

        task = self._active_jobs.get(job_id)
        if task and not task.done():
            task.cancel()
            try:
                # Đợi một chút để task kết thúc và ghi file an toàn
                await asyncio.wait_for(asyncio.shield(task), timeout=1.5)
            except Exception:
                pass

        # Kiểm tra file đã tạo
        meta = self._job_metadata.get(job_id, {})
        filename = meta.get("audio_filename", f"tts_{job_id}.mp3")
        file_path = OUTPUT_AUDIO_DIR / filename

        if file_path.exists() and file_path.stat().st_size > 0:
            return web.json_response({
                "status": "partial",
                "data": {
                    "job_id": job_id,
                    "document_title": meta.get("document_title", "Tài liệu (Một phần)"),
                    "audio_filename": filename,
                    "audio_url": f"/api/audio/{filename}",
                    "is_partial": True,
                    "playback_mac": False,
                    "summary_message": "Đã dừng xử lý. Đoạn âm thanh thu được đã sẵn sàng để nghe hoặc tải về."
                }
            })

        return web.json_response({
            "status": "stopped",
            "message": "Đã dừng tiến trình chuyển đổi."
        })

    async def get_library(self, request: web.Request) -> web.Response:
        """API trả về danh sách toàn bộ các file audio trong thư viện."""
        audio_files = []
        try:
            meta_all = _load_metadata()
            for file_p in sorted(OUTPUT_AUDIO_DIR.glob("*.mp3"), key=lambda p: p.stat().st_mtime, reverse=True):
                stat = file_p.stat()
                size_kb = stat.st_size / 1024
                size_formatted = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb/1024:.2f} MB"
                created_str = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

                # Trích xuất tiêu đề từ metadata hoặc tên file
                clean_name = file_p.stem
                is_partial = "partial" in clean_name.lower()
                meta_item = meta_all.get(file_p.name, {})
                title = meta_item.get("title") or clean_name.replace("tts_", "Bản thu ")

                audio_files.append({
                    "filename": file_p.name,
                    "title": title,
                    "size_bytes": stat.st_size,
                    "size_formatted": size_formatted,
                    "created_at": created_str,
                    "is_partial": is_partial,
                    "audio_url": f"/api/audio/{file_p.name}"
                })
            return web.json_response({"status": "success", "data": audio_files})
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def delete_audio(self, request: web.Request) -> web.Response:
        """API xóa tệp âm thanh khỏi thư viện."""
        filename = request.match_info.get("filename", "")
        safe_filename = Path(filename).name
        file_path = OUTPUT_AUDIO_DIR / safe_filename

        if not file_path.exists() or not file_path.is_file():
            return web.json_response({"status": "error", "message": "Không tìm thấy tệp cần xóa."}, status=404)

        try:
            file_path.unlink()
            meta_all = _load_metadata()
            if safe_filename in meta_all:
                meta_all.pop(safe_filename, None)
                _save_metadata(meta_all)
            return web.json_response({"status": "success", "message": "Đã xóa tệp âm thanh thành công."})
        except Exception as exc:
            return web.json_response({"status": "error", "message": f"Không thể xóa tệp: {str(exc)}"}, status=500)

    async def post_rename_audio(self, request: web.Request) -> web.Response:
        """API đổi tên/tiêu đề hiển thị của tệp âm thanh."""
        filename = request.match_info.get("filename", "")
        safe_filename = Path(filename).name
        file_path = OUTPUT_AUDIO_DIR / safe_filename

        if not file_path.exists() or not file_path.is_file():
            return web.json_response({"status": "error", "message": "Không tìm thấy tệp âm thanh cần đổi tên."}, status=404)

        try:
            body = await request.json()
            new_title = str(body.get("new_title", "")).strip()
        except Exception:
            return web.json_response({"status": "error", "message": "Dữ liệu JSON không hợp lệ."}, status=400)

        if not new_title:
            return web.json_response({"status": "error", "message": "Tiêu đề mới không được để trống."}, status=400)

        try:
            meta_all = _load_metadata()
            if safe_filename not in meta_all:
                meta_all[safe_filename] = {}
            meta_all[safe_filename]["title"] = new_title
            _save_metadata(meta_all)

            return web.json_response({
                "status": "success",
                "message": "Đã đổi tên bản thu thành công.",
                "data": {
                    "filename": safe_filename,
                    "title": new_title
                }
            })
        except Exception as exc:
            return web.json_response({"status": "error", "message": f"Lỗi khi đổi tên: {str(exc)}"}, status=500)

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
        """API phát âm thanh ra loa máy Mac thông qua afplay (bất đồng bộ, không nghẽn server)."""
        try:
            body = await request.json()
            filename = body.get("filename", "")
            safe_filename = Path(filename).name
            file_path = OUTPUT_AUDIO_DIR / safe_filename

            if not file_path.exists():
                return web.json_response({"status": "error", "message": "Tệp âm thanh không tồn tại."}, status=404)

            track = AudioTrack(file_path=file_path)
            session_dto = self._manage_playback_uc.play_audio(track, blocking=False)
            return web.json_response({
                "status": "success",
                "message": "Đang phát qua loa máy Mac.",
                "data": {
                    "session_id": session_dto.session_id,
                    "filename": session_dto.filename,
                    "title": session_dto.title,
                    "started_at": session_dto.started_at,
                    "pid": session_dto.pid
                }
            })
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def get_playback_sessions(self, request: web.Request) -> web.Response:
        """API lấy danh sách các phiên phát âm thanh đang hoạt động."""
        try:
            sessions = self._manage_playback_uc.get_active_sessions()
            data = [
                {
                    "session_id": s.session_id,
                    "filename": s.filename,
                    "file_path": s.file_path,
                    "title": s.title,
                    "started_at": s.started_at,
                    "is_active": s.is_active,
                    "pid": s.pid
                }
                for s in sessions
            ]
            return web.json_response({"status": "success", "data": data})
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def post_stop_playback(self, request: web.Request) -> web.Response:
        """API dừng một phiên phát âm thanh cụ thể hoặc phiên gần nhất."""
        try:
            session_id = None
            if request.can_read_body:
                body = await request.json()
                session_id = body.get("session_id")
        except Exception:
            session_id = None

        try:
            stopped = self._manage_playback_uc.stop_playback(session_id=session_id)
            if stopped:
                return web.json_response({"status": "success", "message": "Đã dừng phát âm thanh thành công."})
            return web.json_response({"status": "not_found", "message": "Không tìm thấy phiên phát âm thanh nào đang chạy."}, status=404)
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def post_stop_all_playback(self, request: web.Request) -> web.Response:
        """API dừng toàn bộ các tiến trình phát âm thanh đang chạy dưới nền."""
        try:
            stopped_count = self._manage_playback_uc.stop_all_playbacks()
            return web.json_response({
                "status": "success",
                "stopped_count": stopped_count,
                "message": f"Đã dừng {stopped_count} phiên phát âm thanh đang chạy nền."
            })
        except Exception as exc:
            return web.json_response({"status": "error", "message": str(exc)}, status=500)

    async def get_health(self, request: web.Request) -> web.Response:
        """Health check endpoint."""
        return web.json_response({"status": "ok", "service": "gdocs_tts_reader"})


def build_web_app() -> web.Application:
    """Xây dựng ứng dụng aiohttp web với đầy đủ router và DI."""
    read_and_speak_uc, list_voices_uc, manage_playback_uc, audio_player = create_web_container()
    controller = WebTtsController(read_and_speak_uc, list_voices_uc, manage_playback_uc, audio_player)

    app = web.Application(client_max_size=50 * 1024 * 1024)  # 50MB max file upload

    # API routes
    app.router.add_get("/api/health", controller.get_health)
    app.router.add_get("/api/voices", controller.get_voices)
    app.router.add_post("/api/read", controller.post_read)
    app.router.add_post("/api/stop", controller.post_stop)
    app.router.add_get("/api/library", controller.get_library)
    app.router.add_delete("/api/audio/{filename}", controller.delete_audio)
    app.router.add_post("/api/audio/{filename}/rename", controller.post_rename_audio)
    app.router.add_get("/api/audio/{filename}", controller.get_audio)
    app.router.add_post("/api/play-mac", controller.post_play_mac)
    app.router.add_get("/api/playback/sessions", controller.get_playback_sessions)
    app.router.add_post("/api/playback/stop", controller.post_stop_playback)
    app.router.add_post("/api/playback/stop-all", controller.post_stop_all_playback)

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
        async def _on_startup_open_browser(app_instance):
            asyncio.create_task(start_background_browser(url))
        app.on_startup.append(_on_startup_open_browser)

    web.run_app(app, host=host, port=port, print=None)
