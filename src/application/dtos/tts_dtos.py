"""Data Transfer Objects."""
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

@dataclass(frozen=True)
class ReadAndSpeakRequest:
    """Yêu cầu đọc tài liệu và phát âm thanh."""
    source_path_or_url: str
    voice_id: Optional[str] = None
    rate: str = "+0%"
    export_path: Optional[str] = None
    play_audio: bool = True

@dataclass(frozen=True)
class ReadAndSpeakResult:
    """Kết quả sau khi hoàn tất đọc và phát âm thanh."""
    document_title: str
    character_count: int
    word_count: int
    voice_used: str
    audio_path: str
    playback_successful: bool
    summary_message: str
    is_partial: bool = False

@dataclass(frozen=True)
class VoiceDto:
    """DTO thông tin giọng đọc."""
    voice_id: str
    name: str
    locale: str
    gender: str
    is_default: bool

@dataclass(frozen=True)
class PlaybackSessionDto:
    """DTO thông tin phiên phát âm thanh đang chạy."""
    session_id: str
    filename: str
    file_path: str
    title: str
    started_at: str
    is_active: bool
    pid: Optional[int] = None
