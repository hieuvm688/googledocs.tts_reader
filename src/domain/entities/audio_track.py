"""Audio Track Entity."""
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

@dataclass(frozen=True)
class AudioTrack:
    """Đại diện cho tệp âm thanh được sinh ra sau khi tổng hợp TTS."""
    file_path: Path
    format: str  # e.g., 'mp3', 'wav'
    duration_seconds: Optional[float] = None
    file_size_bytes: int = 0

    def exists(self) -> bool:
        """Kiểm tra tệp âm thanh có tồn tại trên đĩa không."""
        return self.file_path.exists()
