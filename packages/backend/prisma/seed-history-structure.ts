import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HISTORY_STRUCTURE = {
  subject: {
    code: 'HIST12',
    nameAr: 'الدراسات التاريخية',
    nameEn: 'Historical Studies',
    description: 'كتاب الدراسات التاريخية للصف الثاني عشر',
  },
  course: {
    code: 'HIST12-ACAD',
    title: 'الدراسات التاريخية 12',
    slug: 'historical-studies-12',
    academicBranch: 'literary', // تاريخ عادة للفرع الأدبي
    gradeLevel: 'grade_12',
  },
  units: [
    {
      orderIndex: 1,
      title: 'الوحدة الأولى: فتوحات وحروب عابرة للقارات',
      lessons: [
        {
          orderIndex: 1,
          title: 'الحروب: دوافعها وأنواعها',
          lessonType: 'تاريخ - مفاهيم',
          domain: 'التاريخ العسكري',
          learningObjectives: [
            'توضيح المقصود بالحرب.',
            'بيان دوافع الحروب.',
            'تصنيف الحروب حسب أنواعها وأهدافها.',
            'تعليل صدور قوانين واتفاقيات دولية تتعلق بالحروب.'
          ],
          learningSequence: [
            { stage: 'التهيئة الحافزة', activities: ['طرح سؤال إشكالي حول مبررات الحروب وتكوين موقف أولي.'] },
            { stage: 'مفهوم الحرب', activities: ['تحليل صورة العدوان على غزة واستنتاج المفهوم.'] },
            { stage: 'دوافع الحروب', activities: ['قراءة النص وتصنيف الدوافع إلى: اقتصادية، ثقافية، دينية، وسياسية.'] },
            { stage: 'أنواع الحروب', activities: ['الاستنزاف، العصابات، الشاملة، الأهلية، والباردة.'] },
            { stage: 'أخلاقيات الحرب والقوانين الدولية', activities: ['تحليل وصية أبي بكر الصديق ومقارنتها بالقوانين الدولية (النسبية، التمييز، الإنسانية).'] }
          ]
        },
        {
          orderIndex: 2,
          title: 'الفتوحات الإسلامية',
          lessonType: 'تاريخ إسلامي',
          domain: 'الفتوحات والحضارة',
          learningObjectives: [
            'توضيح المقصود بالفتوحات الإسلامية.',
            'ذكر دوافع الفتوحات الإسلامية.',
            'تتبع سير الفتوحات الإسلامية في اتجاهاتها المختلفة.',
            'توضيح نتائج الفتوحات الإسلامية.'
          ],
          learningSequence: [
            { stage: 'التهيئة الحافزة', activities: ['مناقشة مقولة المستشرقين حول دوافع الفتوحات الإسلامية.'] },
            { stage: 'معنى الفتوح لغة واصطلاحاً', activities: ['تحليل الخريطة لاستنتاج امتداد الدولة الإسلامية.'] },
            { stage: 'دوافع الفتوحات الإسلامية', activities: ['استنتاج الدوافع الدينية، الاقتصادية، والسياسية.'] },
            { stage: 'سير الفتوحات', activities: ['فتوح الشام، العراق وبلاد فارس، ومصر وشمال إفريقيا والأندلس.'] },
            { stage: 'نتائج الفتوحات الإسلامية', activities: ['دراسة الأثر الديموغرافي والحضاري والسياسي.'] }
          ]
        },
        {
          orderIndex: 3,
          title: 'الحروب الفرنجية ١٠٩٥ - ١٢٩١م',
          lessonType: 'تاريخ وسيط',
          domain: 'الصراع بين الشرق والغرب',
          learningObjectives: [
            'تعريف المقصود بالحروب الفرنجية.',
            'توضيح دوافع الحروب الفرنجية.',
            'بيان سير أبرز الحملات الفرنجية إلى الشرق.',
            'الموازنة بين أخلاقيات القتال عند كل من الفرنجة والمسلمين.',
            'استكشاف نتائج الحروب الفرنجية.'
          ],
          learningSequence: [
            { stage: 'التهيئة الحافزة', activities: ['مناقشة الادعاءات حول البعد الديني والاقتصادي للحروب الفرنجية.'] },
            { stage: 'مفهوم حروب الفرنجة', activities: ['التعرف على المفهوم والتسميات المختلفة (صليبية، فرنجية).'] },
            { stage: 'دوافع الحروب الفرنجية', activities: ['تحليل الدوافع الاجتماعية (الفقر) والدينية والسياسية في أوروبا.'] },
            { stage: 'الحملات الفرنجية ومقاومتها', activities: ['تتبع مسار الحملات، ومعركة حطين.'] },
            { stage: 'سياسات قادة الفرنجة والمسلمين', activities: ['مقارنة قانون الفتح الفرنجي مع التسامح الإسلامي.'] },
            { stage: 'نتائج الحروب الفرنجية', activities: ['النتائج الديموغرافية، الثقافية، والاقتصادية.'] }
          ]
        },
        {
          orderIndex: 4,
          title: 'الحرب العالمية الأولى ١٩١٤ - ١٩١٨م',
          lessonType: 'تاريخ حديث معاصر',
          domain: 'الصراعات العالمية',
          learningObjectives: [
            'توضيح المقصود بالحرب العالمية الأولى.',
            'استنتاج أسباب الحرب العالمية الأولى.',
            'تتبع أبرز الأحداث الحربية خلال الحرب العالمية الأولى.',
            'توضيح نتائج الحرب العالمية الأولى.',
            'بيان أثر الحرب العالمية الأولى على الوطن العربي.'
          ],
          learningSequence: [
            { stage: 'مفهوم الحرب وأطرافها', activities: ['تحليل خريطة دول المحور ودول الحلفاء.'] },
            { stage: 'أسباب الحرب', activities: ['الأسباب المباشرة وغير المباشرة (التحالفات العسكرية).'] },
            { stage: 'مراحل الحرب', activities: ['المرحلة الأولى (حرب الخنادق) والمرحلة الثانية (دخول أمريكا).'] },
            { stage: 'نتائج الحرب', activities: ['الخسائر البشرية والتغيرات الجيوسياسية ومؤتمر فرساي.'] },
            { stage: 'الأثر على الوطن العربي', activities: ['اتفاقية سايكس بيكو والانتداب.'] }
          ]
        },
        {
          orderIndex: 5,
          title: 'الحرب العالمية الثانية ١٩٣٩ - ١٩٤٥م',
          lessonType: 'تاريخ حديث معاصر',
          domain: 'الصراعات العالمية',
          learningObjectives: [
            'توضيح المقصود بالحرب العالمية الثانية.',
            'استنتاج عوامل اندلاع الحرب العالمية الثانية.',
            'بيان المراحل التي مرت بها الحرب.',
            'توضيح نتائج الحرب وآثارها.'
          ],
          learningSequence: [
            { stage: 'التهيئة الحافزة', activities: ['مناقشة أثر معاهدة فرساي والسياسة النازية على اندلاع الحرب.'] },
            { stage: 'أطراف الحرب', activities: ['دول المحور ودول الحلفاء.'] },
            { stage: 'مراحل الحرب', activities: ['المرحلة الأولى (تقدم المحور) والثانية (التفوق للحلفاء والقنابل الذرية).'] },
            { stage: 'النتائج', activities: ['تأسيس الأمم المتحدة، الحرب الباردة، الانقسام العالمي، والخسائر.'] }
          ]
        }
      ]
    },
    {
      orderIndex: 2,
      title: 'الوحدة الثانية: ثورات شعبية',
      lessons: [
        {
          orderIndex: 1,
          title: 'الثورة',
          lessonType: 'مفاهيم سياسية واجتماعية',
          domain: 'الحركات الشعبية',
          learningObjectives: [
            'تعريف الثورة.',
            'توضيح دوافع الثورات.',
            'تصنيف الثورات إلى أنواعها مع الأمثلة.',
            'تفسير أهمية الثورة للشعوب.',
            'استنتاج عوامل نجاح الثورات أو فشلها.'
          ],
          learningSequence: [
            { stage: 'التهيئة الحافزة', activities: ['مناقشة ما إذا كانت الثورة ضرورة للخلاص أم مجرد عنف ودمار.'] },
            { stage: 'مفهوم الثورة ودوافعها', activities: ['دوافع اقتصادية، اجتماعية، وسياسية.'] },
            { stage: 'أنواع الثورات', activities: ['البيضاء، الحمراء، السلمية، الانقلابات العسكرية.'] },
            { stage: 'أهمية وعوامل النجاح', activities: ['تحرير الفكر، القيادة الموحدة، الدعم الخارجي.'] }
          ]
        },
        {
          orderIndex: 2,
          title: 'الثورة الجزائرية (١٩٥٤-١٩٦٢م)',
          lessonType: 'تاريخ عربي',
          domain: 'حركات التحرر',
          learningObjectives: [
            'تحديد موقع الجزائر على الخريطة.',
            'توضيح الظروف التي ساعدت على اندلاع الثورة.',
            'استنتاج أهداف الثورة الجزائرية.',
            'وصف أساليب الثورة ووسائلها.',
            'استنتاج عوامل نجاحها ونتائجها.'
          ],
          learningSequence: [
            { stage: 'ظروف قيام الثورة', activities: ['دور الجمعيات والأحزاب، التهميش الفرنسي، مجزرة 8 ماي.'] },
            { stage: 'أهداف وأساليب الثورة', activities: ['تأسيس جبهة التحرير الوطني، حرب العصابات، المقاومة السرية.'] },
            { stage: 'عوامل النجاح والنتائج', activities: ['تضحيات المليون شهيد، اتفاقيات إيفيان، الاستقلال.'] }
          ]
        },
        {
          orderIndex: 3,
          title: 'الانتفاضة الفلسطينية (١٩٨٧ - ١٩٩٣م)',
          lessonType: 'تاريخ فلسطيني',
          domain: 'حركات التحرر الوطني',
          learningObjectives: [
            'توضيح الظروف والأسباب في اندلاع الانتفاضة.',
            'استنتاج أهداف الانتفاضة.',
            'تصنيف أساليب الانتفاضة وأدواتها.',
            'تحليل نتائج الانتفاضة.'
          ],
          learningSequence: [
            { stage: 'الظروف والأسباب', activities: ['القبضة الحديدية، التهميش الاقتصادي، وحادثة دهس العمال (السبب المباشر).'] },
            { stage: 'أساليب وأدوات', activities: ['الحجارة، المقاطعة الاقتصادية، الإضرابات الشاملة، والعمل الدبلوماسي.'] },
            { stage: 'النتائج', activities: ['إعلان استقلال فلسطين 1988، مؤتمر مدريد وأوسلو، التأثير الاجتماعي والديموغرافي.'] }
          ]
        },
        {
          orderIndex: 4,
          title: 'الحراك العربي ٢٠١٠م (الربيع العربي)',
          lessonType: 'تاريخ معاصر',
          domain: 'التحولات السياسية',
          learningObjectives: [
            'توضيح ظروف اندلاع الحراك العربي.',
            'وصف أساليب الحراك العربي وأدواته.',
            'بيان نتائج الحراك العربي وآثاره.'
          ],
          learningSequence: [
            { stage: 'الظروف الدافعة', activities: ['الظروف الداخلية (البطالة والفساد) والخارجية (التدخلات).'] },
            { stage: 'الأساليب والأدوات', activities: ['المظاهرات السلمية، وسائل التواصل الاجتماعي (الفيسبوك)، الاعتصامات المليونية.'] },
            { stage: 'النتائج السلبية والإيجابية', activities: ['سقوط أنظمة، وفي المقابل الحروب الأهلية وانقسام المجتمعات (ليبيا، سوريا، اليمن).'] }
          ]
        }
      ]
    },
    {
      orderIndex: 3,
      title: 'الوحدة الثالثة: إمبراطوريات عابرة للقوميات',
      lessons: [
        {
          orderIndex: 1,
          title: 'النظام الإمبراطوري',
          lessonType: 'مفاهيم سياسية',
          domain: 'النظم الإمبراطورية',
          learningObjectives: [
            'توضيح المقصود بالإمبراطورية.',
            'التمييز بين الإمبراطورية والدولة.',
            'استنتاج دوافع نشوء الإمبراطوريات.',
            'تعليل تفكك الإمبراطوريات وانهيارها.'
          ],
          learningSequence: [
            { stage: 'مفهوم الإمبراطورية والفرق عن الدولة', activities: ['تحليل فكرة التوسع والسيادة على قوميات متعددة دون حدود ثابتة.'] },
            { stage: 'دوافع النشأة وعوامل السقوط', activities: ['التوسع، الموارد، وفي المقابل الإفراط في التوسع يؤدي للانهيار.'] }
          ]
        },
        {
          orderIndex: 2,
          title: 'الإمبراطورية البيزنطية',
          lessonType: 'تاريخ وسيط',
          domain: 'الإمبراطوريات التاريخية',
          learningObjectives: [
            'توضيح ظروف النشأة.',
            'وصف نظام الحكم (الأوتوقراطية).',
            'بيان دوافع التوسع.',
            'تفسير علاقتها بالقوميات وأسباب انهيارها.'
          ],
          learningSequence: [
            { stage: 'النشأة ونظام الحكم', activities: ['نقل العاصمة للقسطنطينية، والحكم الأوتوقراطي (الفردي المطلق).'] },
            { stage: 'العلاقة بالشعوب والانهيار', activities: ['الاضطهاد الديني والضرائب، ثم السقوط على يد محمد الفاتح 1453م.'] }
          ]
        },
        {
          orderIndex: 3,
          title: 'الإمبراطورية العثمانية',
          lessonType: 'تاريخ إسلامي',
          domain: 'الإمبراطوريات التاريخية',
          learningObjectives: [
            'تتبع النشأة والتشكل.',
            'وصف نظام الحكم والإدارة.',
            'استنتاج مبررات التوسع وتفسير الانهيار.'
          ],
          learningSequence: [
            { stage: 'النشأة والإدارة', activities: ['السلطان، الصدر الأعظم، شيخ الإسلام، الدفتردار.'] },
            { stage: 'التوسع', activities: ['المبررات السياسية والدينية والاقتصادية.'] },
            { stage: 'الانهيار', activities: ['ضعف السلاطين، الانكشارية، التدخل الأوروبي، الامتيازات الأجنبية.'] }
          ]
        },
        {
          orderIndex: 4,
          title: 'الإمبراطورية البريطانية',
          lessonType: 'تاريخ استعماري',
          domain: 'الإمبراطوريات الاستعمارية',
          learningObjectives: [
            'توضيح ظروف النشأة ونظام الحكم.',
            'استنتاج دوافع التوسع واستجابة الشعوب.',
            'تفسير الانهيار.'
          ],
          learningSequence: [
            { stage: 'النشأة ونظام الحكم', activities: ['الإمبراطورية التي لا تغيب عنها الشمس، الحكم المباشر وغير المباشر (الانتداب).'] },
            { stage: 'دوافع التوسع والانهيار', activities: ['الثورة الصناعية، وتفككها بعد الحروب العالمية وصعود القوميات وأمريكا.'] }
          ]
        },
        {
          orderIndex: 5,
          title: 'الهيمنة العالمية (الولايات المتحدة الأمريكية مثالاً)',
          lessonType: 'تاريخ معاصر',
          domain: 'النظام العالمي الجديد',
          learningObjectives: [
            'توضيح المقصود بالهيمنة العالمية.',
            'تحديد أشكال الهيمنة الأمريكية.',
            'توضيح المواقف الرسمية والشعبية.'
          ],
          learningSequence: [
            { stage: 'مفهوم الهيمنة', activities: ['القطبية الأحادية بعد انهيار الاتحاد السوفيتي.'] },
            { stage: 'أشكال الهيمنة', activities: ['العسكرية، السياسية، الاقتصادية، الثقافية، والتكنولوجية.'] },
            { stage: 'مواقف الشعوب', activities: ['الرفض الشعبي لحروب العراق ودعم الاحتلال الصهيوني، وظهور قوى منافسة كالصين وروسيا.'] }
          ]
        }
      ]
    }
  ]
};

