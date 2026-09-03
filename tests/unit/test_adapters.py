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
