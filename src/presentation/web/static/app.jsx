const { useState, useEffect, useRef, useCallback } = React;

// 11 Ngôn ngữ hỗ trợ
const LANGUAGES = {
  vi: { name: "Tiếng Việt", flag: "🇻🇳", defaultVoice: "vi-VN-HoaiMyNeural" },
  en: { name: "English", flag: "🇺🇸", defaultVoice: "en-US-JennyNeural" },
  cn: { name: "中文", flag: "🇨🇳", defaultVoice: "zh-CN-XiaoxiaoNeural" },
  es: { name: "Español", flag: "🇪🇸", defaultVoice: "es-ES-ElviraNeural" },
  fr: { name: "Français", flag: "🇫🇷", defaultVoice: "fr-FR-DeniseNeural" },
  jp: { name: "日本語", flag: "🇯🇵", defaultVoice: "ja-JP-NanamiNeural" },
  ru: { name: "Русский", flag: "🇷🇺", defaultVoice: "ru-RU-SvetlanaNeural" },
  ar: { name: "العربية", flag: "🇸🇦", defaultVoice: "ar-SA-ZariyahNeural" },
  hi: { name: "हिन्दी", flag: "🇮🇳", defaultVoice: "hi-IN-SwaraNeural" },
  de: { name: "Deutsch", flag: "🇩🇪", defaultVoice: "de-DE-KatjaNeural" },
  ko: { name: "한국어", flag: "🇰🇷", defaultVoice: "ko-KR-SunHiNeural" },
};

