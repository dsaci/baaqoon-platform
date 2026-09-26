import { PrismaClient, AcademicBranch, CurriculumType } from '@prisma/client';

const prisma = new PrismaClient();

const MOE_BASE = 'https://moe.edu.ps/storage/app/class12';

async function main() {
  console.log('🌱 بدء إدخال المنهاج الفلسطيني الرسمي...');

  // ===================================================================
  // كتب الفرع العلمي
  // ===================================================================
  const scientificBooks = [
    {
      code: 'GOV-SCI-ARABIC-MOTALAA',
      nameAr: 'المطالعة والأدب والنقد',
      nameEn: 'Arabic Literature & Reading',
      downloadUrl: `${MOE_BASE}/ArabicMotalaa12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-ISLAMIC',
      nameAr: 'التربية الإسلامية',
      nameEn: 'Islamic Education',
      downloadUrl: `${MOE_BASE}/Islamic12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-ENGLISH',
      nameAr: 'اللغة الإنجليزية',
      nameEn: 'English Language',
      downloadUrl: `${MOE_BASE}/Puplis%20Book12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-MATH',
      nameAr: 'الرياضيات (علمي)',
      nameEn: 'Mathematics (Scientific)',
      downloadUrl: `${MOE_BASE}/MathElmi12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-PHYSICS',
      nameAr: 'الفيزياء',
      nameEn: 'Physics',
      downloadUrl: `${MOE_BASE}/Physics12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-CHEMISTRY',
      nameAr: 'الكيمياء',
      nameEn: 'Chemistry',
      downloadUrl: `${MOE_BASE}/Chemistry12%202025%20Tawjihi%20Elmi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-IT',
      nameAr: 'تكنولوجيا المعلومات (علمي)',
      nameEn: 'Information Technology (Scientific)',
      downloadUrl: `${MOE_BASE}/IT%2012%20elmeBook%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
    {
      code: 'GOV-SCI-BIOLOGY',
      nameAr: 'العلوم الحياتية (الأحياء)',
      nameEn: 'Biology',
      downloadUrl: `${MOE_BASE}/Biology12%202025%20Tawjihi%20Elmi.pdf`,
      applicableBranches: [AcademicBranch.scientific],
    },
  ];

  // ===================================================================
  // كتب الفرع الأدبي
  // ===================================================================
  const literaryBooks = [
    {
      code: 'GOV-LIT-ARABIC-MOTALAA',
      nameAr: 'المطالعة والأدب والنقد',
      nameEn: 'Arabic Literature & Reading',
      downloadUrl: `${MOE_BASE}/ArabicMotalaa12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-ARABIC-ADAB',
      nameAr: 'قواعد اللغة العربية',
      nameEn: 'Arabic Grammar',
      downloadUrl: `${MOE_BASE}/ARABICadab12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-GEOGRAPHY',
      nameAr: 'الجغرافيا',
      nameEn: 'Geography',
      downloadUrl: `${MOE_BASE}/Geography12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-HISTORY',
      nameAr: 'التاريخ',
      nameEn: 'History',
      downloadUrl: `${MOE_BASE}/History12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-IT',
      nameAr: 'تكنولوجيا المعلومات (أدبي)',
      nameEn: 'Information Technology (Literary)',
      downloadUrl: `${MOE_BASE}/IT%20Adabi12Book%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-ISLAMIC',
      nameAr: 'التربية الإسلامية',
      nameEn: 'Islamic Education',
      downloadUrl: `${MOE_BASE}/Islamic12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-MATH',
      nameAr: 'الرياضيات (أدبي)',
      nameEn: 'Mathematics (Literary)',
      downloadUrl: `${MOE_BASE}/Math12Adabi%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-ENGLISH',
      nameAr: 'اللغة الإنجليزية',
      nameEn: 'English Language',
      downloadUrl: `${MOE_BASE}/Puplis%20Book12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-READING-PLUS',
      nameAr: 'القراءة الإضافية',
      nameEn: 'Reading Plus',
      downloadUrl: `${MOE_BASE}/Reading%20Plus12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
    {
      code: 'GOV-LIT-THAQAFEH',
      nameAr: 'الثقافة العلمية',
      nameEn: 'Scientific Culture',
      downloadUrl: `${MOE_BASE}/Thaqafeh12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.literary],
    },
  ];

  // ===================================================================
  // كتب فرع الريادة والأعمال
  // ===================================================================
  const entrepreneurshipBooks = [
    {
      code: 'GOV-ENT-ARABIC-MOTALAA',
      nameAr: 'المطالعة والأدب والنقد',
      nameEn: 'Arabic Literature & Reading',
      downloadUrl: `${MOE_BASE}/ArabicMotalaa12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.entrepreneurship],
    },
    {
      code: 'GOV-ENT-ISLAMIC',
      nameAr: 'التربية الإسلامية',
      nameEn: 'Islamic Education',
      downloadUrl: `${MOE_BASE}/Islamic12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.entrepreneurship],
    },
    {
      code: 'GOV-ENT-IT',
      nameAr: 'تكنولوجيا المعلومات',
      nameEn: 'Information Technology',
      downloadUrl: `${MOE_BASE}/IT%20Adabi12Book%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.entrepreneurship],
    },
  ];

  // ===================================================================
  // كتب الفرع الصناعي
  // ===================================================================
  const industrialBooks = [
    {
      code: 'GOV-IND-ISLAMIC',
      nameAr: 'التربية الإسلامية',
      nameEn: 'Islamic Education',
      downloadUrl: `${MOE_BASE}/Islamic12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.industrial],
    },
  ];

  // ===================================================================
  // كتب الفرع الشرعي
  // ===================================================================
  const shariaBooks = [
    {
      code: 'GOV-SHA-ARABIC-MOTALAA',
      nameAr: 'المطالعة والأدب والنقد',
      nameEn: 'Arabic Literature & Reading',
      downloadUrl: `${MOE_BASE}/ArabicMotalaa12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.sharia],
    },
    {
      code: 'GOV-SHA-ARABIC-ADAB',
      nameAr: 'قواعد اللغة العربية',
      nameEn: 'Arabic Grammar',
      downloadUrl: `${MOE_BASE}/ARABICadab12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.sharia],
    },
    {
      code: 'GOV-SHA-IT',
      nameAr: 'تكنولوجيا المعلومات',
      nameEn: 'Information Technology',
      downloadUrl: `${MOE_BASE}/IT%20Adabi12Book%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.sharia],
    },
    {
      code: 'GOV-SHA-HISTORY',
      nameAr: 'التاريخ',
      nameEn: 'History',
      downloadUrl: `${MOE_BASE}/History12%202025%20Tawjihi.pdf`,
      applicableBranches: [AcademicBranch.sharia],
    },
  ];

  const allBooks = [
    ...scientificBooks,
    ...literaryBooks,
    ...entrepreneurshipBooks,
    ...industrialBooks,
    ...shariaBooks,
  ];

  for (const book of allBooks) {
    await prisma.subject.upsert({
      where: { code: book.code },
      update: {
        nameAr: book.nameAr,
        nameEn: book.nameEn,
        iconUrl: book.downloadUrl,
        applicableBranches: book.applicableBranches,
      },
      create: {
        code: book.code,
        nameAr: book.nameAr,
        nameEn: book.nameEn,
        iconUrl: book.downloadUrl,
        curriculumType: CurriculumType.governmental,
        applicableBranches: book.applicableBranches,
      },
    });
  }

  console.log(`✅ تم إدخال ${allBooks.length} كتاباً بنجاح من موقع وزارة التربية والتعليم الفلسطينية!`);
  console.log('📚 الفروع: العلمي، الأدبي، الريادة والأعمال، الصناعي، الشرعي');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
