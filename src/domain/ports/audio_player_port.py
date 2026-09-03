"""Cổng trừu tượng cho trình phát âm thanh."""
from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.playback_session import PlaybackSession


class IAudioPlayer(ABC):
    """Interface định nghĩa hợp đồng phát âm thanh ra loa và quản lý phiên phát."""

    @abstractmethod
    def play(self, audio_track: AudioTrack, blocking: bool = False) -> PlaybackSession:
        """
        Phát tệp âm thanh ra loa thiết bị.
        
        :param audio_track: Thực thể AudioTrack cần phát.
        :param blocking: Nếu True, chờ tiến trình phát kết thúc; nếu False, phát ngầm.
        :return: Thực thể PlaybackSession đại diện cho phiên phát âm thanh.
        :raises AudioPlaybackError: Nếu quá trình phát âm thanh bị gián đoạn hoặc lỗi.
        """
        pass

    @abstractmethod
    def stop(self, session_id: Optional[str] = None) -> bool:
        """
        Dừng một phiên phát âm thanh cụ thể (hoặc phiên phát gần nhất nếu session_id là None).
        
        :param session_id: Mã định danh phiên phát cần dừng.
        :return: True nếu đã dừng thành công, False nếu không tìm thấy phiên phát đang chạy.
        """
        pass

    @abstractmethod
    def stop_all(self) -> int:
        """
        Dừng toàn bộ các phiên phát âm thanh đang chạy dưới nền trên hệ thống.
        
        :return: Số lượng phiên phát đã được dừng.
        """
        pass

    @abstractmethod
    def get_active_sessions(self) -> List[PlaybackSession]:
        """
        Lấy danh sách các phiên phát âm thanh đang hoạt động trên hệ thống.
        
        :return: Danh sách các thực thể PlaybackSession đang hoạt động.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Kiểm tra trình phát âm thanh có sẵn sàng trên hệ điều hành này không."""
        pass
