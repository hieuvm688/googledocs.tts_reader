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

# Danh sách giọng đọc AI tiêu biểu tuyển chọn cho 11 ngôn ngữ
CURATED_MULTILINGUAL_VOICES = [
    # 1. Tiếng Việt (vi)
    VoiceOption("vi-VN-HoaiMyNeural", "Hoài My (Nữ - Truyền cảm, tự nhiên)", "vi-VN", "Female", "Microsoft", True),
    VoiceOption("vi-VN-NamMinhNeural", "Nam Minh (Nam - Trầm ấm, dõng dạc)", "vi-VN", "Male", "Microsoft", False),

    # 2. English (en)
    VoiceOption("en-US-JennyNeural", "Jenny (US - Natural Female)", "en-US", "Female", "Microsoft", False),
    VoiceOption("en-US-GuyNeural", "Guy (US - Warm Male)", "en-US", "Male", "Microsoft", False),

    # 3. Chinese (zh/cn)
    VoiceOption("zh-CN-XiaoxiaoNeural", "Xiaoxiao (CN - Warm Female)", "zh-CN", "Female", "Microsoft", False),
    VoiceOption("zh-CN-YunxiNeural", "Yunxi (CN - Lively Male)", "zh-CN", "Male", "Microsoft", False),

    # 4. Spanish (es)
    VoiceOption("es-ES-ElviraNeural", "Elvira (ES - Natural Female)", "es-ES", "Female", "Microsoft", False),
    VoiceOption("es-ES-AlvaroNeural", "Alvaro (ES - Warm Male)", "es-ES", "Male", "Microsoft", False),

    # 5. French (fr)
    VoiceOption("fr-FR-DeniseNeural", "Denise (FR - Elegant Female)", "fr-FR", "Female", "Microsoft", False),
    VoiceOption("fr-FR-HenriNeural", "Henri (FR - Warm Male)", "fr-FR", "Male", "Microsoft", False),

    # 6. Japanese (ja/jp)
    VoiceOption("ja-JP-NanamiNeural", "Nanami (JP - Gentle Female)", "ja-JP", "Female", "Microsoft", False),
    VoiceOption("ja-JP-KeitaNeural", "Keita (JP - Natural Male)", "ja-JP", "Male", "Microsoft", False),

    # 7. Russian (ru)
    VoiceOption("ru-RU-SvetlanaNeural", "Svetlana (RU - Clear Female)", "ru-RU", "Female", "Microsoft", False),
    VoiceOption("ru-RU-DmitryNeural", "Dmitry (RU - Deep Male)", "ru-RU", "Male", "Microsoft", False),

    # 8. Arabic (ar)
    VoiceOption("ar-SA-ZariyahNeural", "Zariyah (AR - Fluent Female)", "ar-SA", "Female", "Microsoft", False),
    VoiceOption("ar-SA-HamedNeural", "Hamed (AR - Clear Male)", "ar-SA", "Male", "Microsoft", False),

    # 9. Hindi (hi)
    VoiceOption("hi-IN-SwaraNeural", "Swara (HI - Natural Female)", "hi-IN", "Female", "Microsoft", False),
    VoiceOption("hi-IN-MadhurNeural", "Madhur (HI - Deep Male)", "hi-IN", "Male", "Microsoft", False),

    # 10. German (de)
    VoiceOption("de-DE-KatjaNeural", "Katja (DE - Clear Female)", "de-DE", "Female", "Microsoft", False),
    VoiceOption("de-DE-ConradNeural", "Conrad (DE - Warm Male)", "de-DE", "Male", "Microsoft", False),

    # 11. Korean (ko)
    VoiceOption("ko-KR-SunHiNeural", "SunHi (KO - Expressive Female)", "ko-KR", "Female", "Microsoft", False),
    VoiceOption("ko-KR-InJoonNeural", "InJoon (KO - Friendly Male)", "ko-KR", "Male", "Microsoft", False),
]

CURATED_VIETNAMESE_VOICES = [v for v in CURATED_MULTILINGUAL_VOICES if v.locale.startswith("vi")]


import re

def split_text_into_chunks(text: str, max_chars_per_chunk: int = 1000, max_words_per_chunk: Optional[int] = None) -> List[str]:
    """Phân tách văn bản dài thành các đoạn tự nhiên (< 1000 ký tự) để xử lý song song siêu tốc."""
    if not text or not text.strip():
        return []

    # Tách theo ngắt câu tự nhiên (\n, . , ? , ! , ;)
    raw_blocks = re.split(r'(\n+|\.\s+|\?\s+|\!\s+|\;\s+)', text)
    sentences: List[str] = []
    temp_sent = ""
    for b in raw_blocks:
        temp_sent += b
        if len(temp_sent) >= 100 or any(delims in b for delims in ['\n', '.', '?', '!', ';']):
            if temp_sent.strip():
                sentences.append(temp_sent.strip())
            temp_sent = ""
    if temp_sent.strip():
        sentences.append(temp_sent.strip())

    chunks: List[str] = []
    current_chunk = ""

    for sentence in sentences:
        if len(sentence) > max_chars_per_chunk:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
            
            # Tách tiếp theo từ nếu câu đơn lẻ quá dài (> 1000 ký tự)
            words = sentence.split()
            sub_chunk = ""
            for w in words:
                if len(sub_chunk) + len(w) + 1 > max_chars_per_chunk:
                    if sub_chunk:
                        chunks.append(sub_chunk)
                    sub_chunk = w
                else:
                    sub_chunk = (sub_chunk + " " + w).strip()
            if sub_chunk:
                current_chunk = sub_chunk
        else:
            if len(current_chunk) + len(sentence) + 1 > max_chars_per_chunk:
                chunks.append(current_chunk)
                current_chunk = sentence
            else:
                current_chunk = (current_chunk + " " + sentence).strip()

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [text]


