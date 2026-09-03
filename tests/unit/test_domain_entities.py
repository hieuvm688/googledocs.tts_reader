"""Unit tests cho Domain Entities."""
import pytest
from src.domain.entities.document import Document
from src.domain.entities.voice import VoiceOption

def test_document_properties():
    doc = Document(
        id="doc-123",
        title="Tài liệu thử nghiệm",
        content="Xin chào thế giới Clean Architecture",
        source_type="google_docs_url"
    )
    assert doc.id == "doc-123"
    assert doc.word_count == 6
    assert doc.character_count == 36
    assert not doc.is_empty()

def test_empty_document():
    doc = Document(
        id="empty-1",
        title="Rỗng",
        content="   \n  ",
        source_type="docx_file"
    )
    assert doc.is_empty()
    assert doc.word_count == 0

def test_voice_option_creation():
    voice = VoiceOption(
        voice_id="vi-VN-HoaiMyNeural",
        name="Hoài My",
        locale="vi-VN",
        gender="Female",
        is_default=True
    )
    assert voice.voice_id == "vi-VN-HoaiMyNeural"
    assert voice.is_default is True
