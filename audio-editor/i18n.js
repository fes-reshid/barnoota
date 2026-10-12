// Audio editor — interface languages: English, Afaan Oromoo, Arabic (right-to-left).
// Menus, buttons, panel headings and dialogs are translated; messages that include numbers or
// file names, tooltips and the help page stay in English for now.
// The Afaan Oromoo wording is a first draft and needs checking by a native speaker.
'use strict';

const I18N_ROWS = [
  // [English, Afaan Oromoo, العربية]
  // Menu bar
  ['File', 'Faayilii', 'ملف'], ['Edit', 'Gulaali', 'تحرير'], ['Effects', 'Effektii', 'مؤثرات'], ['Control', 'To’annoo', 'تحكم'],
  ['Tools', 'Meeshaalee', 'أدوات'], ['Bookmark', 'Mallattoo', 'علامات'], ['View', 'Mul’ata', 'عرض'], ['Voice', 'Sagalee', 'صوت'], ['Help', 'Gargaarsa', 'مساعدة'],
  // File
  ['New File', 'Faayilii haaraa', 'ملف جديد'], ['Open File…', 'Faayilii bani…', 'فتح ملف…'], ['Open from Link…', 'Liinkii irraa bani…', 'فتح من رابط…'], ['Recent Files', 'Faayilota dhiyoo', 'الملفات الأخيرة'],
  ['Save File', 'Olkaa’i', 'حفظ'], ['Save File As…', 'Akka haaraatti olkaa’i…', 'حفظ باسم…'], ['Save Selected Region As…', 'Kutaa filatame olkaa’i…', 'حفظ الجزء المحدد باسم…'],
  ['Save All Files (.zip)', 'Faayilota hunda olkaa’i (.zip)', 'حفظ كل الملفات (.zip)'], ['Share…', 'Qoodi…', 'مشاركة…'], ['Share Selection…', 'Filannoo qoodi…', 'مشاركة التحديد…'],
  ['Send to Video Editor', 'Gara gulaalaa viidiyoo ergi', 'إرسال إلى محرر الفيديو'], ['Send Selection to Video Editor', 'Filannoo gara gulaalaa viidiyoo ergi', 'إرسال التحديد إلى محرر الفيديو'],
  ['Audio Tags…', 'Odeeffannoo sagalee…', 'وسوم الصوت…'], ['Save Format', 'Akkaataa olkaa’uu', 'صيغة الحفظ'], ['WAV (lossless)', 'WAV (qulqullina guutuu)', 'WAV (بلا فقدان)'],
  ['Open Project…', 'Pirojektii bani…', 'فتح مشروع…'], ['Save Project', 'Pirojektii olkaa’i', 'حفظ المشروع'], ['Autosave in This Browser', 'Ofumaan olkaa’i (biraawzara kana keessatti)', 'حفظ تلقائي في هذا المتصفح'],
  ['Join Audio Files…', 'Faayilota sagalee walitti qabsiisi…', 'دمج ملفات صوتية…'], ['Batch Converter…', 'Hedduu al tokkotti jijjiiri…', 'تحويل دفعة ملفات…'],
  ['Close File', 'Faayilii cufi', 'إغلاق الملف'], ['Close All', 'Hunda cufi', 'إغلاق الكل'],
  // Edit
  ['Undo', 'Deebisi', 'تراجع'], ['Redo', 'Irra deebi’i', 'إعادة'], ['History Manager', 'Seenaa gulaallii', 'سجل التعديلات'], ['Cut', 'Muri', 'قص'], ['Copy', 'Garagalchi', 'نسخ'],
  ['Duplicate', 'Dachaa’i', 'تكرار'], ['Paste', 'Maxxansi', 'لصق'], ['Paste Mix', 'Makii maxxansi', 'لصق مع مزج'], ['Delete', 'Haqi', 'حذف'], ['Select', 'Filadhu', 'تحديد'],
  ['Jump to Location…', 'Bakka tokkotti ce’i…', 'الانتقال إلى موضع…'], ['Repeat Loop…', 'Irra deddeebi’i…', 'تكرار حلقة…'], ['Mix with File…', 'Faayilii biraatiin makii…', 'مزج مع ملف…'],
  ['Insert File…', 'Faayilii galchi…', 'إدراج ملف…'], ['Silence', 'Callisa', 'صمت'], ['Trim', 'Qonxoori', 'قص الأطراف'], ['Cleanup', 'Qulqulleessi', 'تنظيف'],
  ['Redact / Beep…', 'Dhoksi / Biip…', 'إخفاء / صفير…'], ['Split File', 'Faayilii qoodi', 'تقسيم الملف'], ['Join Audio…', 'Sagalee walitti qabsiisi…', 'دمج الصوت…'], ['Convert', 'Jijjiiri', 'تحويل'],
  // Effects
  ['Amplify…', 'Sagalee guddisi…', 'تضخيم…'], ['Normalize', 'Sagalee madaalchisi', 'تسوية الصوت'], ['Mute Channel', 'Chaanaalii callisi', 'كتم قناة'],
  ['Fade In', 'Suuta seensisi', 'ظهور تدريجي'], ['Fade Out', 'Suuta dhumsi', 'اختفاء تدريجي'], ['Fade In & Out Selection', 'Filannoo suuta seensisii dhumsi', 'ظهور واختفاء تدريجي للتحديد'],
  ['Fade Type', 'Gosa suuta', 'نوع التدرج'], ['Linear', 'Sarara qajeelaa', 'خطي'], ['Smooth (default)', 'Suuta (durtii)', 'ناعم (افتراضي)'], ['Fast start', 'Jalqaba ariifataa', 'بداية سريعة'],
  ['Envelope…', 'Sararaa sagalee…', 'غلاف مستوى الصوت…'], ['Stereo Pan…', 'Bitaa/mirga…', 'توزيع ستيريو…'], ['Effect Chains…', 'Walitti fufiinsa effektii…', 'سلاسل المؤثرات…'],
  ['Apply Chain', 'Walitti fufiinsa hojiirra oolchi', 'تطبيق سلسلة'], ['AI Noise Removal…', 'Jeequmsa haqi (AI)…', 'إزالة الضوضاء بالذكاء الاصطناعي…'], ['Equalizer…', 'Ikuwalaayizarii…', 'المعادل…'],
  ['Echo…', 'Cuuqqaa…', 'صدى…'], ['Reverb…', 'Sagalee kutaa…', 'تردد…'], ['Compressor…', 'Kompireesarii…', 'ضاغط…'], ['Pitch…', 'Olka’iinsa sagalee…', 'طبقة الصوت…'],
  ['Tempo…', 'Saffisa (sagalee hin jijjiiru)…', 'الإيقاع…'], ['Speed…', 'Ariitii…', 'السرعة…'], ['Reverse', 'Duubatti garagalchi', 'عكس'], ['Invert', 'Garagalchi', 'قلب'],
  // Control
  ['Play / Pause', 'Taphachiisi / Dhaabi', 'تشغيل / إيقاف مؤقت'], ['Stop', 'Dhaabi', 'إيقاف'], ['Record / Stop Recording', 'Waraabi / Waraabbii dhaabi', 'تسجيل / إيقاف التسجيل'],
  ['Re-record Selection (punch-in)', 'Filannoo irra deebi’ii waraabi', 'إعادة تسجيل التحديد'], ['Recording Options (metronome, count-in)…', 'Filannoo waraabbii (metiroonoomii, lakkoofsa)…', 'خيارات التسجيل (المسرّع، العدّ التمهيدي)…'],
  ['Loop Selection', 'Filannoo irra deddeebi’i', 'تكرار التحديد'], ['Go to Start', 'Jalqabatti deemi', 'الذهاب إلى البداية'], ['Go to End', 'Dhumatti deemi', 'الذهاب إلى النهاية'],
  ['Back 5 Seconds', 'Sekondii 5 duubatti', 'رجوع 5 ثوانٍ'], ['Forward 5 Seconds', 'Sekondii 5 fuulduratti', 'تقديم 5 ثوانٍ'], ['Playback Speed', 'Ariitii taphachiisuu', 'سرعة التشغيل'],
  // Tools
  ['Frequency Analysis (FFT)…', 'Xiinxala firiikuwensii (FFT)…', 'تحليل الترددات (FFT)…'], ['Find Peak Sample', 'Bakka sagaleen itti ol’aanu barbaadi', 'البحث عن أعلى قمة'],
  ['Key Detector…', 'Kii sagalee argadhu…', 'كاشف المقام…'], ['Key Changer…', 'Kii jijjiiri…', 'تغيير المقام…'], ['Automatic Beat Detection…', 'Rukuttaa ofumaan argadhu…', 'كشف الإيقاع تلقائيًا…'],
  ['Remove Filler Words (um, uh)…', 'Jechoota guutuu (um, uh) haqi…', 'إزالة كلمات الحشو (أمم، إه)…'], ['Text to Speech…', 'Barreeffama gara sagaleetti…', 'تحويل النص إلى كلام…'],
  ['Multitrack Editor…', 'Gulaalaa tiraakii hedduu…', 'محرر المسارات المتعددة…'], ['Noise Removal…', 'Jeequmsa haquu…', 'إزالة الضوضاء…'], ['Click / Pop Removal…', 'Sagalee kilikii haquu…', 'إزالة النقرات…'],
  ['Memorisation Track…', 'Sagalee qu’annaa…', 'مقطع للحفظ…'], ['Generate Tone…', 'Sagalee uumi…', 'توليد نغمة…'], ['Create Ringtone…', 'Sagalee bilbilaa uumi…', 'إنشاء نغمة رنين…'],
  // Bookmark
  ['Add Marker at Cursor', 'Mallattoo bakka kursarii kaa’i', 'إضافة علامة عند المؤشر'], ['Next Marker', 'Mallattoo itti aanu', 'العلامة التالية'], ['Previous Marker', 'Mallattoo darbe', 'العلامة السابقة'],
  ['Auto-split at Pauses', 'Bakka dhaabbiitti ofumaan qoodi', 'تقسيم تلقائي عند التوقفات'], ['Markers on Beats…', 'Mallattoo rukuttaa irratti…', 'علامات على الإيقاع…'],
  ['Clear All Markers', 'Mallattoolee hunda haqi', 'مسح كل العلامات'], ['Save All Parts (.zip)', 'Kutaalee hunda olkaa’i (.zip)', 'حفظ كل الأجزاء (.zip)'], ['Split Parts into Tabs', 'Kutaalee gara taabiitti qoodi', 'تقسيم الأجزاء إلى تبويبات'],
  ['Name Parts from a List…', 'Kutaalee tarree irraa moggaasi…', 'تسمية الأجزاء من قائمة…'], ['Export Timestamps', 'Yeroowwan baasi', 'تصدير التوقيتات'], ['Import Timestamps…', 'Yeroowwan galchi…', 'استيراد التوقيتات…'],
  // View
  ['Zoom In', 'Guddisi', 'تكبير'], ['Zoom Out', 'Xiqqeessi', 'تصغير'], ['Zoom to Selection', 'Filannootti guddisi', 'تكبير إلى التحديد'], ['Zoom to Fit', 'Hunda agarsiisi', 'ملاءمة الكل'],
  ['Spectrogram', 'Speektiroogiraamii', 'المخطط الطيفي'], ['Overview Bar', 'Sarara waliigalaa', 'شريط النظرة العامة'], ['Taller Waveform', 'Suuraa sagalee dheeraa', 'موجة أطول'],
  ['Show Effects & Tools Panels', 'Paanaalii effektii fi meeshaalee agarsiisi', 'إظهار لوحات المؤثرات والأدوات'], ['Next Tab', 'Taabii itti aanu', 'التبويب التالي'], ['Previous Tab', 'Taabii darbe', 'التبويب السابق'],
  ['Theme', 'Bifa', 'المظهر'], ['Automatic (like this device)', 'Ofumaan (akka meeshaa kanaa)', 'تلقائي (حسب الجهاز)'], ['Light', 'Ifa', 'فاتح'], ['Dark', 'Dukkana', 'داكن'],
  ['Language', 'Afaan', 'اللغة'],
  // Voice
  ['One-click voice tools', 'Meeshaalee sagalee tuqa tokkoon', 'أدوات الصوت بنقرة واحدة'], ['Transcribe & Edit by Text…', 'Barreessi fi barreeffamaan gulaali…', 'تفريغ نصي وتحرير بالنص…'],
  ['Voice Cleanup', 'Sagalee qulqulleessi', 'تنظيف الصوت'], ['Audio Enhancer', 'Sagalee fooyyessi', 'تحسين الصوت'], ['Amplify Vocals', 'Sagalee namaa guddisi', 'تقوية الصوت البشري'],
  ['Isolate Voice', 'Sagalee namaa addaan baasi', 'عزل الصوت'], ['Reduce Voice (karaoke)', 'Sagalee namaa hir’isi (karaoke)', 'خفض الصوت البشري (كاريوكي)'],
  ['Pitch (higher / lower voice)…', 'Olka’iinsa (sagalee ol/gadi)…', 'طبقة الصوت (أعلى / أخفض)…'], ['Tempo (slower / faster, same voice)…', 'Saffisa (suuta/ariitii, sagaleen wal fakkaata)…', 'الإيقاع (أبطأ / أسرع بنفس الصوت)…'],
  // Help
  ['Help & Tutorials (full page)', 'Gargaarsaa fi leenjii (fuula guutuu)', 'المساعدة والدروس (صفحة كاملة)'], ['Tutorials', 'Leenjii', 'دروس'], ['Menu Reference', 'Ibsa baafataa', 'مرجع القوائم'],
  ['Guide & Keyboard Shortcuts', 'Qajeelfamaa fi furtuuwwan gabaabaa', 'الدليل واختصارات لوحة المفاتيح'], ['Keyboard Shortcuts…', 'Furtuuwwan gabaabaa…', 'اختصارات لوحة المفاتيح…'],
  ['Install as an App…', 'Akka appiitti fe’i…', 'التثبيت كتطبيق…'], ['About', 'Waa’ee', 'حول'],
  // Header, start screen
  ['Audio Editor', 'Gulaalaa Sagalee', 'محرر الصوت'], ['⤓ Install app', '⤓ Appii fe’i', '⤓ تثبيت التطبيق'], ['? Guide', '? Qajeelfama', '? الدليل'], ['← All apps', '← Appiilee hunda', '← كل التطبيقات'],
  ['Edit audio in your browser', 'Sagalee biraawzara kee keessatti gulaali', 'حرّر الصوت في متصفحك'], ['Open audio file', 'Faayilii sagalee bani', 'فتح ملف صوتي'], ['🔗 From a link', '🔗 Liinkii irraa', '🔗 من رابط'], ['Open audio from a link', 'Sagalee liinkii irraa bani', 'فتح صوت من رابط'], ['Open', 'Bani', 'فتح'],
  ['● Record', '● Waraabi', '● تسجيل'], ['＋ New empty', '＋ Duwwaa haaraa', '＋ ملف فارغ'], ['Join audio files', 'Faayilota sagalee walitti qabsiisi', 'دمج ملفات صوتية'],
  ['Text to speech', 'Barreeffama gara sagaleetti', 'تحويل النص إلى كلام'], ['Multitrack', 'Tiraakii hedduu', 'مسارات متعددة'], ['Recent files', 'Faayilota dhiyoo', 'الملفات الأخيرة'],
  ['New here?', 'Haaraa dhuftee?', 'جديد هنا؟'], ['Read the step-by-step tutorials', 'Leenjii tarkaanfii tarkaanfiin dubbisi', 'اقرأ الدروس خطوة بخطوة'],
  ['Continue where you left off?', 'Bakka dhiifte irraa itti fufta?', 'المتابعة من حيث توقفت؟'], ['Restore my work', 'Hojii koo deebisi', 'استعادة عملي'], ['Start fresh', 'Haaraa jalqabi', 'البدء من جديد'],
  // Editor toolbar and panels
  ['Open…', 'Bani…', 'فتح…'], ['⟲● Re-record', '⟲● Irra deebi’ii waraabi', '⟲● إعادة التسجيل'], ['⧉ Duplicate', '⧉ Dachaa’i', '⧉ تكرار'], ['▶ Play', '▶ Taphachiisi', '▶ تشغيل'],
  ['❚❚ Pause', '❚❚ Dhaabbii', '❚❚ إيقاف مؤقت'], ['⟲ Loop', '⟲ Deddeebi’i', '⟲ تكرار'], ['↶ Undo', '↶ Deebisi', '↶ تراجع'], ['↷ Redo', '↷ Irra deebi’i', '↷ إعادة'],
  ['Paste mix', 'Makii maxxansi', 'لصق مع مزج'], ['Mix with file…', 'Faayilii biraatiin makii…', 'مزج مع ملف…'], ['Trim to selection', 'Filannoo qofa hambisi', 'الإبقاء على التحديد فقط'],
  ['Zoom sel.', 'Filannoo guddisi', 'تكبير التحديد'], ['Fit', 'Hunda', 'ملاءمة'], ['Start', 'Jalqaba', 'البداية'], ['End', 'Dhuma', 'النهاية'], ['Length', 'Dheerina', 'الطول'], ['Total', 'Waliigala', 'المجموع'],
  ['Volume envelope', 'Sararaa sagalee', 'غلاف مستوى الصوت'], ['▶ Preview', '▶ Dursa dhaggeeffadhu', '▶ معاينة'], ['Reset', 'Haaromsi', 'إعادة ضبط'], ['Cancel', 'Dhiisi', 'إلغاء'], ['Apply', 'Hojiirra oolchi', 'تطبيق'],
  ['OK', 'Tole', 'موافق'], ['Close', 'Cufi', 'إغلاق'], ['Save', 'Olkaa’i', 'حفظ'], ['Remove', 'Haqi', 'إزالة'],
  ['This file is empty. Record, paste or drop audio into it.', 'Faayiliin kun duwwaa dha. Itti waraabi, maxxansi ykn sagalee itti gadi dhiisi.', 'هذا الملف فارغ. سجّل أو الصق أو أفلت صوتًا فيه.'],
  ['Open file', 'Faayilii bani', 'فتح ملف'], ['…or drag and drop an audio file here', '…ykn faayilii sagalee as harkisii gadi dhiisi', '…أو اسحب ملفًا صوتيًا وأفلته هنا'],
  ['(whole file)', '(faayilii guutuu)', '(الملف كاملًا)'], ['(selection)', '(filannoo)', '(التحديد)'],
  ['Basic', 'Bu’uuraa', 'أساسي'], ['Fade in', 'Suuta seensisi', 'ظهور تدريجي'], ['Fade out', 'Suuta dhumsi', 'اختفاء تدريجي'], ['Normalise', 'Madaalchisi', 'تسوية'],
  ['Gain', 'Guddina', 'الكسب'], ['Amplify', 'Guddisi', 'تضخيم'], ['Insert', 'Galchi', 'إدراج'], ['Insert silence', 'Callisa galchi', 'إدراج صمت'], ['Auto trim…', 'Ofumaan qonxoori…', 'قص تلقائي…'],
  ['Sound', 'Sagalee', 'الصوت'], ['Effect chain…', 'Walitti fufiinsa effektii…', 'سلسلة مؤثرات…'], ['Equaliser…', 'Ikuwalaayizarii…', 'المعادل…'], ['Clean up', 'Qulqulleessi', 'تنظيف'],
  ['Grab noise sample', 'Fakkeenya jeequmsaa fudhu', 'التقاط عينة ضوضاء'], ['Noise reduction…', 'Jeequmsa hir’isi…', 'تقليل الضوضاء…'], ['AI noise removal…', 'Jeequmsa haqi (AI)…', 'إزالة الضوضاء (ذكاء اصطناعي)…'],
  ['Noise gate…', 'Karra jeequmsaa…', 'بوابة الضوضاء…'], ['Remove rumble…', 'Sagalee gadi aanaa haqi…', 'إزالة الهدير…'], ['Remove hiss…', 'Shuuxuu haqi…', 'إزالة الهسهسة…'],
  ['Channels', 'Chaanaalota', 'القنوات'], ['Make mono', 'Mono godhi', 'تحويل إلى أحادي'], ['Make stereo', 'Isteeriyoo godhi', 'تحويل إلى ستيريو'], ['Swap L/R', 'Bitaa/Mirga jijjiiri', 'تبديل يسار/يمين'],
  ['Sample rate…', 'Saffisa fakkeenyaa…', 'معدل العينة…'], ['Format', 'Akkaataa', 'الصيغة'], ['Quality', 'Qulqullina', 'الجودة'], ['96 kbps (small)', '96 kbps (xiqqaa)', '96 kbps (صغير)'], ['320 kbps (best)', '320 kbps (isa gaarii)', '320 kbps (الأفضل)'],
  ['Download MP3', 'MP3 buufadhu', 'تنزيل MP3'], ['Download selection', 'Filannoo buufadhu', 'تنزيل التحديد'], ['⇪ Share / download', '⇪ Qoodi / buufadhu', '⇪ مشاركة / تنزيل'], ['Tags…', 'Odeeffannoo…', 'الوسوم…'],
  ['Everything happens on this device. Your audio is never uploaded.', 'Wanti hundi meeshaa kana irratti raawwata. Sagaleen kee gonkumaa hin ergamu.', 'كل شيء يتم على هذا الجهاز. لا يُرفع صوتك أبدًا.'],
  ['Markers & parts', 'Mallattoolee fi kutaalee', 'العلامات والأجزاء'], ['＋ Marker', '＋ Mallattoo', '＋ علامة'], ['Clear markers', 'Mallattoolee haqi', 'مسح العلامات'],
  ['Silence below', 'Callisa gadii', 'صمت أقل من'], ['for at least', 'yoo xiqqaate', 'لمدة لا تقل عن'], ['Auto-split at pauses', 'Dhaabbiitti ofumaan qoodi', 'تقسيم تلقائي عند التوقفات'],
  ['Download all parts (.zip)', 'Kutaalee hunda buufadhu (.zip)', 'تنزيل كل الأجزاء (.zip)'], ['Name parts…', 'Kutaalee moggaasi…', 'تسمية الأجزاء…'], ['Memorise…', 'Qu’adhu…', 'للحفظ…'], ['Timestamps…', 'Yeroowwan…', 'التوقيتات…'],
  ['Add audio', 'Sagalee dabali', 'إضافة صوت'], ['Insert file…', 'Faayilii galchi…', 'إدراج ملف…'], ['Generate…', 'Uumi…', 'توليد…'], ['Repeat loop…', 'Irra deddeebi’i…', 'تكرار حلقة…'], ['Redact…', 'Dhoksi…', 'إخفاء…'],
  ['Files', 'Faayilota', 'الملفات'], ['Split into tabs', 'Gara taabiitti qoodi', 'تقسيم إلى تبويبات'], ['Join audio…', 'Sagalee walitti qabsiisi…', 'دمج الصوت…'], ['Batch convert…', 'Hedduu jijjiiri…', 'تحويل دفعة…'],
  ['History', 'Seenaa', 'السجل'], ['1. Opened', '1. Banameera', '1. تم الفتح'],
  // Dialogs
  ['Mix with file', 'Faayilii biraatiin makii', 'مزج مع ملف'], ['Audio to mix in', 'Sagalee makamu', 'الصوت المراد مزجه'], ['Browse…', 'Barbaadi…', 'استعراض…'], ['Its volume', 'Sagalee isaa', 'مستوى صوته'],
  ['Start at', 'Irraa jalqabi', 'البدء عند'], ['Mix', 'Makii', 'مزج'], ['Join audio', 'Sagalee walitti qabsiisi', 'دمج الصوت'], ['＋ Add files…', '＋ Faayilota dabali…', '＋ إضافة ملفات…'],
  ['Pause between files', 'Dhaabbii faayilota gidduu', 'توقف بين الملفات'], ['seconds', 'sekondii', 'ثوانٍ'], ['Put a marker at each join', 'Bakka walqabsiisaa hundatti mallattoo kaa’i', 'ضع علامة عند كل وصلة'], ['Join', 'Walitti qabsiisi', 'دمج'],
  ['English', 'Afaan Ingiliffaa', 'الإنجليزية'], ['Arabic', 'Afaan Arabaa', 'العربية'], ['Male', 'Dhiira', 'ذكر'], ['Female', 'Dubartii', 'أنثى'], ['Speed', 'Ariitii', 'السرعة'], ['Pitch', 'Olka’iinsa', 'الطبقة'],
  ['New tab', 'Taabii haaraa', 'تبويب جديد'], ['Insert at cursor', 'Bakka kursarii galchi', 'إدراج عند المؤشر'], ['Remove filler words', 'Jechoota guutuu haqi', 'إزالة كلمات الحشو'],
  ['Sensitivity', 'Miira', 'الحساسية'], ['Normal', 'Idilee', 'عادي'], ['Scan again', 'Irra deebi’ii sakatta’i', 'فحص مجددًا'], ['Use speech recognition…', 'Beekumsa sagalee fayyadami…', 'استخدام التعرّف على الكلام…'],
  ['Then', 'Achiis', 'ثم'], ['Cut them out and close the gap', 'Muriitii iddoo duwwaa cufi', 'قصّها وأغلق الفراغ'], ['Replace them with silence', 'Callisaan bakka buusi', 'استبدلها بصمت'], ['Remove ticked', 'Kan mallatteeffame haqi', 'إزالة المحدد'],
  ['Key detector', 'Kii argachuu', 'كاشف المقام'], ['Change key', 'Kii jijjiiri', 'تغيير المقام'], ['Beat detection', 'Rukuttaa argachuu', 'كشف الإيقاع'], ['Tempo', 'Saffisa', 'الإيقاع'],
  ['Frequency analysis', 'Xiinxala firiikuwensii', 'تحليل الترددات'], ['Graphic equaliser', 'Ikuwalaayizarii', 'المعادل الرسومي'], ['Preset', 'Qophii', 'إعداد مسبق'], ['Flat', 'Wal qixa', 'مستوٍ'],
  ['Audio tags', 'Odeeffannoo sagalee', 'وسوم الصوت'], ['Title', 'Mata duree', 'العنوان'], ['Artist / reciter', 'Dubbisaa / qaari’a', 'الفنان / القارئ'], ['Album / series', 'Albamii / walfakkaataa', 'الألبوم / السلسلة'],
  ['Year', 'Waggaa', 'السنة'], ['Genre', 'Gosa', 'النوع'], ['Comment', 'Yaada', 'تعليق'], ['Cover picture', 'Suuraa fuula duraa', 'صورة الغلاف'], ['Choose picture…', 'Suuraa filadhu…', 'اختيار صورة…'], ['Save tags', 'Odeeffannoo olkaa’i', 'حفظ الوسوم'],
  ['Effect chain', 'Walitti fufiinsa effektii', 'سلسلة المؤثرات'], ['Chain', 'Walitti fufiinsa', 'السلسلة'], ['Save as…', 'Akka … olkaa’i', 'حفظ باسم…'], ['＋ Add step', '＋ Tarkaanfii dabali', '＋ إضافة خطوة'],
  ['Transcript', 'Barreeffama', 'النص المفرغ'], ['Model', 'Moodeela', 'النموذج'], ['Detect automatically', 'Ofumaan beeki', 'اكتشاف تلقائي'], ['Transcribe', 'Barreessi', 'تفريغ نصي'],
  ['▶ Play selected', '▶ Kan filatame taphachiisi', '▶ تشغيل المحدد'], ['Delete selected words', 'Jechoota filataman haqi', 'حذف الكلمات المحددة'], ['Remove fillers', 'Jechoota guutuu haqi', 'إزالة الحشو'],
  ['Markers at sentences', 'Hima hundatti mallattoo', 'علامات عند الجمل'], ['Export text…', 'Barreeffama baasi…', 'تصدير النص…'], ['Working…', 'Hojjechaa jira…', 'جارٍ العمل…'],
  ['Recording options', 'Filannoo waraabbii', 'خيارات التسجيل'], ['Amount', 'Hamma', 'المقدار'], ['Clip volume and fades', 'Sagalee fi suuta kilippii', 'مستوى المقطع والتدرج'],
  // Multitrack
  ['● Record track', '● Tiraakii waraabi', '● تسجيل مسار'], ['＋ Track', '＋ Tiraakii', '＋ مسار'], ['Add files…', 'Faayilota dabali…', 'إضافة ملفات…'], ['Split', 'Qoodi', 'تقسيم'],
  ['Volume & fades…', 'Sagalee fi suuta…', 'المستوى والتدرج…'], ['Edit clip', 'Kilippii gulaali', 'تحرير المقطع'], ['◆ Marker', '◆ Mallattoo', '◆ علامة'], ['Mix down → new tab', 'Walitti makii → taabii haaraa', 'مزج نهائي ← تبويب جديد'],
  ['Save mix', 'Makiinsa olkaa’i', 'حفظ المزج'], ['Save project', 'Pirojektii olkaa’i', 'حفظ المشروع'], ['✕ Close', '✕ Cufi', '✕ إغلاق'], ['Tracks', 'Tiraakota', 'المسارات'],
  ['Keyboard shortcuts', 'Furtuuwwan gabaabaa', 'اختصارات لوحة المفاتيح'],
  // Hints, descriptions and smaller windows (Arabic; the Afaan Oromoo wording is still to come)
  ['Open a recording or record from your microphone. Trim, cut, fade and normalise, split a recitation into lines at the pauses, and save each part as a WAV file.', null, 'افتح تسجيلًا أو سجّل من الميكروفون. قصّ واحذف وأضف التدرّج ووحّد مستوى الصوت، وقسّم التلاوة إلى مقاطع عند الوقفات، واحفظ كل جزء في ملف.'],
  ['…or drop audio files here (MP3, WAV, M4A, OGG, WebM) — each opens in its own tab. Save as MP3 or WAV.', null, '…أو اسحب ملفات الصوت إلى هنا (MP3 وWAV وM4A وOGG وWebM) — يُفتح كل ملف في تبويب خاص. احفظ بصيغة MP3 أو WAV.'],
  ['← NoorEditor', null, '→ NoorEditor'],
  ['Click to place the cursor · drag to select ·', null, 'انقر لوضع المؤشر · اسحب للتحديد ·'], ['+click to extend ·', null, '+نقرة لتوسيع التحديد ·'],
  ['drag a red marker to move it · drag the bar under a selection to move it, or its edges to resize it · drag the small squares at the top corners inwards to fade in / out ·', null, 'اسحب العلامة الحمراء لنقلها · اسحب الشريط أسفل التحديد لنقله أو حوافه لتغيير حجمه · اسحب المربعين الصغيرين في الزاويتين العلويتين للتدرّج دخولًا وخروجًا ·'],
  ['+scroll to zoom ·', null, '+عجلة الفأرة للتكبير ·'],
  ['+click to extend · drag a red marker to move it · drag the bar under a selection to move it, or its edges to resize it · drag the small squares at the top corners inwards to fade in / out ·', null, '+نقرة لتوسيع التحديد · اسحب العلامة الحمراء لنقلها · اسحب الشريط أسفل التحديد لنقله أو حوافه لتغيير حجمه · اسحب المربعين الصغيرين في الزاويتين العلويتين للتدرّج ·'],
  ['marker · press', null, 'علامة · اضغط'], ['■ Stop preview', null, '■ إيقاف المعاينة'], ['■ Stop recording', null, '■ إيقاف التسجيل'], ['■ Stop punch-in', null, '■ إيقاف إعادة التسجيل'], ['play ·', null, 'تشغيل ·'], ['delete ·', null, 'حذف ·'], ['marker ·', null, 'علامة ·'], ['press', null, 'اضغط'], ['for the guide and all shortcuts', null, 'للدليل وكل الاختصارات'],
  ['Tap to place the cursor · drag to select · pinch with two fingers to zoom · press and hold for the quick menu · drag a red marker to move it · drag the small squares at the top corners to fade in / out', null, 'المس لوضع المؤشر · اسحب للتحديد · باعد بإصبعين للتكبير · اضغط مطوّلًا للقائمة السريعة · اسحب العلامة الحمراء لنقلها · اسحب المربعين في الزاويتين العلويتين للتدرّج'],
  ['Add markers (or auto-split) to cut the audio into parts.', null, 'أضف علامات (أو قسّم تلقائيًا) لتقطيع الصوت إلى أجزاء.'],
  ['Split, Join and Duplicate open their result in a new tab and never change the original.', null, 'التقسيم والدمج والتكرار تفتح النتيجة في تبويب جديد ولا تغيّر الأصل أبدًا.'],
  ['Recent files are kept in this browser only (up to 8 files under 25 MB).', null, 'تُحفظ الملفات الأخيرة في هذا المتصفح فقط (حتى 8 ملفات أقل من 25 ميغابايت).'],
  ['Shown by music players and phones. Saved into MP3, FLAC and OGG files of this tab (and in projects).', null, 'تظهر في مشغلات الصوت والهواتف. تُحفظ في ملفات MP3 وFLAC وOGG لهذا التبويب (وفي المشاريع).'],
  ['Tick what to join and put it in order. The result opens in a new tab; the originals aren\'t changed.', null, 'اختر ما تريد دمجه ورتّبه. تُفتح النتيجة في تبويب جديد، ولا تتغيّر الملفات الأصلية.'],
  ['Crossfade (blend one into the next — used when the pause is 0)', null, 'تداخل (مزج كل ملف بالذي يليه — عندما يكون التوقف 0)'],
  ['Press “Add files…” to choose the audio to join.', null, 'اضغط «إضافة ملفات…» لاختيار الصوت المراد دمجه.'],
  ['For recording in time with a beat. The metronome clicks come out of the speakers — use headphones so they aren’t recorded.', null, 'للتسجيل على إيقاع منتظم. تخرج نقرات الميترونوم من السماعات — استخدم سماعات الرأس حتى لا تُسجَّل.'],
  ['Count-in before recording starts', null, 'عدّ تمهيدي قبل بدء التسجيل'], ['None', null, 'لا شيء'], ['1 bar', null, 'مازورة واحدة'], ['2 bars', null, 'مازورتان'],
  ['Metronome click while recording', null, 'نقرة الميترونوم أثناء التسجيل'], ['beats per minute', null, 'نبضة في الدقيقة'], ['Beats per bar', null, 'نبضات في المازورة'],
  ['Punch-in: play this much before the selection', null, 'إعادة التسجيل: شغّل هذا القدر قبل التحديد'], ['Multitrack: recording delay to correct', null, 'المسارات المتعددة: تأخير التسجيل المراد تصحيحه'],
  ['ms (if new takes land late, raise this)', null, 'مللي ثانية (إن جاءت التسجيلات الجديدة متأخرة فزِد هذه القيمة)'],
  ['Type or paste text and it is turned into speech — right here in your browser, in more than 100 languages including', null, 'اكتب نصًا أو الصقه فيتحوّل إلى كلام — هنا في متصفحك، بأكثر من 100 لغة منها'],
  ['Afaan Oromoo', null, 'الأورومية'], ['and', null, 'و'], ['. The voice is synthetic (robot-like), good for announcements, prompts and pronunciation practice.', null, '. الصوت اصطناعي (يشبه الآلي)، مناسب للإعلانات والتنبيهات والتدرّب على النطق.'],
  ['words/min', null, 'كلمة/دقيقة'], ['Pause between words', null, 'التوقف بين الكلمات'], ['×10 ms', null, '×10 مللي ثانية'],
  ['The speech engine could not be loaded — check your internet connection and try again.', null, 'تعذّر تحميل محرك الكلام — تحقّق من اتصالك بالإنترنت وحاول مجددًا.'],
  ['Type what should be spoken…', null, 'اكتب ما تريد نطقه…'],
  ['Give any menu command your own key. Press', null, 'اختر مفتاحك الخاص لأي أمر في القوائم. اضغط'], ['Change', null, 'تغيير'],
  [', then the key (with Ctrl, Alt or Shift if you like).', null, '، ثم المفتاح (مع Ctrl أو Alt أو Shift إن شئت).'], ['cancels. Your keys win over the built-in ones.', null, 'يلغي. مفاتيحك تتقدّم على المفاتيح المدمجة.'],
  ['Reset all', null, 'إعادة الكل'], ['Done', null, 'تم'], ['Find a command…', null, 'ابحث عن أمر…'], ['Find a command', null, 'ابحث عن أمر'], ['Back to the built-in key', null, 'العودة إلى المفتاح المدمج'],
  ['Built by', null, 'صنعه'], ['Version', null, 'الإصدار'], ['Everything happens on your device. Your audio is never uploaded.', null, 'كل شيء يتم على جهازك. لا يُرفع صوتك أبدًا.'], ['Questions, or something to report?', null, 'أسئلة أو شيء تريد الإبلاغ عنه؟'],
  ['Audio Editor — NoorEditor', null, 'محرر الصوت — NoorEditor'],
  // Screen-reader labels
  ['Switch between light and dark', null, 'التبديل بين الفاتح والداكن'], ['Menu', null, 'القائمة'], ['Open files', null, 'الملفات المفتوحة'], ['New empty tab', null, 'تبويب فارغ جديد'], ['File name', null, 'اسم الملف'],
  ['Transport', null, 'التشغيل'], ['Stop', null, 'إيقاف'], ['Go to start (Home)', null, 'الذهاب إلى البداية (Home)'], ['Back 5 seconds (,)', null, 'الرجوع 5 ثوانٍ (,)'], ['Forward 5 seconds (.)', null, 'التقدّم 5 ثوانٍ (.)'],
  ['Zoom', null, 'التكبير'], ['Zoom in (+)', null, 'تكبير (+)'], ['Zoom out (−)', null, 'تصغير (−)'], ['Markers and parts', null, 'العلامات والأجزاء'], ['Remove from recent files', null, 'إزالة من الملفات الأخيرة'],
  ['Move up', null, 'نقل لأعلى'], ['Move down', null, 'نقل لأسفل'], ['Remove from the list', null, 'إزالة من القائمة'],
  ['Waveform. Click to place the cursor, drag to select.', null, 'الموجة الصوتية. انقر لوضع المؤشر، واسحب للتحديد.'],
  ['Overview of the whole file. Drag the box to scroll, drag its edges to zoom, click to jump, double-click to show everything.', null, 'نظرة عامة على الملف كله. اسحب المربع للتمرير، وحوافه للتكبير، وانقر للانتقال، وانقر مرتين لعرض الكل.'],
  // Closing with unsaved edits
  ['Save your changes?', 'Jijjiirama kee olkaa’uu barbaaddaa?', 'حفظ التغييرات؟'], ['Don’t save', 'Hin olkaa’in', 'لا تحفظ'], ['Save all (.zip)', 'Hunda olkaa’i (.zip)', 'حفظ الكل (.zip)'],
  ['“{name}” has changes that are not saved. Save them before closing?', '“{name}” jijjiirama hin olkaa’amne qaba. Osoo hin cufin dura olkaa’uu?', 'في «{name}» تغييرات غير محفوظة. هل تحفظها قبل الإغلاق؟'],
  ['“{name}” has changes that are not saved. Save them before closing all files?', '“{name}” jijjiirama hin olkaa’amne qaba. Faayilota hunda osoo hin cufin dura olkaa’uu?', 'في «{name}» تغييرات غير محفوظة. هل تحفظها قبل إغلاق كل الملفات؟'],
  ['{n} files have changes that are not saved. Save them before closing all files?', 'Faayiloonni {n} jijjiirama hin olkaa’amne qabu. Osoo hin cufin dura olkaa’uu?', 'في {n} ملفات تغييرات غير محفوظة. هل تحفظها قبل إغلاق كل الملفات؟'],
  // Clean layout
  ['Parts', 'Kutaalee', 'الأجزاء'], ['Save', 'Olkaa’i', 'حفظ'], ['Close markers and parts', 'Mallattoo fi kutaalee cufi', 'إغلاق العلامات والأجزاء'],
];
const I18N_LANGS = [['en', 'English', 'ltr'], ['om', 'Afaan Oromoo', 'ltr'], ['ar', 'العربية', 'rtl']];
const I18N = { om: new Map(), ar: new Map() };
for (const [en, om, ar] of I18N_ROWS) { if (om) I18N.om.set(en, om); if (ar) I18N.ar.set(en, ar); }

