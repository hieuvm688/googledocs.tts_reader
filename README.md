# 🎙️ Google Docs Text-to-Speech & Audio Player (Clean Architecture)

Hệ thống tự động chuyển đổi văn bản từ **Google Docs** (hoặc tệp Word `.docx` / text `.txt`) thành giọng nói truyền cảm, tự nhiên bằng công nghệ **Microsoft Edge Neural TTS**, sau đó **tự động phát âm thanh trực tiếp** cho người dùng nghe trên máy macOS.

Dự án tuân thủ nghiêm ngặt chuẩn **Clean Architecture**, sử dụng **100% thư viện mã nguồn mở miễn phí có bản quyền hợp lệ (MIT & Apache-2.0)**, không tốn bất kỳ chi phí API nào.

---

## 🌟 Tính Năng Nổi Bật

- **Giao diện Web React Local tiện lợi**: Khởi chạy ngay bằng `./run_web.sh`, tự động mở trình duyệt, hỗ trợ kéo thả tệp, dán link Google Docs hoặc nhập text trực tiếp, tích hợp sẵn trình phát audio đầy đủ tính năng.
- **Đọc trực tiếp từ Google Docs**: Chỉ cần dán đường dẫn tài liệu Google Docs (chế độ người xem công khai), hệ thống tự động tải và trích xuất nội dung văn bản.
- **Đọc tệp cục bộ**: Hỗ trợ đọc các file Word `.docx` và file `.txt` lưu trong thư mục `docx/` hoặc trên máy.
- **Giọng đọc AI tự nhiên**: Tích hợp các giọng Neural tiếng Việt hàng đầu (`vi-VN-HoaiMyNeural` - nữ truyền cảm, `vi-VN-NamMinhNeural` - nam trầm ấm) cùng hàng trăm giọng đọc đa ngôn ngữ.
- **Phát âm thanh tức thì trên macOS**: Hỗ trợ cả phát trực tiếp trên trình duyệt Web lẫn phát native qua `/usr/bin/afplay` với độ trễ bằng 0.
- **Kiến trúc sạch (Clean Architecture)**: Tách biệt tuyệt đối giữa Domain, Application, Infrastructure và Presentation (CLI & Web), dễ dàng mở rộng thêm nguồn tài liệu hoặc công cụ TTS mới.
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
├── run.sh                     # Script CLI chạy nhanh tiện lợi
├── run_web.sh                 # Script khởi chạy Giao diện Web React Local
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
│   ├── infrastructure/        # Cài đặt cụ thể (Google Docs, Docx, RawText, Edge-TTS, Afplay)
│   └── presentation/          # Tầng hiển thị: Rich CLI & Web React local
│       ├── cli/               # Giao diện dòng lệnh Terminal
│       └── web/               # Web Server (aiohttp) & React Frontend (Glassmorphism UI)
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

### 2. Khởi chạy Giao Diện Webapp Enterprise Local (Khuyên dùng)
Chỉ cần chạy lệnh sau, hệ thống sẽ tự động khởi động server và mở trình duyệt web:
```bash
./run_web.sh
# Hoặc: ./run.sh web
```
- **🌟 Tính năng Webapp Enterprise v2.2:**
  - **Thanh điều hướng Sidebar dọc bên trái (Left Sidebar):** Thiết kế chuẩn Enterprise hiện đại, chuyển đổi tức thì giữa **Studio Chuyển Đổi** và **Thư Viện Audio**.
  - **⚡ Xử lý song song siêu tốc (Parallel Synthesis):** Tự động phân đoạn và tổng hợp song song đa luồng qua Edge Neural, tăng tốc độ hoàn thành nhanh gấp 3–5 lần.
  - **⏹️ Nút "Dừng xử lý" & Giữ âm thanh:** Cho phép dừng chuyển đổi bất kỳ lúc nào; đoạn âm thanh đã hoàn tất trước đó được bảo toàn thành file MP3 để nghe hoặc tải về máy.
  - **🌐 Đa Ngôn Ngữ (Multilanguage 11 Ngôn Ngữ):** Chuyển đổi giao diện và tự động lọc giọng đọc AI tương ứng cho 11 quốc gia (`vi`, `en`, `cn`, `es`, `fr`, `jp`, `ru`, `ar`, `hi`, `de`, `ko`).
  - **📁 Thư Viện Audio (Archive & Management):** Quản lý toàn bộ các bản thu đã tạo, hỗ trợ tìm kiếm, phát ngay, tải MP3, phát loa Mac, và xóa file.
  - **🎛️ Bộ Điều Khiển Player Hoàn Hảo:** Nút Play/Pause, tua lùi/tiến 5s & 10s, thanh trượt scrubber, âm lượng & mute, tùy chỉnh tốc độ đọc, tải MP3 trực tiếp.

### 3. Sử dụng qua dòng lệnh Terminal (CLI)

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
