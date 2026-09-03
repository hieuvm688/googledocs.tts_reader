"""Unit tests cho Adapters."""
import pytest
from src.infrastructure.document_sources.google_docs_url_adapter import GoogleDocsUrlAdapter
from src.infrastructure.document_sources.docx_file_adapter import DocxFileAdapter

def test_google_docs_url_adapter_can_handle():
    adapter = GoogleDocsUrlAdapter()
    assert adapter.can_handle("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit") is True
    assert adapter.can_handle("https://docs.google.com/document/d/1234567890abcdef1234567890/preview") is True
    assert adapter.can_handle("some_file.docx") is False

def test_google_docs_id_extraction():
    adapter = GoogleDocsUrlAdapter()
    doc_id = adapter.extract_document_id("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing")
    assert doc_id == "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

def test_docx_file_adapter_can_handle():
    adapter = DocxFileAdapter()
    assert adapter.can_handle("report.docx") is True
    assert adapter.can_handle("notes.txt") is True
    assert adapter.can_handle("https://docs.google.com/document/d/123") is False

from unittest.mock import patch, MagicMock
from src.domain.exceptions.base import DocumentFetchError, DocumentPermissionDeniedError

def test_google_docs_404_handling():
    adapter = GoogleDocsUrlAdapter()
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    with patch("requests.get", return_value=mock_resp):
        with pytest.raises(DocumentFetchError) as exc_info:
            adapter.fetch_document("https://docs.google.com/document/d/12345678901234567890/edit")
        assert "404" in str(exc_info.value)

def test_google_docs_permission_denied_handling():
    adapter = GoogleDocsUrlAdapter()
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.url = "https://accounts.google.com/signin"
    with patch("requests.get", return_value=mock_resp):
        with pytest.raises(DocumentPermissionDeniedError) as exc_info:
            adapter.fetch_document("https://docs.google.com/document/d/12345678901234567890/edit")
        assert "chưa được mở quyền xem" in str(exc_info.value)

from src.infrastructure.document_sources.raw_text_adapter import RawTextAdapter

def test_raw_text_adapter():
    adapter = RawTextAdapter()
    assert adapter.can_handle("text://Xin chào các bạn") is True
    assert adapter.can_handle("https://docs.google.com") is False

    doc = adapter.fetch_document("text://Xin chào Việt Nam!\nĐây là dòng thứ hai.")
    assert doc.id == "raw_text_input"
    assert "Xin chào Việt Nam!" in doc.title
    assert "Đây là dòng thứ hai." in doc.content
    assert doc.word_count > 0

def test_raw_text_adapter_empty():
    adapter = RawTextAdapter()
    with pytest.raises(DocumentFetchError):
        adapter.fetch_document("text://   ")

from src.infrastructure.audio_players.mac_afplay_adapter import MacAfplayAdapter
from src.domain.entities.audio_track import AudioTrack
from src.domain.exceptions.base import AudioPlaybackError

def test_mac_afplay_adapter_play_and_stop(tmp_path):
    fake_audio = tmp_path / "song.mp3"
    fake_audio.write_bytes(b"fake audio data")

    adapter = MacAfplayAdapter(executable_path="/usr/bin/afplay")
    mock_proc = MagicMock()
    mock_proc.pid = 1234
    mock_proc.poll.return_value = None

    with patch("shutil.which", return_value="/usr/bin/afplay"):
        with patch("subprocess.Popen", return_value=mock_proc):
            track = AudioTrack(file_path=fake_audio)
            session = adapter.play(track, blocking=False)
            assert session.pid == 1234
            assert session.file_name == "song.mp3"

            active = adapter.get_active_sessions()
            assert any(s.session_id == session.session_id for s in active)

            stopped = adapter.stop(session.session_id)
            assert stopped is True
            mock_proc.terminate.assert_called_once()

def test_mac_afplay_adapter_file_not_found(tmp_path):
    non_existent = tmp_path / "not_found.mp3"
    adapter = MacAfplayAdapter(executable_path="/usr/bin/afplay")
    track = AudioTrack(file_path=non_existent)
    with pytest.raises(AudioPlaybackError):
        adapter.play(track)

