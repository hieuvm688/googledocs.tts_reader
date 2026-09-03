# SỔ TAY HƯỚNG DẪN SỬ DỤNG (USER GUIDE)

Hệ thống **Google Docs Text-to-Speech Reader (Enterprise v2.2)** hỗ trợ chuyển đổi văn bản từ Google Docs, tệp Word `.docx` / text `.txt`, hoặc nhập văn bản trực tiếp thành giọng nói AI tự nhiên (Microsoft Edge Neural TTS) và phát ngay lập tức trên máy macOS.

---

## 1. Khởi Chạy Nhanh Giao Diện Webapp Enterprise (Khuyên dùng)

Để có trải nghiệm tiện lợi và trực quan nhất, bạn chỉ cần chạy lệnh:

```bash
cd /Users/hieuminhvu/Public/hieuvm/gdocs_tts_reader
./run_web.sh
# hoặc: ./run.sh web
```

Hệ thống sẽ tự động kích hoạt môi trường ảo `.venv`, khởi động máy chủ tại `http://127.0.0.1:8000` và tự động mở trình duyệt web.

---

## 2. Các Tính Năng Trên Giao Diện Webapp Enterprise

### A. Thanh Điều Hướng Dọc Bên Trái (Left Sidebar)
- **Studio Chuyển Đổi (TTS Studio):** Nơi làm việc chính để chuyển đổi Google Docs, tệp hoặc văn bản.
- **Thư Viện Audio (Audio Library):** Nơi lưu trữ, quản lý, tìm kiếm, nghe lại và tải các bản thu đã tạo.
- **Đa Ngôn Ngữ (Multilanguage - 11 Ngôn Ngữ):**
  - Chuyển đổi nhanh 11 ngôn ngữ: 🇻🇳 Tiếng Việt (`vi`), 🇺🇸 English (`en`), 🇨🇳 中文 (`cn`), 🇪🇸 Español (`es`), 🇫🇷 Français (`fr`), 🇯🇵 日本語 (`jp`), 🇷🇺 Русский (`ru`), 🇸🇦 العربية (`ar`), 🇮🇳 हिन्दी (`hi`), 🇩🇪 Deutsch (`de`), 🇰🇷 한국어 (`ko`).
  - Giao diện và danh sách giọng đọc tự động cập nhật tương ứng theo ngôn ngữ được chọn.
- **Chế độ Giao diện (Theme):** Bấm nút chuyển đổi Sáng ☀️ / Tối 🌙.

### B. 3 Chế Độ Nhập Văn Bản
1. **Google Docs:** Dán link tài liệu công khai (có nút dán nhanh và link mẫu).
2. **Tải Tệp:** Kéo thả tệp `.docx` hoặc `.txt`.
3. **Nhập Văn Bản:** Dán đoạn text bất kỳ.

### C. Xử Lý Song Song Siêu Tốc & Nút Dừng Xử Lý
- **Tốc độ nhanh gấp 3–5 lần:** Hệ thống tự động phân tách văn bản và xử lý song song đa luồng.
- **Nút "⏹️ Dừng xử lý":** Khi đang chuyển đổi, bạn có thể bấm nút dừng bất cứ lúc nào. Đoạn âm thanh đã xử lý trước đó sẽ được giữ lại nguyên vẹn và hiển thị ngay trên Player để bạn nghe hoặc tải về.

### D. Bộ Điều Khiển Âm Thanh (Player)
- Nút Play / Pause bật/tắt âm thanh.
- 4 nút tua nhanh: `⏪ 10s`, `⏪ 5s`, `5s ⏩`, `10s ⏩`.
- Thanh trượt timeline và thanh điều chỉnh âm lượng (Volume + Mute).
- Chỉnh tốc độ đọc: `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`.
- Nút **⬇️ Tải MP3** về máy tính.
- Nút **🔊 Phát ra loa máy Mac (`afplay`)**.

### E. Thư Viện Audio (Archive Management)
- Xem danh sách toàn bộ các file audio đã chuyển đổi với kích thước và ngày tạo.
- Tìm kiếm theo tên tài liệu.
- Nghe lại ngay, tải xuống MP3, phát loa Mac hoặc xóa file khỏi ổ đĩa.

---

## 3. Sử Dụng Qua Dòng Lệnh Terminal (CLI)

Nếu muốn sử dụng trực tiếp trên Terminal:

### A. Đọc tài liệu Google Docs và phát audio ngay:
```bash
./run.sh read --url "https://docs.google.com/document/d/YOUR_DOC_ID/edit"
```
*(Đảm bảo tài liệu đã được bật quyền: "Bất kỳ ai có đường liên kết đều có thể xem")*

### B. Chọn giọng đọc (Nam hoặc Nữ):
- Giọng Nữ (Hoài My - Mặc định):
```bash
./run.sh read --url "..." --voice vi-VN-HoaiMyNeural
```
- Giọng Nam (Nam Minh):
```bash
./run.sh read --url "..." --voice vi-VN-NamMinhNeural
```

### C. Đọc từ file `.docx` trong máy:
```bash
./run.sh read --file "docx/sample_document.docx"
```

### D. Xem danh sách các giọng đọc được hỗ trợ:
```bash
./run.sh voices --locale vi
```

### E. Chế độ tương tác từng bước (Interactive Mode):
```bash
./run.sh interactive
```

---

## 4. Chạy Kiểm Thử Tự Động (Unit Tests)
```bash
.venv/bin/pytest
```
