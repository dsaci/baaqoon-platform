const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Compiling Unified Azhari Syllabus Distributions ---');

  // Month definition template for academic year 2025-2026
  const MONTHS = [
    { index: 1, nameAr: 'سبتمبر', semester: 1 },
    { index: 2, nameAr: 'أكتوبر', semester: 1 },
    { index: 3, nameAr: 'نوفمبر', semester: 1 },
    { index: 4, nameAr: 'ديسمبر', semester: 1 },
    { index: 5, nameAr: 'فبراير', semester: 2 },
    { index: 6, nameAr: 'مارس', semester: 2 },
    { index: 7, nameAr: 'أبريل', semester: 2 },
    { index: 8, nameAr: 'مايو', semester: 2 },
  ];

  // Helper to fetch months for a course by code
  async function getCourseMonths(courseCode) {
    const dist = await prisma.syllabusDistribution.findFirst({
      where: { course: { code: courseCode } },
      include: {
        months: {
          orderBy: { monthIndex: 'asc' },
        },
      },
    });
    const map = {};
    if (dist && dist.months) {
      dist.months.forEach(m => {
        // Find matching month by nameAr or monthIndex
        map[m.monthNameAr] = m.topics;
      });
    }
    return map;
  }

  // 1. Fetch Arabic branches
  const nahwMonths = await getCourseMonths('AZH-12-NAHW');
  const sarfMonths = await getCourseMonths('AZH-12-SARF');
  const balaghaMonths = await getCourseMonths('AZH-12-BALAGHA');
  const adabMonths = await getCourseMonths('AZH-12-ADAB');
  const motalaaMonths = await getCourseMonths('AZH-12-MOTALAA');

  // 2. Fetch Islamic branches
  const quranMonths = await getCourseMonths('AZH-12-QURAN');
  const hadithMonths = await getCourseMonths('AZH-12-HADITH');
  const tawheedMonths = await getCourseMonths('AZH-12-TAWHEED');
  const tafseerMonths = await getCourseMonths('AZH-12-TAFSEER');
  const fiqhMonths = await getCourseMonths('AZH-12-FIQH-SHAFII');
  const meerathMonths = await getCourseMonths('AZH-12-MEERATH');

  // 3. Fetch Math branches
  const pureMathMonths = await getCourseMonths('AZH-12-MATH-PURE');
  const appliedMathMonths = await getCourseMonths('AZH-12-MATH-APPLIED');

  // Get umbrella subjects
  const arabicSubject = await prisma.subject.findFirst({ where: { code: 'GOV-SCI-ARABIC-MOTALAA' } });
  const islamicSubject = await prisma.subject.findFirst({ where: { code: 'GOV-SCI-ISLAMIC' } });
  const mathSubject = await prisma.subject.findFirst({ where: { code: 'MATH-12-SC' } });

  console.log('Umbrella Subjects found:', {
    arabic: arabicSubject?.id,
    islamic: islamicSubject?.id,
    math: mathSubject?.id,
  });

  // ─── A. CREATE UNIFIED ARABIC COURSE & DISTRIBUTION ───
  console.log('Creating / Updating AZH-12-ARABIC-UNIFIED...');
  const arabicUnifiedCourse = await prisma.course.upsert({
    where: { code: 'AZH-12-ARABIC-UNIFIED' },
    update: {
      title: 'اللغة العربية وفروعها (الثالث الثانوي - أزهري)',
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل لفروع اللغة العربية: النحو، الصرف، البلاغة، الأدب والنصوص، المطالعة والإنشاء',
      isActive: true,
    },
    create: {
      code: 'AZH-12-ARABIC-UNIFIED',
      title: 'اللغة العربية وفروعها (الثالث الثانوي - أزهري)',
      slug: 'azhari-arabic-unified-grade-12',
      subjectId: arabicSubject.id,
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل لفروع اللغة العربية: النحو، الصرف، البلاغة، الأدب والنصوص، المطالعة والإنشاء',
      isActive: true,
    },
  });

  // Upsert Distribution
  const arabicDist = await prisma.syllabusDistribution.upsert({
    where: {
      courseId_academicYear: {
        courseId: arabicUnifiedCourse.id,
        academicYear: '2025-2026',
      },
    },
    update: {},
    create: {
      courseId: arabicUnifiedCourse.id,
      academicYear: '2025-2026',
    },
  });

  // Delete existing months if any and re-create combined months
  await prisma.syllabusMonth.deleteMany({
    where: { distributionId: arabicDist.id },
  });

  for (const m of MONTHS) {
    const combinedTopics = [
      nahwMonths[m.nameAr] ? `📌 النحو:\n${nahwMonths[m.nameAr]}` : null,
      sarfMonths[m.nameAr] ? `📌 الصرف:\n${sarfMonths[m.nameAr]}` : null,
      balaghaMonths[m.nameAr] ? `📌 البلاغة:\n${balaghaMonths[m.nameAr]}` : null,
      adabMonths[m.nameAr] ? `📌 الأدب والنصوص وتاريخ الأدب:\n${adabMonths[m.nameAr]}` : null,
      motalaaMonths[m.nameAr] ? `📌 المطالعة والإنشاء:\n${motalaaMonths[m.nameAr]}` : null,
    ].filter(Boolean).join('\n\n');

    await prisma.syllabusMonth.create({
      data: {
        distributionId: arabicDist.id,
        semester: m.semester,
        monthIndex: m.index,
        monthNameAr: m.nameAr,
        topics: combinedTopics || 'مراجعة عامة وتطبيقات واختبارات تجريبية شاملة',
        isExamPeriod: m.nameAr === 'ديسمبر' || m.nameAr === 'مايو',
      },
    });
  }
  console.log('✓ Unified Arabic course & distribution created successfully.');

  // ─── B. CREATE UNIFIED ISLAMIC COURSE & DISTRIBUTION ───
  console.log('Creating / Updating AZH-12-ISLAMIC-UNIFIED...');
  const islamicUnifiedCourse = await prisma.course.upsert({
    where: { code: 'AZH-12-ISLAMIC-UNIFIED' },
    update: {
      title: 'العلوم الشرعية والتربية الإسلامية (الثالث الثانوي - أزهري)',
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل للعلوم الشرعية: القرآن الكريم، التفسير، الحديث الشريف، الفقه الشافعي، الميراث، التوحيد والعقيدة',
      isActive: true,
    },
    create: {
      code: 'AZH-12-ISLAMIC-UNIFIED',
      title: 'العلوم الشرعية والتربية الإسلامية (الثالث الثانوي - أزهري)',
      slug: 'azhari-islamic-unified-grade-12',
      subjectId: islamicSubject.id,
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل للعلوم الشرعية: القرآن الكريم، التفسير، الحديث الشريف، الفقه الشافعي، الميراث، التوحيد والعقيدة',
      isActive: true,
    },
  });

  const islamicDist = await prisma.syllabusDistribution.upsert({
    where: {
      courseId_academicYear: {
        courseId: islamicUnifiedCourse.id,
        academicYear: '2025-2026',
      },
    },
    update: {},
    create: {
      courseId: islamicUnifiedCourse.id,
      academicYear: '2025-2026',
    },
  });

  await prisma.syllabusMonth.deleteMany({
    where: { distributionId: islamicDist.id },
  });

  for (const m of MONTHS) {
    const combinedTopics = [
      quranMonths[m.nameAr] ? `📖 القرآن الكريم وتجويده:\n${quranMonths[m.nameAr]}` : null,
      tafseerMonths[m.nameAr] ? `🔍 التفسير النسفي:\n${tafseerMonths[m.nameAr]}` : null,
      hadithMonths[m.nameAr] ? `📜 الحديث الشريف وعلومه:\n${hadithMonths[m.nameAr]}` : null,
      fiqhMonths[m.nameAr] ? `⚖️ الفقه الشافعي:\n${fiqhMonths[m.nameAr]}` : null,
      meerathMonths[m.nameAr] ? `⚖️ الوجيز في علم الميراث:\n${meerathMonths[m.nameAr]}` : null,
      tawheedMonths[m.nameAr] ? `🕋 التوحيد والعقيدة الإسلامية:\n${tawheedMonths[m.nameAr]}` : null,
    ].filter(Boolean).join('\n\n');

    await prisma.syllabusMonth.create({
      data: {
        distributionId: islamicDist.id,
        semester: m.semester,
        monthIndex: m.index,
        monthNameAr: m.nameAr,
        topics: combinedTopics || 'مراجعة وتطبيقات واختبارات تجريبية شاملة',
        isExamPeriod: m.nameAr === 'ديسمبر' || m.nameAr === 'مايو',
      },
    });
  }
  console.log('✓ Unified Islamic course & distribution created successfully.');

  // ─── C. CREATE UNIFIED MATH COURSE & DISTRIBUTION ───
  console.log('Creating / Updating AZH-12-MATH-UNIFIED...');
  const mathUnifiedCourse = await prisma.course.upsert({
    where: { code: 'AZH-12-MATH-UNIFIED' },
    update: {
      title: 'الرياضيات (البحتة والتطبيقية) (الثالث الثانوي علمي - أزهري)',
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل لمادة الرياضيات للفرع العلمي: الرياضيات البحتة (تفاضل، تكامل، جبر، فراغية) والرياضيات التطبيقية (استاتيكا، ديناميكا)',
      isActive: true,
    },
    create: {
      code: 'AZH-12-MATH-UNIFIED',
      title: 'الرياضيات (البحتة والتطبيقية) (الثالث الثانوي علمي - أزهري)',
      slug: 'azhari-math-unified-grade-12',
      subjectId: mathSubject.id,
      curriculumType: 'azhari',
      academicBranch: 'scientific',
      gradeLevel: 'grade_12',
      academicYear: '2025-2026',
      description: 'المنهاج الأزهري الشامل لمادة الرياضيات للفرع العلمي: الرياضيات البحتة (تفاضل، تكامل، جبر، فراغية) والرياضيات التطبيقية (استاتيكا، ديناميكا)',
      isActive: true,
    },
  });

  const mathDist = await prisma.syllabusDistribution.upsert({
    where: {
      courseId_academicYear: {
        courseId: mathUnifiedCourse.id,
        academicYear: '2025-2026',
      },
    },
    update: {},
    create: {
      courseId: mathUnifiedCourse.id,
      academicYear: '2025-2026',
    },
  });

  await prisma.syllabusMonth.deleteMany({
    where: { distributionId: mathDist.id },
  });

  for (const m of MONTHS) {
    const combinedTopics = [
      pureMathMonths[m.nameAr] ? `📐 الرياضيات البحتة (تفاضل وتكامل / جبر وهندسة فراغية):\n${pureMathMonths[m.nameAr]}` : null,
      appliedMathMonths[m.nameAr] ? `⚙️ الرياضيات التطبيقية (استاتيكا / ديناميكا):\n${appliedMathMonths[m.nameAr]}` : null,
    ].filter(Boolean).join('\n\n');

    await prisma.syllabusMonth.create({
      data: {
        distributionId: mathDist.id,
        semester: m.semester,
        monthIndex: m.index,
        monthNameAr: m.nameAr,
        topics: combinedTopics || 'مراجعة وتطبيقات وحل امتحانات سابقة',
        isExamPeriod: m.nameAr === 'ديسمبر' || m.nameAr === 'مايو',
      },
    });
  }
  console.log('✓ Unified Math course & distribution created successfully.');

  console.log('--- ALL UNIFIED DISTRIBUTIONS CREATED SUCCESSFULLY ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
