"""Voice Option Entity."""
from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class VoiceOption:
    """Đại diện cho cấu hình giọng đọc TTS."""
    voice_id: str
    name: str
    locale: str
    gender: str
    provider: str = "edge-tts"
    description: Optional[str] = None
    is_default: bool = False