class EdgeTtsAdapter(ITtsEngine):
    """Hiện thực hóa cổng TTS Engine bằng thư viện edge-tts với Parallel Synthesis."""

    def __init__(self, max_concurrency: int = 4):
        self._max_concurrency = max_concurrency

    async def _synthesize_single_chunk(
        self,
        sem: asyncio.Semaphore,
        chunk_text: str,
        voice_id: str,
        rate: str,
        pitch: str,
        retries: int = 3
    ) -> bytes:
        """Tổng hợp một đoạn văn bản thành byte audio MP3 với tự động thử lại khi gặp sự cố mạng."""
        async with sem:
            last_exc = None
            for attempt in range(retries):
                try:
                    comm = edge_tts.Communicate(text=chunk_text, voice=voice_id, rate=rate, pitch=pitch)
                    buf = bytearray()
                    stream_iter = comm.stream()
                    try:
                        async for item in stream_iter:
                            if item.get("type") == "audio" and "data" in item:
                                buf.extend(item["data"])
                    finally:
                        await stream_iter.aclose()

                    if len(buf) > 0:
                        return bytes(buf)
                except Exception as exc:
                    last_exc = exc
                    if attempt < retries - 1:
                        await asyncio.sleep(0.5)

            if last_exc:
                raise last_exc
            return b""

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
            tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
            dest_file = Path(tmp.name)
            tmp.close()
        else:
            dest_file = output_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)

        chunks = split_text_into_chunks(text, max_chars_per_chunk=1000)
        sem = asyncio.Semaphore(self._max_concurrency)

        is_partial = False
        completed_data: List[Optional[bytes]] = [None] * len(chunks)

        async def worker(index: int, chunk_str: str):
            res = await self._synthesize_single_chunk(sem, chunk_str, voice_id, rate, pitch)
            completed_data[index] = res

        tasks = [asyncio.create_task(worker(i, ch)) for i, ch in enumerate(chunks)]

        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            is_partial = True
            for t in tasks:
                if not t.done():
                    t.cancel()

        # Ghép nối các đoạn đã hoàn tất (tính từ đầu văn bản)
        combined_bytes = bytearray()
        for part in completed_data:
            if part is not None and len(part) > 0:
                combined_bytes.extend(part)
            else:
                # Gặp đoạn chưa xong thì dừng ghép nối để giữ tính liền mạch
                if is_partial:
                    break

        if len(combined_bytes) == 0:
            if is_partial:
                raise asyncio.CancelledError("Tiến trình bị hủy trước khi đoạn âm thanh đầu tiên kịp hoàn tất.")
            raise TtsSynthesisError("Không thể tạo dữ liệu âm thanh từ Edge TTS.", details=f"Voice: {voice_id}")

        # Ghi trực tiếp ra file đích
        with open(dest_file, "wb") as f:
            f.write(combined_bytes)

        file_size = dest_file.stat().st_size if dest_file.exists() else 0
        return AudioTrack(
            file_path=dest_file,
            format="mp3",
            file_size_bytes=file_size,
            is_partial=is_partial
        )

    async def get_available_voices(self, locale_prefix: Optional[str] = None) -> List[VoiceOption]:
        try:
            all_voices = await edge_tts.list_voices()
            results: List[VoiceOption] = []
            normalized_prefix = (locale_prefix or "").lower().strip()

            for v in all_voices:
                locale = v.get("Locale", "")
                locale_lower = locale.lower()

                # Hỗ trợ lọc theo mã quốc gia (vi, en, zh, es, fr, ja, ru, ar, hi, de, ko)
                if normalized_prefix:
                    if not (locale_lower.startswith(normalized_prefix) or normalized_prefix in locale_lower):
                        continue

                short_name = v.get("ShortName", "")
                friendly = v.get("FriendlyName", short_name)
                gender = v.get("Gender", "Unknown")

                is_default = (short_name in [cv.voice_id for cv in CURATED_MULTILINGUAL_VOICES if cv.is_default])

                results.append(
                    VoiceOption(
                        voice_id=short_name,
                        name=friendly,
                        locale=locale,
                        gender=gender,
                        provider="Microsoft Edge TTS",
                        is_default=is_default
                    )
                )
            return results if results else CURATED_MULTILINGUAL_VOICES
        except Exception:
            # Fallback về danh sách tuyển chọn đa ngôn ngữ nếu mất kết nối
            if locale_prefix:
                filtered = [v for v in CURATED_MULTILINGUAL_VOICES if v.locale.lower().startswith(locale_prefix.lower())]
                return filtered if filtered else CURATED_MULTILINGUAL_VOICES
            return CURATED_MULTILINGUAL_VOICES
