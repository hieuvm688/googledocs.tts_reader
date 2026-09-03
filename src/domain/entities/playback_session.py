"""Thực thể đại diện cho một phiên phát âm thanh trên hệ thống."""
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class PlaybackSession:
    """Đại diện cho phiên phát âm thanh ra loa thiết bị."""
    session_id: str
    file_path: Path
    title: str
    started_at: str
    is_active: bool = True
    pid: Optional[int] = None

    @property
    def file_name(self) -> str:
        """Tên tệp tin âm thanh."""
        return self.file_path.name
