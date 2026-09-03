"""Giao diện dòng lệnh chuyên nghiệp (Rich CLI)."""
import argparse
import asyncio
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt

from src.domain.exceptions.base import GDocsTtsException
from src.infrastructure.document_sources.google_docs_url_adapter import GoogleDocsUrlAdapter
from src.infrastructure.document_sources.docx_file_adapter import DocxFileAdapter
from src.infrastructure.document_sources.raw_text_adapter import RawTextAdapter
from src.infrastructure.tts_engines.edge_tts_adapter import EdgeTtsAdapter, CURATED_VIETNAMESE_VOICES
from src.infrastructure.audio_players.mac_afplay_adapter import MacAfplayAdapter
from src.application.dtos.tts_dtos import ReadAndSpeakRequest
from src.application.use_cases.read_and_speak_use_case import ReadAndSpeakUseCase
from src.application.use_cases.list_voices_use_case import ListVoicesUseCase

console = Console()

def create_container():
    """Dependency Injection Container - Ghép nối các lớp theo Clean Architecture."""
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

    return read_and_speak_uc, list_voices_uc

async def handle_read(args, read_and_speak_uc: ReadAndSpeakUseCase):
    source = args.url or args.file
    if not source:
        console.print("[bold red]Lỗi:[/bold red] Vui lòng cung cấp --url hoặc --file!")
        sys.exit(1)

    req = ReadAndSpeakRequest(
        source_path_or_url=source,
        voice_id=args.voice,
        rate=args.rate,
        export_path=args.export,
        play_audio=not args.no_play
    )

    with console.status("[bold green]Đang tải nội dung văn bản và tổng hợp giọng nói AI...[/bold green]", spinner="dots"):
        try:
            result = await read_and_speak_uc.execute(req)
        except GDocsTtsException as err:
            console.print(Panel(
                f"[bold red]{err.message}[/bold red]\n[dim]{err.details}[/dim]",
                title="❌ Đã Xảy Ra Lỗi",
                border_style="red"
            ))
            sys.exit(1)

    table = Table(title="🎉 KẾT QUẢ XỬ LÝ TEXT-TO-SPEECH", show_header=True, header_style="bold cyan")
    table.add_column("Thuộc Tính", style="bold")
    table.add_column("Chi Tiết", style="green")

    table.add_row("Tiêu đề tài liệu", result.document_title)
    table.add_row("Số từ", f"{result.word_count:,} từ ({result.character_count:,} ký tự)")
    table.add_row("Giọng đọc đã dùng", result.voice_used)
    table.add_row("Tệp âm thanh", result.audio_path)
    table.add_row("Trạng thái phát loa", "✅ Đã phát thành công" if result.playback_successful else "⏹️ Không phát (Chỉ xuất file)")

    console.print(table)

async def handle_voices(args, list_voices_uc: ListVoicesUseCase):
    with console.status("[bold green]Đang lấy danh sách giọng đọc...[/bold green]"):
        voices = await list_voices_uc.execute(locale_prefix=args.locale)

    table = Table(title=f"🎙️ DANH SÁCH GIỌNG ĐỌC (Lọc: {args.locale or 'Tất cả'})", show_header=True, header_style="bold magenta")
    table.add_column("Mã Giọng Đọc (Voice ID)", style="bold cyan")
    table.add_column("Tên & Mô Tả", style="yellow")
    table.add_column("Ngôn Ngữ", style="blue")
    table.add_column("Giới Tính", style="green")
    table.add_column("Mặc Định", style="bold red")

    for v in voices:
        table.add_row(
            v.voice_id,
            v.name,
            v.locale,
            v.gender,
            "⭐ Mặc định" if v.is_default else ""
        )

    console.print(table)

