"""Cổng trừu tượng cho công cụ TTS (Text-to-Speech)."""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.voice import VoiceOption

class ITtsEngine(ABC):
    """Interface định nghĩa hợp đồng chuyển văn bản thành âm thanh."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: Optional[Path] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
    ) -> AudioTrack:
        """
        Tổng hợp văn bản thành tệp âm thanh.
        
        :param text: Văn bản cần đọc.
        :param voice_id: Mã định danh giọng đọc.
        :param output_path: Đường dẫn lưu file mp3 (nếu None sẽ lưu tạm).
        :param rate: Tốc độ đọc (vd: '+10%', '-5%').
        :param pitch: Cao độ giọng (vd: '+0Hz').
        :return: Thực thể AudioTrack chứa đường dẫn tệp audio.
        :raises TtsSynthesisError: Nếu quá trình sinh giọng nói thất bại.
        """
        pass

    @abstractmethod
    async def get_available_voices(self, locale_prefix: Optional[str] = None) -> List[VoiceOption]:
        """
        Lấy danh sách các giọng đọc hỗ trợ.
        
        :param locale_prefix: Lọc theo mã ngôn ngữ (vd: 'vi' cho tiếng Việt).
        :return: Danh sách VoiceOption.
        """
        pass