let uiLang = 'en';
try { uiLang = localStorage.getItem('ae-lang') || (/^ar\b/i.test(navigator.language) ? 'ar' : /^om\b/i.test(navigator.language) ? 'om' : 'en'); } catch (e) {}
if (!I18N_LANGS.some(l => l[0] === uiLang)) uiLang = 'en';
tr = s => (uiLang !== 'en' && I18N[uiLang].get(s)) || s;

// Text nodes and attributes keep their English original, so switching language (or back) works.
const i18nText = new WeakMap(), i18nAttr = new WeakMap();
const I18N_SKIP = 'script,style,textarea,#trText,.tab .nm,#recentList .nm,.seglist .t,#fileInfo,#clock,#totalLen,#selLen,#mtClock,#mtInfo,#toast,.lang-pick';
function i18nNode(n) {
  const par = n.parentElement; if (!par || par.closest(I18N_SKIP)) return;
  const orig = i18nText.has(n) ? i18nText.get(n) : n.nodeValue;
  const m = orig.match(/^(\s*)([\s\S]*?)(\s*)$/), key = m[2].replace(/\s+/g, ' '); if (!key) return;
  const t = tr(key), val = t === key ? orig : m[1] + t + m[3];
  if (!i18nText.has(n)) i18nText.set(n, orig);
  if (n.nodeValue !== val) n.nodeValue = val;
}
function i18nAttrs(el) {
  for (const a of ['aria-label', 'placeholder']) {
    if (!el.hasAttribute(a)) continue;
    let o = i18nAttr.get(el); if (!o) i18nAttr.set(el, o = {});
    if (!(a in o)) o[a] = el.getAttribute(a);
    const v = tr(o[a]); if (el.getAttribute(a) !== v) el.setAttribute(a, v);
  }
}
function i18nTree(root) {
  if (root.nodeType === 3) { i18nNode(root); return; }
  if (root.nodeType !== 1 || root.closest && root.closest(I18N_SKIP)) return;
  i18nAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = tw.nextNode())) { if (n.nodeType === 3) i18nNode(n); else i18nAttrs(n); }
}
const i18nObs = new MutationObserver(recs => {
  for (const r of recs) {
    if (r.type === 'characterData') { i18nText.set(r.target, r.target.nodeValue); i18nNode(r.target); }
    else r.addedNodes.forEach(i18nTree);
  }
  i18nObs.takeRecords(); // our own changes
});
function setLanguage(code) {
  uiLang = code;
  try { localStorage.setItem('ae-lang', code); } catch (e) {}
  const L = I18N_LANGS.find(l => l[0] === code) || I18N_LANGS[0];
  document.documentElement.lang = code; document.documentElement.dir = L[2];
  i18nTree(document.body); i18nObs.takeRecords();
  const sel = document.getElementById('langSel'); if (sel) sel.value = code;
  if (typeof refresh === 'function' && doc) refresh();
}

(() => {
  // Language picker in the header
  const sel = document.createElement('select'); sel.id = 'langSel'; sel.className = 'num lang-pick'; sel.setAttribute('aria-label', 'Language / Afaan / اللغة');
  sel.style.cssText = 'width:auto; border-radius:20px; padding:5px 8px';
  I18N_LANGS.forEach(([c, name]) => sel.add(new Option(name, c)));
  sel.onchange = () => setLanguage(sel.value);
  const head = document.querySelector('.head-actions'); if (head) head.prepend(sel);
  const view = MENUS.find(m => m.label === 'View').items;
  view.push('-', { label: 'Language', sub: () => I18N_LANGS.map(([c, name]) => ({ label: name, check: () => uiLang === c, run: () => setLanguage(c) })) });
  // The menu bar was built before this file loaded; its labels are plain text nodes, so the walker handles them.
  i18nObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  setLanguage(uiLang);
})();
