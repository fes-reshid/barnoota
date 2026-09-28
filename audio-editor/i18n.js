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
  ['New File', 'Faayilii haaraa', 'ملف جديد'], ['Open File…', 'Faayilii bani…', 'فتح ملف…'], ['Recent Files', 'Faayilota dhiyoo', 'الملفات الأخيرة'],
  ['Save File', 'Olkaa’i', 'حفظ'], ['Save File As…', 'Akka haaraatti olkaa’i…', 'حفظ باسم…'], ['Save Selected Region As…', 'Kutaa filatame olkaa’i…', 'حفظ الجزء المحدد باسم…'],
  ['Save All Files (.zip)', 'Faayilota hunda olkaa’i (.zip)', 'حفظ كل الملفات (.zip)'], ['Share…', 'Qoodi…', 'مشاركة…'], ['Share Selection…', 'Filannoo qoodi…', 'مشاركة التحديد…'],
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
  ['Edit audio in your browser', 'Sagalee biraawzara kee keessatti gulaali', 'حرّر الصوت في متصفحك'], ['Open audio file', 'Faayilii sagalee bani', 'فتح ملف صوتي'],
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
];
const I18N_LANGS = [['en', 'English', 'ltr'], ['om', 'Afaan Oromoo', 'ltr'], ['ar', 'العربية', 'rtl']];
const I18N = { om: new Map(), ar: new Map() };
for (const [en, om, ar] of I18N_ROWS) { I18N.om.set(en, om); I18N.ar.set(en, ar); }

let uiLang = 'en';
try { uiLang = localStorage.getItem('ae-lang') || (/^ar\b/i.test(navigator.language) ? 'ar' : /^om\b/i.test(navigator.language) ? 'om' : 'en'); } catch (e) {}
if (!I18N_LANGS.some(l => l[0] === uiLang)) uiLang = 'en';
tr = s => (uiLang !== 'en' && I18N[uiLang].get(s)) || s;

// Text nodes and attributes keep their English original, so switching language (or back) works.
const i18nText = new WeakMap(), i18nAttr = new WeakMap();
const I18N_SKIP = 'script,style,textarea,#trText,.tab .nm,#recentList .nm,.seglist .t,#fileInfo,#clock,#totalLen,#selLen,#mtClock,#mtInfo,#toast,.lang-pick';
function i18nNode(n) {
  const par = n.parentElement; if (!par || par.closest(I18N_SKIP)) return;
  const orig = i18nText.has(n) ? i18nText.get(n) : n.nodeValue, key = orig.trim(); if (!key) return;
  const t = tr(key), val = t === key ? orig : orig.replace(key, t);
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
