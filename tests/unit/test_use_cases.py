"""Unit tests cho Use Cases sử dụng Mock Adapters."""
import pytest
from pathlib import Path
from typing import List, Optional
from src.domain.entities.document import Document
from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.voice import VoiceOption
from src.domain.ports.document_source_port import IDocumentSource
from src.domain.ports.tts_engine_port import ITtsEngine
from src.domain.ports.audio_player_port import IAudioPlayer
from src.application.dtos.tts_dtos import ReadAndSpeakRequest
from src.application.use_cases.read_and_speak_use_case import ReadAndSpeakUseCase
from src.application.use_cases.list_voices_use_case import ListVoicesUseCase

class MockDocumentSource(IDocumentSource):
    def can_handle(self, source_identifier: str) -> bool:
        return "mock" in source_identifier

    def fetch_document(self, source_identifier: str) -> Document:
        return Document(
            id="mock-id",
            title="Tài liệu Mock",
            content="Đây là nội dung kiểm thử mock.",
            source_type="mock_source"
        )

class MockTtsEngine(ITtsEngine):
    async def synthesize(self, text: str, voice_id: str, output_path: Optional[Path] = None, rate: str = "+0%", pitch: str = "+0Hz") -> AudioTrack:
        dummy_path = output_path or Path("/tmp/mock_audio.mp3")
        return AudioTrack(file_path=dummy_path, format="mp3", file_size_bytes=1024)

    async def get_available_voices(self, locale_prefix: Optional[str] = None) -> List[VoiceOption]:
        return [
            VoiceOption(voice_id="vi-VN-HoaiMyNeural", name="Hoài My", locale="vi-VN", gender="Female", is_default=True),
            VoiceOption(voice_id="vi-VN-NamMinhNeural", name="Nam Minh", locale="vi-VN", gender="Male", is_default=False)
        ]

class MockAudioPlayer(IAudioPlayer):
    def __init__(self):
        self.played = False

    def is_available(self) -> bool:
        return True

    def play(self, audio_track: AudioTrack) -> None:
        self.played = True

@pytest.mark.asyncio
async def test_read_and_speak_use_case_success():
    doc_source = MockDocumentSource()
    tts_engine = MockTtsEngine()
    player = MockAudioPlayer()

    use_case = ReadAndSpeakUseCase(
        document_sources=[doc_source],
        tts_engine=tts_engine,
        audio_player=player
    )

    req = ReadAndSpeakRequest(
        source_path_or_url="https://docs.google.com/document/d/mock-123/edit",
        voice_id="vi-VN-HoaiMyNeural",
        play_audio=True
    )

    res = await use_case.execute(req)
    assert res.document_title == "Tài liệu Mock"
    assert res.word_count == 7
    assert res.playback_successful is True
    assert player.played is True

@pytest.mark.asyncio
async def test_list_voices_use_case():
    tts_engine = MockTtsEngine()
    use_case = ListVoicesUseCase(tts_engine=tts_engine)
    voices = await use_case.execute(locale_prefix="vi")
    assert len(voices) == 2
    assert voices[0].voice_id == "vi-VN-HoaiMyNeural"