async def handle_interactive(read_and_speak_uc: ReadAndSpeakUseCase):
    console.print(Panel.fit(
        "[bold cyan]CHƯƠNG TRÌNH TEXT-TO-SPEECH TỪ GOOGLE DOCS (CLEAN ARCHITECTURE)[/bold cyan]\n"
        "[dim]Phát âm thanh trực tiếp trên macOS | 100% Miễn phí & Bản quyền chứng thực[/dim]",
        border_style="cyan"
    ))

    source = Prompt.ask("[bold yellow]Nhập liên kết Google Docs (hoặc đường dẫn file .docx)[/bold yellow]")
    if not source.strip():
        console.print("[red]Đường dẫn không được để trống![/red]")
        return

    console.print("\n[bold]Chọn giọng đọc:[/bold]")
    for i, v in enumerate(CURATED_VIETNAMESE_VOICES, 1):
        console.print(f"  [{i}] {v.name} ({v.voice_id})")
    
    choice = Prompt.ask("Chọn số", choices=["1", "2"], default="1")
    selected_voice = CURATED_VIETNAMESE_VOICES[int(choice) - 1].voice_id

    req = ReadAndSpeakRequest(
        source_path_or_url=source.strip(),
        voice_id=selected_voice,
        play_audio=True
    )

    with console.status("[bold green]Đang đọc tài liệu và phát âm thanh...[/bold green]", spinner="arc"):
        try:
            result = await read_and_speak_uc.execute(req)
            console.print(f"\n[bold green]✅ Hoàn tất:[/bold green] {result.summary_message}")
        except GDocsTtsException as err:
            console.print(Panel(
                f"[bold red]{err.message}[/bold red]\n[dim]{err.details}[/dim]",
                title="❌ Thao Tác Thất Bại",
                border_style="red"
            ))

def main_entrypoint():
    parser = argparse.ArgumentParser(
        description="Text-to-Speech từ Google Docs & Phát Audio (Clean Architecture)"
    )
    subparsers = parser.add_subparsers(dest="command", help="Lệnh thực hiện")

    # Command: read
    read_parser = subparsers.add_parser("read", help="Đọc tài liệu và phát âm thanh")
    read_parser.add_argument("--url", type=str, help="Đường dẫn Google Docs")
    read_parser.add_argument("--file", type=str, help="Đường dẫn tệp .docx hoặc .txt")
    read_parser.add_argument("--voice", type=str, default="vi-VN-HoaiMyNeural", help="Mã giọng đọc (mặc định: vi-VN-HoaiMyNeural)")
    read_parser.add_argument("--rate", type=str, default="+0%", help="Tốc độ đọc (ví dụ: +10%%, -5%%)")
    read_parser.add_argument("--export", type=str, help="Đường dẫn lưu file mp3")
    read_parser.add_argument("--no-play", action="store_true", help="Chỉ xuất file mp3, không phát qua loa")

    # Command: voices
    voices_parser = subparsers.add_parser("voices", help="Hiển thị danh sách các giọng đọc hỗ trợ")
    voices_parser.add_argument("--locale", type=str, default="vi", help="Mã ngôn ngữ (mặc định: vi)")

    # Command: interactive
    subparsers.add_parser("interactive", help="Chế độ tương tác từng bước thân thiện")

    # Command: web
    web_parser = subparsers.add_parser("web", help="Khởi chạy giao diện Web React local")
    web_parser.add_argument("--port", type=int, default=8000, help="Cổng chạy server (mặc định: 8000)")
    web_parser.add_argument("--host", type=str, default="127.0.0.1", help="Địa chỉ host (mặc định: 127.0.0.1)")
    web_parser.add_argument("--no-browser", action="store_true", help="Không tự động mở trình duyệt")

    args = parser.parse_args()

    if args.command == "web":
        from src.presentation.web.web_server import run_web_server
        run_web_server(host=args.host, port=args.port, open_browser=not args.no_browser)
        return

    read_and_speak_uc, list_voices_uc = create_container()

    if args.command == "read":
        asyncio.run(handle_read(args, read_and_speak_uc))
    elif args.command == "voices":
        asyncio.run(handle_voices(args, list_voices_uc))
    elif args.command == "interactive" or args.command is None:
        asyncio.run(handle_interactive(read_and_speak_uc))
