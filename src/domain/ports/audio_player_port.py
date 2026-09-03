"""Cổng trừu tượng cho trình phát âm thanh."""
from abc import ABC, abstractmethod
from src.domain.entities.audio_track import AudioTrack

class IAudioPlayer(ABC):
    """Interface định nghĩa hợp đồng phát âm thanh ra loa."""

    @abstractmethod
    def play(self, audio_track: AudioTrack) -> None:
        """
        Phát tệp âm thanh ra loa thiết bị.
        
        :param audio_track: Thực thể AudioTrack cần phát.
        :raises AudioPlaybackError: Nếu quá trình phát âm thanh bị gián đoạn hoặc lỗi.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Kiểm tra trình phát âm thanh có sẵn sàng trên hệ điều hành này không."""
        pass
