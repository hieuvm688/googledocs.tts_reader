"""Nghiệp vụ quản lý các phiên phát âm thanh trên hệ thống."""
from pathlib import Path
from typing import List, Optional
from src.domain.entities.audio_track import AudioTrack
from src.domain.ports.audio_player_port import IAudioPlayer
from src.application.dtos.tts_dtos import PlaybackSessionDto


class ManagePlaybackUseCase:
    """Use case điều phối quản lý, theo dõi và dừng các phiên phát âm thanh."""

    def __init__(self, audio_player: IAudioPlayer):
        self._audio_player = audio_player

    def get_active_sessions(self) -> List[PlaybackSessionDto]:
        """Lấy danh sách các phiên phát âm thanh đang hoạt động."""
        sessions = self._audio_player.get_active_sessions()
        return [
            PlaybackSessionDto(
                session_id=s.session_id,
                filename=s.file_name,
                file_path=str(s.file_path),
                title=s.title,
                started_at=s.started_at,
                is_active=s.is_active,
                pid=s.pid,
            )
            for s in sessions
        ]

    def play_audio(self, audio_track: AudioTrack, blocking: bool = False) -> PlaybackSessionDto:
        """Phát một tệp âm thanh và trả về thông tin phiên phát."""
        session = self._audio_player.play(audio_track, blocking=blocking)
        return PlaybackSessionDto(
            session_id=session.session_id,
            filename=session.file_name,
            file_path=str(session.file_path),
            title=session.title,
            started_at=session.started_at,
            is_active=session.is_active,
            pid=session.pid,
        )

    def stop_playback(self, session_id: Optional[str] = None) -> bool:
        """Dừng một phiên phát âm thanh cụ thể hoặc phiên gần nhất."""
        return self._audio_player.stop(session_id=session_id)

    def stop_all_playbacks(self) -> int:
        """Dừng toàn bộ các phiên phát âm thanh đang chạy dưới nền."""
        return self._audio_player.stop_all()
