"""Nghiệp vụ lấy danh sách giọng đọc."""
from typing import List, Optional
from src.domain.ports.tts_engine_port import ITtsEngine
from src.application.dtos.tts_dtos import VoiceDto

class ListVoicesUseCase:
    """Use case truy vấn các giọng đọc hỗ trợ."""

    def __init__(self, tts_engine: ITtsEngine):
        self._tts_engine = tts_engine

    async def execute(self, locale_prefix: Optional[str] = "vi") -> List[VoiceDto]:
        domain_voices = await self._tts_engine.get_available_voices(locale_prefix=locale_prefix)
        return [
            VoiceDto(
                voice_id=v.voice_id,
                name=v.name,
                locale=v.locale,
                gender=v.gender,
                is_default=v.is_default
            )
            for v in domain_voices
        ]
