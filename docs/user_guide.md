# SỔ TAY HƯỚNG DẪN SỬ DỤNG (USER GUIDE)

Hệ thống hỗ trợ chuyển đổi văn bản từ Google Docs hoặc tệp `.docx` thành giọng nói tiếng Việt tự nhiên và phát ngay lập tức.

## 1. Cài Đặt Môi Trường
```bash
cd /Users/hieuminhvu/Public/hieuvm/gdocs_tts_reader
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Chuẩn Bị Tài Liệu Google Docs
1. Mở tài liệu trên Google Docs (docs.google.com).
2. Bấm nút **Chia sẻ (Share)** ở góc trên bên phải.
3. Trong mục **Quyền truy cập chung**, chọn: **Bất kỳ ai có đường liên kết** $\to$ **Người xem**.
4. Bấm **Sao chép đường liên kết** (Copy link).

## 3. Các Lệnh Thường Dùng

### A. Đọc tài liệu Google Docs và phát audio ngay:
```bash
python3 main.py read --url "https://docs.google.com/document/d/YOUR_DOC_ID/edit"
```

### B. Chọn giọng đọc (Nam hoặc Nữ):
- Giọng Nữ (Hoài My - Mặc định):
```bash
python3 main.py read --url "..." --voice vi-VN-HoaiMyNeural
```
- Giọng Nam (Nam Minh):
```bash
python3 main.py read --url "..." --voice vi-VN-NamMinhNeural
```

### C. Đọc từ file `.docx` trong máy:
```bash
python3 main.py read --file "docx/sample_document.docx"
```

### D. Xem danh sách các giọng đọc được hỗ trợ:
```bash
python3 main.py voices
```

### E. Chế độ tương tác từng bước (Interactive Mode):
```bash
python3 main.py interactive
```
