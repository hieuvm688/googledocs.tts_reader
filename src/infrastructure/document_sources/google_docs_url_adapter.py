"""Adapter tải văn bản từ Google Docs thông qua URL chia sẻ."""
import re
import requests
from src.domain.entities.document import Document
from src.domain.exceptions.base import (
    DocumentFetchError,
    InvalidDocumentUrlError,
    DocumentPermissionDeniedError,
)
from src.domain.ports.document_source_port import IDocumentSource

class GoogleDocsUrlAdapter(IDocumentSource):
    """
    Hiện thực hóa việc lấy văn bản từ liên kết Google Docs.
    Hỗ trợ các dạng liên kết:
    - https://docs.google.com/document/d/<DOC_ID>/edit...
    - https://docs.google.com/document/d/<DOC_ID>/preview...
    - Hoặc trực tiếp mã định danh DOC_ID
    """

    DOC_ID_PATTERN = re.compile(r"/document/d/([a-zA-Z0-9-_]+)")

    def can_handle(self, source_identifier: str) -> bool:
        identifier = source_identifier.strip()
        if "docs.google.com/document/d/" in identifier:
            return True
        # Nếu truyền trực tiếp chuỗi doc_id hợp lệ (thường > 25 ký tự chữ số gạch nối)
        if len(identifier) > 20 and not identifier.startswith("http") and not identifier.endswith(".docx"):
            return True
        return False

    def extract_document_id(self, source_identifier: str) -> str:
        """Trích xuất mã Document ID từ URL hoặc chuỗi đầu vào."""
        match = self.DOC_ID_PATTERN.search(source_identifier)
        if match:
            return match.group(1)
        # Nếu người dùng truyền thẳng doc id
        clean_id = source_identifier.strip().split("/")[0].split("?")[0]
        if re.match(r"^[a-zA-Z0-9-_]{20,}$", clean_id):
            return clean_id
        raise InvalidDocumentUrlError(
            "Đường dẫn Google Docs không hợp lệ. Vui lòng cung cấp link có định dạng: "
            "https://docs.google.com/document/d/DOC_ID/edit",
            details=source_identifier
        )

    def fetch_document(self, source_identifier: str) -> Document:
        doc_id = self.extract_document_id(source_identifier)
        export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"

        try:
            response = requests.get(export_url, timeout=20, allow_redirects=True)
        except requests.RequestException as exc:
            raise DocumentFetchError(
                "Không thể kết nối đến máy chủ Google Docs.",
                details=str(exc)
            ) from exc

        if response.status_code == 404:
            raise DocumentFetchError(
                "Không tìm thấy tài liệu Google Docs (Lỗi 404). Vui lòng kiểm tra lại Document ID.",
                details=f"Doc ID: {doc_id}"
            )
        elif response.status_code in (401, 403) or "accounts.google.com" in response.url:
            raise DocumentPermissionDeniedError(
                "Tài liệu Google Docs này chưa được mở quyền xem công khai.",
                details=(
                    "Cách khắc phục: Mở Google Docs -> Bấm nút 'Chia sẻ' (Share) -> "
                    "Tại 'Quyền truy cập chung', chọn 'Bất kỳ ai có đường liên kết' -> 'Người xem'."
                )
            )
        elif response.status_code != 200:
            raise DocumentFetchError(
                f"Lỗi phản hồi từ Google Docs (Mã trạng thái: {response.status_code}).",
                details=response.text[:200]
            )

        content = response.text.strip()
        
        # Thử trích xuất tiêu đề dòng đầu tiên hoặc mặc định
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        title = lines[0][:80] if lines else f"Google Doc ({doc_id[:8]}...)"

        return Document(
            id=doc_id,
            title=title,
            content=content,
            source_type="google_docs_url",
            metadata={"export_url": export_url, "doc_id": doc_id}
        )
