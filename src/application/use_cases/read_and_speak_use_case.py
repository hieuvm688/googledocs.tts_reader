"""Nghiệp vụ chính: Trích xuất tài liệu -> Sinh giọng nói -> Phát ra loa."""
import os
from pathlib import Path
from typing import List, Optional
from src.domain.entities.document import Document
from src.domain.entities.audio_track import AudioTrack
from src.domain.exceptions.base import DocumentFetchError, TtsSynthesisError, AudioPlaybackError
from src.domain.ports.document_source_port import IDocumentSource
from src.domain.ports.tts_engine_port import ITtsEngine
from src.domain.ports.audio_player_port import IAudioPlayer
from src.application.dtos.tts_dtos import ReadAndSpeakRequest, ReadAndSpeakResult

DEFAULT_VIETNAMESE_VOICE = "vi-VN-HoaiMyNeural"

class ReadAndSpeakUseCase:
    """Use case điều phối quá trình đọc tài liệu từ Google Docs/Docx và phát ra loa."""

    def __init__(
        self,
        document_sources: List[IDocumentSource],
        tts_engine: ITtsEngine,
        audio_player: IAudioPlayer,
    ):
        self._document_sources = document_sources
        self._tts_engine = tts_engine
        self._audio_player = audio_player

    async def execute(self, request: ReadAndSpeakRequest) -> ReadAndSpeakResult:
        # 1. Tìm source adapter phù hợp
        source_adapter: Optional[IDocumentSource] = None
        for src in self._document_sources:
            if src.can_handle(request.source_path_or_url):
                source_adapter = src
                break

        if not source_adapter:
            raise DocumentFetchError(
                "Không tìm thấy adapter phù hợp cho nguồn tài liệu này.",
                details=f"URL/Đường dẫn: {request.source_path_or_url}"
            )

        # 2. Tải và phân tích văn bản
        document = source_adapter.fetch_document(request.source_path_or_url)
        if document.is_empty():
            raise DocumentFetchError("Tài liệu không có nội dung văn bản nào để đọc.")

        # 3. Chọn giọng đọc
        voice_id = request.voice_id or DEFAULT_VIETNAMESE_VOICE

        # 4. Xác định vị trí lưu audio
        target_audio_path: Optional[Path] = None
        if request.export_path:
            target_audio_path = Path(request.export_path).resolve()

        # 5. Tổng hợp giọng nói TTS
        audio_track = await self._tts_engine.synthesize(
            text=document.content,
            voice_id=voice_id,
            output_path=target_audio_path,
            rate=request.rate
        )

        # 6. Phát audio (nếu được yêu cầu)
        playback_ok = False
        if request.play_audio:
            self._audio_player.play(audio_track)
            playback_ok = True

        return ReadAndSpeakResult(
            document_title=document.title,
            character_count=document.character_count,
            word_count=document.word_count,
            voice_used=voice_id,
            audio_path=str(audio_track.file_path),
            playback_successful=playback_ok,
            summary_message=(
                f"Đã đọc xong tài liệu '{document.title}' ({document.word_count} từ) "
                f"bằng giọng '{voice_id}'."
            )
        )
