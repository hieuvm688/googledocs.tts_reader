const { useState, useEffect, useRef, useCallback } = React;

// Danh sách giọng Việt Nam mặc định để fallback nếu chưa tải xong API
const DEFAULT_VIETNAMESE_VOICES = [
  { voice_id: "vi-VN-HoaiMyNeural", name: "Hoài My (Nữ - Truyền cảm)", gender: "Female", is_default: true },
  { voice_id: "vi-VN-NamMinhNeural", name: "Nam Minh (Nam - Trầm ấm)", gender: "Male", is_default: false },
];

function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem("gdocs_tts_theme") || "dark");

  // Tab: 'gdocs' | 'file' | 'text'
  const [activeTab, setActiveTab] = useState("gdocs");

  // Input states
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState("");

  // Settings states
  const [voices, setVoices] = useState(DEFAULT_VIETNAMESE_VOICES);
  const [selectedVoice, setSelectedVoice] = useState("vi-VN-HoaiMyNeural");
  const [rateSlider, setRateSlider] = useState(0); // -50 to +100 (%)
  const [playMac, setPlayMac] = useState(false);

  // Execution states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Audio Player states
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [isMacPlaying, setIsMacPlaying] = useState(false);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gdocs_tts_history")) || [];
    } catch {
      return [];
    }
  });

  // Apply Theme
  useEffect(() => {
    document.body.className = theme === "dark" ? "theme-dark" : "theme-light";
    localStorage.setItem("gdocs_tts_theme", theme);
  }, [theme]);

  // Load Voices from API
  useEffect(() => {
    fetch("/api/voices?locale=")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data.length > 0) {
          // Sắp xếp: Tiếng Việt lên đầu
          const sorted = [...data.data].sort((a, b) => {
            const aIsVi = a.locale.startsWith("vi") ? 1 : 0;
            const bIsVi = b.locale.startsWith("vi") ? 1 : 0;
            return bIsVi - aIsVi;
          });
          setVoices(sorted);
        }
      })
      .catch((err) => console.warn("Dùng danh sách giọng đọc mặc định.", err));
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Convert rateSlider int to string format e.g. "+10%" or "-20%"
  const getRateString = () => {
    if (rateSlider === 0) return "+0%";
    return rateSlider > 0 ? `+${rateSlider}%` : `${rateSlider}%`;
  };

  // Quick paste from clipboard
  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      alert("Trình duyệt không cho phép truy cập clipboard tự động. Vui lòng nhấn Cmd+V để dán.");
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  // Start conversion
  const handleStartRead = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);

    // Validate input
    if (activeTab === "gdocs" && !url.trim()) {
      setError({ message: "Vui lòng nhập đường dẫn Google Docs!" });
      return;
    }
    if (activeTab === "file" && !selectedFile) {
      setError({ message: "Vui lòng chọn hoặc kéo thả tệp (.docx / .txt)!" });
      return;
    }
    if (activeTab === "text" && !rawText.trim()) {
      setError({ message: "Vui lòng nhập nội dung văn bản!" });
      return;
    }

    setIsLoading(true);
    setStatusMessage("Đang chuẩn bị dữ liệu và kết nối bộ chuyển đổi...");

    try {
      let response;

      if (activeTab === "file") {
        setStatusMessage("Đang tải tệp lên và trích xuất nội dung...");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("voice", selectedVoice);
        formData.append("rate", getRateString());
        formData.append("play_mac", playMac ? "true" : "false");

        response = await fetch("/api/read", {
          method: "POST",
          body: formData,
        });
      } else {
        const payload = {
          type: activeTab === "gdocs" ? "url" : "text",
          source: activeTab === "gdocs" ? url.trim() : rawText.trim(),
          voice: selectedVoice,
          rate: getRateString(),
          play_mac: playMac,
        };

        setStatusMessage(
          activeTab === "gdocs"
            ? "Đang tải tài liệu từ Google Docs và phân tích cấu trúc..."
            : "Đang phân tích đoạn văn bản..."
        );

        response = await fetch("/api/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const resData = await response.json();

      if (!response.ok || resData.status !== "success") {
        throw new Error(resData.message || "Quá trình đọc tài liệu thất bại.");
      }

      const resultData = resData.data;
      setResult(resultData);

      // Lưu vào Lịch sử
      const newHistoryItem = {
        id: Date.now(),
        title: resultData.document_title,
        words: resultData.word_count,
        voice: resultData.voice_used,
        audio_url: resultData.audio_url,
        audio_filename: resultData.audio_filename,
        created_at: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedHistory = [newHistoryItem, ...history.filter((h) => h.title !== resultData.document_title)].slice(0, 8);
      setHistory(updatedHistory);
      localStorage.setItem("gdocs_tts_history", JSON.stringify(updatedHistory));

      // Tự động phát âm thanh trên trình duyệt nếu không chọn loa Mac
      if (!playMac) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              console.log("Autoplay bị chặn bởi trình duyệt, vui lòng bấm Play");
            });
          }
        }, 300);
      }
    } catch (err) {
      setError({
        message: err.message,
        details: err.details || "Kiểm tra lại quyền truy cập công khai của Google Docs hoặc định dạng tệp.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Player Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    }
  };

  const changeSpeed = (speed) => {
    setPlayerSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handlePlayOnMac = async (filename) => {
    if (!filename) return;
    setIsMacPlaying(true);
    try {
      await fetch("/api/play-mac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
    } catch (err) {
      alert("Không thể phát qua loa Mac: " + err.message);
    } finally {
      setTimeout(() => setIsMacPlaying(false), 2000);
    }
  };

  const handlePlayHistory = (item) => {
    setResult({
      document_title: item.title,
      word_count: item.words,
      voice_used: item.voice,
      audio_url: item.audio_url,
      audio_filename: item.audio_filename,
    });
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }, 200);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">🎙️</div>
          <div className="brand-titles">
            <h1>Google Docs TTS Reader</h1>
            <p>Trình chuyển đổi văn bản sang giọng đọc AI tự nhiên (Microsoft Neural)</p>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge">
            <span className="badge-dot"></span>
            100% Miễn phí &amp; Riêng tư
          </span>
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="glass-card">
        {/* Tabs */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "gdocs" ? "active" : ""}`}
            onClick={() => setActiveTab("gdocs")}
          >
            🔗 Google Docs
          </button>
          <button
            className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
            onClick={() => setActiveTab("file")}
          >
            📁 Tải Tệp (.docx, .txt)
          </button>
          <button
            className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            ✍️ Nhập Văn Bản
          </button>
        </div>

        {/* Tab 1: Google Docs */}
        {activeTab === "gdocs" && (
          <div className="form-group">
            <div className="form-label">
              <span>Đường dẫn liên kết Google Docs</span>
              <span className="input-hint">Yêu cầu quyền "Bất kỳ ai có đường liên kết đều xem được"</span>
            </div>
            <div className="input-with-actions">
              <input
                type="text"
                className="text-input"
                id="input-gdocs-url"
                placeholder="https://docs.google.com/document/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button className="btn-secondary" type="button" onClick={handlePasteUrl}>
                📋 Dán
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setUrl("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")}
              >
                💡 Mẫu
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === "file" && (
          <div className="form-group">
            <div
              className={`dropzone ${isDragging ? "dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input-field").click()}
            >
              <input
                id="file-input-field"
                type="file"
                accept=".docx,.txt"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <div className="dropzone-icon">📥</div>
              <div className="dropzone-title">Kéo &amp; thả tệp tin vào đây, hoặc bấm để chọn</div>
              <div className="dropzone-subtitle">Hỗ trợ tệp Microsoft Word (.docx) và Plain Text (.txt)</div>
            </div>

            {selectedFile && (
              <div className="file-selected-badge">
                <span>📄 <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  ✕ Gỡ bỏ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Direct Text */}
        {activeTab === "text" && (
          <div className="form-group">
            <div className="form-label">
              <span>Nội dung văn bản cần đọc</span>
              <span className="input-hint">{rawText.length} ký tự (~{rawText.trim() ? rawText.trim().split(/\s+/).length : 0} từ)</span>
            </div>
            <textarea
              className="textarea-input"
              id="input-direct-text"
              placeholder="Nhập hoặc dán đoạn văn bản bất kỳ mà bạn muốn lắng nghe..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
        )}

        {/* Settings Grid */}
        <div className="settings-grid">
          {/* Voice Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-voice">
              <span>Giọng đọc AI (Neural Voices)</span>
            </label>
            <select
              id="select-voice"
              className="select-input"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              <optgroup label="Tiếng Việt (Khuyên dùng)">
                <option value="vi-VN-HoaiMyNeural">👩 Hoài My (Nữ truyền cảm, ấm áp) ⭐</option>
                <option value="vi-VN-NamMinhNeural">👨 Nam Minh (Nam trầm ấm, tự nhiên) ⭐</option>
              </optgroup>
              <optgroup label="Quốc tế (Tiếng Anh & Khác)">
                {voices
                  .filter((v) => !v.voice_id.startsWith("vi-VN"))
                  .slice(0, 30)
                  .map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.locale} - {v.name} ({v.gender})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Speed / Rate */}
          <div className="form-group slider-container">
            <div className="form-label">
              <span>Tốc độ đọc</span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{getRateString()}</span>
            </div>
            <input
              type="range"
              className="range-slider"
              min="-50"
              max="100"
              step="5"
              value={rateSlider}
              onChange={(e) => setRateSlider(parseInt(e.target.value, 10))}
            />
            <div className="preset-chips">
              <button className={`preset-chip ${rateSlider === -20 ? "active" : ""}`} onClick={() => setRateSlider(-20)}>0.8x</button>
              <button className={`preset-chip ${rateSlider === 0 ? "active" : ""}`} onClick={() => setRateSlider(0)}>1.0x (Chuẩn)</button>
              <button className={`preset-chip ${rateSlider === 20 ? "active" : ""}`} onClick={() => setRateSlider(20)}>1.2x</button>
              <button className={`preset-chip ${rateSlider === 50 ? "active" : ""}`} onClick={() => setRateSlider(50)}>1.5x</button>
            </div>
          </div>
        </div>

        {/* Mac Speakers Toggle */}
        <div className="toggle-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Phát trực tiếp ra loa máy Mac (afplay)</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {playMac ? "Hệ thống sẽ phát ngay lập tức trên máy Mac của bạn." : "Phát qua trình phát âm thanh trên Web (khuyên dùng)."}
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={playMac} onChange={(e) => setPlayMac(e.target.checked)} />
            <span className="switch-slider"></span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          className="btn-primary-action"
          id="btn-start-reading"
          type="button"
          disabled={isLoading}
          onClick={handleStartRead}
        >
          {isLoading ? (
            <>
              <div className="loader-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              <span>Đang xử lý giọng nói AI...</span>
            </>
          ) : (
            <>
              <span>🎙️ Bắt đầu đọc tài liệu</span>
            </>
          )}
        </button>

        {/* Loading / Status Indicator */}
        {isLoading && (
          <div className="processing-card">
            <div className="loader-spinner" style={{ width: 28, height: 28 }}></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Đang thực hiện chuyển đổi...</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{statusMessage}</div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="error-banner">
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700 }}>{error.message}</div>
              {error.details && <div style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: 4 }}>{error.details}</div>}
            </div>
          </div>
        )}
      </main>

      {/* Result & Audio Player Card */}
      {result && (
        <section className="player-card">
          <div className="doc-info-header">
            <div>
              <div className="doc-title">📖 {result.document_title || "Tài liệu hoàn tất"}</div>
              <div className="doc-stats">
                {result.word_count && (
                  <span className="stat-item">📝 {result.word_count.toLocaleString()} từ</span>
                )}
                {result.character_count && (
                  <span className="stat-item">🔤 {result.character_count.toLocaleString()} ký tự</span>
                )}
                {result.voice_used && (
                  <span className="stat-item">🗣️ {result.voice_used.split("-").slice(-1)[0]}</span>
                )}
                {result.playback_mac && (
                  <span className="stat-item" style={{ color: "var(--accent-emerald)" }}>🔊 Đã phát trên máy Mac</span>
                )}
              </div>
            </div>
            <a
              href={result.audio_url}
              download={`${result.document_title || "speech"}.mp3`}
              className="btn-secondary"
              title="Tải tệp MP3 về máy"
            >
              ⬇️ Tải MP3
            </a>
          </div>

          {/* Hidden HTML5 Audio Element */}
          <audio
            ref={audioRef}
            src={result.audio_url}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />

          {/* Audio Waveform Simulator */}
          <div className={`wave-visualizer ${isPlaying ? "playing" : ""}`}>
            {Array.from({ length: 36 }).map((_, idx) => (
              <div key={idx} className="wave-bar"></div>
            ))}
          </div>

          {/* Audio Player Controls */}
          <div className="audio-controls-row">
            <button className="btn-secondary" style={{ padding: "8px 12px" }} onClick={() => handleSkip(-5)} title="Tua lùi 5 giây">
              ⏪ 5s
            </button>
            <button className="play-pause-btn" onClick={togglePlay} title={isPlaying ? "Tạm dừng" : "Phát"}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="btn-secondary" style={{ padding: "8px 12px" }} onClick={() => handleSkip(5)} title="Tua tới 5 giây">
              5s ⏩
            </button>

            <div className="progress-section">
              <input
                type="range"
                className="audio-progress-bar"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
              />
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Auxiliary Actions */}
          <div className="player-aux-actions">
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Tốc độ phát:</span>
            {[1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                className={`preset-chip ${playerSpeed === spd ? "active" : ""}`}
                onClick={() => changeSpeed(spd)}
              >
                {spd}x
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className="btn-secondary"
                onClick={() => handlePlayOnMac(result.audio_filename)}
                disabled={isMacPlaying}
              >
                {isMacPlaying ? "🔊 Đang phát qua Mac..." : "🔊 Phát lại ra loa máy Mac"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <section className="history-section">
          <div className="section-title">
            <span>⏱️ Lịch sử đọc gần đây</span>
            <button
              className="btn-secondary"
              style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "4px 8px" }}
              onClick={() => {
                setHistory([]);
                localStorage.removeItem("gdocs_tts_history");
              }}
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-meta">
                  <div className="history-title">{item.title}</div>
                  <div className="history-sub">
                    {item.words ? `${item.words.toLocaleString()} từ • ` : ""}
                    {item.voice ? `Giọng: ${item.voice.split("-").slice(-1)[0]} • ` : ""}
                    Lúc {item.created_at}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => handlePlayHistory(item)}
                  title="Nghe lại ngay"
                >
                  ▶ Nghe lại
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Render root
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