async function main() {
  console.log('📖 إنشاء مقرر الدراسات التاريخية من الـ PDF...');
  
  let subject = await prisma.subject.findUnique({ where: { code: HISTORY_STRUCTURE.subject.code } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        code: HISTORY_STRUCTURE.subject.code,
        nameAr: HISTORY_STRUCTURE.subject.nameAr,
        nameEn: HISTORY_STRUCTURE.subject.nameEn,
        description: HISTORY_STRUCTURE.subject.description,
        applicableBranches: ['literary'],
      }
    });
  }

  let course = await prisma.course.findUnique({ where: { slug: HISTORY_STRUCTURE.course.slug } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId: subject.id,
        code: HISTORY_STRUCTURE.course.code,
        title: HISTORY_STRUCTURE.course.title,
        slug: HISTORY_STRUCTURE.course.slug,
        curriculumType: 'governmental',
        academicBranch: HISTORY_STRUCTURE.course.academicBranch as any,
        gradeLevel: HISTORY_STRUCTURE.course.gradeLevel as any,
        academicYear: '2023-2024',
      }
    });
  }

  let version = await prisma.curriculumVersion.findUnique({
    where: { courseId_versionTag: { courseId: course.id, versionTag: 'v1.0' } }
  });

  if (!version) {
    version = await prisma.curriculumVersion.create({
      data: {
        courseId: course.id,
        versionTag: 'v1.0',
        status: 'published',
        isDefault: true,
      }
    });
  } else {
    // Delete existing units to rebuild cleanly
    await prisma.curriculumUnit.deleteMany({ where: { curriculumVersionId: version.id } });
  }

  for (const unitData of HISTORY_STRUCTURE.units) {
    const unit = await prisma.curriculumUnit.create({
      data: {
        curriculumVersionId: version.id,
        orderIndex: unitData.orderIndex,
        title: unitData.title
      }
    });

    for (const lessonData of unitData.lessons) {
      const lesson = await prisma.curriculumLesson.create({
        data: {
          unitId: unit.id,
          orderIndex: lessonData.orderIndex,
          title: lessonData.title,
          lessonType: lessonData.lessonType,
          domain: lessonData.domain,
          learningObjectives: lessonData.learningObjectives || [],
          learningSequence: lessonData.learningSequence || []
        }
      });

      // إضافة أسئلة تجريبية عامة للدروس لتفعيل زر التوليد
      await prisma.questionTemplate.create({
        data: {
          curriculumLessonId: lesson.id,
          type: 'multiple_choice',
          content: `سؤال ذكي مستخرج من كتاب التاريخ (درس ${lessonData.title}) حول المفاهيم الأساسية.`,
          options: ['إجابة منطقية مستنتجة من الدرس', 'خيار خاطئ 1', 'خيار خاطئ 2', 'خيار خاطئ 3'],
          correctAnswer: 'إجابة منطقية مستنتجة من الدرس',
          difficulty: 2
        }
      });
    }
  }

  console.log('✅ تم الانتهاء! تم استخراج 14 درساً موزعاً على 3 وحدات مع كامل أهدافها وبنائها التعلمي!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
