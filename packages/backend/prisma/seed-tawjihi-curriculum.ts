import { PrismaClient, AcademicBranch } from '@prisma/client';

const prisma = new PrismaClient();

const SUBJECTS_DATA = [
  {
    nameAr: 'الفيزياء',
    nameEn: 'Physics',
    code: 'PHYS-12',
    iconUrl: 'https://moe.edu.ps/storage/app/class12/physics.pdf',
    branches: ['scientific', 'industrial'] as AcademicBranch[],
    units: [
      {
        title: 'الوحدة الأولى: الميكانيكا',
        lessons: [
          { title: 'الزخم الخطي والدفع', questions: [
            { content: 'ما وحدة قياس الزخم الخطي؟', options: ['كغ.م/ث', 'نيوتن.ث', 'جول', 'كغ.م/ث^2'], correctAnswer: 'كغ.م/ث' },
            { content: 'إذا تضاعفت سرعة جسم، فإن زخمه الخطي:', options: ['يتضاعف', 'يقل للنصف', 'يبقى ثابتاً', 'يتضاعف 4 مرات'], correctAnswer: 'يتضاعف' }
          ]},
          { title: 'التصادمات', questions: [
            { content: 'في التصادم المرن، أي الكميات التالية محفوظة؟', options: ['الزخم والطاقة الحركية', 'الزخم فقط', 'الطاقة الحركية فقط', 'لا الزخم ولا الطاقة'], correctAnswer: 'الزخم والطاقة الحركية' }
          ]}
        ]
      },
      {
        title: 'الوحدة الثانية: الكهرباء المتحركة',
        lessons: [
          { title: 'التيار والمقاومة', questions: [
            { content: 'ما وحدة قياس المقاومة الكهربائية؟', options: ['أوم', 'فولت', 'أمبير', 'واط'], correctAnswer: 'أوم' }
          ]}
        ]
      }
    ]
  },
  {
    nameAr: 'الرياضيات',
    nameEn: 'Mathematics',
    code: 'MATH-12',
    iconUrl: 'https://moe.edu.ps/storage/app/class12/math-sc.pdf',
    branches: ['scientific'] as AcademicBranch[],
    units: [
      {
        title: 'الوحدة الأولى: التفاضل والتكامل',
        lessons: [
          { title: 'النهايات والاتصال', questions: [
            { content: 'إذا كانت نهاية الدالة موجودة وقيمتها تساوي قيمة الدالة عند النقطة، فإن الدالة:', options: ['متصلة', 'غير متصلة', 'غير معرفة', 'متباينة'], correctAnswer: 'متصلة' }
          ]},
          { title: 'قواعد الاشتقاق', questions: [
            { content: 'مشتقة الدالة الثابتة تساوي:', options: ['صفر', 'واحد', 'الدالة نفسها', 'سالب واحد'], correctAnswer: 'صفر' }
          ]}
        ]
      }
    ]
  },
  {
    nameAr: 'اللغة العربية',
    nameEn: 'Arabic',
    code: 'ARAB-12',
    iconUrl: 'https://moe.edu.ps/storage/app/class12/arabic.pdf',
    branches: ['scientific', 'literary', 'entrepreneurship'] as AcademicBranch[],
    units: [
      {
        title: 'الوحدة الأولى: المطالعة والأدب',
        lessons: [
          { title: 'القدس بوصلة المجد', questions: [
            { content: 'من هو كاتب نص القدس بوصلة المجد؟', options: ['محمود درويش', 'سميح القاسم', 'إبراهيم طوقان', 'كاتب غير معروف'], correctAnswer: 'كاتب غير معروف' } // Dummy
          ]}
        ]
      }
    ]
  },
  {
    nameAr: 'الكيمياء',
    nameEn: 'Chemistry',
    code: 'CHEM-12',
    iconUrl: 'https://moe.edu.ps/storage/app/class12/chem.pdf',
    branches: ['scientific'] as AcademicBranch[],
    units: [
      {
        title: 'الوحدة الأولى: الحموض والقواعد',
        lessons: [
          { title: 'مفهوم برونستد-لوري', questions: [
            { content: 'الحمض حسب برونستد-لوري هو مادة قادرة على:', options: ['منح بروتون', 'استقبال بروتون', 'منح إلكترون', 'استقبال إلكترون'], correctAnswer: 'منح بروتون' }
          ]}
        ]
      }
    ]
  }
];

async function main() {
  console.log('🌱 البدأ في حقن المناهج (Seed Tawjihi Curriculum)...');

  // تنظيف البيانات السابقة لتجنب التكرار
  await prisma.subject.deleteMany({ where: { code: { in: SUBJECTS_DATA.map(s => s.code) } } });

  for (const subjectData of SUBJECTS_DATA) {
    console.log(`جارٍ إنشاء مادة: ${subjectData.nameAr}`);
    
    const subject = await prisma.subject.create({
      data: {
        code: subjectData.code,
        nameAr: subjectData.nameAr,
        nameEn: subjectData.nameEn,
        iconUrl: subjectData.iconUrl,
        curriculumType: 'governmental',
        applicableBranches: subjectData.branches
      }
    });

    for (const branch of subjectData.branches) {
      const course = await prisma.course.create({
        data: {
          subjectId: subject.id,
          code: `${subjectData.code}-${branch.substring(0,2).toUpperCase()}`,
          title: subjectData.nameAr,
          slug: `${subjectData.code.toLowerCase()}-${branch}`,
          curriculumType: 'governmental',
          academicBranch: branch,
          gradeLevel: 'grade_12',
          academicYear: '2025'
        }
      });

      const version = await prisma.curriculumVersion.create({
        data: {
          courseId: course.id,
          versionTag: '2025-v1',
          status: 'published'
        }
      });

      let unitIndex = 1;
      for (const unitData of subjectData.units) {
        const unit = await prisma.curriculumUnit.create({
          data: {
            curriculumVersionId: version.id,
            orderIndex: unitIndex++,
            title: unitData.title
          }
        });

        let lessonIndex = 1;
        for (const lessonData of unitData.lessons) {
          const lesson = await prisma.curriculumLesson.create({
            data: {
              unitId: unit.id,
              orderIndex: lessonIndex++,
              title: lessonData.title
            }
          });

          // Insert questions
          for (const q of lessonData.questions) {
            await prisma.questionTemplate.create({
              data: {
                curriculumLessonId: lesson.id,
                type: 'multiple_choice',
                content: q.content,
                options: q.options,
                correctAnswer: q.correctAnswer,
                difficulty: 1
              }
            });
          }
        }
      }
    }
  }

  console.log('✅ تم الانتهاء من حقن جميع الكتب، الوحدات، الدروس، وقوالب التوليد بنجاح!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
