"""Unit tests cho Use Cases sử dụng Mock Adapters."""
import pytest
from pathlib import Path
from typing import List, Optional
from src.domain.entities.document import Document
from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.voice import VoiceOption
from src.domain.entities.playback_session import PlaybackSession
from src.domain.ports.document_source_port import IDocumentSource
from src.domain.ports.tts_engine_port import ITtsEngine
from src.domain.ports.audio_player_port import IAudioPlayer
from src.application.dtos.tts_dtos import ReadAndSpeakRequest
from src.application.use_cases.read_and_speak_use_case import ReadAndSpeakUseCase
from src.application.use_cases.list_voices_use_case import ListVoicesUseCase
from src.application.use_cases.manage_playback_use_case import ManagePlaybackUseCase

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
        self.sessions: List[PlaybackSession] = []

    def is_available(self) -> bool:
        return True

    def play(self, audio_track: AudioTrack, blocking: bool = False) -> PlaybackSession:
        self.played = True
        session = PlaybackSession(
            session_id="mock_session_1",
            file_path=audio_track.file_path,
            title=audio_track.file_path.stem,
            started_at="2026-09-03 22:00:00",
            is_active=True,
            pid=99999
        )
        self.sessions.append(session)
        return session

    def stop(self, session_id: Optional[str] = None) -> bool:
        if not self.sessions:
            return False
        if session_id:
            self.sessions = [s for s in self.sessions if s.session_id != session_id]
            return True
        self.sessions.pop()
        return True

    def stop_all(self) -> int:
        count = len(self.sessions)
        self.sessions.clear()
        return count

    def get_active_sessions(self) -> List[PlaybackSession]:
        return list(self.sessions)

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

def test_manage_playback_use_case():
    player = MockAudioPlayer()
    use_case = ManagePlaybackUseCase(audio_player=player)

    # Ban đầu không có session
    assert len(use_case.get_active_sessions()) == 0

    # Phát thử 1 bài
    track = AudioTrack(file_path=Path("/tmp/test_song.mp3"))
    session = use_case.play_audio(track)
    assert session.session_id == "mock_session_1"
    assert session.filename == "test_song.mp3"
    assert len(use_case.get_active_sessions()) == 1

    # Dừng bài
    stopped = use_case.stop_playback(session.session_id)
    assert stopped is True
    assert len(use_case.get_active_sessions()) == 0

    # Dừng tất cả
    use_case.play_audio(track)
    count = use_case.stop_all_playbacks()
    assert count == 1
    assert len(use_case.get_active_sessions()) == 0
