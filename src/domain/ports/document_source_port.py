"""Cổng trừu tượng cho nguồn tài liệu văn bản."""
from abc import ABC, abstractmethod
from src.domain.entities.document import Document

class IDocumentSource(ABC):
    """Interface định nghĩa hợp đồng trích xuất tài liệu."""
    
    @abstractmethod
    def fetch_document(self, source_identifier: str) -> Document:
        """
        Lấy tài liệu từ đường dẫn hoặc tệp tin.
        
        :param source_identifier: URL Google Docs hoặc đường dẫn tệp tin.
        :return: Thực thể Document chứa nội dung và metadata.
        :raises DocumentFetchError: Nếu không thể tải hoặc đọc tài liệu.
        """
        pass

    @abstractmethod
    def can_handle(self, source_identifier: str) -> bool:
        """Kiểm tra xem adapter này có thể xử lý định dạng/nguồn này không."""
        pass
