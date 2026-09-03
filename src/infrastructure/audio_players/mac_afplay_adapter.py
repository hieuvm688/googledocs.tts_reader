"""Adapter phát âm thanh bằng lệnh chuẩn macOS /usr/bin/afplay."""
import shutil
import subprocess
from pathlib import Path
from src.domain.entities.audio_track import AudioTrack
from src.domain.exceptions.base import AudioPlaybackError
from src.domain.ports.audio_player_port import IAudioPlayer

class MacAfplayAdapter(IAudioPlayer):
    """
    Sử dụng trình phát afplay native của macOS.
    Hoàn toàn miễn phí, 0 độ trễ, không cần thêm driver hay thư viện cồng kềnh.
    """

    def __init__(self, executable_path: str = "/usr/bin/afplay"):
        self._executable_path = executable_path

    def is_available(self) -> bool:
        return shutil.which(self._executable_path) is not None or shutil.which("afplay") is not None

    def play(self, audio_track: AudioTrack) -> None:
        if not audio_track.exists():
            raise AudioPlaybackError(
                "Tệp âm thanh không tồn tại để phát.",
                details=str(audio_track.file_path)
            )

        cmd = [self._executable_path, str(audio_track.file_path)]
        try:
            # Thực thi phát âm thanh đồng bộ
            process = subprocess.run(
                cmd,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        except subprocess.CalledProcessError as exc:
            raise AudioPlaybackError(
                "Trình phát âm thanh macOS afplay báo lỗi.",
                details=exc.stderr or str(exc)
            ) from exc
        except FileNotFoundError:
            raise AudioPlaybackError(
                "Không tìm thấy lệnh phát âm thanh /usr/bin/afplay trên hệ thống macOS này."
            )
