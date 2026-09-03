# QUY TẮC PHÁT TRIỂN & TIÊU CHUẨN DỰ ÁN (RULES.md)

Tài liệu này định nghĩa các quy tắc kỹ thuật nghiêm ngặt áp dụng cho toàn bộ mã nguồn của dự án.

## 1. Tiêu Chuẩn Ngôn Ngữ & Môi Trường
- **Python Version**: >= 3.9
- **Môi trường ảo**: Bắt buộc kích hoạt `.venv` trước khi chạy hoặc cài đặt package.
- **Dependency Management**: Mọi thư viện mới phải được ghi vào `requirements.txt` kèm ghi chú License.

## 2. Nguyên Tắc Xử Lý Ngoại Lệ (Error Handling)
1. **Không bao giờ nuốt lỗi**: Tuyệt đối không dùng `except Exception: pass`.
2. **Chuẩn hóa Exception**:
   - Mọi lỗi từ Google Docs URL/API $\to$ chuyển thành `DocumentFetchError` hoặc `InvalidDocumentUrlError`.
   - Mọi lỗi từ Edge TTS / TTS Engine $\to$ chuyển thành `TtsSynthesisError`.
   - Mọi lỗi từ Trình phát âm thanh $\to$ chuyển thành `AudioPlaybackError`.
3. **Thông báo thân thiện**: Cung cấp giải pháp xử lý lỗi cho người dùng (ví dụ: nhắc người dùng kiểm tra quyền chia sẻ "Bất kỳ ai có liên kết đều có thể xem" nếu gặp lỗi 403).

## 3. Tiêu Chuẩn Thư Viện Miễn Phí (License Rule)
| Thư viện | Giấy phép | Mục đích |
| :--- | :--- | :--- |
| `edge-tts` | Apache-2.0 / MIT | Chuyển đổi văn bản thành giọng nói (Neural TTS chất lượng cao) |
| `python-docx` | MIT | Đọc và xử lý tệp `.docx` |
| `requests` | Apache-2.0 | Tải nội dung xuất từ Google Docs |
| `rich` | MIT | Giao diện CLI chuyên nghiệp, thanh tiến trình |
| `pytest` | MIT | Framework kiểm thử tự động |

## 4. Kiểm Thử (Testing Rule)
- Mỗi Use Case phải có ít nhất 1 Unit Test tương ứng.
- Không được gọi network thật trong Unit Test (dùng Mock hoặc Stub cho các Ports).
