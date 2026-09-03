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
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Chuyển đổi văn bản & tài liệu thành giọng đọc AI tự nhiên",
    tabConverter: "🎙️ Chuyển Đổi TTS",
    tabLibrary: "📁 Quản Lý Audio",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Tải Tệp (.docx, .txt)",
    tabText: "✍️ Nhập Văn Bản",
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
    libraryTitle: "Thư viện các bản audio đã chuyển đổi",
    searchPlaceholder: "Tìm kiếm bản thu theo tên...",
    emptyLibrary: "Chưa có bản thu nào trong thư viện.",
    delete: "🗑️ Xóa",
    deleteConfirm: "Bạn có chắc chắn muốn xóa bản thu này khỏi máy?",
    playNow: "▶ Phát ngay",
    words: "từ",
    chars: "ký tự",
  },
  en: {
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Convert documents & text to natural AI speech",
    tabConverter: "🎙️ TTS Converter",
    tabLibrary: "📁 Audio Library",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Upload File (.docx, .txt)",
    tabText: "✍️ Direct Text",
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
    libraryTitle: "Audio Library & Converted Files",
    searchPlaceholder: "Search audio recordings...",
    emptyLibrary: "No audio recordings found in library.",
    delete: "🗑️ Delete",
    deleteConfirm: "Are you sure you want to delete this audio file?",
    playNow: "▶ Play Now",
    words: "words",
    chars: "characters",
  },
  cn: {
    appTitle: "Google Docs 语音合成阅读器",
    appSubtitle: "将文档和文本转换为自然流畅的 AI 语音",
    tabConverter: "🎙️ 语音转换",
    tabLibrary: "📁 音频管理",
    tabGdocs: "🔗 Google 文档",
    tabFile: "📁 上传文件 (.docx, .txt)",
    tabText: "✍️ 直接输入",
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
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Convierte documentos y texto en voz natural de IA",
    tabConverter: "🎙️ Conversor TTS",
    tabLibrary: "📁 Biblioteca de Audio",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Subir Archivo (.docx, .txt)",
    tabText: "✍️ Texto Directo",
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
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Convertissez vos documents et textes en voix IA naturelle",
    tabConverter: "🎙️ Convertisseur TTS",
    tabLibrary: "📁 Bibliothèque Audio",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Fichier (.docx, .txt)",
    tabText: "✍️ Texte Direct",
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
    appTitle: "Google Docs 音声リーダー",
    appSubtitle: "文書やテキストを自然な AI 音声に変換",
    tabConverter: "🎙️ 音声変換",
    tabLibrary: "📁 音声ライブラリ",
    tabGdocs: "🔗 Google ドキュメント",
    tabFile: "📁 ファイル (.docx, .txt)",
    tabText: "✍️ テキスト直接入力",
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
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Преобразование текста и документов в живой голос ИИ",
    tabConverter: "🎙️ Преобразование",
    tabLibrary: "📁 Аудиотека",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Файл (.docx, .txt)",
    tabText: "✍️ Ввод Текста",
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
    appTitle: "قارئ مستندات Google الصوتي",
    appSubtitle: "تحويل المستندات والنصوص إلى أصوات ذكاء اصطناعي طبيعية",
    tabConverter: "🎙️ محول الصوت",
    tabLibrary: "📁 مكتبة الصوتيات",
    tabGdocs: "🔗 مستندات Google",
    tabFile: "📁 رفع ملف (.docx, .txt)",
    tabText: "✍️ إدخال نص",
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
    appTitle: "Google Docs टीटीएस रीडर",
    appSubtitle: "दस्तावेज़ों और टेक्स्ट को स्वाभाविक AI आवाज़ में बदलें",
    tabConverter: "🎙️ टीटीएस कनवर्टर",
    tabLibrary: "📁 ऑडियो लाइब्रेरी",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 फ़ाइल (.docx, .txt)",
    tabText: "✍️ सीधा टेक्स्ट",
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
    appTitle: "Google Docs TTS Reader",
    appSubtitle: "Dokumente und Texte in natürliche KI-Stimme umwandeln",
    tabConverter: "🎙️ TTS-Konverter",
    tabLibrary: "📁 Audio-Bibliothek",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 Datei (.docx, .txt)",
    tabText: "✍️ Direkter Text",
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
    libraryTitle: "Bibliothek der Konvertierten Audiodateien",
    searchPlaceholder: "Audioaufnahmen durchsuchen...",
    emptyLibrary: "Keine Audiodateien in der Bibliothek.",
    delete: "🗑️ Löschen",
    deleteConfirm: "Möchten Sie diese Audiodatei wirklich löschen?",
    playNow: "▶ Jetzt Anhören",
    words: "Wörter",
    chars: "Zeichen",
  },
  ko: {
    appTitle: "Google Docs TTS 리더",
    appSubtitle: "문서 및 텍스트를 자연스러운 AI 음성으로 변환",
    tabConverter: "🎙️ TTS 변환기",
    tabLibrary: "📁 오디오 보관함",
    tabGdocs: "🔗 Google Docs",
    tabFile: "📁 파일 (.docx, .txt)",
    tabText: "✍️ 직접 입력",
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
  // Theme & Language state
  const [theme, setTheme] = useState(() => localStorage.getItem("gdocs_tts_theme") || "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("gdocs_tts_lang") || "vi");
  const t = I18N[lang] || I18N.vi;

  // Navigation View: 'converter' | 'library'
  const [currentView, setCurrentView] = useState("converter");

  // Input tab: 'gdocs' | 'file' | 'text'
  const [activeTab, setActiveTab] = useState("gdocs");
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState("");

  // Settings state
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("vi-VN-HoaiMyNeural");
  const [rateSlider, setRateSlider] = useState(0); // -50% to +100%
  const [playMac, setPlayMac] = useState(false);

  // Execution & Job state
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Audio Player state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMacPlaying, setIsMacPlaying] = useState(false);

  // Library state
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Apply Theme
  useEffect(() => {
    document.body.className = theme === "dark" ? "theme-dark" : "theme-light";
    localStorage.setItem("gdocs_tts_theme", theme);
  }, [theme]);

  // Apply Language & Auto-suggest top voice for that language
  useEffect(() => {
    localStorage.setItem("gdocs_tts_lang", lang);
    const langConfig = LANGUAGES[lang];
    if (langConfig && langConfig.defaultVoice) {
      setSelectedVoice(langConfig.defaultVoice);
    }
  }, [lang]);

  // Load Voices from API
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

  // Fetch Library Files
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

  // Time formatter
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

  // Drag & Drop
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

  // Start Conversion
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

      // Autoplay if not Mac speakers
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

  // Stop Processing Handler
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

  // Audio Player Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
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

  const handleDeleteAudio = async (filename) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/audio/${filename}`, { method: "DELETE" });
      if (res.ok) {
        setLibraryFiles((prev) => prev.filter((f) => f.filename !== filename));
        if (result && result.audio_filename === filename) {
          setResult(null);
        }
      }
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
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

  // Filter voices for current language
  const filteredVoices = voices.filter((v) => {
    const targetPrefix = lang === "cn" ? "zh" : lang === "jp" ? "ja" : lang;
    return v.locale.toLowerCase().startsWith(targetPrefix.toLowerCase());
  });

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="app-navbar">
        <div className="nav-brand">
          <div className="nav-brand-icon">🎙️</div>
          <div>
            <div className="nav-brand-title">{t.appTitle}</div>
          </div>
        </div>

        <div className="nav-menu">
          <button
            className={`nav-tab-btn ${currentView === "converter" ? "active" : ""}`}
            onClick={() => setCurrentView("converter")}
          >
            {t.tabConverter}
          </button>
          <button
            className={`nav-tab-btn ${currentView === "library" ? "active" : ""}`}
            onClick={() => {
              setCurrentView("library");
              fetchLibrary();
            }}
          >
            {t.tabLibrary}
            {libraryFiles.length > 0 && <span className="count-badge">{libraryFiles.length}</span>}
          </button>
        </div>

        <div className="nav-controls">
          {/* Multi-language Selector (11 Languages) */}
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            title="Đổi ngôn ngữ giao diện (Multilanguage)"
          >
            {Object.entries(LANGUAGES).map(([code, item]) => (
              <option key={code} value={code}>
                {item.flag} {item.name}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Theme Sáng / Tối"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* VIEW 1: CONVERTER */}
      {currentView === "converter" && (
        <>
          <main className="glass-card">
            {/* Input Mode Tabs */}
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
                      setUrl("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")
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
                  <div style={{ fontSize: 42 }}>📥</div>
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
              {/* Voice Selector */}
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
                      .slice(0, 40)
                      .map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.locale} - {v.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Speech Rate Slider */}
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

            {/* Action Buttons */}
            {!isLoading ? (
              <button className="btn-primary-action" type="button" onClick={handleStartRead}>
                <span>{t.startBtn}</span>
              </button>
            ) : (
              /* Processing State with Stop Button */
              <div className="processing-card">
                <div className="processing-info">
                  <div className="loader-spinner" style={{ width: 26, height: 26 }}></div>
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

            {/* Error Notification */}
            {error && (
              <div className="error-banner">
                <div style={{ fontSize: 20 }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{error.message}</div>
                </div>
              </div>
            )}
          </main>

          {/* AUDIO PLAYER & RESULTS CARD */}
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

              {/* Hidden HTML5 Audio Element */}
              <audio
                ref={audioRef}
                src={result.audio_url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
              />

              {/* Waveform Visualizer */}
              <div className={`wave-visualizer ${isPlaying ? "playing" : ""}`}>
                {Array.from({ length: 42 }).map((_, idx) => (
                  <div key={idx} className="wave-bar"></div>
                ))}
              </div>

              {/* Complete Audio Player Controls */}
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

                {/* Scrubber Progress Bar */}
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

                {/* Volume & Mute */}
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

              {/* Player Aux Actions */}
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
                  <button
                    className="btn-secondary"
                    onClick={() => handlePlayOnMac(result.audio_filename)}
                    disabled={isMacPlaying}
                  >
                    {isMacPlaying ? t.playingMac : t.playMac}
                  </button>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* VIEW 2: AUDIO LIBRARY */}
      {currentView === "library" && (
        <section className="glass-card">
          <div className="library-header">
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{t.libraryTitle}</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Tổng cộng {libraryFiles.length} bản ghi âm thanh đã được lưu trên máy
              </p>
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
              <div style={{ fontSize: 44 }}>📭</div>
              <p>{t.emptyLibrary}</p>
            </div>
          ) : (
            <div className="library-cards-list">
              {libraryFiles
                .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <div key={item.filename} className="library-card">
                    <div className="library-item-info">
                      <div className="library-item-title">
                        {item.title}
                        {item.is_partial && <span className="partial-badge" style={{ marginLeft: 8 }}>{t.partialBadge}</span>}
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
                      <a href={item.audio_url} download={`${item.title}.mp3`} className="btn-secondary">
                        ⬇️ MP3
                      </a>
                      <button className="btn-secondary" onClick={() => handlePlayOnMac(item.filename)}>
                        🔊 Mac
                      </button>
                      <button className="btn-danger" onClick={() => handleDeleteAudio(item.filename)}>
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Render React App
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
