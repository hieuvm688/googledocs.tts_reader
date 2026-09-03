# 🎙️ Google Docs Text-to-Speech & Audio Player (Clean Architecture)

Hệ thống tự động chuyển đổi văn bản từ **Google Docs** (hoặc tệp Word `.docx` / text `.txt`) thành giọng nói truyền cảm, tự nhiên bằng công nghệ **Microsoft Edge Neural TTS**, sau đó **tự động phát âm thanh trực tiếp** cho người dùng nghe trên máy macOS.

Dự án tuân thủ nghiêm ngặt chuẩn **Clean Architecture**, sử dụng **100% thư viện mã nguồn mở miễn phí có bản quyền hợp lệ (MIT & Apache-2.0)**, không tốn bất kỳ chi phí API nào.

---

## 🌟 Tính Năng Nổi Bật

- **Đọc trực tiếp từ Google Docs**: Chỉ cần dán đường dẫn tài liệu Google Docs (chế độ người xem công khai), hệ thống tự động tải và trích xuất nội dung văn bản.
- **Đọc tệp cục bộ**: Hỗ trợ đọc các file Word `.docx` và file `.txt` lưu trong thư mục `docx/` hoặc trên máy.
- **Giọng đọc AI tự nhiên**: Tích hợp các giọng Neural tiếng Việt hàng đầu (`vi-VN-HoaiMyNeural` - nữ truyền cảm, `vi-VN-NamMinhNeural` - nam trầm ấm) cùng hàng trăm giọng đọc đa ngôn ngữ.
- **Phát âm thanh tức thì trên macOS**: Sử dụng trình phát native `/usr/bin/afplay` với độ trễ bằng 0, không cần cài đặt driver âm thanh phức tạp.
- **Kiến trúc sạch (Clean Architecture)**: Tách biệt tuyệt đối giữa Domain, Application, Infrastructure và Presentation, dễ dàng mở rộng thêm nguồn tài liệu hoặc công cụ TTS mới.
- **Tài liệu & Chỉ thị Agent chặt chẽ**: Cung cấp đầy đủ `AGENTS.md`, `RULES.md`, `ARCHITECTURE.md` và `docs/license_compliance.md` để ngăn chặn các AI Agent tự suy diễn làm sai lệch kiến trúc.

---

## 📁 Cấu Trúc Dự Án

```
gdocs_tts_reader/
├── AGENTS.md                  # Bản hiến chương & chỉ thị cho AI Agent (Chống suy diễn)
├── RULES.md                   # Bộ quy tắc kỹ thuật & tiêu chuẩn mã nguồn
├── ARCHITECTURE.md            # Tài liệu thiết kế Clean Architecture
├── README.md                  # Hướng dẫn sử dụng tổng quan
├── requirements.txt           # Danh mục thư viện mã nguồn mở & chứng chỉ bản quyền
├── pytest.ini                 # Cấu hình kiểm thử tự động
├── run.sh                     # Script chạy nhanh tiện lợi
├── main.py                    # Điểm khởi động ứng dụng (Dependency Injection)
├── docx/                      # Thư mục lưu tài liệu dự án (.docx) & file mẫu
│   ├── README.md
│   └── sample_document.docx
├── docs/                      # Tài liệu kỹ thuật chi tiết
│   ├── license_compliance.md  # Báo cáo chứng chỉ bản quyền (MIT, Apache-2.0)
│   └── user_guide.md          # Sổ tay hướng dẫn chi tiết
├── src/
│   ├── domain/                # Hạt nhân nghiệp vụ (Entities, Ports, Exceptions)
│   ├── application/           # Điều phối luồng nghiệp vụ (Use Cases, DTOs)
│   ├── infrastructure/        # Cài đặt cụ thể (Google Docs, Edge-TTS, Afplay)
│   └── presentation/          # Giao diện dòng lệnh Rich CLI
└── tests/                     # Bộ kiểm thử tự động (Unit & Integration tests)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Kích hoạt môi trường ảo
```bash
cd /Users/hieuminhvu/Public/hieuvm/gdocs_tts_reader
source .venv/bin/activate
# (Nếu tạo mới: pip install -r requirements.txt)
```

### 2. Sử dụng lệnh nhanh qua `run.sh` hoặc `python3 main.py`

#### A. Đọc tài liệu Google Docs và phát audio ngay:
```bash
./run.sh read --url "https://docs.google.com/document/d/YOUR_DOC_ID/edit"
```
*(Lưu ý: Đảm bảo tài liệu đã được bật quyền: "Bất kỳ ai có đường liên kết đều có thể xem")*

#### B. Đọc tài liệu Word `.docx` cục bộ:
```bash
./run.sh read --file "docx/sample_document.docx"
```

#### C. Chọn giọng đọc (Nam / Nữ) và tốc độ đọc:
```bash
# Giọng Nam, tốc độ tăng 10%:
./run.sh read --file "docx/sample_document.docx" --voice vi-VN-NamMinhNeural --rate "+10%"
```

#### D. Chỉ xuất file MP3 (không phát qua loa):
```bash
./run.sh read --file "docx/sample_document.docx" --export output.mp3 --no-play
```

#### E. Xem danh sách tất cả các giọng đọc:
```bash
./run.sh voices --locale vi
```

#### F. Chế độ tương tác từng bước (Interactive Wizard):
```bash
./run.sh interactive
```

---

## 🧪 Chạy Kiểm Thử Tự Động (Tests)
```bash
./.venv/bin/pytest
```

---

## 📜 Chứng Chỉ Bản Quyền (License)
Toàn bộ các thư viện sử dụng trong dự án đều có chứng chỉ mở hợp lệ:
- `edge-tts`: Apache-2.0 / MIT
- `python-docx`: MIT
- `requests`: Apache-2.0
- `rich`: MIT
- `pytest`: MIT
- `afplay`: macOS Native
