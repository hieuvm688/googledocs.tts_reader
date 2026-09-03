"""Document Entity."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional

@dataclass(frozen=True)
class Document:
    """Đại diện cho tài liệu văn bản được trích xuất từ bất kỳ nguồn nào."""
    id: str
    title: str
    content: str
    source_type: str  # e.g., 'google_docs_url', 'docx_file', 'raw_text'
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def character_count(self) -> int:
        """Tổng số ký tự trong tài liệu."""
        return len(self.content)

    @property
    def word_count(self) -> int:
        """Tổng số từ trong tài liệu."""
        return len(self.content.split())

    def is_empty(self) -> bool:
        """Kiểm tra tài liệu có rỗng không."""
        return not self.content.strip()
