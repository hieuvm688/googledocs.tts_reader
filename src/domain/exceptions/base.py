"""Hệ thống ngoại lệ chuẩn mực của dự án."""

class GDocsTtsException(Exception):
    """Lớp cha của tất cả domain exceptions trong dự án."""
    def __init__(self, message: str, details: str = ""):
        super().__init__(message)
        self.message = message
        self.details = details

    def __str__(self) -> str:
        if self.details:
            return f"{self.message} (Chi tiết: {self.details})"
        return self.message

class DocumentFetchError(GDocsTtsException):
    """Xảy ra khi không thể trích xuất nội dung tài liệu."""
    pass

class InvalidDocumentUrlError(GDocsTtsException):
    """Xảy ra khi đường dẫn Google Docs không đúng định dạng."""
    pass

class DocumentPermissionDeniedError(DocumentFetchError):
    """Xảy ra khi tài liệu Google Docs bị khóa quyền truy cập."""
    pass

class TtsSynthesisError(GDocsTtsException):
    """Xảy ra khi quá trình chuyển văn bản thành giọng nói thất bại."""
    pass

class AudioPlaybackError(GDocsTtsException):
    """Xảy ra khi trình phát âm thanh gặp sự cố."""
    pass
