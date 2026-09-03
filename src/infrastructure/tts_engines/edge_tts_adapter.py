"""Adapter sử dụng Microsoft Edge Neural TTS (100% Miễn phí, Open Source)."""
import asyncio
import tempfile
from pathlib import Path
from typing import List, Optional
import edge_tts
from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.voice import VoiceOption
from src.domain.exceptions.base import TtsSynthesisError
from src.domain.ports.tts_engine_port import ITtsEngine

# Danh sách giọng đọc tiếng Việt chất lượng cao của Edge TTS
CURATED_VIETNAMESE_VOICES = [
    VoiceOption(
        voice_id="vi-VN-HoaiMyNeural",
        name="Hoài My (Nữ - Truyền cảm, tự nhiên)",
        locale="vi-VN",
        gender="Female",
        provider="Microsoft Edge TTS",
        is_default=True
    ),
    VoiceOption(
        voice_id="vi-VN-NamMinhNeural",
        name="Nam Minh (Nam - Trầm ấm, dõng dạc)",
        locale="vi-VN",
        gender="Male",
        provider="Microsoft Edge TTS",
        is_default=False
    )
]

class EdgeTtsAdapter(ITtsEngine):
    """Hiện thực hóa cổng TTS Engine bằng thư viện edge-tts."""

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: Optional[Path] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
    ) -> AudioTrack:
        if not text.strip():
            raise TtsSynthesisError("Nội dung văn bản rỗng, không thể tổng hợp giọng nói.")

        if output_path is None:
            # Lưu ra file tạm trong thư mục temp
            tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
            dest_file = Path(tmp.name)
            tmp.close()
        else:
            dest_file = output_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            communicate = edge_tts.Communicate(text=text, voice=voice_id, rate=rate, pitch=pitch)
            await communicate.save(str(dest_file))
        except Exception as exc:
            raise TtsSynthesisError(
                f"Quá trình chuyển văn bản thành giọng nói gặp sự cố: {str(exc)}",
                details=f"Voice ID: {voice_id}"
            ) from exc

        file_size = dest_file.stat().st_size if dest_file.exists() else 0
        return AudioTrack(
            file_path=dest_file,
            format="mp3",
            file_size_bytes=file_size
        )

    async def get_available_voices(self, locale_prefix: Optional[str] = None) -> List[VoiceOption]:
        try:
            all_voices = await edge_tts.list_voices()
            results: List[VoiceOption] = []
            for v in all_voices:
                locale = v.get("Locale", "")
                if locale_prefix and not locale.lower().startswith(locale_prefix.lower()):
                    continue
                results.append(
                    VoiceOption(
                        voice_id=v.get("ShortName", ""),
                        name=f"{v.get('FriendlyName', v.get('ShortName', ''))}",
                        locale=locale,
                        gender=v.get("Gender", "Unknown"),
                        provider="Microsoft Edge TTS",
                        is_default=(v.get("ShortName") == "vi-VN-HoaiMyNeural")
                    )
                )
            return results if results else CURATED_VIETNAMESE_VOICES
        except Exception:
            # Fallback về danh sách tuyển chọn nếu mất kết nối
            return CURATED_VIETNAMESE_VOICES
