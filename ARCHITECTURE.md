# KIẾN TRÚC HỆ THỐNG - CLEAN ARCHITECTURE (ARCHITECTURE.md)

## 1. Tổng Quan Kiến Trúc
Dự án được thiết kế theo mô hình **Clean Architecture**, phân tách triệt để các mối quan tâm (Separation of Concerns).

```
+-----------------------------------------------------------------------+
|                         PRESENTATION LAYER                            |
|             (CLI App, Rich Terminal UI, User Prompts)                |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                         APPLICATION LAYER                             |
|  Use Cases:                                                           |
|    - ReadAndSpeakUseCase      - ListVoicesUseCase                     |
|    - ExportAudioUseCase                                               |
|  DTOs: ReadAndSpeakRequest, ReadAndSpeakResult, VoiceDto              |
+-----------------------------------------------------------------------+
            |                                           ^
            v                                           |
+-----------------------------------+   +-------------------------------+
|           DOMAIN LAYER            |   |     INFRASTRUCTURE LAYER      |
|  Entities:                        |   |  Adapters:                    |
|    - Document                     |   |    - GoogleDocsUrlAdapter     |
|    - AudioTrack                   |   |    - DocxFileAdapter          |
|    - VoiceOption                  |   |    - EdgeTtsAdapter           |
|  Ports (Interfaces):              |<--|    - MacAfplayAdapter         |
|    - DocumentSourcePort           |   |                               |
|    - TtsEnginePort                |   |  External Libraries:          |
|    - AudioPlayerPort              |   |    edge-tts, python-docx,     |
|  Exceptions: Domain Errors        |   |    requests, /usr/bin/afplay  |
+-----------------------------------+   +-------------------------------+
```

## 2. Luồng Dữ Liệu Chi Tiết (Data Flow)
1. **Khởi chạy**: Người dùng nhập link Google Docs (hoặc file docx) qua CLI.
2. **Presentation**: `CLIApp` tạo `ReadAndSpeakRequest(source_path_or_url, voice_id)`.
3. **Application**: `ReadAndSpeakUseCase` nhận request:
   - Gọi `DocumentSourcePort.fetch_document(url)`:
     - `GoogleDocsUrlAdapter` giải mã Document ID $\to$ tải text từ `export?format=txt`.
     - Trả về thực thể `Document`.
   - Gọi `TtsEnginePort.synthesize(text, voice_id)`:
     - `EdgeTtsAdapter` kết nối đến Microsoft Edge Neural TTS để sinh tệp `.mp3`.
     - Trả về thực thể `AudioTrack`.
   - Gọi `AudioPlayerPort.play(audio_track)`:
     - `MacAfplayAdapter` kích hoạt `/usr/bin/afplay` phát âm thanh ra loa trực tiếp.
4. **Kết quả**: CLI nhận `ReadAndSpeakResult` và hiển thị bảng thống kê chi tiết (thời lượng, số từ, giọng đọc).
