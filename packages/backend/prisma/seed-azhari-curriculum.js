const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AZHARI_DATA = [
  // ==========================================
  // 1. ISLAMIC STUDIES (التربية الإسلامية)
  // ==========================================
  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-QURAN',
    title: 'القرآن الكريم (الثالث الثانوي - أزهري)',
    slug: 'azh-12-quran',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'منهاج القرآن الكريم وتجويده للصف الثالث الثانوي الأزهري (حفظ وتلاوة سورة البقرة)',
    textbook: {
      title: 'القرآن الكريم وتجويده (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=10Yf1_QhYoPXd4hrpewwSjYQwsFJOMVjK',
      totalPages: 100,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: سورة البقرة (الآيات 1 - 260)',
        lessons: [
          { orderIndex: 1, title: 'سورة البقرة: من الآية 1 إلى الآية 106', lessonType: 'حفظ وتجويد' },
          { orderIndex: 2, title: 'سورة البقرة: من الآية 107 إلى الآية 124', lessonType: 'حفظ وتجويد' },
          { orderIndex: 3, title: 'سورة البقرة: من الآية 125 إلى الآية 188', lessonType: 'حفظ وتجويد' },
          { orderIndex: 4, title: 'سورة البقرة: من الآية 189 إلى الآية 260', lessonType: 'حفظ وتجويد' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: سورة البقرة (الآيات 261 - 286)',
        lessons: [
          { orderIndex: 1, title: 'سورة البقرة: من الآية 261 إلى الآية 272', lessonType: 'حفظ وتجويد' },
          { orderIndex: 2, title: 'سورة البقرة: من الآية 273 إلى نهاية السورة', lessonType: 'حفظ وتجويد' },
          { orderIndex: 3, title: 'مراجعة عامة وتثبيت أحكام التجويد والترتيل', lessonType: 'مراجعة عامة' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'تحفيظ الطلاب من أول سورة البقرة {الم (1) ذَلِكَ الْكِتَابُ...} إلى قوله تعالى {مَا نَنسَخْ مِنْ آيَةٍ...} الآية (106) مع أحكام التجويد والترتيل.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'تحفيظ الطلاب من الآية (107) إلى قوله تعالى {وَإِذِ ابْتَلَى إِبْرَاهِيمَ رَبُّهُ بِكَلِمَاتٍ فَأَتَمَّهُنَّ} الآية (124).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'تحفيظ الطلاب من الآية (125) إلى قوله تعالى {وَقَاتِلُوا فِي سَبِيلِ اللَّهِ الَّذِينَ يُقَاتِلُونَكُمْ...} الآية (188).' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'تحفيظ الطلاب من الآية (189) إلى قوله تعالى {وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا...} الآية (260).' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'تحفيظ الطلاب من الآية (261) {أَيَوَدُّ أَحَدُكُمْ أَن تَكُونَ لَهُ جَنَّةٌ...} إلى الآية (272) {وَإِن كُنتُمْ عَلَى سَفَرٍ...}.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تثبيت ومراجعة الآيات المقررة للفصل الدراسي الثاني والتدريب على أحكام النون الساكنة والتنوين والمدود.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'تحفيظ الطلاب من الآية (273) {لِّلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ...} إلى نهاية سورة البقرة الكريمة.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة وتثبيت الحفظ لجميع الآيات المقررة وامتحانات نهاية العام الدراسي.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-HADITH',
    title: 'الحديث الشريف (الثالث الثانوي - أزهري)',
    slug: 'azh-12-hadith',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تيسير فتح المبدي شرح مختصر الزبيدي للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'تيسير فتح المبدي شرح مختصر الزبيدي (الصف الثالث الثانوي)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1gxNg3luSlvcGTdfwCvwrdT7TwasBWlFg',
      totalPages: 120,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: الأحاديث الشريفة (1 - 12)',
        lessons: [
          { orderIndex: 1, title: 'الأحاديث الشريفة من (1) إلى (5) - حفظ الحديثين 1 و 5', lessonType: 'شرح وحفظ' },
          { orderIndex: 2, title: 'الأحاديث الشريفة من (6) إلى (9) - حفظ الحديث 8', lessonType: 'شرح وحفظ' },
          { orderIndex: 3, title: 'الأحاديث الشريفة من (10) إلى (12) - حفظ الحديث 10', lessonType: 'شرح وحفظ' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: الأحاديث الشريفة (13 - 20)',
        lessons: [
          { orderIndex: 1, title: 'الأحاديث الشريفة (13 و 14) - حفظ الحديث 14', lessonType: 'شرح وحفظ' },
          { orderIndex: 2, title: 'الأحاديث الشريفة من (15) إلى (18) - حفظ الحديث 15', lessonType: 'شرح وحفظ' },
          { orderIndex: 3, title: 'الأحاديث الشريفة (19 و 20) وتطبيقات التخريج', lessonType: 'شرح وتطبيق' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'تدريس الأحاديث النبوية الشريفة أرقام: (1، 2، 3) ودراسة رواتها والمفردات اللغوية.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'تدريس الأحاديث أرقام: (4، 5) ويحفظ منها الحديث رقم (1) والحديث رقم (5).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'تدريس الأحاديث أرقام: (6، 7، 8، 9) ويحفظ منها الحديث رقم (8).' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'تدريس الأحاديث أرقام: (10، 11، 12) ويحفظ منها الحديث رقم (10) ومراجعة أحاديث الفصل الأول.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'تدريس الأحاديث أرقام: (13، 14) ويحفظ منها الحديث رقم (14).' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تدريس الأحاديث أرقام: (15، 16، 17، 18) ويحفظ منها الحديث رقم (15).' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'تدريس الأحاديث أرقام: (19، 20) والدروس المستفادة واللطائف الإسنادية.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لكافة الأحاديث العشرين المقررة شروحاً وحفظاً وأسانيد.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-TAWHEED',
    title: 'التوحيد والعقيدة (الثالث الثانوي - أزهري)',
    slug: 'azh-12-tawheed',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تيسير شرح جوهرة التوحيد للإمام البيجوري للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'تيسير شرح جوهرة التوحيد (الصف الثالث الثانوي)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=190mZTNrOlNNRCK0gxgpvTqB1XoXCGH0V',
      totalPages: 130,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: السمعيات والإلهيات',
        lessons: [
          { orderIndex: 1, title: 'السمعيات وأدلتها وحكم إنكار الملائكة', lessonType: 'عقيدة وتوحيد' },
          { orderIndex: 2, title: 'الجن والشياطين وعجب الذنب', lessonType: 'عقيدة وتوحيد' },
          { orderIndex: 3, title: 'الروح والبعث والحساب وتفنيد الشبهات', lessonType: 'عقيدة وتوحيد' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: اليوم الآخر والمعاد والجزاء',
        lessons: [
          { orderIndex: 1, title: 'أهوال اليوم الآخر والحسنات والسيئات', lessonType: 'عقيدة وتوحيد' },
          { orderIndex: 2, title: 'التوبة وشروطها والوزن والميزان', lessonType: 'عقيدة وتوحيد' },
          { orderIndex: 3, title: 'الصراط والشفاعة والجنة والنار ورؤية الله تعالى', lessonType: 'عقيدة وتوحيد' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'بداية من درس السمعيات (تعريفها وطريق ثبوتها) إلى مبحث الملائكة وصفاتهم.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'تابع الملائكة إلى نهاية فقرة (حكم إنكار الملائكة) وهو قوله "فمنكرهم كافر".' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'بداية من درس الجن والشياطين إلى نهاية فقرة (عجب الذنب) وهو قوله: "هو معنى" فإن "يبلى".' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'من درس الروح إلى نهاية الجواب عن شبهات المنكرين، وبداية من البعث والحساب إلى نهايته.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'بداية من درس اليوم الآخر وأشراطه إلى نهاية درس الحسنات والسيئات وتضاعفها.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'بداية من درس التوبة وأحكامها إلى نهاية درس الوزن والميزان وأقوال العلماء فيه.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'بداية من الصراط وصفته إلى نهاية درس الجنة والنار، ونعيم أهل الجنة ورؤية الله سبحانه.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لمسائل العقيدة والسمعيات ونماذج امتحانات الشهادة الثانوية الأزهرية.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-TAFSEER',
    title: 'التفسير - النسفي (الثالث الثانوي - أزهري)',
    slug: 'azh-12-tafseer',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تيسير التفسير النسفي (مدارك التنزيل وحقائق التأويل) للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'تيسير التفسير النسفي (الصف الثالث الثانوي)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1Y7UScJwbtzK0k_fE1_0EWFCShF_Mp4DT',
      totalPages: 140,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: تفسير سور الذاريات والطور والنجم (1-32)',
        lessons: [
          { orderIndex: 1, title: 'تفسير سورة الذاريات: الآيات (1 - 23)', lessonType: 'تفسير تحليلي' },
          { orderIndex: 2, title: 'تفسير سورة الذاريات (24-60) وسورة الطور (1-28)', lessonType: 'تفسير تحليلي' },
          { orderIndex: 3, title: 'تفسير سورة الطور (29-49) وسورة النجم (1-32)', lessonType: 'تفسير تحليلي' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: تفسير سورة النجم والقمر والرحمن',
        lessons: [
          { orderIndex: 1, title: 'تفسير سورة النجم (33-62) وسورة القمر كاملة', lessonType: 'تفسير تحليلي' },
          { orderIndex: 2, title: 'تفسير سورة الرحمن كاملة والبلاغة القرآنية', lessonType: 'تفسير تحليلي' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'من أول سورة الذاريات {وَالذَّارِيَاتِ ذَرْوًا} إلى الآية (14) ودراسة الأسرار البلاغية والإعرابية.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'من الآية (15) إلى نهاية الآية رقم (23) من سورة الذاريات {وَفِي أَنفُسِكُمْ أَفَلَا تُبْصِرُونَ}.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'بداية من الآية (24) من سورة الذاريات {هَلْ أَتَاكَ حَدِيثُ ضَيْفِ إِبْرَاهِيمَ} إلى نهاية سورة الطور الآية (28).' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'بداية من الآية (29) من سورة الطور إلى نهاية سورة النجم الآية (32) {الَّذِينَ يَجْتَنِبُونَ كَبَائِرَ الْإِثْمِ}.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'بداية من الآية (33) من سورة النجم إلى نهاية السورة الكريمة.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تفسير سورة القمر كاملة من قوله تعالى {اقْتَرَبَتِ السَّاعَةُ وَانشَقَّ الْقَمَرُ} إلى قوله {فِي مَقْعَدِ صِدْقٍ عِندَ مَلِيكٍ مُّقْتَدِرٍ}.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'تفسير سورة الرحمن كاملة من أول السورة الكريمة إلى خاتمتها العظيمة {تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ}.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لمفردات التفسير، أسباب النزول، والإعرابات البلاغية والبيانية.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-FIQH-SHAFII',
    title: 'الفقه الشافعي (الثالث الثانوي - أزهري)',
    slug: 'azh-12-fiqh-shafii',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تيسير كتاب الإقناع في حل ألفاظ أبي شجاع (الفقه الشافعي) للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'تيسير كتاب الإقناع في حل ألفاظ أبي شجاع (الصف الثالث الثانوي)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1XTuekyHBT-sp8Le6XPdoSMEwzHwDVG9S',
      totalPages: 180,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: المعاملات الأسرية والجنايات والحدود',
        lessons: [
          { orderIndex: 1, title: 'كتاب الطلاق والرجعة والظهار والكفارات', lessonType: 'فقه مقارن وتطبيقي' },
          { orderIndex: 2, title: 'الرضاع وشروط القصاص في النفس والأطراف', lessonType: 'فقه مقارن وتطبيقي' },
          { orderIndex: 3, title: 'كتاب الحدود: حد الزنا والقذف والسرقة وقطع الطريق والأشربة', lessonType: 'فقه مقارن وتطبيقي' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: الجهاد والأيمان والأقضية والشهادات',
        lessons: [
          { orderIndex: 1, title: 'كتاب الجهاد والجزية والأضحية والعقيقة', lessonType: 'فقه مقارن وتطبيقي' },
          { orderIndex: 2, title: 'كتاب الأيمان والنذور وأحكام اليمين المنعقدة', lessonType: 'فقه مقارن وتطبيقي' },
          { orderIndex: 3, title: 'كتاب الأقضية والشهادات والدعاوى والبينات وموجبات العدل', lessonType: 'فقه مقارن وتطبيقي' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'بداية من كتاب الطلاق، أركانه وشروطه وصيغه، إلى نهاية فصل في الرجعة وشروطها.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'بداية فصل في الظهار وشروطه إلى نهاية فصل في الكفارة وأنواعها وأحكامها.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'بداية من فصل في الرضاع إلى نهاية شروط القصاص في الأطراف، ومن كتاب الحدود إلى نهاية حد الزنا.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'من أول الحجر في مال المرتد، حد السرقة، حد قاطع الطريق، حد الأشربة، وتطبيقات فقهية قضائية.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'كتاب الجهاد، أحكام الأضحية والعقيقة وشروط إجزائها، كتاب الأيمان والنذور.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'كتاب الأقضية وآداب القاضي وشروط تولية القضاء إلى نهاية حكم الشهادة للقاضي بعلمه.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'بداية من فصل الدعاوى والبينات وشروط قبول الشهادة وموجبات العدالة إلى آخر الكتاب.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة للأبواب الفقهية والمسائل المعاصرة الملحقة بالفقه الشافعي.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ISLAMIC',
    code: 'AZH-12-MEERATH',
    title: 'الوجيز في الميراث (الثالث الثانوي - أزهري)',
    slug: 'azh-12-meerath',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الوجيز في الميراث وفق الفقه الإسلامي للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'الوجيز في الميراث (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=12XjQRqzk_yy9PQfs9amjjhxGWzVgRpwt',
      totalPages: 85,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: أصحاب الفروض والعصبات والحجب',
        lessons: [
          { orderIndex: 1, title: 'مقدمات علم الميراث، الحقوق المتعلقة بالتركة، وأصحاب الفروض من الرجال', lessonType: 'مواريث وقسمة تركات' },
          { orderIndex: 2, title: 'أصحاب الفروض من النساء وأحكام التعصيب', lessonType: 'مواريث وقسمة تركات' },
          { orderIndex: 3, title: 'الحجب بنوعيه وحساب مسائل العول وتطبيقاتها', lessonType: 'مواريث وقسمة تركات' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: الرد، ذوي الأرحام، والمناسخات',
        lessons: [
          { orderIndex: 1, title: 'مسائل الرد وأحكام توريث ذوي الأرحام', lessonType: 'مواريث وقسمة تركات' },
          { orderIndex: 2, title: 'ميراث الحمل والمفقود والخنثى المشكل والغرق والحرقى', lessonType: 'مواريث وقسمة تركات' },
          { orderIndex: 3, title: 'المناسخات وطرق تصفية وقسمة التركات النقدية والعقارية', lessonType: 'مواريث وقسمة تركات' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'مقدمة علم الميراث، أسبابه وشروطه وموانعه، أصحاب الفروض من الرجال (الأب، الجد، الزوج، الأخ لأم).' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'أصحاب الفروض من النساء (الزوجة، البنت، بنت الابن، الأم، الجدة، الأخوات الشقيقات ولأب ولأم).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'العصبات (عصبة بالنفس، بالغير، مع الغير)، الحجب (حجب حرمان، حجب نقصان) وقواعده.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'العول (تعريفه، أصول المسائل العائلة وغير العائلة)، حل المسائل الفرضية والتطبيقات.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الرد (شروطه، حكم رد الفائض على غير الزوجين)، توريث ذوي الأرحام وأصنافهم الأربعة.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الحالات الخاصة: ميراث الحمل، المفقود، والخنثى المشكل وتقدير الأنصبة الأحوط.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'المناسخات: حالات موت بعض الورثة قبل قسمة التركة، وتأصيل المسائل الجامعة.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة شاملة وتدريبات مكثفة على حل مسائل المواريث في امتحانات الثانوية الأزهرية.' }
    ]
  },

  // ==========================================
  // 2. ARABIC LANGUAGE (اللغة العربية وآدابها)
  // ==========================================
  {
    subjectCode: 'GOV-SCI-ARABIC-MOTALAA',
    code: 'AZH-12-ADAB',
    title: 'الأدب والنصوص وتاريخ الأدب (الثالث الثانوي - أزهري)',
    slug: 'azh-12-adab',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تاريخ الأدب والنصوص الأدبية للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'تاريخ الأدب والنصوص (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1mNt8PVyZfQmRqKcy6Jzq-Bqa2t2FMVND',
      totalPages: 160,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: النهضة الأدبية ومدرسة الإحياء والمحافظين',
        lessons: [
          { orderIndex: 1, title: 'عوامل النهضة الأدبية ونص طيف سميرة للبارودي (دراسة وحفظ)', lessonType: 'أدب ونصوص' },
          { orderIndex: 2, title: 'مدرسة الإحياء والبعث وخطبة الشيخ محمد عبده (دراسة وحفظ)', lessonType: 'أدب ونصوص' },
          { orderIndex: 3, title: 'مدرسة المحافظين والاتجاه الوجداني ونص صخرة الملتقى ونهج البردة', lessonType: 'أدب ونصوص' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: أدب المهجر وفنون النثر الحديث',
        lessons: [
          { orderIndex: 1, title: 'أدب المهجر وشعراء الرابطة والعصبة ونص الغاب لإيليا أبي ماضي', lessonType: 'أدب ونصوص' },
          { orderIndex: 2, title: 'فنون النثر الحديث: المقال، الخطابة، والمسرحية وقصة نظرة', lessonType: 'أدب ونصوص' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الأدب: أثر أول البعثات التعليمية وعوامل النهضة الأدبية في العصر الحديث. النصوص: طيف سميرة لمحمود سامي البارودي (المقطع الأول حفظ).' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الأدب: النهضة في الشعر والنثر والصحافة. النصوص: استكمال طيف سميرة (دراسة وتحليل فني وبياني).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'الأدب: مدرسة الإحياء والبعث وخصائصها. النصوص: خطبة الشيخ محمد عبده (حفظ وتحليل) ورحلة البارودي.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الأدب: مدرسة المحافظين ومدرسة الديوان. النصوص: صخرة الملتقى لإبراهيم ناجي، ونهج البردة لأحمد شوقي.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الأدب: أدب المهجر الشمالي والجنوبي وسمات التجديد فيه. النصوص: من قصيدة الغاب لإيليا أبي ماضي (دراسة وحفظ).' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الأدب: الرابطة القلمية والعصبة الأندلسية. النصوص: قصيدة كم ذا أكابد للمنفلوطي والتحليل الأدبي.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الأدب: تطور فن المقال الأدبي والسياسي، والمسرحية الشعرية والنثرية. النصوص: من قصة نظرة ليوسف إدريس.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لتاريخ الأدب والمدارس الأدبية وشعراء العصر الحديث والنصوص الحفظ والدراسة.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ARABIC-MOTALAA',
    code: 'AZH-12-BALAGHA',
    title: 'البلاغة (الثالث الثانوي - أزهري)',
    slug: 'azh-12-balagha',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'كتاب البلاغة للصف الثالث الثانوي الأزهري (البيان والبديع)',
    textbook: {
      title: 'البلاغة (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=15henzJRGQWOd2NA3u2Js3KLEHNsVXuQv',
      totalPages: 110,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: علم البيان (الاستعارة وأنواعها) والمحسنات البديعية',
        lessons: [
          { orderIndex: 1, title: 'الاستعارة التصريحية والمكنية والفرق بين الحقيقة والمجاز', lessonType: 'بلاغة وبيان' },
          { orderIndex: 2, title: 'الاستعارة باعتبار اللفظ (أصلية وتبعية) والطرفين (مرشحة ومجردة ومطلقة)', lessonType: 'بلاغة وبيان' },
          { orderIndex: 3, title: 'مفهوم علم البديع والمحسنات المعنوية: الطباق والمقابلة', lessonType: 'بلاغة وبيان' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: المحسنات المعنوية واللفظية',
        lessons: [
          { orderIndex: 1, title: 'التورية والمبالغة وتأكيد المدح بما يشبه الذم وعكسه', lessonType: 'بلاغة وبيان' },
          { orderIndex: 2, title: 'الجناس التام وغير التام وأنواعه وسر جماله', lessonType: 'بلاغة وبيان' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'المجاز اللغوي والاستعارة تعريفها وأركانها وقرينتها إلى الاستعارة التصريحية.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الاستعارة المكنية وإجراء الاستعارات وتطبيقات من القرآن الكريم والشعر العربي.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'تقسيم الاستعارة باعتبار اللفظ المستعار (أصلية وتبعية) وباعتبار الطرفين (مرشحة ومجردة ومطلقة).' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'مدخل علم البديع، المحسنات المعنوية، الطباق (إيجاب وسلب) والمقابلة وأثرها البلاغي.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'المقابلة وشروطها والتورية (مجردة ومرشحة ومبينة) والمبالغة (تبليغ، إغراق، غلو).' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تأكيد المدح بما يشبه الذم، وتأكيد الذم بما يشبه المدح، وحسن التعليل وتطبيقاتها.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الجناس: تعريفه وأقسامه (الجناس التام في نوع الحروف وعددها وترتيبها وهيئاتها، والجناس غير التام).' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية شاملة لعلمي البيان والبديع والتحليل البلاغي للشواهد القرآنية والنبوية.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ARABIC-MOTALAA',
    code: 'AZH-12-SARF',
    title: 'الصرف (الثالث الثانوي - أزهري)',
    slug: 'azh-12-sarf',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الصرف الميسر للصف الثالث الثانوي الأزهري (همزتا الوصل والقطع والإبدال والإعلال)',
    textbook: {
      title: 'الصرف الميسر (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1OzLwB_Px2JCQJnzjIIutVetK_DJ9pir3',
      totalPages: 125,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: همزتا الوصل والقطع والإبدال في أحرف العلة',
        lessons: [
          { orderIndex: 1, title: 'همزتا الوصل والقطع ومواضع كل منهما وأحكام حركة همزة الوصل', lessonType: 'قواعد صرفية' },
          { orderIndex: 2, title: 'إبدال أحرف العلة همزة في خمسة مواضع والتقاء الهمزتين في كلمة', lessonType: 'قواعد صرفية' },
          { orderIndex: 3, title: 'التقاء الهمزتين في كلمتين ومواضع إبدال الواو ياءً (المواضع 1 - 4)', lessonType: 'قواعد صرفية' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: إبدال الواو ياءً والياء واواً وإبدال التاء دالاً وطاءً',
        lessons: [
          { orderIndex: 1, title: 'إبدال الواو ياءً (المواضع 5 - 10) وإبدال الياء واواً', lessonType: 'قواعد صرفية' },
          { orderIndex: 2, title: 'إبدال الواو والياء ألفاً وشروطه العشرة وإبدال التاء دالاً وطاءً', lessonType: 'قواعد صرفية' },
          { orderIndex: 3, title: 'الإعلال بالنقل والحذف والإدغام وتطبيقات الوزن الصرفي', lessonType: 'قواعد صرفية' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'همزتا الوصل والقطع، مواضع همزة الوصل القياسية والسماعية في الأسماء والأفعال والحروف.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'دخول همزة الاستفهام على همزة الوصل، والبدء بهمزة الوصل، وإبدال أحرف العلة همزة (المواضع 1-3).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'استكمال إبدال أحرف العلة همزة (الموضعان 4 و 5) والتقاء همزتين في كلمة واحدة وحكم الثانية.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'التقاء همزتين في كلمتين، وبداية مواضع إبدال الواو ياءً من الموضع الأول إلى الموضع الرابع.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'المواضع 5 و 6 و 7 و 8 من إبدال الواو ياءً، ومواضع إبدال الياء واواً وشروط كل موضع.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'إبدال الواو والياء ألفاً بالشروط العشرة، واستثناءاتها الصرفية وتطبيقات الميزان الصرفي.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'إبدال التاء طاءً في صيغة افتعل، وإبدالها دالاً، والإعلال بالحذف والنقل في الأفعال المعتلة.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لمادة الصرف وحل تدريبات الامتحانات الوزارية الأزهرية السابقة.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ARABIC-MOTALAA',
    code: 'AZH-12-NAHW',
    title: 'النحو (الثالث الثانوي - أزهري)',
    slug: 'azh-12-nahw',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'شرح ابن عقيل على ألفية ابن مالك للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'النحو (شرح ابن عقيل - الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1L3RzXnYmjrKNN9q41o6eKJ8Ek8Y9xwuw',
      totalPages: 175,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: باب النداء والأساليب النحوية ونواصب المضارع',
        lessons: [
          { orderIndex: 1, title: 'باب النداء وأنواع المنادى وأحكامه وحكم المنادى المكرر مضافاً', lessonType: 'قواعد نحوية' },
          { orderIndex: 2, title: 'النداء المضاف لياء المتكلم، أسماء لازمت النداء، الاستغاثة، الندبة، والاختصاص', lessonType: 'قواعد نحوية' },
          { orderIndex: 3, title: 'التحذير والإغراء وأسماء الأفعال وإعراب الفعل ونواصب المضارع', lessonType: 'قواعد نحوية' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: جوازم المضارع والعدد والتأنيث والتكسير',
        lessons: [
          { orderIndex: 1, title: 'جوازم الفعل المضارع، الشرط والجزاء، واقتران الجواب بالفاء', lessonType: 'قواعد نحوية' },
          { orderIndex: 2, title: 'أحكام باب العدد: تذكيره وتأنيثه، تمييزه، وبناؤه على وزن فاعل', lessonType: 'قواعد نحوية' },
          { orderIndex: 3, title: 'باب التأنيث وعلاماته، وجموع التكسير (قلة وكثرة)', lessonType: 'قواعد نحوية' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'باب النداء: حروف النداء واستعمالاتها، أقسام المنادى وأحكام إعرابه وبنائه.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'حكم المنادى المكرر مضافاً، تابع المنادى المبني والمعرب، والمنادى المضاف إلى ياء المتكلم.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'أسماء لازمت النداء، الاستغاثة والندبة، الاختصاص، التحذير والإغراء، وأسماء الأفعال والأصوات.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'إعراب الفعل: رفع المضارع ونصبه، نواصب المضارع وإضمار (أن) وجوباً وجوازاً حتى شذوذ حذفها.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'عوامل جزم المضارع: الأدوات الجازمة لفعل واحد، والجازمة لفعلين وأدوات الشرط ومعانيها.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'حكم اقتران جواب الشرط بالفاء، حذف الشرط أو الجواب، واجتماع الشرط والقسم وترجيح أحدهما.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'باب العدد: تذكير وتأنيث العدد مع المعدود، تمييز الأعداد المفردة والمركبة والعقود والمعطوف وصياغة فاعل.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'باب التأنيث وعلاماته، ومراجعة عامة وتطبيقات إعرابية شاملة على ألفية ابن مالك.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-ARABIC-MOTALAA',
    code: 'AZH-12-MOTALAA',
    title: 'المطالعة والإنشاء (الثالث الثانوي - أزهري)',
    slug: 'azh-12-motalaa',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'المطالعة والنصوص والإنشاء التحريري للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'المطالعة والإنشاء (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1lOouLUpwLuA-NMowp2fRY5CSexG9Zuyb',
      totalPages: 100,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: قضايا فكرية ومجتمعية وفنون الكتابة التحريرية',
        lessons: [
          { orderIndex: 1, title: 'مقاصد الشريعة الإسلامية وكتابة المقال الصحفي والأدبي', lessonType: 'مطالعة وإنشاء' },
          { orderIndex: 2, title: 'التكافل الاجتماعي وفن التلخيص وصياغة الأفكار', lessonType: 'مطالعة وإنشاء' },
          { orderIndex: 3, title: 'وثيقة المدينة المنورة وكتابة الرسائل الإخوانية والرسمية', lessonType: 'مطالعة وإنشاء' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: قضايا الأمة والهوية والبحث العلمي',
        lessons: [
          { orderIndex: 1, title: 'القدس في الضمير العربي والإسلامي وكتابة البحوث العلمية', lessonType: 'مطالعة وإنشاء' },
          { orderIndex: 2, title: 'الحوار وقبول الآخر وفن المناظرة والخطابة المؤثرة', lessonType: 'مطالعة وإنشاء' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'المطالعة: مقاصد الشريعة الإسلامية وحفظ الضروريات الخمس. الإنشاء: فن المقال وأسس صياغة الفكرة.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'المطالعة: استكمال مقاصد الشريعة ومناقشتها. الإنشاء: التلخيص وتقنياته وضوابطه.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'المطالعة: التكافل الاجتماعي في الرؤية الإسلامية. الإنشاء: المراسلات الرسمية والرسائل الإخوانية.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'المطالعة: وثيقة المدينة المنورة والتعايش الإنساني. الإنشاء: كتابة التقرير الصحفي والإداري.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'المطالعة: القدس ومكانتها التاريخية والدينية. الإنشاء: إعداد وكتابة البحث العلمي واستخدام المصادر.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'المطالعة: مكانة المرأة ودورها في بناء الأمة. الإنشاء: تنظيم الحواشي وفهرسة المراجع والموضوعات.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'المطالعة: الحوار البناء وحرية الرأي المسؤول. الإنشاء: المناظرة والخطابة وقواعد العرض الجماهيري.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لموضوعات المطالعة وتطبيقات تحريرية على الإنشاء والتعبير.' }
    ]
  },

  // ==========================================
  // 3. MATHEMATICS (الرياضيات)
  // ==========================================
  {
    subjectCode: 'MATH-12-SC',
    code: 'AZH-12-MATH-PURE',
    title: 'الرياضيات البحتة (الثالث الثانوي علمي - أزهري)',
    slug: 'azh-12-math-pure',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الجبر والهندسة الفراغية والتفاضل والتكامل للصف الثالث الثانوي الأزهري (القسم العلمي)',
    textbook: {
      title: 'الرياضيات البحتة (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1cPMqWaPdZXCdkEJb16FrP4ruHzL-T_5z',
      totalPages: 240,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: التباديل والتوافيق وذات الحدين والهندسة الفراغية والاشتقاق',
        lessons: [
          { orderIndex: 1, title: 'الجبر: مبدأ العد، التباديل، التوافيق، ونظرية ذات الحدين بأس صحيح موجب', lessonType: 'رياضيات بحتة' },
          { orderIndex: 2, title: 'الهندسة الفراغية: النظام الإحداثي المتعامد والمتجهات والضرب القياسي والاتجاهي', lessonType: 'رياضيات بحتة' },
          { orderIndex: 3, title: 'التفاضل: مشتقات الدوال المثلثية والاشتقاق الضمني والمعدلات الزمنية المرتبطة', lessonType: 'رياضيات بحتة' },
          { orderIndex: 4, title: 'تطبيقات التفاضل: تزايد وتناقص الدوال والقيم العظمى والصغرى ونقط الانقلاب', lessonType: 'رياضيات بحتة' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: الأعداد المركبة والمستقيم والمستوى في الفراغ والتكامل وتطبيقاته',
        lessons: [
          { orderIndex: 1, title: 'الجبر: الأعداد المركبة في الصورة المثلثية ونظرية ديموافر والمحددات والمصفوفات', lessonType: 'رياضيات بحتة' },
          { orderIndex: 2, title: 'الهندسة الفراغية: معادلة المستقيم والمستوى في الفراغ وطول العمود والزوايا', lessonType: 'رياضيات بحتة' },
          { orderIndex: 3, title: 'التكامل: تكامل الدوال المثلثية والأسية واللوغاريتمية وتكامل بالتعويض وبالتجزيء', lessonType: 'رياضيات بحتة' },
          { orderIndex: 4, title: 'تطبيقات التكامل: حساب المساحات المستوية وحجوم الأجسام الدورانية', lessonType: 'رياضيات بحتة' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الجبر: مبدأ العد، التباديل والتوافيق، نظرية ذات الحدين. الفراغية: النظام الإحداثي ثلاثي الأبعاد. التفاضل: مشتقات الدوال المثلثية.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الجبر: حالات خاصة ومفكوك ذات الحدين. الفراغية: المتجهات في الفراغ. التفاضل: الاشتقاق الضمني والبارامتري والمشتقات العليا.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'الجبر: الحد الأوسط والنسبة بين حدين متتاليين. الفراغية: الضرب القياسي والاتجاهي. التفاضل: المماس والعمودي والمعدلات الزمنية.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الجبر: تطبيقات ذات الحدين. الفراغية: الضرب الثلاثي القياسي. التفاضل: القيم العظمى والصغرى ورسم المنحنيات.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الجبر: الأعداد المركبة والصورة المثلثية ونظرية ديموافر والجذور التكعيبية للواحد. التفاضل والتكامل: تكامل الدوال الأسية واللوغاريتمية.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الفراغية: الزاوية بين مستقيمين ومعادلة المستقيم في الفراغ. التكامل: طرق التكامل بالتعويض وبالتجزيء وتكامل الكسور الجزئية.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الجبر: المحددات والمصفوفات وحل المعادلات الخطية بكرامر والمعكوس. الفراغية: معادلة المستوى والبعد العمودي. التكامل: المساحات والحجوم الدورانية.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية مكثفة وحل مسائل الامتحانات الأزهرية الرسمية في الرياضيات البحتة.' }
    ]
  },

  {
    subjectCode: 'MATH-12-SC',
    code: 'AZH-12-MATH-APPLIED',
    title: 'الرياضيات التطبيقية (الثالث الثانوي علمي - أزهري)',
    slug: 'azh-12-math-applied',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الاستاتيكا والديناميكا للصف الثالث الثانوي الأزهري (القسم العلمي)',
    textbook: {
      title: 'الرياضيات التطبيقية - استاتيكا وديناميكا (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=10L9v3BflzrOslAfUhZQtT9mtGcVkOMho',
      totalPages: 220,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: الاحتكاك، العزوم، الحركة المستقيمة، وقوانين نيوتن',
        lessons: [
          { orderIndex: 1, title: 'الاستاتيكا: الاحتكاك على مستوى أفقي ومائل خشن، وعزوم القوى في المستوي والفراغ', lessonType: 'رياضيات تطبيقية' },
          { orderIndex: 2, title: 'الاستاتيكا: القوى المتوازية المستوية، الاتزان العام، والازدواجات', lessonType: 'رياضيات تطبيقية' },
          { orderIndex: 3, title: 'الديناميكا: تفاضل وتكامل الدوال المتجهة، وكمية الحركة، وقوانين نيوتن الثلاثة', lessonType: 'رياضيات تطبيقية' },
          { orderIndex: 4, title: 'الديناميكا: حركة المصاعد وحركة الأجسام على المستويات الملساء والخشنة والبكرات البسيطة', lessonType: 'رياضيات تطبيقية' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: مركز الثقل، الدفع والتصادم، الشغل، الطاقة، والقدرة',
        lessons: [
          { orderIndex: 1, title: 'الاستاتيكا: مركز الثقل وطريقة الإحداثيات وطريقة الكتلة السالبة', lessonType: 'رياضيات تطبيقية' },
          { orderIndex: 2, title: 'الديناميكا: الدفع، التصادم المرن وغير المرن، والشغل وطاقة الحركة', lessonType: 'رياضيات تطبيقية' },
          { orderIndex: 3, title: 'الديناميكا: طاقة الوضع ومبدأ ثبوت الطاقة الميكانيكية والقدرة والمحركات', lessonType: 'رياضيات تطبيقية' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'استاتيكا: الاحتكاك على مستوى أفقي خشن ومائل خشن. ديناميكا: الحركة في خط مستقيم وتفاضل وتكامل الدوال المتجهة.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'استاتيكا: العزوم ونظرية فارينون في بعدين وثلاثة أبعاد. ديناميكا: كمية الحركة والقانون الأول والثاني لنيوتن.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'استاتيكا: القوى المتوازية المستوية والاتزان العام. ديناميكا: القانون الثالث لنيوتن وحركة المصاعد وحركة الأجسام المتصلة ببكرة.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'استاتيكا: الازدواج وتكافؤ الازدواجين. ديناميكا: الدفع والتصادم المرن وغير المرن وتطبيقات عملية.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'استاتيكا: مركز الثقل وحساب مركز ثقل الأجسام المركبة. ديناميكا: الشغل وطاقة الحركة والعلاقة بينهما.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'استاتيكا: طريقة الكتلة السالبة في مركز الثقل. ديناميكا: مبدأ ثبوت الطاقة ومجموع طاقتي الحركة والوضع.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'استاتيكا: تمارين الاتزان المتقدمة. ديناميكا: طاقة الوضع، القدرة اللحظية والمتوسطة، ومحركات الآلات.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية شاملة للاستاتيكا والديناميكا وحل امتحانات الثانوية الأزهرية السابقة.' }
    ]
  },

  {
    subjectCode: 'MATH-12-SC',
    code: 'AZH-12-STATISTICS',
    title: 'الإحصاء (الثالث الثانوي أدبي - أزهري)',
    slug: 'azh-12-statistics',
    academicBranch: 'literary',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'منهاج الإحصاء والاحتمالات للصف الثالث الثانوي الأدبي الأزهري',
    textbook: {
      title: 'الإحصاء (الصف الثالث الثانوي الأدبي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1d1HCK_fnjtzcNpLo5DAWdZDFlAj2QQu4',
      totalPages: 110,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: الارتباط، الانحدار، عرض البيانات، وحساب الاحتمال',
        lessons: [
          { orderIndex: 1, title: 'الارتباط الخطي، معامل بيرسون، معامل سبيرمان، ومعادلة خط الانحدار', lessonType: 'إحصاء وتطبيقات' },
          { orderIndex: 2, title: 'عرض البيانات بطريقة الساق والأوراق وتعيين الرباعيات والتمثيل الصندوقي', lessonType: 'إحصاء وتطبيقات' },
          { orderIndex: 3, title: 'مسلمات الاحتمال، العمليات على الأحداث، والاحتمال الشرطي والأحداث المستقلة', lessonType: 'إحصاء وتطبيقات' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: المتغيرات العشوائية والتوزيع الطبيعي وفترات الثقة',
        lessons: [
          { orderIndex: 1, title: 'المتغير العشوائي المتقطع والتوقع والتباين والانحراف المعياري وتوزيع ذات الحدين', lessonType: 'إحصاء وتطبيقات' },
          { orderIndex: 2, title: 'المتغير العشوائي المتصل ودالة كثافة الاحتمال', lessonType: 'إحصاء وتطبيقات' },
          { orderIndex: 3, title: 'التوزيع الطبيعي المعياري ومستوى الثقة وفترات الثقة واختبارات الفروض', lessonType: 'إحصاء وتطبيقات' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الارتباط الخطي، شكل الانتشار، معامل ارتباط بيرسون، معامل ارتباط الرتب لسبيرمان.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الانحدار ومعادلة خط الانحدار وطريقة المربعات الصغرى، عرض البيانات بالساق والأوراق وتعيين الرباعيات.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'نصف المدى الربيعي، الوحدة الثالثة: حساب الاحتمال، التجربة العشوائية وفضاء العينة ومسلمات الاحتمال.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الاحتمال الشرطي والجداول التوافقية والأحداث المستقلة وغير المستقلة وتطبيقاتها.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'المتغير العشوائي المتقطع ودالة توزيعه الاحتمالي وحساب التوقع والتباين والانحراف المعياري.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تجربة برنولي، التوزيع الاحتمالي الهندسي وتوزيع ذي الحدين والتوقع والتباين له.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'المتغير العشوائي المتصل ودالة كثافة الاحتمال، والتوزيع الطبيعي وحساب المساحات تحت المنحنى الطبيعي.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'تطبيقات عملية على التوزيع الطبيعي، مستوى الثقة والخطأ وفترات الثقة، ومراجعة عامة وحل امتحانات.' }
    ]
  },

  // ==========================================
  // 4. SCIENCES (العلوم: فيزياء، أحياء)
  // ==========================================
  {
    subjectCode: 'GOV-SCI-PHYSICS',
    code: 'AZH-12-PHYSICS',
    title: 'الفيزياء (الثالث الثانوي علمي - أزهري)',
    slug: 'azh-12-physics',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الفيزياء الكهربية والكهرومغناطيسية والفيزياء الحديثة للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'الفيزياء (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1I0IibfWspuxFJuTmKTyHHoQKGMsLApSi',
      totalPages: 250,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: الفيزياء الكلاسيكية (الكهربية والتيار المتردد)',
        lessons: [
          { orderIndex: 1, title: 'التيار الكهربي وقانون أوم وقانونا كيرشوف وتوصيل المقاومات', lessonType: 'فيزياء وتجارب' },
          { orderIndex: 2, title: 'التأثير المغناطيسي للتيار الكهربي والقوة وعزم الازدواج وأجهزة القياس', lessonType: 'فيزياء وتجارب' },
          { orderIndex: 3, title: 'الحث الكهرومغناطيسي، فاراداي، الدينامو، المحول الكهربي، والمحرك', lessonType: 'فيزياء وتجارب' },
          { orderIndex: 4, title: 'دوائر التيار المتردد (R, L, C) ودوائر الرنين والاهتزاز الكهرومغناطيسي', lessonType: 'فيزياء وتجارب' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: مقدمة في الفيزياء الحديثة والإلكترونيات',
        lessons: [
          { orderIndex: 1, title: 'ازدواجية الموجة والجسيم، إشعاع الجسم الأسود، والظاهرة الكهروضوئية وكومتون', lessonType: 'فيزياء وتجارب' },
          { orderIndex: 2, title: 'الأطياف الذرية وأشعة إكس وأشعة الليزر وتطبيقاتها', lessonType: 'فيزياء وتجارب' },
          { orderIndex: 3, title: 'الإلكترونيات الحديثة، أشباه الموصلات، الترانزستور، والبوابات المنطقية', lessonType: 'فيزياء وتجارب' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الفصل الأول: التيار الكهربي، شدة التيار، فرق الجهد، قانون أوم، المقاومة النوعية والتوصيلية الكهربية.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'توصيل المقاومات توالي وتوازي، قانون أوم للدائرة المغلقة، قانونا كيرشوف للتيار وفرق الجهد.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'الفصل الثاني: الفيض والمجال المغناطيسي لسلك وملف دائري ولولبي، القوة المغناطيسية، وأجهزة القياس التناظرية.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الفصل الثالث: الحث الكهرومغناطيسي وقانون فاراداي وقاعدة لنز، الحث الذاتي والمتبادل، المولد (الدينامو)، المحول، والمحرك.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الفصل الرابع: دوائر التيار المتردد. الفصل الخامس: ازدواجية الموجة والجسيم، إشعاع الجسم الأسود، والخلية الكهروضوئية.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'ظاهرة كومتون، الطبيعة الموجية للجسيم (دي برولي)، الفصل السادس: الأطياف الذرية والأشعة السينية ومطياف الكتلة.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الفصل السابع: الليزر (الخصائص ونظرية الفعل الليزري وهيليوم-نيون)، الفصل الثامن: أشباه الموصلات والبلورة P-N والترانزستور والبوابات.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة عامة شاملة لمسائل الفيزياء والرسوم البيانية وتدريبات امتحانات التوجيهي الأزهري.' }
    ]
  },

  {
    subjectCode: 'GOV-SCI-BIOLOGY',
    code: 'AZH-12-BIOLOGY',
    title: 'العلوم الحياتية والأحياء (الثالث الثانوي علمي - أزهري)',
    slug: 'azh-12-biology',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'علم الأحياء والبيولوجيا الجزيئية للصف الثالث الثانوي الأزهري (القسم العلمي)',
    textbook: {
      title: 'الأحياء (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1MRYV_GfCmuFB35FdnqtR9GkRTZyk3AEo',
      totalPages: 230,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: التركيب والوظيفة في الكائنات الحية',
        lessons: [
          { orderIndex: 1, title: 'الدعامة والحركة في النبات والإنسان (الجهاز الهيكلي والعضلي)', lessonType: 'علوم حياتية' },
          { orderIndex: 2, title: 'التنسيق الهرموني في الكائنات الحية وجهاز الغدد الصماء', lessonType: 'علوم حياتية' },
          { orderIndex: 3, title: 'التكاثر في الكائنات الحية (النباتات الزهرية والإنسان)', lessonType: 'علوم حياتية' },
          { orderIndex: 4, title: 'المناعة في النبات والجهاز المناعي في الإنسان وآلية عمله', lessonType: 'علوم حياتية' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: البيولوجيا الجزيئية وتخليق البروتين وتاريخ الأرض',
        lessons: [
          { orderIndex: 1, title: 'الحمض النووي DNA وتركيبه وتضاعفه وإصلاح عيوبه', lessonType: 'علوم حياتية' },
          { orderIndex: 2, title: 'الأحماض النووية RNA وتخليق البروتين والشفرة الوراثية والهندسة الوراثية', lessonType: 'علوم حياتية' },
          { orderIndex: 3, title: 'الأحياء وتطور الأرض وطبقات الصخور والمعادن', lessonType: 'علوم حياتية' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الفصل الأول: الدعامة الفسيولوجية والتركيبية في النبات، والهيكل العظمي المحوري والطرفي في الإنسان.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الحركة في النبات والإنسان، تركيب العضلة الهيكلية وآلية الانقباض، الفصل الثاني: التنسيق الهرموني والغدد الصماء.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'الفصل الثالث: صور التكاثر اللاجنسي والجنسي، تعاقب الأجيال، التكاثر في النباتات الزهرية، والتكاثر في الإنسان.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الفصل الرابع: المناعة التركيبية والبيوكيميائية في النبات، والأعضاء والخلايا الليمفاوية والأجسام المضادة في الإنسان.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'آلية عمل الجهاز المناعي والاستجابة المناعية، الباب الثاني: الحمض النووي DNA وتجارب إثبات المادة الوراثية وتركيبه.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'تضاعف DNA وأنظيمات اللولب والبلمرة والربط، وإصلاح عيوب الوراثة، وأنواع RNA الثلاثة (mRNA, tRNA, rRNA).' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الشفرة الوراثية وتخليق البروتين، وتطبيقات الهندسة الوراثية والـ DNA معاد الاتحاد، والأحياء وتطور طبقات الأرض.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية شاملة لعلم الأحياء، الرسوم التخطيطية والبيانية، ونماذج امتحانات الثانوية الأزهرية.' }
    ]
  },

  // ==========================================
  // 5. SOCIAL STUDIES (التاريخ، الجغرافيا)
  // ==========================================
  {
    subjectCode: 'GOV-LIT-HISTORY',
    code: 'AZH-12-HISTORY',
    title: 'التاريخ (الثالث الثانوي أدبي - أزهري)',
    slug: 'azh-12-history',
    academicBranch: 'literary',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'تاريخ مصر والعرب الحديث والمعاصر للصف الثالث الثانوي الأدبي الأزهري',
    textbook: {
      title: 'التاريخ الحديث والمعاصر (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1yjDmMv2PWZ_1yAuqvJTg-X-mKbdDXLLc',
      totalPages: 210,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: الحملة الفرنسية وبناء الدولة الحديثة والثورة العرابية وثورة 1919',
        lessons: [
          { orderIndex: 1, title: 'الحملة الفرنسية على مصر والشام ونزول الحملة وأثر الوجود الفرنسي', lessonType: 'تاريخ حديث' },
          { orderIndex: 2, title: 'بناء الدولة الحديثة في عهد محمد علي وسياسته الداخلية والخارجية وسقوط الاحتكار', lessonType: 'تاريخ حديث' },
          { orderIndex: 3, title: 'مصر منذ الثورة العرابية والاحتلال البريطاني حتى الحرب العالمية الأولى', lessonType: 'تاريخ حديث' },
          { orderIndex: 4, title: 'مصر بعد الحرب العالمية الأولى وثورة 1919 والمفاوضات حتى معاهدة 1936', lessonType: 'تاريخ حديث' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: الاستعمار في البلاد العربية، قضية فلسطين، وثورات العصر الحديث',
        lessons: [
          { orderIndex: 1, title: 'التوسع الاستعماري في الخليج والجزائر وتونس والمغرب وليبيا', lessonType: 'تاريخ معاصر' },
          { orderIndex: 2, title: 'اتفاقية سايكس بيكو والانتداب ومصر وقضايا الصراع العربي الإسرائيلي وحروب فلسطين', lessonType: 'تاريخ معاصر' },
          { orderIndex: 3, title: 'نصر أكتوبر 1973 المجيد، وثورة 25 يناير 2011م وثورة 30 يونيه 2013م', lessonType: 'تاريخ معاصر' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الفصل الأول: الحملة الفرنسية على مصر والشام (أحوال المجتمع المصري، نزول الحملة، المقاومة الشعبية، أثر الوجود الفرنسي).' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'الفصل الثاني: بناء الدولة الحديثة في مصر من نزول الحملة حتى توطيد سلطة محمد علي وتطبيق نظام الاحتكار.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'مظاهر بناء الدولة في عهد محمد علي (الجيش والأسطول والتعليم والسياسة الخارجية) وانهيار الاحتكار وخلفاء محمد علي.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الفصل الثالث: الثورة العرابية والاحتلال الإنجليزي والحركة الوطنية. الفصل الرابع: ثورة 1919 والوفد وتصريح 28 فبراير.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الفصل الخامس: التوسع الاستعماري في البلاد العربية: إنجلترا في الخليج، فرنسا في الجزائر وتونس ومراكش، إيطاليا في ليبيا.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الفصل السادس: التوسع الاستعماري بعد الحرب العالمية الأولى، اتفاقية سايكس بيكو، مؤتمر سان ريمو والانتداب على العراق والشام.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الفصل السابع: مصر وقضايا العالم العربي، القضية الفلسطينية والحروب العربية الإسرائيلية (1948، 1956، 1967، ونصر أكتوبر 1973).' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'الفصل الثامن: ثورة 25 يناير 2011م وثورة 30 يونيه 2013م، ومراجعة عامة شاملة ونماذج امتحانات الشهادة الثانوية.' }
    ]
  },

  {
    subjectCode: 'GOV-LIT-GEOGRAPHY',
    code: 'AZH-12-GEOGRAPHY',
    title: 'الجغرافيا السياسية (الثالث الثانوي أدبي - أزهري)',
    slug: 'azh-12-geography',
    academicBranch: 'literary',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'الجغرافيا السياسية والمنظومة الدولية للصف الثالث الثانوي الأدبي الأزهري',
    textbook: {
      title: 'الجغرافيا السياسية (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=1Krn0nyfrBeU9T9CG-IlQudGwLsD-I1LL',
      totalPages: 190,
    },
    units: [
      {
        orderIndex: 1,
        title: 'الفصل الدراسي الأول: مدخل الجغرافيا السياسية، الدولة ومقوماتها، وجغرافية الحدود',
        lessons: [
          { orderIndex: 1, title: 'المدخل لدراسة الجغرافيا السياسية والدولة تعريفها وأنواعها والعاصمة', lessonType: 'جغرافيا سياسية' },
          { orderIndex: 2, title: 'المقومات الطبيعية والبشرية لقوة الدولة والنظام السياسي والانتخابي', lessonType: 'جغرافيا سياسية' },
          { orderIndex: 3, title: 'الحدود السياسية: مفهومها ووظائفها وأنواعها وتطور الخريطة السياسية', lessonType: 'جغرافيا سياسية' },
        ]
      },
      {
        orderIndex: 2,
        title: 'الفصل الدراسي الثاني: المشكلات السياسية، التكتلات الاقتصادية، والأحلاف العسكرية والعلاقات الدولية',
        lessons: [
          { orderIndex: 1, title: 'المشكلات السياسية والاقتصادية والاجتماعية ذات البعد السياسي (الأقليات والهجرة)', lessonType: 'جغرافيا سياسية' },
          { orderIndex: 2, title: 'التكتلات الاقتصادية الكبرى (الاتحاد الأوروبي ومجلس التعاون) والأحلاف العسكرية (الناتو)', lessonType: 'جغرافيا سياسية' },
          { orderIndex: 3, title: 'العلاقات الدولية والنظام الدولي الجديد وآثاره الجيوسياسية', lessonType: 'جغرافيا سياسية' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الدرس التمهيدي: مدخل لدراسة الجغرافيا السياسية. الوحدة الأولى: الدولة في الجغرافيا السياسية، أنواع الدول والعاصمة.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'المقومات الطبيعية لقوة الدولة (الموقع والمساحة والتضاريس والمناخ والنبات الطبيعي).' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'المقومات البشرية لقوة الدولة، النظام السياسي والانتخابي بالدولة، والوحدة الثانية: جغرافية الحدود السياسية ووظائفها.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'أنواع الحدود السياسية، تطور الخريطة السياسية للعالم المعاصر، والمشكلات الاقتصادية (المياه والطاقة).' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'مشكلات اجتماعية ذات بعد سياسي (الأقليات ومشكلات الهجرة الشرعية وغير الشرعية). والوحدة الثالثة: التكتلات الاقتصادية.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الأحلاف العسكرية وتطورها (حلف الناتو وحلف وارسو وأسباب تفككه). والوحدة الرابعة: العلاقات الدولية وتطورها التاريخي.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'النظام الدولي الجديد: خصائصه ومراحله والمؤسسات الدولية المؤثرة وأثره على دول العالم النامي والمتقدم.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية وتطبيقات تحليل الخرائط الجغرافية والسياسية ونماذج الامتحانات الرسمية.' }
    ]
  },

  // ==========================================
  // 6. ENGLISH & REVELATION (اللغة الإنجليزية)
  // ==========================================
  {
    subjectCode: 'GOV-SCI-ENGLISH',
    code: 'AZH-12-ENGLISH',
    title: 'اللغة الإنجليزية ومضة من الوحي (الثالث الثانوي - أزهري)',
    slug: 'azh-12-english',
    academicBranch: 'scientific',
    gradeLevel: 'grade_12',
    academicYear: '2025-2026',
    description: 'منهاج اللغة الإنجليزية وكتاب ومضة من الوحي A Glimpse of Revelation للصف الثالث الثانوي الأزهري',
    textbook: {
      title: 'A Glimpse of Revelation III (الصف الثالث الثانوي الأزهري)',
      pdfUrl: 'https://drive.google.com/uc?export=download&id=18Zj1XW7eG5ZpD6xsFh3o6hBO9d_hGRt4',
      totalPages: 150,
    },
    units: [
      {
        orderIndex: 1,
        title: 'First Term: New Hello Units 1-6 & A Glimpse of Revelation Units 1-3',
        lessons: [
          { orderIndex: 1, title: 'New Hello Units 1-2 & Revelation Unit 1: Prophetic Guidance & Morals', lessonType: 'English & Islamic Reader' },
          { orderIndex: 2, title: 'New Hello Unit 3 + Rev. 1 & Revelation Unit 2: Islamic Civilization', lessonType: 'English & Islamic Reader' },
          { orderIndex: 3, title: 'New Hello Units 4-5 & Revelation Unit 3: Human Values and Tolerance', lessonType: 'English & Islamic Reader' },
          { orderIndex: 4, title: 'New Hello Unit 6 + Rev. 2: Grammar Revision & Mid-Year Exam Prep', lessonType: 'English & Islamic Reader' },
        ]
      },
      {
        orderIndex: 2,
        title: 'Second Term: New Hello Units 7-12 & A Glimpse of Revelation Units 4-6',
        lessons: [
          { orderIndex: 1, title: 'New Hello Units 7-8 & Revelation Unit 4: Global Dialogue and Knowledge', lessonType: 'English & Islamic Reader' },
          { orderIndex: 2, title: 'New Hello Units 9-10 & Revelation Unit 5: Environmental Stewardship in Islam', lessonType: 'English & Islamic Reader' },
          { orderIndex: 3, title: 'New Hello Units 11-12 & Revelation Unit 6: Synthesis and Translation', lessonType: 'English & Islamic Reader' },
        ]
      }
    ],
    syllabus: [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'New Hello English: Unit 1 (Cultural heritage) & Unit 2 (Life skills). A Glimpse of Revelation: Unit 1 (Prophetic Guidance and Ethical conduct).' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'New Hello: Unit 2 practice & Grammar focus. Revelation: Unit 1 vocabulary, comprehension passages, and Islamic terminology in English.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'New Hello English: Unit 3 & Revision 1. A Glimpse of Revelation: Unit 2 (The Splendors of Islamic Civilization and Scientific Contributions).' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'New Hello English: Units 4-5. A Glimpse of Revelation: Unit 3 (Tolerance, Peace and Universal Human Values in Islam) & Essay writing.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'New Hello English: Units 7-8. A Glimpse of Revelation: Unit 4 (Dialogue and Cross-Cultural Understanding), advanced grammar.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'New Hello English: Unit 9 & Revision 3. A Glimpse of Revelation: Unit 5 (Environmental Balance and Ecological Ethics in Quran).' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'New Hello English: Units 10-11 & Unit 12. A Glimpse of Revelation: Unit 6 & Advanced Islamic Translation and summary writing.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'Comprehensive Final Revision covering language, structure, reading comprehension, Revelation reader, and past Al-Azhar exams.' }
    ]
  }
];

// Grade 11 Textbooks to link as well
const GRADE_11_TEXTBOOKS = [
  { courseCode: 'AZH-SCI-CHEM-11', pdfId: '1NKhwdMyCBCOPeLW__PaIaH6XJ5y17aNJ', title: 'الكيمياء (الصف الثاني الثانوي الأزهري)' },
  { courseCode: 'ENG-G11-AZH', pdfId: '1BQhLxvbcA1KZ7FEe0wpi_qaXY5gT9maz', title: 'English Language 2nd Secondary Al-Azhar' },
  { courseCode: 'AZH-SCI-ARABIC-11', pdfId: '1oeZihGXNTQljPa4mEmZERldLqnjpQyiG', title: 'النحو والصرف (الصف الثاني الثانوي الأزهري)' },
];

async function main() {
  console.log('🚀 Starting Comprehensive Azhari Curriculum Seeding...');

  // Map of subject codes to subject records
  const subjects = await prisma.subject.findMany();
  const subjectMap = new Map();
  subjects.forEach(s => subjectMap.set(s.code, s));

  console.log(`Found ${subjects.length} existing subjects in DB.`);

  let createdCourses = 0;
  let updatedCourses = 0;
  let createdTextbooks = 0;
  let createdDists = 0;
  let createdUnits = 0;
  let createdLessons = 0;

  for (const item of AZHARI_DATA) {
    const subject = subjectMap.get(item.subjectCode);
    if (!subject) {
      console.warn(`⚠️ Subject code not found: ${item.subjectCode}`);
      continue;
    }

    // 1. Find or create Course
    let course = await prisma.course.findUnique({
      where: { code: item.code },
      include: { versions: true, distributions: true, textbooks: true }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          code: item.code,
          title: item.title,
          slug: item.slug,
          subjectId: subject.id,
          academicBranch: item.academicBranch,
          gradeLevel: item.gradeLevel,
          curriculumType: 'azhari',
          academicYear: item.academicYear,
          description: item.description,
          isActive: true
        },
        include: { versions: true, distributions: true, textbooks: true }
      });
      createdCourses++;
      console.log(`✨ Created course: [${course.code}] ${course.title}`);
    } else {
      course = await prisma.course.update({
        where: { id: course.id },
        data: {
          title: item.title,
          description: item.description,
          curriculumType: 'azhari',
          academicYear: item.academicYear,
          isActive: true
        },
        include: { versions: true, distributions: true, textbooks: true }
      });
      updatedCourses++;
      console.log(`🔄 Updated course: [${course.code}] ${course.title}`);
    }

    // 2. Textbook
    if (item.textbook) {
      const existingTb = await prisma.textbook.findFirst({
        where: { courseId: course.id }
      });

      if (!existingTb) {
        await prisma.textbook.create({
          data: {
            courseId: course.id,
            title: item.textbook.title,
            author: 'قطاع المعاهد الأزهرية - جمهورية مصر العربية',
            publicationYear: 2025,
            pdfUrl: item.textbook.pdfUrl,
            totalPages: item.textbook.totalPages || 120,
            isActive: true
          }
        });
        createdTextbooks++;
      } else {
        await prisma.textbook.update({
          where: { id: existingTb.id },
          data: {
            title: item.textbook.title,
            pdfUrl: item.textbook.pdfUrl,
            isActive: true
          }
        });
      }
    }

    // 3. Curriculum Version & Units/Lessons
    let version = course.versions?.[0];
    if (!version) {
      version = await prisma.curriculumVersion.create({
        data: {
          courseId: course.id,
          versionTag: 'v2025-2026',
          status: 'published',
          isDefault: true,
          changelog: 'Official 2025/2026 Al-Azhar Curriculum Distribution'
        }
      });
    }

    // Units and Lessons
    if (item.units && item.units.length > 0) {
      // Clear old units for this version to refresh with complete structure
      await prisma.curriculumUnit.deleteMany({
        where: { curriculumVersionId: version.id }
      });

      for (const u of item.units) {
        const unit = await prisma.curriculumUnit.create({
          data: {
            curriculumVersionId: version.id,
            orderIndex: u.orderIndex,
            title: u.title
          }
        });
        createdUnits++;

        for (const l of u.lessons) {
          const lesson = await prisma.curriculumLesson.create({
            data: {
              unitId: unit.id,
              orderIndex: l.orderIndex,
              title: l.title,
              lessonType: l.lessonType || 'درس منهجي',
              domain: 'المنهاج الأزهري المعتمد',
              learningObjectives: [`فهم واستيعاب مباحث ${l.title}`, 'تطبيق القواعد والتمارين وحل تدريبات الامتحانات']
            }
          });
          createdLessons++;

          // Sample assessment question
          await prisma.questionTemplate.create({
            data: {
              curriculumLessonId: lesson.id,
              type: 'multiple_choice',
              content: `سؤال تقويمي نموذجي مستخرج من مقرر: ${l.title}`,
              options: ['الخيار الصحيح الأول', 'خيار بديل 1', 'خيار بديل 2', 'خيار بديل 3'],
              correctAnswer: 'الخيار الصحيح الأول',
              difficulty: 1
            }
          });
        }
      }
    }

    // 4. Syllabus Distribution (2025-2026)
    if (item.syllabus && item.syllabus.length > 0) {
      let dist = await prisma.syllabusDistribution.findUnique({
        where: {
          courseId_academicYear: {
            courseId: course.id,
            academicYear: '2025-2026'
          }
        }
      });

      if (!dist) {
        dist = await prisma.syllabusDistribution.create({
          data: {
            courseId: course.id,
            academicYear: '2025-2026',
            status: 'published'
          }
        });
        createdDists++;
      }

      // Refresh months
      await prisma.syllabusMonth.deleteMany({
        where: { distributionId: dist.id }
      });

      for (const m of item.syllabus) {
        await prisma.syllabusMonth.create({
          data: {
            distributionId: dist.id,
            semester: m.semester,
            monthIndex: m.monthIndex,
            monthNameAr: m.monthNameAr,
            topics: m.topics,
            isExamPeriod: m.monthNameAr.includes('مايو') || m.monthNameAr.includes('يناير')
          }
        });
      }
    }
  }

  // Link Grade 11 Textbooks
  for (const g11 of GRADE_11_TEXTBOOKS) {
    const course = await prisma.course.findUnique({ where: { code: g11.courseCode } });
    if (course) {
      const existing = await prisma.textbook.findFirst({ where: { courseId: course.id } });
      const pdfUrl = `https://drive.google.com/uc?export=download&id=${g11.pdfId}`;
      if (!existing) {
        await prisma.textbook.create({
          data: {
            courseId: course.id,
            title: g11.title,
            pdfUrl,
            author: 'قطاع المعاهد الأزهرية',
            publicationYear: 2025
          }
        });
      } else {
        await prisma.textbook.update({
          where: { id: existing.id },
          data: { pdfUrl, title: g11.title }
        });
      }
      console.log(`Linked Grade 11 textbook for: ${g11.courseCode}`);
    }
  }

  // Update Chemistry G12 Azhari with textbook & distribution
  const azhChem12 = await prisma.course.findUnique({ where: { code: 'AZH-SCI-CHEM-12' } });
  if (azhChem12) {
    const existing = await prisma.textbook.findFirst({ where: { courseId: azhChem12.id } });
    const chemPdfUrl = 'https://drive.google.com/uc?export=download&id=11GF6s7OWqBc_KdXFr1I77N4G8IZPryyL';
    if (!existing) {
      await prisma.textbook.create({
        data: {
          courseId: azhChem12.id,
          title: 'الكيمياء (الصف الثالث الثانوي الأزهري)',
          pdfUrl: chemPdfUrl,
          author: 'قطاع المعاهد الأزهرية',
          publicationYear: 2025
        }
      });
    } else {
      await prisma.textbook.update({
        where: { id: existing.id },
        data: { pdfUrl: chemPdfUrl, title: 'الكيمياء (الصف الثالث الثانوي الأزهري)' }
      });
    }

    // Chemistry distribution
    let chemDist = await prisma.syllabusDistribution.findUnique({
      where: { courseId_academicYear: { courseId: azhChem12.id, academicYear: '2025-2026' } }
    });
    if (!chemDist) {
      chemDist = await prisma.syllabusDistribution.create({
        data: { courseId: azhChem12.id, academicYear: '2025-2026', status: 'published' }
      });
    }
    await prisma.syllabusMonth.deleteMany({ where: { distributionId: chemDist.id } });
    const chemMonths = [
      { semester: 1, monthIndex: 1, monthNameAr: 'سبتمبر', topics: 'الباب الأول: العناصر الانتقالية، الخصائص العامة لعناصر السلسلة الانتقالية الأولى وحالات التأكسد.' },
      { semester: 1, monthIndex: 2, monthNameAr: 'أكتوبر', topics: 'فلز الحديد، خاماته وتجهيزها واستخلاصه في الفرن العالي وفرن مدركس، سبائك الحديد وأكاسيده.' },
      { semester: 1, monthIndex: 3, monthNameAr: 'نوفمبر', topics: 'الباب الثاني: التحليل الكيميائي الوصفي، الكشف عن الأنيونات والكاتيونات، والتحليل الحجمي والمعايرة.' },
      { semester: 1, monthIndex: 4, monthNameAr: 'ديسمبر', topics: 'الباب الثالث: الاتزان الكيميائي وقاعدة لوشاتيليه، الاتزان الأيوني وحاصل الإذابة وتطبيقاته.' },
      { semester: 2, monthIndex: 1, monthNameAr: 'فبراير', topics: 'الباب الرابع: الكيمياء الكهربية، الخلايا الجلفانية، قطب الهيدروجين القياسي، ومتسلسلة الجهود وتآكل المعادن.' },
      { semester: 2, monthIndex: 2, monthNameAr: 'مارس', topics: 'الخلايا الإلكتروليتية، قوانين فاراداي في التحليل الكهربي، وبداية الباب الخامس: الهيدروكربونات الأليفاتية والألكانات والألكينات.' },
      { semester: 2, monthIndex: 3, monthNameAr: 'إبريل', topics: 'الهيدروكربونات الحلقية والبنزين العطري، ومشتقات الهيدروكربونات: الكحولات والفينولات والأحماض والإسترات.' },
      { semester: 2, monthIndex: 4, monthNameAr: 'مايو', topics: 'مراجعة نهائية شاملة لمنهاج الكيمياء الأزهري وحل نماذج الامتحانات العامة.' }
    ];
    for (const cm of chemMonths) {
      await prisma.syllabusMonth.create({
        data: {
          distributionId: chemDist.id,
          semester: cm.semester,
          monthIndex: cm.monthIndex,
          monthNameAr: cm.monthNameAr,
          topics: cm.topics,
          isExamPeriod: cm.monthNameAr === 'مايو'
        }
      });
    }
    console.log('Updated Chemistry G12 Azhari with textbook and 2025/2026 distribution.');
  }

  console.log(`\n🎉 SUMMARY:`);
  console.log(`- Created Courses: ${createdCourses}`);
  console.log(`- Updated Courses: ${updatedCourses}`);
  console.log(`- Created/Updated Textbooks: ${createdTextbooks}`);
  console.log(`- Created Distributions: ${createdDists}`);
  console.log(`- Created Units: ${createdUnits}`);
  console.log(`- Created Lessons: ${createdLessons}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