// Từ điển bản địa hóa (i18n) cho 11 ngôn ngữ
const I18N = {
  vi: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Chuyển đổi văn bản & tài liệu thành giọng đọc AI tự nhiên",
    workspaceTitle: "KHÔNG GIAN LÀM VIỆC",
    systemTitle: "HỆ THỐNG & CÀI ĐẶT",
    tabConverter: "Studio Chuyển Đổi",
    tabLibrary: "Thư Viện Audio",
    tabGdocs: "Google Docs",
    tabFile: "Tải Tệp (.docx, .txt)",
    tabText: "Nhập Văn Bản",
    gdocsLabel: "Đường dẫn liên kết Google Docs",
    gdocsHint: 'Yêu cầu quyền "Bất kỳ ai có đường liên kết đều có thể xem"',
    paste: "📋 Dán",
    sample: "💡 Mẫu",
    dropzoneTitle: "Kéo & thả tệp tin vào đây, hoặc bấm để chọn",
    dropzoneSubtitle: "Hỗ trợ tệp Microsoft Word (.docx) và Plain Text (.txt)",
    remove: "✕ Gỡ bỏ",
    textLabel: "Nội dung văn bản cần đọc",
    textPlaceholder: "Nhập hoặc dán nội dung bất kỳ mà bạn muốn lắng nghe...",
    voiceLabel: "Giọng đọc AI (Neural Voices)",
    speedLabel: "Tốc độ đọc",
    macToggle: "Phát trực tiếp ra loa máy Mac (afplay)",
    macToggleSub: "Hệ thống sẽ phát ngay lập tức trên máy Mac của bạn.",
    startBtn: "🎙️ Bắt đầu chuyển đổi siêu tốc",
    processing: "Đang xử lý song song siêu tốc...",
    stopBtn: "⏹️ Dừng xử lý",
    stopping: "Đang dừng...",
    downloadMp3: "⬇️ Tải MP3",
    playMac: "🔊 Phát ra loa máy Mac",
    playingMac: "🔊 Đang phát loa Mac...",
    partialBadge: "⏹️ Bản thu một phần (Đã dừng)",
    completed: "Hoàn tất",
    libraryTitle: "Thư Viện Các Bản Audio",
    searchPlaceholder: "Tìm kiếm bản thu theo tên...",
    emptyLibrary: "Chưa có bản thu nào trong thư viện.",
    delete: "🗑️ Xóa",
    deleteConfirm: "Bạn có chắc chắn muốn xóa bản thu này khỏi máy?",
    playNow: "▶ Phát ngay",
    words: "từ",
    chars: "ký tự",
    tabActiveAudio: "Audio Đang Phát",
    activeAudioTitle: "Quản Lý Audio Đang Mở & Chạy Nền",
    activeAudioSubtitle: "Giám sát các tiến trình afplay và tắt các audio đang chạy ngầm trên máy",
    stopAllAudio: "⏹️ Dừng tất cả audio nền",
    stopThisAudio: "⏹️ Tắt audio này",
    stopMac: "Dừng loa Mac",
    noActiveAudio: "Hiện không có audio nào đang chạy dưới nền.",
    backgroundAudioPlaying: "audio đang phát dưới nền",
    manageSessions: "Quản lý",
    refresh: "Làm mới",
    rename: "Đổi tên",
    renameModalTitle: "Đổi Tên Bản Thu Âm Thanh",
    renameInputLabel: "Tiêu đề bản thu mới:",
    renamePlaceholder: "Nhập tên mới cho bản thu...",
    deleteModalTitle: "Xác Nhận Xóa Bản Thu",
    deleteModalMessage: "Bạn có chắc chắn muốn xóa vĩnh viễn bản thu này khỏi máy tính? Thao tác này không thể hoàn tác.",
    dontAskAgain: "Không hỏi lại lần sau",
    save: "Lưu thay đổi",
    cancel: "Hủy",
    saving: "Đang lưu...",
    resetDeleteConfirm: "Bật lại hỏi khi xóa",
    skipConfirmActive: "Đang bật xóa nhanh (Không hỏi lại)",
  },
  en: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Convert documents & text to natural AI speech",
    workspaceTitle: "WORKSPACE",
    systemTitle: "SYSTEM & SETTINGS",
    tabConverter: "TTS Studio",
    tabLibrary: "Audio Library",
    tabGdocs: "Google Docs",
    tabFile: "Upload File (.docx, .txt)",
    tabText: "Direct Text",
    gdocsLabel: "Google Docs document link",
    gdocsHint: 'Requires "Anyone with the link can view" permission',
    paste: "📋 Paste",
    sample: "💡 Demo",
    dropzoneTitle: "Drag & drop files here, or click to browse",
    dropzoneSubtitle: "Supports Word (.docx) and Plain Text (.txt)",
    remove: "✕ Remove",
    textLabel: "Text content to read",
    textPlaceholder: "Type or paste any text content you want to listen to...",
    voiceLabel: "AI Voice (Neural)",
    speedLabel: "Speech Rate",
    macToggle: "Play directly on Mac speakers (afplay)",
    macToggleSub: "Audio will play immediately on your Mac.",
    startBtn: "🎙️ Start Fast Conversion",
    processing: "Processing with high-speed parallel synthesis...",
    stopBtn: "⏹️ Stop Processing",
    stopping: "Stopping...",
    downloadMp3: "⬇️ Download MP3",
    playMac: "🔊 Play on Mac Speakers",
    playingMac: "🔊 Playing on Mac...",
    partialBadge: "⏹️ Partial Audio (Stopped)",
    completed: "Completed",
    libraryTitle: "Audio Library & Archive",
    searchPlaceholder: "Search audio recordings...",
    emptyLibrary: "No audio recordings found in library.",
    delete: "🗑️ Delete",
    deleteConfirm: "Are you sure you want to delete this audio file?",
    playNow: "▶ Play Now",
    words: "words",
    chars: "characters",
    tabActiveAudio: "Active Audio",
    activeAudioTitle: "Active & Background Audio Manager",
    activeAudioSubtitle: "Monitor and stop background audio playback processes on your Mac",
    stopAllAudio: "⏹️ Stop All Background Audio",
    stopThisAudio: "⏹️ Stop Audio",
    stopMac: "Stop Mac Speaker",
    noActiveAudio: "No audio is currently playing in the background.",
    backgroundAudioPlaying: "audio tracks playing in background",
    manageSessions: "Manage",
    refresh: "Refresh",
    rename: "Rename",
    renameModalTitle: "Rename Audio Recording",
    renameInputLabel: "New audio title:",
    renamePlaceholder: "Enter new title...",
    deleteModalTitle: "Confirm Audio Deletion",
    deleteModalMessage: "Are you sure you want to permanently delete this audio recording? This action cannot be undone.",
    dontAskAgain: "Do not ask again",
    save: "Save Changes",
    cancel: "Cancel",
    saving: "Saving...",
    resetDeleteConfirm: "Enable delete prompt",
    skipConfirmActive: "Quick delete enabled (No confirmation)",
  },
  cn: {
    appTitle: "Google Docs 语音工作台",
    appSubtitle: "将文档和文本转换为自然流畅的 AI 语音",
    workspaceTitle: "工作空间",
    systemTitle: "系统与设置",
    tabConverter: "语音工作室",
    tabLibrary: "音频媒体库",
    tabGdocs: "Google 文档",
    tabFile: "上传文件 (.docx, .txt)",
    tabText: "直接输入",
    gdocsLabel: "Google Docs 链接",
    gdocsHint: "需要开启「任何知道链接的人均可查看」权限",
    paste: "📋 粘贴",
    sample: "💡 示例",
    dropzoneTitle: "拖拽文件到此处，或点击选择",
    dropzoneSubtitle: "支持 Word (.docx) 和文本文档 (.txt)",
    remove: "✕ 移除",
    textLabel: "待朗读文本内容",
    textPlaceholder: "在此输入或粘贴想要朗读的内容...",
    voiceLabel: "AI 语音",
    speedLabel: "语速",
    macToggle: "直接通过 Mac 扬声器播放 (afplay)",
    macToggleSub: "转换后将在 Mac 上直接播放声音。",
    startBtn: "🎙️ 开始极速转换",
    processing: "正在并行高速处理中...",
    stopBtn: "⏹️ 停止处理",
    stopping: "正在停止...",
    downloadMp3: "⬇️ 下载 MP3",
    playMac: "🔊 Mac 扬声器播放",
    playingMac: "🔊 正在播放...",
    partialBadge: "⏹️ 部分音频（已停止）",
    completed: "完成",
    libraryTitle: "已转换音频库",
    searchPlaceholder: "按名称搜索音频...",
    emptyLibrary: "媒体库中暂无音频文件。",
    delete: "🗑️ 删除",
    deleteConfirm: "确定要删除此音频文件吗？",
    playNow: "▶ 立即播放",
    words: "词",
    chars: "字",
  },
  es: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Convierte documentos y texto en voz natural de IA",
    workspaceTitle: "ESPACIO DE TRABAJO",
    systemTitle: "SISTEMA Y AJUSTES",
    tabConverter: "Estudio TTS",
    tabLibrary: "Biblioteca de Audio",
    tabGdocs: "Google Docs",
    tabFile: "Subir Archivo (.docx, .txt)",
    tabText: "Texto Directo",
    gdocsLabel: "Enlace de Google Docs",
    gdocsHint: 'Requiere permiso "Cualquiera con el enlace puede ver"',
    paste: "📋 Pegar",
    sample: "💡 Ejemplo",
    dropzoneTitle: "Arrastra y suelta archivos aquí, o haz clic para buscar",
    dropzoneSubtitle: "Soporta Word (.docx) y texto plano (.txt)",
    remove: "✕ Quitar",
    textLabel: "Contenido de texto a leer",
    textPlaceholder: "Escribe o pega el texto que deseas escuchar...",
    voiceLabel: "Voz de IA (Neural)",
    speedLabel: "Velocidad",
    macToggle: "Reproducir en altavoces de Mac (afplay)",
    macToggleSub: "El audio se reproducirá directamente en tu Mac.",
    startBtn: "🎙️ Iniciar Conversión Rápida",
    processing: "Procesando en paralelo a alta velocidad...",
    stopBtn: "⏹️ Detener Proceso",
    stopping: "Deteniendo...",
    downloadMp3: "⬇️ Descargar MP3",
    playMac: "🔊 Altavoces de Mac",
    playingMac: "🔊 Reproduciendo...",
    partialBadge: "⏹️ Audio Parcial (Detenido)",
    completed: "Completado",
    libraryTitle: "Biblioteca de Archivos de Audio",
    searchPlaceholder: "Buscar audios por nombre...",
    emptyLibrary: "No hay archivos en la biblioteca.",
    delete: "🗑️ Eliminar",
    deleteConfirm: "¿Seguro que deseas eliminar este archivo?",
    playNow: "▶ Reproducir",
    words: "palabras",
    chars: "caracteres",
  },
  fr: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Convertissez vos documents et textes en voix IA naturelle",
    workspaceTitle: "ESPACE DE TRAVAIL",
    systemTitle: "SYSTÈME ET PARAMÈTRES",
    tabConverter: "Studio TTS",
    tabLibrary: "Bibliothèque Audio",
    tabGdocs: "Google Docs",
    tabFile: "Fichier (.docx, .txt)",
    tabText: "Texte Direct",
    gdocsLabel: "Lien Google Docs",
    gdocsHint: 'Nécessite l\'accès "Tous les utilisateurs disposant du lien"',
    paste: "📋 Coller",
    sample: "💡 Exemple",
    dropzoneTitle: "Glissez-déposez un fichier ici ou cliquez",
    dropzoneSubtitle: "Prend en charge Word (.docx) et texte brut (.txt)",
    remove: "✕ Supprimer",
    textLabel: "Contenu texte à lire",
    textPlaceholder: "Tapez ou collez le texte que vous voulez écouter...",
    voiceLabel: "Voix IA (Neural)",
    speedLabel: "Vitesse de lecture",
    macToggle: "Diffuser sur les haut-parleurs Mac (afplay)",
    macToggleSub: "Le son sera lu directement sur votre Mac.",
    startBtn: "🎙️ Lancer la Conversion Rapide",
    processing: "Traitement parallèle accéléré en cours...",
    stopBtn: "⏹️ Arrêter",
    stopping: "Arrêt en cours...",
    downloadMp3: "⬇️ Télécharger MP3",
    playMac: "🔊 Haut-parleurs Mac",
    playingMac: "🔊 Lecture en cours...",
    partialBadge: "⏹️ Audio Partiel (Arrêté)",
    completed: "Terminé",
    libraryTitle: "Bibliothèque des Fichiers Audio",
    searchPlaceholder: "Rechercher un enregistrement...",
    emptyLibrary: "Aucun fichier audio enregistré.",
    delete: "🗑️ Supprimer",
    deleteConfirm: "Voulez-vous vraiment supprimer ce fichier ?",
    playNow: "▶ Écouter",
    words: "mots",
    chars: "caractères",
  },
  jp: {
    appTitle: "Google Docs 音声スタジオ",
    appSubtitle: "文書やテキストを自然な AI 音声に変換",
    workspaceTitle: "ワークスペース",
    systemTitle: "システム設定",
    tabConverter: "音声スタジオ",
    tabLibrary: "音声ライブラリ",
    tabGdocs: "Google ドキュメント",
    tabFile: "ファイル (.docx, .txt)",
    tabText: "テキスト直接入力",
    gdocsLabel: "Google ドキュメントのリンク",
    gdocsHint: "「リンクを知っている全員が閲覧可能」設定が必要です",
    paste: "📋 貼り付け",
    sample: "💡 サンプル",
    dropzoneTitle: "ファイルをドラッグ＆ドロップ、または選択",
    dropzoneSubtitle: "Word (.docx) およびテキスト (.txt) に対応",
    remove: "✕ 削除",
    textLabel: "読み上げるテキスト",
    textPlaceholder: "読み上げたい内容を入力または貼り付け...",
    voiceLabel: "AI 音声",
    speedLabel: "読み上げ速度",
    macToggle: "Mac スピーカーで直接再生 (afplay)",
    macToggleSub: "変換完了後、Mac から即座に音声が流れます。",
    startBtn: "🎙️ 高速変換を開始",
    processing: "並行高速処理中...",
    stopBtn: "⏹️ 処理停止",
    stopping: "停止中...",
    downloadMp3: "⬇️ MP3 を保存",
    playMac: "🔊 Mac で再生",
    playingMac: "🔊 再生中...",
    partialBadge: "⏹️ 部分録音（停止済み）",
    completed: "完了",
    libraryTitle: "変換済み音声ライブラリ",
    searchPlaceholder: "録音を検索...",
    emptyLibrary: "ライブラリに音声がありません。",
    delete: "🗑️ 削除",
    deleteConfirm: "この音声ファイルを削除しますか？",
    playNow: "▶ 今すぐ再生",
    words: "単語",
    chars: "文字",
  },
  ru: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Преобразование текста и документов в живой голос ИИ",
    workspaceTitle: "РАБОЧАЯ ОБЛАСТЬ",
    systemTitle: "СИСТЕМА И НАСТРОЙКИ",
    tabConverter: "TTS Студия",
    tabLibrary: "Аудиотека",
    tabGdocs: "Google Docs",
    tabFile: "Файл (.docx, .txt)",
    tabText: "Ввод Текста",
    gdocsLabel: "Ссылка на Google Docs",
    gdocsHint: 'Требуется доступ "Все, у кого есть ссылка, могут просматривать"',
    paste: "📋 Вставить",
    sample: "💡 Пример",
    dropzoneTitle: "Перетащите файл сюда или нажмите для выбора",
    dropzoneSubtitle: "Поддерживаются Word (.docx) и текст (.txt)",
    remove: "✕ Удалить",
    textLabel: "Текст для чтения",
    textPlaceholder: "Введите или вставьте текст для озвучки...",
    voiceLabel: "Голос ИИ (Neural)",
    speedLabel: "Скорость",
    macToggle: "Воспроизводить через динамики Mac (afplay)",
    macToggleSub: "Звук будет проигрываться прямо на вашем Mac.",
    startBtn: "🎙️ Начать Быстрое Преобразование",
    processing: "Выполняется параллельная обработка...",
    stopBtn: "⏹️ Остановить",
    stopping: "Остановка...",
    downloadMp3: "⬇️ Скачать MP3",
    playMac: "🔊 Динамики Mac",
    playingMac: "🔊 Воспроизведение...",
    partialBadge: "⏹️ Частичная запись (Остановлено)",
    completed: "Завершено",
    libraryTitle: "Библиотека Аудиозаписей",
    searchPlaceholder: "Поиск аудиофайлов...",
    emptyLibrary: "В аудиотеке пока нет записей.",
    delete: "🗑️ Удалить",
    deleteConfirm: "Вы уверены, что хотите удалить этот файл?",
    playNow: "▶ Слушать",
    words: "слов",
    chars: "символов",
  },
  ar: {
    appTitle: "استوديو مستندات Google الصوتي",
    appSubtitle: "تحويل المستندات والنصوص إلى أصوات ذكاء اصطناعي طبيعية",
    workspaceTitle: "مساحة العمل",
    systemTitle: "النظام والإعدادات",
    tabConverter: "استوديو الصوت",
    tabLibrary: "مكتبة الصوتيات",
    tabGdocs: "مستندات Google",
    tabFile: "رفع ملف (.docx, .txt)",
    tabText: "إدخال نص",
    gdocsLabel: "رابط مستند Google",
    gdocsHint: 'يتطلب إذن "أي شخص لديه الرابط يمكنه العرض"',
    paste: "📋 لصق",
    sample: "💡 مثال",
    dropzoneTitle: "اسحب الملف وأفلته هنا أو اضغط للاختيار",
    dropzoneSubtitle: "يدعم Word (.docx) والنصوص (.txt)",
    remove: "✕ إزالة",
    textLabel: "النص المطلوب قراءته",
    textPlaceholder: "اكتب أو الصق النص هنا...",
    voiceLabel: "الصوت الذكي (Neural)",
    speedLabel: "سرعة القراءة",
    macToggle: "التشغيل عبر مكبر صوت Mac مباشرة (afplay)",
    macToggleSub: "سيتم تشغيل الصوت مباشرة على جهاز Mac الخاص بك.",
    startBtn: "🎙️ بدء التحويل السريع",
    processing: "جاري المعالجة المتوازية فائقة السرعة...",
    stopBtn: "⏹️ إيقاف المعالجة",
    stopping: "جاري الإيقاف...",
    downloadMp3: "⬇️ تحميل MP3",
    playMac: "🔊 مكبر صوت Mac",
    playingMac: "🔊 جاري التشغيل...",
    partialBadge: "⏹️ تسجيل جزئي (تم الإيقاف)",
    completed: "مكتمل",
    libraryTitle: "مكتبة التسجيلات الصوتية",
    searchPlaceholder: "بحث عن تسجيل...",
    emptyLibrary: "لا توجد ملفات صوتية محفوظة.",
    delete: "🗑️ حذف",
    deleteConfirm: "هل أنت متأكد من حذف هذا الملف الصوتي؟",
    playNow: "▶ استمع الآن",
    words: "كلمة",
    chars: "حرف",
  },
  hi: {
    appTitle: "Google Docs टीटीएस स्टूडियो",
    appSubtitle: "दस्तावेज़ों और टेक्स्ट को स्वाभाविक AI आवाज़ में बदलें",
    workspaceTitle: "कार्यक्षेत्र",
    systemTitle: "सिस्टम और सेटिंग्स",
    tabConverter: "टीटीएस स्टूडियो",
    tabLibrary: "ऑडियो लाइब्रेरी",
    tabGdocs: "Google Docs",
    tabFile: "फ़ाइल (.docx, .txt)",
    tabText: "सीधा टेक्स्ट",
    gdocsLabel: "Google Docs दस्तावेज़ लिंक",
    gdocsHint: '"लिंक वाला कोई भी व्यक्ति देख सकता है" अनुमति आवश्यक है',
    paste: "📋 पेस्ट",
    sample: "💡 डेमो",
    dropzoneTitle: "फ़ाइलें यहाँ खींचें या चुनने के लिए क्लिक करें",
    dropzoneSubtitle: "Word (.docx) और Plain Text (.txt) समर्थित",
    remove: "✕ हटाएं",
    textLabel: "पढ़ने के लिए टेक्स्ट सामग्री",
    textPlaceholder: "वह टेक्स्ट टाइप या पेस्ट करें जिसे आप सुनना चाहते हैं...",
    voiceLabel: "AI आवाज़",
    speedLabel: "बोलने की गति",
    macToggle: "Mac स्पीकर पर सीधे चलाएं (afplay)",
    macToggleSub: "ऑडियो सीधे आपके Mac पर बजेगा।",
    startBtn: "🎙️ तेज़ रूपांतरण शुरू करें",
    processing: "तेज़ समानांतर प्रोसेसिंग जारी है...",
    stopBtn: "⏹️ रोकें",
    stopping: "रुक रहा है...",
    downloadMp3: "⬇️ MP3 डाउनलोड करें",
    playMac: "🔊 Mac स्पीकर",
    playingMac: "🔊 बज रहा है...",
    partialBadge: "⏹️ आंशिक ऑडियो (रोका गया)",
    completed: "पूर्ण",
    libraryTitle: "ऑडियो फ़ाइल लाइब्रेरी",
    searchPlaceholder: "ऑडियो खोजें...",
    emptyLibrary: "लाइब्रेरी में कोई ऑडियो नहीं है।",
    delete: "🗑️ हटाएं",
    deleteConfirm: "क्या आप वाकई इस ऑडियो फ़ाइल को हटाना चाहते हैं?",
    playNow: "▶ अभी सुनें",
    words: "शब्द",
    chars: "अक्षर",
  },
  de: {
    appTitle: "Google Docs TTS Studio",
    appSubtitle: "Dokumente und Texte in natürliche KI-Stimme umwandeln",
    workspaceTitle: "ARBEITSBEREICH",
    systemTitle: "SYSTEM & EINSTELLUNGEN",
    tabConverter: "TTS Studio",
    tabLibrary: "Audio-Bibliothek",
    tabGdocs: "Google Docs",
    tabFile: "Datei (.docx, .txt)",
    tabText: "Direkter Text",
    gdocsLabel: "Google Docs Dokument-Link",
    gdocsHint: 'Benötigt "Jeder mit dem Link kann ansehen" Berechtigung',
    paste: "📋 Einfügen",
    sample: "💡 Demo",
    dropzoneTitle: "Datei hierher ziehen oder klicken zum Auswählen",
    dropzoneSubtitle: "Unterstützt Word (.docx) und Textdateien (.txt)",
    remove: "✕ Entfernen",
    textLabel: "Zu lesender Textinhalt",
    textPlaceholder: "Geben Sie den Text ein, den Sie hören möchten...",
    voiceLabel: "KI-Stimme (Neural)",
    speedLabel: "Lesegeschwindigkeit",
    macToggle: "Direkt über Mac-Lautsprecher abspielen (afplay)",
    macToggleSub: "Der Ton wird direkt auf Ihrem Mac wiedergegeben.",
    startBtn: "🎙️ Schnelle Konvertierung Starten",
    processing: "Hochgeschwindigkeits-Parallelverarbeitung...",
    stopBtn: "⏹️ Abbrechen",
    stopping: "Wird gestoppt...",
    downloadMp3: "⬇️ MP3 Herunterladen",
    playMac: "🔊 Mac-Lautsprecher",
    playingMac: "🔊 Wiedergabe auf Mac...",
    partialBadge: "⏹️ Teilaufnahme (Gestoppt)",
    completed: "Abgeschlossen",
    libraryTitle: "Bibliothek der Audiodateien",
    searchPlaceholder: "Audioaufnahmen durchsuchen...",
    emptyLibrary: "Keine Audiodateien in der Bibliothek.",
    delete: "🗑️ Löschen",
    deleteConfirm: "Möchten Sie diese Audiodatei wirklich löschen?",
    playNow: "▶ Jetzt Anhören",
    words: "Wörter",
    chars: "Zeichen",
  },
  ko: {
    appTitle: "Google Docs TTS 스튜디오",
    appSubtitle: "문서 및 텍스트를 자연스러운 AI 음성으로 변환",
    workspaceTitle: "작업 공간",
    systemTitle: "시스템 및 설정",
    tabConverter: "TTS 스튜디오",
    tabLibrary: "오디오 보관함",
    tabGdocs: "Google Docs",
    tabFile: "파일 (.docx, .txt)",
    tabText: "직접 입력",
    gdocsLabel: "Google Docs 문서 링크",
    gdocsHint: '"링크가 있는 모든 사용자가 볼 수 있음" 권한 필요',
    paste: "📋 붙여넣기",
    sample: "💡 예시",
    dropzoneTitle: "파일을 여기에 드래그하거나 클릭하여 선택",
    dropzoneSubtitle: "Word (.docx) 및 텍스트 (.txt) 지원",
    remove: "✕ 삭제",
    textLabel: "읽을 텍스트 내용",
    textPlaceholder: "듣고 싶은 텍스트 내용을 입력하거나 붙여넣으세요...",
    voiceLabel: "AI 음성",
    speedLabel: "읽기 속도",
    macToggle: "Mac 스피커로 직접 재생 (afplay)",
    macToggleSub: "오디오가 Mac에서 즉시 재생됩니다.",
    startBtn: "🎙️ 초고속 변환 시작",
    processing: "초고속 병렬 처리 진행 중...",
    stopBtn: "⏹️ 처리 중지",
    stopping: "중지 중...",
    downloadMp3: "⬇️ MP3 다운로드",
    playMac: "🔊 Mac 스피커",
    playingMac: "🔊 재생 중...",
    partialBadge: "⏹️ 부분 오디오 (중지됨)",
    completed: "완료",
    libraryTitle: "변환된 오디오 보관함",
    searchPlaceholder: "녹음 파일 검색...",
    emptyLibrary: "보관함에 저장된 오디오가 없습니다.",
    delete: "🗑️ 삭제",
    deleteConfirm: "이 오디오 파일을 정말 삭제하시겠습니까?",
    playNow: "▶ 지금 재생",
    words: "단어",
    chars: "글자",
  },
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("gdocs_tts_theme") || "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("gdocs_tts_lang") || "vi");
  const t = I18N[lang] || I18N.vi;

  const [currentView, setCurrentView] = useState("converter"); // 'converter' | 'library'
  const [activeTab, setActiveTab] = useState("gdocs"); // 'gdocs' | 'file' | 'text'

  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState("");

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("vi-VN-HoaiMyNeural");
  const [rateSlider, setRateSlider] = useState(0);
  const [playMac, setPlayMac] = useState(false);

  const [currentJobId, setCurrentJobId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMacPlaying, setIsMacPlaying] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  const [libraryFiles, setLibraryFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() => {
    return localStorage.getItem("gdocs_tts_skip_delete_confirm") === "true";
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    filename: "",
    title: "",
    dontAskAgain: false,
  });
  const [renameModal, setRenameModal] = useState({
    isOpen: false,
    filename: "",
    currentTitle: "",
    newTitle: "",
    isSaving: false,
    error: "",
  });

  useEffect(() => {
    document.body.className = theme === "dark" ? "theme-dark" : "theme-light";
    localStorage.setItem("gdocs_tts_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("gdocs_tts_lang", lang);
    const langConfig = LANGUAGES[lang];
    if (langConfig && langConfig.defaultVoice) {
      setSelectedVoice(langConfig.defaultVoice);
    }
  }, [lang]);

  useEffect(() => {
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data.length > 0) {
          setVoices(data.data);
        }
      })
      .catch((err) => console.warn("Lỗi tải giọng đọc:", err));
  }, []);

  const fetchActiveSessions = useCallback(() => {
    fetch("/api/playback/sessions")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setActiveSessions(data.data || []);
          setIsMacPlaying((data.data || []).length > 0);
        }
      })
      .catch((err) => console.warn("Lỗi tải active sessions:", err));
  }, []);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 2500);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  const fetchLibrary = useCallback(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setLibraryFiles(data.data);
        }
      })
      .catch((err) => console.warn("Lỗi tải thư viện:", err));
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getRateString = () => {
    if (rateSlider === 0) return "+0%";
    return rateSlider > 0 ? `+${rateSlider}%` : `${rateSlider}%`;
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      alert("Vui lòng nhấn Cmd+V để dán liên kết.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartRead = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);

    if (activeTab === "gdocs" && !url.trim()) {
      setError({ message: t.gdocsLabel + "!" });
      return;
    }
    if (activeTab === "file" && !selectedFile) {
      setError({ message: t.dropzoneTitle + "!" });
      return;
    }
    if (activeTab === "text" && !rawText.trim()) {
      setError({ message: t.textLabel + "!" });
      return;
    }

    const newJobId = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    setCurrentJobId(newJobId);
    setIsLoading(true);
    setIsStopping(false);
    setStatusMessage(t.processing);

    try {
      let response;
      if (activeTab === "file") {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("voice", selectedVoice);
        formData.append("rate", getRateString());
        formData.append("play_mac", playMac ? "true" : "false");
        formData.append("job_id", newJobId);

        response = await fetch("/api/read", { method: "POST", body: formData });
      } else {
        const payload = {
          type: activeTab === "gdocs" ? "url" : "text",
          source: activeTab === "gdocs" ? url.trim() : rawText.trim(),
          voice: selectedVoice,
          rate: getRateString(),
          play_mac: playMac,
          job_id: newJobId,
        };

        response = await fetch("/api/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const resData = await response.json();
      if (!response.ok || (resData.status !== "success" && resData.status !== "partial")) {
        throw new Error(resData.message || "Xử lý thất bại.");
      }

      setResult(resData.data);
      fetchLibrary();

      if (!playMac) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }, 300);
      }
    } catch (err) {
      setError({ message: err.message });
    } finally {
      setIsLoading(false);
      setCurrentJobId(null);
    }
  };

  const handleStopProcessing = async () => {
    if (!currentJobId) return;
    setIsStopping(true);
    try {
      const res = await fetch("/api/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: currentJobId }),
      });
      const data = await res.json();
      if (data.status === "partial" && data.data) {
        setResult(data.data);
        fetchLibrary();
      }
    } catch (err) {
      console.warn("Lỗi khi dừng:", err);
    } finally {
      setIsLoading(false);
      setIsStopping(false);
      setCurrentJobId(null);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current) {
        setIsPlaying(!audioRef.current.paused);
        setCurrentTime(audioRef.current.currentTime);
        if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
          setDuration(audioRef.current.duration);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch((err) => {
          console.warn("Audio play error:", err);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handleSkip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    }
  };

  const changeSpeed = (speed) => {
    setPlayerSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlayOnMac = async (filename) => {
    if (!filename) return;
    try {
      const res = await fetch("/api/play-mac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchActiveSessions();
      } else {
        alert("Không thể phát qua loa Mac: " + (data.message || "Lỗi không xác định"));
      }
    } catch (err) {
      alert("Không thể phát qua loa Mac: " + err.message);
    }
  };

  const handleStopSession = async (sessionId) => {
    try {
      const res = await fetch("/api/playback/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchActiveSessions();
      } else {
        alert(data.message || "Không thể dừng phiên audio này.");
      }
    } catch (err) {
      alert("Lỗi khi dừng audio: " + err.message);
    }
  };

  const handleStopAllSessions = async () => {
    try {
      const res = await fetch("/api/playback/stop-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchActiveSessions();
      }
    } catch (err) {
      alert("Lỗi khi dừng tất cả: " + err.message);
    }
  };

  // Mở yêu cầu xóa bản thu (kiểm tra trạng thái Không hỏi lại)
  const handleRequestDelete = (item) => {
    if (skipDeleteConfirm) {
      performDeleteAudio(item.filename);
    } else {
      setDeleteModal({
        isOpen: true,
        filename: item.filename,
        title: item.title || item.filename,
        dontAskAgain: false,
      });
    }
  };

  // Xác nhận xóa từ Modal
  const handleConfirmDelete = async () => {
    if (!deleteModal.filename) return;
    const targetFilename = deleteModal.filename;
    if (deleteModal.dontAskAgain) {
      localStorage.setItem("gdocs_tts_skip_delete_confirm", "true");
      setSkipDeleteConfirm(true);
    }
    setDeleteModal({ isOpen: false, filename: "", title: "", dontAskAgain: false });
    await performDeleteAudio(targetFilename);
  };

  // Thực hiện gọi API xóa
  const performDeleteAudio = async (filename) => {
    try {
      const res = await fetch(`/api/audio/${filename}`, { method: "DELETE" });
      if (res.ok) {
        setLibraryFiles((prev) => prev.filter((f) => f.filename !== filename));
        if (result && result.audio_filename === filename) {
          setResult(null);
        }
      } else {
        const errData = await res.json();
        alert("Lỗi khi xóa: " + (errData.message || "Không thể xóa tệp"));
      }
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  // Mở modal đổi tên
  const handleOpenRenameModal = (item) => {
    setRenameModal({
      isOpen: true,
      filename: item.filename,
      currentTitle: item.title,
      newTitle: item.title,
      isSaving: false,
      error: "",
    });
  };

  // Xác nhận lưu tên mới
  const handleConfirmRename = async (e) => {
    if (e) e.preventDefault();
    const trimmedTitle = renameModal.newTitle.trim();
    if (!trimmedTitle) {
      setRenameModal((prev) => ({ ...prev, error: "Tiêu đề không được để trống" }));
      return;
    }
    setRenameModal((prev) => ({ ...prev, isSaving: true, error: "" }));

    try {
      const res = await fetch(`/api/audio/${renameModal.filename}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_title: trimmedTitle }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setLibraryFiles((prev) =>
          prev.map((f) =>
            f.filename === renameModal.filename ? { ...f, title: trimmedTitle } : f
          )
        );
        if (result && result.audio_filename === renameModal.filename) {
          setResult((prev) => (prev ? { ...prev, document_title: trimmedTitle } : null));
        }
        setRenameModal({ isOpen: false, filename: "", currentTitle: "", newTitle: "", isSaving: false, error: "" });
      } else {
        setRenameModal((prev) => ({
          ...prev,
          isSaving: false,
          error: data.message || "Không thể đổi tên",
        }));
      }
    } catch (err) {
      setRenameModal((prev) => ({
        ...prev,
        isSaving: false,
        error: "Lỗi kết nối: " + err.message,
      }));
    }
  };

  const handlePlayLibraryItem = (item) => {
    setResult({
      document_title: item.title,
      audio_filename: item.filename,
      audio_url: item.audio_url,
      is_partial: item.is_partial,
    });
    setCurrentView("converter");
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }, 250);
  };

  const filteredVoices = voices.filter((v) => {
    const targetPrefix = lang === "cn" ? "zh" : lang === "jp" ? "ja" : lang;
    return v.locale.toLowerCase().startsWith(targetPrefix.toLowerCase());
  });

  return (
    <div className="enterprise-layout">
      {/* PERSISTENT GLOBAL AUDIO ELEMENT (NEVER DESTROYED ON TAB SWITCH) */}
      <audio
        ref={audioRef}
        src={result ? result.audio_url : ""}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onError={(e) => {
          console.warn("Audio playback error:", e);
          setIsPlaying(false);
        }}
      />

      {/* LEFT SIDEBAR */}
      <aside className="app-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">🎙️</div>
          <div className="sidebar-title-box">
            <span className="sidebar-title">GDocs Studio</span>
            <span className="sidebar-badge">Enterprise v2.2</span>
          </div>
        </div>

        {/* Navigation Workspace */}
        <div className="sidebar-section-title">{t.workspaceTitle}</div>
        <div className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${currentView === "converter" ? "active" : ""}`}
            onClick={() => setCurrentView("converter")}
          >
            <div className="sidebar-nav-left">
              <span>🎙️</span>
              <span>{t.tabConverter}</span>
            </div>
          </button>
          <button
            className={`sidebar-nav-item ${currentView === "library" ? "active" : ""}`}
            onClick={() => {
              setCurrentView("library");
              fetchLibrary();
            }}
          >
            <div className="sidebar-nav-left">
              <span>📁</span>
              <span>{t.tabLibrary}</span>
            </div>
            {libraryFiles.length > 0 && <span className="nav-count-badge">{libraryFiles.length}</span>}
          </button>
          <button
            className={`sidebar-nav-item ${currentView === "sessions" ? "active" : ""}`}
            onClick={() => {
              setCurrentView("sessions");
              fetchActiveSessions();
            }}
          >
            <div className="sidebar-nav-left">
              <span>🔊</span>
              <span>{t.tabActiveAudio || "Audio Đang Phát"}</span>
            </div>
            {activeSessions.length > 0 && (
              <span className="nav-count-badge pulse-active">{activeSessions.length}</span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="system-status-box">
            <div className="status-dot-pulse"></div>
            <span>Cloud Neural Engine: Online</span>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="main-content-area">
        {/* Top Header Bar */}
        <div className="main-top-bar">
          <div className="top-bar-title">
            <h1>
              {currentView === "converter"
                ? t.appTitle
                : currentView === "library"
                ? t.libraryTitle
                : (t.activeAudioTitle || "Quản Lý Audio Đang Mở & Nền")}
            </h1>
            <p>
              {currentView === "converter"
                ? t.appSubtitle
                : currentView === "library"
                ? `Hệ thống lưu trữ ${libraryFiles.length} bản ghi âm thanh`
                : (t.activeAudioSubtitle || "Giám sát các tiến trình phát âm thanh và tắt audio chạy ngầm")}
            </p>
          </div>

          {/* Top Right Controls: Multilanguage & Dark Mode */}
          <div className="top-bar-actions">
            {/* Multi-language Selector */}
            <select
              className="top-bar-lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              title="Đổi ngôn ngữ giao diện (Multilanguage - 11 Ngôn ngữ)"
            >
              {Object.entries(LANGUAGES).map(([code, item]) => (
                <option key={code} value={code}>
                  {item.flag} {item.name}
                </option>
              ))}
            </select>

            {/* Dark / Light Mode Toggle */}
            <button
              className="top-bar-theme-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Chuyển chế độ Sáng / Tối"
            >
              <span>{theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}</span>
            </button>
          </div>
        </div>

        {/* Active Audio Alert Banner */}
        {activeSessions.length > 0 && (
          <div className="active-audio-alert-banner">
            <div className="alert-banner-left">
              <span className="pulsing-speaker">🔊</span>
              <span>
                Có <strong>{activeSessions.length}</strong> {t.backgroundAudioPlaying || "audio đang phát dưới nền máy Mac"}
              </span>
            </div>
            <div className="alert-banner-actions">
              <button
                className="btn-banner-view"
                onClick={() => {
                  setCurrentView("sessions");
                  fetchActiveSessions();
                }}
              >
                {t.manageSessions || "Quản lý"}
              </button>
              <button
                className="btn-banner-stop-all"
                onClick={handleStopAllSessions}
              >
                {t.stopAllAudio || "⏹️ Dừng tất cả"}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: CONVERTER */}
        {currentView === "converter" && (
          <>
            <div className="glass-card">
              {/* Input Tabs */}
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === "gdocs" ? "active" : ""}`}
                  onClick={() => setActiveTab("gdocs")}
                >
                  {t.tabGdocs}
                </button>
                <button
                  className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
                  onClick={() => setActiveTab("file")}
                >
                  {t.tabFile}
                </button>
                <button
                  className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
                  onClick={() => setActiveTab("text")}
                >
                  {t.tabText}
                </button>
              </div>

              {/* Tab: Google Docs */}
              {activeTab === "gdocs" && (
                <div className="form-group">
                  <div className="form-label">
                    <span>{t.gdocsLabel}</span>
                    <span className="input-hint">{t.gdocsHint}</span>
                  </div>
                  <div className="input-with-actions">
                    <input
                      type="text"
                      className="text-input"
                      placeholder="https://docs.google.com/document/d/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <button className="btn-secondary" type="button" onClick={handlePasteUrl}>
                      {t.paste}
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        setUrl(
                          "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                        )
                      }
                    >
                      {t.sample}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: File Upload */}
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
                    <div style={{ fontSize: 44 }}>📥</div>
                    <div style={{ fontWeight: 700 }}>{t.dropzoneTitle}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.dropzoneSubtitle}</div>
                  </div>

                  {selectedFile && (
                    <div className="file-selected-badge">
                      <span>
                        📄 <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        {t.remove}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Direct Text */}
              {activeTab === "text" && (
                <div className="form-group">
                  <div className="form-label">
                    <span>{t.textLabel}</span>
                    <span className="input-hint">
                      {rawText.length} {t.chars} (~{rawText.trim() ? rawText.trim().split(/\s+/).length : 0} {t.words})
                    </span>
                  </div>
                  <textarea
                    className="textarea-input"
                    placeholder={t.textPlaceholder}
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
                    <span>{t.voiceLabel}</span>
                  </label>
                  <select
                    id="select-voice"
                    className="select-input"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                  >
                    {filteredVoices.length > 0 ? (
                      <optgroup label={LANGUAGES[lang]?.name || "Giọng phù hợp"}>
                        {filteredVoices.map((v) => (
                          <option key={v.voice_id} value={v.voice_id}>
                            {v.gender === "Female" ? "👩" : "👨"} {v.name} ({v.locale})
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    <optgroup label="Tất cả các giọng khác">
                      {voices
                        .filter((v) => !filteredVoices.some((fv) => fv.voice_id === v.voice_id))
                        .slice(0, 35)
                        .map((v) => (
                          <option key={v.voice_id} value={v.voice_id}>
                            {v.locale} - {v.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="form-group slider-container">
                  <div className="form-label">
                    <span>{t.speedLabel}</span>
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
                    <button className={`preset-chip ${rateSlider === 0 ? "active" : ""}`} onClick={() => setRateSlider(0)}>1.0x</button>
                    <button className={`preset-chip ${rateSlider === 20 ? "active" : ""}`} onClick={() => setRateSlider(20)}>1.2x</button>
                    <button className={`preset-chip ${rateSlider === 50 ? "active" : ""}`} onClick={() => setRateSlider(50)}>1.5x</button>
                  </div>
                </div>
              </div>

              {/* Mac Speakers Toggle */}
              <div className="toggle-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.macToggle}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.macToggleSub}</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={playMac} onChange={(e) => setPlayMac(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Conversion Buttons */}
              {!isLoading ? (
                <button className="btn-primary-action" type="button" onClick={handleStartRead}>
                  <span>{t.startBtn}</span>
                </button>
              ) : (
                <div className="processing-card">
                  <div className="processing-info">
                    <div className="loader-spinner" style={{ width: 28, height: 28 }}></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{t.processing}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{statusMessage}</div>
                    </div>
                  </div>
                  <button
                    className="btn-stop-action"
                    type="button"
                    disabled={isStopping}
                    onClick={handleStopProcessing}
                  >
                    {isStopping ? t.stopping : t.stopBtn}
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="error-banner">
                  <div style={{ fontSize: 20 }}>⚠️</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{error.message}</div>
                  </div>
                </div>
              )}
            </div>

            {/* PLAYER CARD */}
            {result && (
              <section className="player-card">
                <div className="doc-info-header">
                  <div>
                    <div className="doc-title">📖 {result.document_title || "Bản thu âm thanh"}</div>
                    <div className="doc-stats">
                      {result.is_partial && <span className="partial-badge">{t.partialBadge}</span>}
                      {result.word_count ? (
                        <span className="stat-item">
                          📝 {result.word_count.toLocaleString()} {t.words}
                        </span>
                      ) : null}
                      {result.voice_used && (
                        <span className="stat-item">🗣️ {result.voice_used.split("-").slice(-1)[0]}</span>
                      )}
                    </div>
                  </div>

                  <a
                    href={result.audio_url}
                    download={`${result.is_partial ? "[Một phần] - " : ""}${result.document_title || "speech"}.mp3`}
                    className="btn-download-mp3"
                  >
                    {t.downloadMp3}
                  </a>
                </div>

                <div className={`wave-visualizer ${isPlaying ? "playing" : ""}`}>
                  {Array.from({ length: 44 }).map((_, idx) => (
                    <div key={idx} className="wave-bar"></div>
                  ))}
                </div>

                <div className="audio-controls-row">
                  <button className="skip-btn" onClick={() => handleSkip(-10)} title="Tua lùi 10 giây">
                    -10s
                  </button>
                  <button className="skip-btn" onClick={() => handleSkip(-5)} title="Tua lùi 5 giây">
                    -5s
                  </button>

                  <button className="play-pause-btn" onClick={togglePlay} title={isPlaying ? "Tạm dừng" : "Phát"}>
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  <button className="skip-btn" onClick={() => handleSkip(5)} title="Tua tiến 5 giây">
                    +5s
                  </button>
                  <button className="skip-btn" onClick={() => handleSkip(10)} title="Tua tiến 10 giây">
                    +10s
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

                  <div className="volume-control-box">
                    <button className="mute-btn" onClick={toggleMute} title="Bật/Tắt tiếng">
                      {isMuted || volume === 0 ? "🔇" : "🔊"}
                    </button>
                    <input
                      type="range"
                      className="volume-slider"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <div className="player-aux-actions">
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Tốc độ phát:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      className={`preset-chip ${playerSpeed === spd ? "active" : ""}`}
                      onClick={() => changeSpeed(spd)}
                    >
                      {spd}x
                    </button>
                  ))}

                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {activeSessions.some((s) => s.filename === result.audio_filename) ? (
                      <button
                        className="btn-danger btn-pulse"
                        onClick={() => {
                          const sess = activeSessions.find((s) => s.filename === result.audio_filename);
                          if (sess) handleStopSession(sess.session_id);
                        }}
                      >
                        ⏹️ {t.stopMac || "Dừng loa Mac"}
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        onClick={() => handlePlayOnMac(result.audio_filename)}
                      >
                        {t.playMac}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* VIEW 2: AUDIO LIBRARY */}
        {currentView === "library" && (
          <div className="glass-card">
            <div className="library-header">
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>{t.libraryTitle}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    Lưu trữ {libraryFiles.length} bản ghi âm thanh đã được chuyển đổi
                  </p>
                  {skipDeleteConfirm && (
                    <span className="skip-confirm-pill">
                      ⚡ {t.skipConfirmActive || "Xóa nhanh"}
                      <button
                        className="btn-reset-confirm"
                        onClick={() => {
                          localStorage.removeItem("gdocs_tts_skip_delete_confirm");
                          setSkipDeleteConfirm(false);
                        }}
                        title="Bật lại hộp thoại hỏi xác nhận trước khi xóa"
                      >
                        [Bật lại hỏi xác nhận]
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  className="library-search-input"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn-secondary" onClick={fetchLibrary} title="Làm mới">
                  🔄
                </button>
              </div>
            </div>

            {libraryFiles.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>📭</div>
                <p>{t.emptyLibrary}</p>
              </div>
            ) : (
              <div className="library-cards-list">
                {libraryFiles
                  .filter(
                    (item) =>
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.filename.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <div key={item.filename} className="library-card">
                      <div className="library-item-info">
                        <div className="library-item-title">
                          {item.title}
                          {item.is_partial && (
                            <span className="partial-badge" style={{ marginLeft: 8 }}>
                              {t.partialBadge}
                            </span>
                          )}
                        </div>
                        <div className="library-item-meta">
                          <span>📅 {item.created_at}</span>
                          <span>💾 {item.size_formatted}</span>
                        </div>
                      </div>

                      <div className="library-item-actions">
                        <button className="btn-secondary" onClick={() => handlePlayLibraryItem(item)}>
                          {t.playNow}
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleOpenRenameModal(item)}
                          title={t.rename || "Đổi tên"}
                        >
                          ✏️ {t.rename || "Đổi tên"}
                        </button>
                        <a href={item.audio_url} download={`${item.title}.mp3`} className="btn-secondary">
                          ⬇️ MP3
                        </a>
                        {activeSessions.some((s) => s.filename === item.filename) ? (
                          <button
                            className="btn-danger btn-pulse"
                            onClick={() => {
                              const sess = activeSessions.find((s) => s.filename === item.filename);
                              if (sess) handleStopSession(sess.session_id);
                            }}
                            title="Dừng phát tệp âm thanh này"
                          >
                            ⏹️ Dừng
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={() => handlePlayOnMac(item.filename)}
                            title="Phát ra loa máy Mac"
                          >
                            🔊 Mac
                          </button>
                        )}
                        <button className="btn-danger" onClick={() => handleRequestDelete(item)}>
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ACTIVE AUDIO SESSIONS (QUẢN LÝ AUDIO ĐANG MỞ & NỀN) */}
        {currentView === "sessions" && (
          <div className="glass-card">
            <div className="library-header">
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                  🔊 {t.activeAudioTitle || "Quản Lý Audio Đang Mở & Chạy Nền"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {t.activeAudioSubtitle ||
                    "Giám sát các tiến trình phát âm thanh afplay và dừng các audio đang chạy ngầm trên máy."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={fetchActiveSessions}
                  title={t.refresh || "Làm mới"}
                >
                  🔄 {t.refresh || "Làm mới"}
                </button>
                {activeSessions.length > 0 && (
                  <button className="btn-danger" onClick={handleStopAllSessions}>
                    {t.stopAllAudio || "⏹️ Dừng tất cả audio nền"}
                  </button>
                )}
              </div>
            </div>

            {activeSessions.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>🎧</div>
                <h3 style={{ marginTop: 12, fontSize: "1.1rem" }}>
                  {t.noActiveAudio || "Hiện không có audio nào đang chạy dưới nền"}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.88rem",
                    marginTop: 4,
                  }}
                >
                  Tất cả các tiến trình phát âm thanh đều đang yên tĩnh. Bạn có thể
                  phát audio ra loa máy Mac từ Thư viện hoặc Studio.
                </p>
              </div>
            ) : (
              <div className="sessions-list">
                <div className="session-stats-bar">
                  <span>
                    Tổng cộng: <strong>{activeSessions.length}</strong> tiến trình
                    âm thanh đang phát
                  </span>
                </div>
                {activeSessions.map((session) => (
                  <div key={session.session_id} className="session-card">
                    <div className="session-card-indicator">
                      <div className="pulse-dot"></div>
                    </div>
                    <div className="session-card-info">
                      <div className="session-card-title">
                        <span>{session.title || session.filename}</span>
                        {session.pid && (
                          <span className="session-pid-badge">
                            PID: {session.pid}
                          </span>
                        )}
                        <span className="session-active-pill">🟢 Đang phát</span>
                      </div>
                      <div className="session-card-meta">
                        <span>📁 {session.filename}</span>
                        <span>⏱️ Bắt đầu: {session.started_at}</span>
                      </div>
                    </div>
                    <div className="session-card-actions">
                      <button
                        className="btn-danger"
                        onClick={() => handleStopSession(session.session_id)}
                      >
                        {t.stopThisAudio || "⏹️ Tắt audio này"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERSISTENT FLOATING PLAYER (VISIBLE ACROSS ALL TABS WHEN AUDIO IS LOADED) */}
        {result && currentView !== "converter" && (
          <div className="floating-bottom-player">
            <div className="floating-player-left">
              <div className="floating-player-icon">🎵</div>
              <div className="floating-player-text">
                <span className="floating-player-title">{result.document_title || "Bản thu âm thanh"}</span>
                <span className="floating-player-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
            <div className="floating-player-controls">
              <button className="skip-btn-mini" onClick={() => handleSkip(-10)} title="Tua lùi 10 giây">
                ⏪ 10s
              </button>
              <button className="play-pause-btn-mini" onClick={togglePlay} title={isPlaying ? "Tạm dừng" : "Phát"}>
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              <button className="skip-btn-mini" onClick={() => handleSkip(10)} title="Tua tiến 10 giây">
                10s ⏩
              </button>
              <input
                type="range"
                className="floating-seek-slider"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
              />
            </div>
            <div className="floating-player-right">
              <button className="btn-return-studio" onClick={() => setCurrentView("converter")}>
                🎙️ Quay lại Studio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: XÁC NHẬN XÓA BẢN THU (CÓ CHECKBOX KHÔNG HỎI LẠI) */}
      {deleteModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>
          <div className="modal-card modal-delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-icon-danger">🗑️</span>
                <h3>{t.deleteModalTitle || "Xác Nhận Xóa Bản Thu"}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                title={t.cancel || "Đóng"}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                {t.deleteModalMessage || "Bạn có chắc chắn muốn xóa vĩnh viễn bản thu này khỏi máy tính? Thao tác này không thể hoàn tác."}
              </p>
              <div className="modal-target-box">
                <div className="modal-target-title">📖 {deleteModal.title || deleteModal.filename}</div>
                <div className="modal-target-filename">📁 {deleteModal.filename}</div>
              </div>
              <label className="checkbox-container dont-ask-container">
                <input
                  type="checkbox"
                  checked={deleteModal.dontAskAgain}
                  onChange={(e) => setDeleteModal({ ...deleteModal, dontAskAgain: e.target.checked })}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label-text">
                  {t.dontAskAgain || "Không hỏi lại lần sau"}
                </span>
              </label>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
              >
                {t.cancel || "Hủy"}
              </button>
              <button className="btn-danger" onClick={handleConfirmDelete}>
                🗑️ {t.delete || "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐỔI TÊN BẢN THU (RENAME MODAL) */}
      {renameModal.isOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !renameModal.isSaving && setRenameModal({ ...renameModal, isOpen: false })}
        >
          <div className="modal-card modal-rename-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleConfirmRename}>
              <div className="modal-header">
                <div className="modal-title-row">
                  <span className="modal-icon-primary">✏️</span>
                  <h3>{t.renameModalTitle || "Đổi Tên Bản Thu Âm Thanh"}</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setRenameModal({ ...renameModal, isOpen: false })}
                  disabled={renameModal.isSaving}
                  title={t.cancel || "Đóng"}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-desc">
                  Đặt tiêu đề mới để dễ dàng quản lý và tìm kiếm bản thu trong thư viện:
                </p>
                <div className="modal-input-group">
                  <label className="input-label">
                    {t.renameInputLabel || "Tiêu đề bản thu mới:"}
                  </label>
                  <input
                    type="text"
                    className="modal-text-input"
                    value={renameModal.newTitle}
                    onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value, error: "" })}
                    placeholder={t.renamePlaceholder || "Nhập tên mới cho bản thu..."}
                    autoFocus
                    disabled={renameModal.isSaving}
                  />
                  {renameModal.error && (
                    <div className="modal-error-text">⚠️ {renameModal.error}</div>
                  )}
                  <div className="modal-target-filename" style={{ marginTop: 8 }}>
                    📁 Tệp gốc: {renameModal.filename}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRenameModal({ ...renameModal, isOpen: false })}
                  disabled={renameModal.isSaving}
                >
                  {t.cancel || "Hủy"}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={renameModal.isSaving || !renameModal.newTitle.trim()}
                >
                  {renameModal.isSaving ? (t.saving || "Đang lưu...") : `💾 ${t.save || "Lưu thay đổi"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Render React App
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
