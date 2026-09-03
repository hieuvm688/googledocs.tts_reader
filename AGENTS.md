# BẢN HIẾN CHƯƠNG & CHỈ THỊ DÀNH CHO AI AGENT (AGENTS.md)

> **CẢNH BÁO QUAN TRỌNG:**
> Mọi AI Agent (Gemini, Claude, GPT, Cursor, Copilot, Antigravity...) khi đọc hoặc chỉnh sửa repository này **BẮT BUỘC TUÂN THỦ 100% CÁC QUY TẮC DƯỚI ĐÂY**.
> **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ SUY DIỄN**, không được tự ý phá vỡ ranh giới kiến trúc (Clean Architecture), không được cài đặt thư viện khi chưa kiểm tra giấy phép bản quyền.

---

## 1. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM: CLEAN ARCHITECTURE

Dự án này tổ chức theo **Clean Architecture (Onion Architecture)**. Chiều phụ thuộc (Dependency Direction) **CHỈ ĐƯỢC PHÉP ĐI TỪ NGOÀI VÀO TRONG**.

```
[Presentation] ──▶ [Application] ──▶ [Domain] ◀── [Infrastructure]
```

### Ranh Giới Giữa Các Tầng:
1. **Tầng Domain (`src/domain/`)**:
   - Là hạt nhân trung tâm của ứng dụng.
   - **CẤM TUYỆT ĐỐI**: Không bao giờ import bất kỳ thư viện bên thứ 3 nào (trừ thư viện chuẩn của Python như `dataclasses`, `abc`, `typing`, `enum`).
   - **CẤM TUYỆT ĐỐI**: Không import từ `src/application`, `src/infrastructure`, hay `src/presentation`.
   - Mọi giao tiếp với thế giới bên ngoài (TTS, Download, Play audio) BẮT BUỘC phải thông qua **Port (Abstract Base Class / Interface)** nằm trong `src/domain/ports/`.

2. **Tầng Application (`src/application/`)**:
   - Chứa logic nghiệp vụ (Use Cases) và Data Transfer Objects (DTOs).
   - Chỉ phụ thuộc vào `src/domain/`.
   - **CẤM TUYỆT ĐỐI**: Không import trực tiếp từ `src/infrastructure/` (Ví dụ: Không bao giờ `from src.infrastructure.tts_engines.edge_tts_adapter import EdgeTtsAdapter` bên trong Use Case).
   - Use Case chỉ làm việc với các Port trừu tượng được tiêm vào (Dependency Injection).

3. **Tầng Infrastructure (`src/infrastructure/`)**:
   - Chứa các Adapter cụ thể hiện thực hóa các Port của Domain.
   - Được phép sử dụng thư viện bên ngoài (ví dụ: `edge-tts`, `requests`, `python-docx`, `subprocess`).
   - Phải bắt toàn bộ ngoại lệ kỹ thuật của thư viện bên thứ 3 và bọc lại thành Domain Exception (ví dụ: `TtsSynthesisError`, `DocumentFetchError`).

4. **Tầng Presentation (`src/presentation/`) & Entrypoint (`main.py`)**:
   - Giao tiếp với người dùng (CLI, Terminal, Rich UI).
   - Chỉ gọi `Application Use Cases`.
   - Là nơi duy nhất kết nối (Wiring/Dependency Injection) các Adapter cụ thể từ Infrastructure vào Use Case.

---

## 2. QUY TRÌNH KHI AGENT THÊM TÍNH NĂNG MỚI (CHỐNG TỰ SUY DIỄN)

Khi có yêu cầu phát triển tính năng mới, Agent phải thực hiện theo trình tự 5 bước:

1. **Bước 1: Xác định Thực Thể (Domain Entity) & Ngoại Lệ (Exception)**
   - Tạo hoặc cập nhật entity trong `src/domain/entities/`.
   - Định nghĩa exception tương ứng trong `src/domain/exceptions/`.
2. **Bước 2: Định nghĩa Cổng Giao Tiếp (Domain Port)**
   - Tạo Interface kế thừa từ `abc.ABC` trong `src/domain/ports/`.
   - Khai báo rõ các phương thức trừu tượng (`@abstractmethod`) cùng Type Hints đầy đủ.
3. **Bước 3: Viết Nghiệp Vụ (Application Use Case & DTO)**
   - Định nghĩa DTO Request/Response trong `src/application/dtos/`.
   - Viết Use Case trong `src/application/use_cases/`.
4. **Bước 4: Cài Đặt Adapter Cụ Thể (Infrastructure Adapter)**
   - Tạo class hiện thực hóa Port trong `src/infrastructure/`.
   - Đảm bảo xử lý lỗi và logging đầy đủ.
5. **Bước 5: Ghép Nối (DI) & Viết Test**
   - Đăng ký Adapter vào `main.py` hoặc CLI.
   - Viết Unit Test kiểm thử Use Case bằng Mock Adapter.

---

## 3. TIÊU CHUẨN MÃ NGUỒN & CHỨNG CHỈ BẢN QUYỀN

1. **Chứng chỉ thư viện (License Compliance)**:
   - Chỉ được phép sử dụng các thư viện miễn phí có chứng chỉ tương thích thương mại: **MIT**, **Apache-2.0**, **BSD**.
   - CẤM sử dụng các thư viện GPL có tính chất copyleft lây nhiễm hoặc các dịch vụ TTS yêu cầu trả phí / API key độc quyền.
2. **Định dạng code (Code Style)**:
   - 100% hàm và phương thức phải có **Type Hints** (`typing`).
   - Mọi class và method phải có docstrings tiếng Việt hoặc tiếng Anh chuẩn.
   - Xử lý bất đồng bộ (`asyncio`) chuẩn xác khi làm việc với `edge-tts`.
