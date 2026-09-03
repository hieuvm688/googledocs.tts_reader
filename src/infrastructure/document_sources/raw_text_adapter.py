"""Adapter xử lý văn bản trực tiếp (Raw Text)."""
from urllib.parse import unquote
from src.domain.entities.document import Document
from src.domain.exceptions.base import DocumentFetchError
from src.domain.ports.document_source_port import IDocumentSource

class RawTextAdapter(IDocumentSource):
    """Adapter trích xuất văn bản từ chuỗi text trực tiếp (tiền tố text://)."""

    PREFIX = "text://"

    def can_handle(self, source_identifier: str) -> bool:
        return source_identifier.strip().startswith(self.PREFIX)

    def fetch_document(self, source_identifier: str) -> Document:
        raw_content = source_identifier.strip()[len(self.PREFIX):].strip()
        # Hỗ trợ URL decode nếu chuỗi được encode
        try:
            content = unquote(raw_content)
        except Exception:
            content = raw_content

        if not content.strip():
            raise DocumentFetchError("Nội dung văn bản trực tiếp không được để trống.")

        # Lấy dòng đầu tiên làm tiêu đề rút gọn (tối đa 40 ký tự)
        first_line = content.strip().split("\n")[0].strip()
        title = first_line[:40] + "..." if len(first_line) > 40 else first_line or "Văn bản nhập trực tiếp"

        return Document(
            id="raw_text_input",
            title=title,
            content=content,
            source_type="raw_text",
            metadata={"length": len(content)}
        )
