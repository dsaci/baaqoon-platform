import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  Eye, 
  Maximize2, 
  Sparkles, 
  Layers, 
  GraduationCap, 
  UserCheck, 
  Shield, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  Calendar, 
  Video, 
  FileText, 
  Clock, 
  Users, 
  Compass, 
  Info,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type GuideRole = 'student' | 'teacher' | 'supervisor' | 'overview';

interface VisualGuidesViewerProps {
  initialRole?: GuideRole;
  onNavigateToTour?: () => void;
  compact?: boolean;
}

export default function VisualGuidesViewer({
  initialRole = 'student',
  onNavigateToTour,
  compact = false
}: VisualGuidesViewerProps) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<GuideRole>(initialRole);
  const [studentVariant, setStudentVariant] = useState<'comprehensive' | 'alternative'>('comprehensive');
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ══════════════════════════════════════════════════════════════════════════
  // Data for each Guide
  // ══════════════════════════════════════════════════════════════════════════
  const guidesData = {
    // ------------------------------------------------------------------------
    // الطالب
    // ------------------------------------------------------------------------
    student: {
      comprehensive: {
        title: 'دليل الطالب لاستخدام منصة باقون',
        subtitle: 'خريطة بصرية شاملة لإتقان التعلم عن بُعد (11 صفحة)',
        pdfUrl: '/guides/baaqoon_student_guide_comprehensive.pdf',
        infographicUrl: '/guides/infographics/student_guide_mindmap.png',
        workflowUrl: '/guides/infographics/student_guide_workflow.png',
        totalPages: 11,
        slides: [
          {
            page: 1,
            title: 'الغلاف: دليل الطالب للتعلم عن بُعد',
            badge: 'المقدمة',
            desc: 'خريطتك البصرية الشاملة للتفوق الأكاديمي والتعلم الرقمي الذكي في منصة باقون التعليمية.',
            keyPoints: ['مقدمة المنصة ورسالتها للطلبة', 'هيكلية النظام الأكاديمي الرقمي', 'جاهزية الاستخدام']
          },
          {
            page: 2,
            title: 'شجرة حساب الطالب: المحاور الخمسة الأساسية',
            badge: 'خارطة الحساب',
            desc: 'الواجهة الرئيسية (لوحة المتابعة اليومية) • الحصص المباشرة (البث التفاعلي) • الدروس المسجلة (المحتوى الإثرائي) • معسكر المراجعة (الاستعداد للاختبارات) • الإعدادات والدعم.',
            keyPoints: ['الواجهة الرئيسية ولوحة المتابعة', 'الحصص التفاعلية المباشرة', 'معسكرات المراجعة والجاهزية', 'الدروس المسجلة والإعدادات']
          },
          {
            page: 3,
            title: 'الواجهة الرئيسية وشارة الصف والمنهاج',
            badge: 'الواجهة الرئيسية',
            desc: 'تأكد دائماً من مطابقة هويتك الدراسية: الفرع (علمي / أدبي)، الصف (11 أو توجيهي)، والمنهاج (حكومي / أزهري). وزر «دخول الحصة» المباشر للوصول السريع.',
            keyPoints: ['شارة الهوية الدراسية المعتمدة', 'زر «دخول الحصة» السريع لتجنب التأخر', 'بطاقة الترحيب والدافعية']
          },
          {
            page: 4,
            title: 'لوحة نبض اليوم والإحصائيات الفورية',
            badge: 'نبض اليوم',
            desc: 'مصفوفة إحصائية ذكية تعرض الحصص القادمة اليوم، الواجبات المعلقة، الدروس المتأخرة غير المشاهدة، ونسبة المقررات المسجلة المتاحة لك.',
            keyPoints: ['عداد الحصص المباشرة المتبقية لليوم', 'تنبيه فوري بالواجبات المنتظرة للحل', 'تتبع الدروس المسجلة الجديدة والمواد']
          },
          {
            page: 5,
            title: 'الدروس المباشرة ومبادرة النقاط التعليمية (غزة)',
            badge: 'البث المباشر',
            desc: 'الانضمام للحصص التفاعلية الجارية بضغطة زر [انضم الآن]. تصفح الجدول الأسبوعي حسب الأيام والأفواج. ومبادرة النقاط التعليمية المجهزة لطلبة غزة لضمان استمرار التعلم رغم انقطاع الإنترنت المنزلي.',
            keyPoints: ['زر [انضم الآن] الأخضر للدخول الفوري', 'تخطيط الأسبوع وتصفية الجدول', 'نقاط المتابعة المجهزة دون إنترنت شخصي']
          },
          {
            page: 6,
            title: 'معسكرات المراجعة الربع سنوية ونسبة الجاهزية',
            badge: 'معسكر الاختبارات',
            desc: 'العد التنازلي الدقيق بالساعات والأيام لانطلاق معسكرات المراجعة، مع شريط تقدم يوضح مؤشر جاهزية المنهاج والتوزيع الأكاديمي، وزر مراجعة الكتب المقررة بنقرة واحدة.',
            keyPoints: ['العد التنازلي التلقائي لانطلاق المعسكر', 'مؤشر مرئي لمدى استعدادك للاختبارات', 'الوصول المباشر لجدول المعسكرات والكتب']
          },
          {
            page: 7,
            title: 'سير عمل البحث الذكي في الدروس المسجلة',
            badge: 'المكتبة والدروس',
            desc: 'ثلاث خطوات سهلة: 1) البحث الذكي باسم الدرس أو الأستاذ، 2) فلترة المقرر المادة (عربي، رياضيات...)، 3) فرز الدروس حسب حالة المشاهدة (الكل، جديد لم يشاهد، تمت المشاهدة).',
            keyPoints: ['محرك بحث سريع وفوري', 'تصفية حسب المواد الدراسية', 'تنظيم الوقت ومتابعة ما فاتك']
          },
          {
            page: 8,
            title: 'ميثاق الشرف التعليمي وأمانة المشاهدة (حماية الحصص)',
            badge: 'أمانة المشاهدة',
            desc: 'الدروس أمانة علمية مخصصة لطلبة باقون فقط، لحماية خصوصية المعلمات والأساتذة. تظهر علامة مائية ديناميكية ترصد النشاط لمنع التسريب أو تصوير الشاشة. الفيديوهات بجودة فائقة 1080p مع زر [إعادة المشاهدة والمراجعة].',
            keyPoints: ['العلامة المائية الديناميكية الرقمية', 'حظر تصوير الشاشة أو نشر الروابط', 'زر [إعادة المشاهدة والمراجعة] لتثبيت الفهم']
          },
          {
            page: 9,
            title: 'القائمة الجانبية والقائمة العلوية والملف الشخصي',
            badge: 'التنقل والتحكم',
            desc: 'وصول فوري من القائمة الجانبية إلى: الرئيسية، الدروس المسجلة، الجدول والحصص، واجباتي، المكتبة الرقمية، والمحادثات. ومن القائمة العلوية: تعديل الملف الشخصي، ربط البريد، وإعدادات الحساب.',
            keyPoints: ['شريط التنقل الجانبي السريع', 'لوحة التحكم في الملف الشخصي والبريد', 'إدارة وتأمين الحساب']
          },
          {
            page: 10,
            title: 'المساعد التفاعلي: زر «دليل الاستخدام والأزرار»',
            badge: 'الدعم والمساعدة',
            desc: 'إذا واجهتك مشكلة أو نسيت وظيفة أي زر، اضغط على الزر البنفسجي العائم في أي وقت لتشغيل جولة إرشادية حية على الشاشة تشرح لك كل عنصر خطوة بخطوة.',
            keyPoints: ['الزر البنفسجي العائم المتواجد دائماً', 'جولة الشاشة التفاعلية الحية', 'شرح فوري لوظائف الأزرار']
          },
          {
            page: 11,
            title: 'دورة الطالب اليومية الناجحة في منصة باقون',
            badge: 'خلاصة الرحلة',
            desc: '1. تفقد النبض اليومي والواجبات ➔ 2. احضر الحصص المباشرة في وقتها ➔ 3. عزز بالدروس المسجلة والمكتبة ➔ 4. استعد للاختبارات عبر معسكرات المراجعة.',
            keyPoints: ['الروتين اليومي الموصى به للمتفوقين', 'التكامل بين المباشر والمسجل', 'الاستعداد المبكر للامتحانات النهائية']
          }
        ],
        actionsMatrix: [
          { name: 'دخول الحصة', role: 'الاستعداد السريع للدخول إلى الحصة القادمة المجدولة', path: '/student' },
          { name: 'انضم الآن', role: 'الدخول الفوري المباشر إلى البث التفاعلي للحصة الجارية', path: '/student/live' },
          { name: 'إعادة المشاهدة والمراجعة', role: 'مشاهدة تسجيل الدرس ومراجعته بجودة HD مع تدوين الملاحظات', path: '/student/recorded-lessons' },
          { name: 'تمت المشاهدة', role: 'تأكيد إكمال الدرس وتحديث مؤشر التقدم الدراسي', path: '/student/recorded-lessons' },
          { name: 'عرض جدول المعسكرات', role: 'الاطلاع على مواعيد معسكرات المراجعة الربع سنوية وجدول الاختبارات', path: '/student' },
          { name: 'دليل الاستخدام والأزرار', role: 'فتح الدليل الشامل والمساعد التفاعلي وتشغيل الجولة الإرشادية', path: '#' }
        ]
      },
      alternative: {
        title: 'دليل الطالب (البديل المبسط)',
        subtitle: 'خريطتك الشاملة لرحلة تعليمية متكاملة وسريعة (7 صفحات)',
        pdfUrl: '/guides/baaqoon_student_guide_alternative.pdf',
        infographicUrl: '/guides/infographics/student_guide_workflow.png',
        workflowUrl: '/guides/infographics/student_guide_mindmap.png',
        totalPages: 7,
        slides: [
          {
            page: 1,
            title: 'خريطة الأقسام السريعة لحساب الطالب',
            badge: 'نظرة عامة',
            desc: 'لوحة الطالب • الحصص المباشرة • معسكر الاختبارات • الدروس المسجلة • الدعم والإعدادات.',
            keyPoints: ['أقسام مبسطة وواضحة', 'وصول بنقرة واحدة لكل قسم', 'تصميم انسيابي للتعلم السريع']
          },
          {
            page: 2,
            title: 'واجهتك الرئيسية.. نبض يومك الدراسي',
            badge: 'الرئيسية',
            desc: 'الهوية الدراسية (فرعك ومنهاجك) + إحصائيات فورية (الحصص القادمة، الواجبات المعلقة، المقررات المتاحة) + اختصارات الوصول المباشر.',
            keyPoints: ['شارة هويتك الدراسية', 'نبض يومك وحصصك لحظة بلحظة', 'اختصارات سريعة للمكتبة والمحادثات']
          },
          {
            page: 3,
            title: 'لا تفوت حصصك.. انضم للبث المباشر فوراً',
            badge: 'الحصص',
            desc: 'زر [انضم الآن] الأخضر ينقلك مباشرة لقاعة البث. خطتك الأسبوعية مرتبة من السبت للأربعاء. ونقاط تعليمية مجهزة لطلبة غزة.',
            keyPoints: ['دخول مباشر للبث', 'جدول زمني مقسم بالساعات', 'دعم استمرار التعلم دون نت شخصي']
          },
          {
            page: 4,
            title: 'مكتبتك الدائمة.. راجع دروسك في أي وقت',
            badge: 'المكتبة',
            desc: 'تصفية ذكية حسب المادة وحالة المشاهدة. بطاقات الدروس بجودة 1080p. وميثاق الشرف التعليمي لحماية خصوصية المعلمين.',
            keyPoints: ['فرز المحتوى: تم المشاهدة / جديد', 'بطاقات دروس فائقة الوضوح', 'حفظ أمانة الدروس والخصوصية']
          },
          {
            page: 5,
            title: 'استعد للتفوق.. معسكرات المراجعة والاختبارات',
            badge: 'المعسكرات',
            desc: 'تنبيه رسمي بموعد الانطلاق والعد التنازلي بالساعات، مؤشر جاهزية المنهاج والتوزيع (مثل 75%)، وزر عرض جدول الحصص والمعسكرات.',
            keyPoints: ['العد التنازلي التفاعلي', 'مراقبة نسبة إنجاز المنهاج', 'الاستعداد التام لاختبارات الفترة الأولى']
          },
          {
            page: 6,
            title: 'دليلك دائماً معك.. إعداداتك ومساعدتك الفورية',
            badge: 'المساعدة',
            desc: 'الملف الشخصي: تعديل بياناتك والبريد وكلمة المرور. الدليل التفاعلي الحي: الزر البنفسجي العائم لشرح الشاشة خطوة بخطوة.',
            keyPoints: ['تعديل الملف الشخصي والبريد', 'الزر البنفسجي العائم للمساعدة', 'شرح أي زر تواجه فيه صعوبة']
          },
          {
            page: 7,
            title: 'خلاصة الإجراءات السريعة (4 أزرار تهمك يومياً)',
            badge: 'الأزرار الأساسية',
            desc: '1. [انضم الآن]: البث المباشر الجاري ➔ 2. [دخول الحصة]: الاستعداد للحصة القادمة ➔ 3. [تمت المشاهدة]: توثيق إكمال الدرس المسجل ➔ 4. [دليل الاستخدام والأزرار]: المساعدة الفورية.',
            keyPoints: ['أزرار اليوم الدراسي الأربعة', 'تفاعل فوري بدون تعقيد', 'تجربة مستخدم سهلة ومريحة']
          }
        ],
        actionsMatrix: [
          { name: 'انضم الآن', role: 'الدخول المباشر للحصة التفاعلية الحالية', path: '/student/live' },
          { name: 'دخول الحصة', role: 'الاستعداد لدخول حصتك القادمة المجدولة', path: '/student' },
          { name: 'تمت المشاهدة', role: 'تأكيد إنهاء مشاهدة الدرس المسجل وتحديث إنجازك', path: '/student/recorded-lessons' },
          { name: 'دليل الاستخدام والأزرار', role: 'طلب المساعدة الفورية وتشغيل الجولة الإرشادية', path: '#' }
        ]
      }
    },

    // ------------------------------------------------------------------------
    // الأستاذ
    // ------------------------------------------------------------------------
    teacher: {
      title: 'دليل الأستاذ لاستخدام منصة باقون',
      subtitle: 'خريطتك الشاملة لإدارة حصصك، متابعة طلابك، والوصول السريع لأدواتك التعليمية (8 صفحات)',
      pdfUrl: '/guides/baaqoon_teacher_guide.pdf',
      infographicUrl: '/guides/infographics/teacher_guide_infographic.png',
      workflowUrl: '/guides/infographics/platform_roles_overview.png',
      totalPages: 8,
      slides: [
        {
          page: 1,
          title: 'الغلاف: دليل الأستاذ لإدارة العملية التعليمية',
          badge: 'المقدمة',
          desc: 'دليل شامل يوضح أدوات التخطيط الذكي، مصفوفة الإجراءات اليومية السريعة، وإدارة الأفواج والحصص والتقييم.',
          keyPoints: ['رسالة باقون للمعلمين المتطوعين', 'بنية الأدوات الأكاديمية والتربوية', 'تنظيم العمل اليومي']
        },
        {
          page: 2,
          title: 'شريط التنقل الجانبي وبطاقة المادة (نقطة الارتكاز)',
          badge: 'لوحة التحكم',
          desc: 'شريط التنقل الجانبي محطتك للوصول الشامل إلى: الدروس المسجلة، الواجبات، الجدول، والمكتبة. وبطاقة المادة تعرض مادتك المعتمدة وتفاصيل المنهاج ومؤشر الالتزام بالخطة الشهرية.',
          keyPoints: ['شريط التنقل الجانبي لمحطة العمل', 'بطاقة المادة الرسمية المعتمدة', 'مؤشر وتيرة المرافقة الشهرية']
        },
        {
          page: 3,
          title: 'إدارة المادة والمنهاج: أدوات التخطيط الأكاديمي',
          badge: 'التخطيط والمنهاج',
          desc: 'ثلاث أدوات مركزية: 1) بناء الحصص الذكية لبدء تخطيط حصة تفاعلية وهيكلة أفكارها، 2) كتب الوزارة PDF للوصول الفوري للمقررات الرسمية، 3) التوزيع السنوي لمطابقة خطتك الحالية مع الخطة الزمنية المعتمدة.',
          keyPoints: ['بناء الحصص الذكية وهيكلتها', 'كتب الوزارة الرسمية بصيغة PDF', 'التوزيع السنوي والشهري المعتمد']
        },
        {
          page: 4,
          title: 'مصفوفة الإجراءات اليومية السريعة (Quick Actions)',
          badge: 'الإجراءات السريعة',
          desc: 'أربعة أزرار جوهرية: [رصد الغياب والحضور] لتسجيل حضور الطلبة وتوثيق التأخير، [إضافة درس / نشر درس مسجل أو محتوى إثرائي]، [بناء حصة ذكية] لترتيب المحتوى، و[توليد اختبار ذكي] لإنشاء أسئلة مؤتمتة فورية.',
          keyPoints: ['رصد الغياب والحضور بضغطة واحدة', 'نشر الدروس المسجلة والمصادر', 'بناء الحصص وتوليد اختبارات ذكية']
        },
        {
          page: 5,
          title: 'إدارة الحصص المباشرة والأفواج ومتابعة الطلاب',
          badge: 'الحصص والأفواج',
          desc: 'بطاقة الحصة القادمة مع توضيح موعد البدء واسم الدرس الفعلي مع زر [رصد الغياب والحضور] لضبط القاعة. وقائمة «الأفواج التي أدرسها» مع زر [فتح سجل الفوج ومتابعة التطور] وإحصاء الطلبة.',
          keyPoints: ['توقيت الحصص والقاعات الافتراضية', 'سجلات الأفواج وعدد الطلاب', 'رصد الغياب الفوري وضبط الانضباط']
        },
        {
          page: 6,
          title: 'المتابعة والتقييم ورحلة الإنجاز الأكاديمي',
          badge: 'التقييم والإنجاز',
          desc: 'مؤشر المرافقة والالتزام لتحقيق الهدف (مثال: 9 حصص منفذة من أصل 9) لضمان مواكبة التوزيع. وجدول متابعة تقدم المنهاج وإنجاز الدروس: علامات الصح الخضراء للدروس المنجزة، والدوائر الفارغة للمتبقية.',
          keyPoints: ['تسليط الضوء على تحقيق هدف الحصص', 'علامات الإنجاز التفصيلية لكل وحدة', 'متابعة الخطط الزمنية بدقة']
        },
        {
          page: 7,
          title: 'المحطات الكبرى: الاستعداد للمعسكرات والاختبارات',
          badge: 'المعسكرات الكبرى',
          desc: 'توجيه إداري وإشرافي لانطلاق التحضير للمعسكر الربع سنوي، مع مؤشر زمني للعد التنازلي، وزر [معاينة خطة المنهاج والتوزيع الأكاديمي] وزر [إنشاء واجب أو مراجعة للفوج].',
          keyPoints: ['تنبيهات انطلاق معسكرات المراجعة', 'العد التنازلي التلقائي بالساعات', 'أزرار إنشاء الواجبات ومعاينة التوزيع']
        },
        {
          page: 8,
          title: 'الدعم المستمر بين يديك: جولة الشاشة التفاعلية',
          badge: 'المساعد الحي',
          desc: 'في حال احتجت إلى جولة تفاعلية حية داخل أي شاشة أو صفحة، اضغط دائماً على الزر البنفسجي العائم أسفل الشاشة [دليل الاستخدام والأزرار].',
          keyPoints: ['الزر البنفسجي العائم لمعلمي المنصة', 'جولة الشاشة الحية لأي واجهة', 'دعم دائم وتحديثات مستمرة']
        }
      ],
      actionsMatrix: [
        { name: 'رصد الغياب والحضور', role: 'تسجيل الحضور اليومي للطلبة وتوثيق التأخير بضغطة واحدة', path: '/teacher/cohorts' },
        { name: 'إضافة درس مسجل', role: 'رفع درس مسجل أو محتوى إثرائي لتعويض الطلبة', path: '/teacher/lessons' },
        { name: 'بناء حصة ذكية', role: 'ترتيب أفكار ومحاور الحصة التفاعلية القادمة', path: '/teacher/lessons' },
        { name: 'توليد اختبار ذكي', role: 'إنشاء اختبار إلكتروني تقييمي مؤتمت من بنك الأسئلة', path: '/teacher/quizzes' },
        { name: 'التوزيع السنوي', role: 'معاينة ومطابقة الخطة الزمنية للمنهاج المعتمد', path: '/teacher/curriculum' },
        { name: 'فتح سجل الفوج', role: 'متابعة تطور ودرجات ومستوى طلاب الفوج', path: '/teacher/cohorts' }
      ]
    },

    // ------------------------------------------------------------------------
    // المشرف التربوي
    // ------------------------------------------------------------------------
    supervisor: {
      title: 'دليل المشرف لاستخدام منصة باقون',
      subtitle: 'دليلك الشامل للإشراف، المتابعة، وإدارة المنظومة التعليمية بكفاءة (15 صفحة)',
      pdfUrl: '/guides/baaqoon_supervisor_guide.pdf',
      infographicUrl: '/guides/infographics/platform_roles_overview.png',
      workflowUrl: '/guides/infographics/teacher_guide_infographic.png',
      totalPages: 15,
      slides: [
        {
          page: 1,
          title: 'الغلاف: دليل المشرف وغرفة العمليات الإشرافية',
          badge: 'المقدمة',
          desc: 'الإصدار الإرشادي البصري لغرفة العمليات الإشرافية لإدارة المتابعة والتفويج والجاهزية الأكاديمية.',
          keyPoints: ['إدارة المنظومة التعليمية بكفاءة', 'غرفة العمليات الإشرافية المباشرة', 'محاور العمل التربوي']
        },
        {
          page: 2,
          title: 'هيكل الوظائف الإشرافية: شجرة المهام الثلاث',
          badge: 'خارطة الإشراف',
          desc: '1) المتابعة: المراقبة المباشرة للحصص، تقارير الغياب، متابعة نشاط الأساتذة • 2) الإدارة: إدارة الأفواج والتفويج، متابعة الشواغر، إضافة الطلبة • 3) المراجعة: معسكرات الاختبارات، جاهزية الأفواج، دراسة ملفات المتطوعين.',
          keyPoints: ['محور المتابعة والرقابة الميدانية', 'محور إدارة الطاقة الاستيعابية والأفواج', 'محور المراجعة ومعسكرات الاختبارات والفرز']
        },
        {
          page: 3,
          title: 'لوحة القيادة: نظرة شاملة ولحظية على مادتك',
          badge: 'لوحة القيادة',
          desc: 'إحصاء فوري ولحظي لإجمالي الطلبة، الأساتذة، والأفواج النشطة تحت إشرافك، مع بطاقات المراقبة الحية.',
          keyPoints: ['إحصاء الطلبة والأساتذة والأفواج', 'تتبع المادة المنسقة بنظرة واحدة', 'مؤشرات الانضباط والأداء العام']
        },
        {
          page: 4,
          title: 'المراقبة المباشرة للحصص ورصد التأخير',
          badge: 'المراقبة المباشرة',
          desc: '1) حالة البث: تمييز بصري للحصص الجارية حالياً مع اسم الأستاذ والمادة • 2) التنبيهات اللحظية: إشعار فوري في حال تأخر الأستاذ عن موعد بدء الحصة المجدولة للتدخل الإشرافي السريع.',
          keyPoints: ['شارة [حصة جارية] باللون الأخضر', 'شارة تحذيرية [أستاذ متأخر] باللون الأحمر', 'التدخل اللحظي لضمان انضباط البث']
        },
        {
          page: 5,
          title: 'تقارير الأداء ونسب الإنجاز وتتبع المنهاج',
          badge: 'التقارير والأداء',
          desc: 'رصد الغياب: جدول تفصيلي يوضح حضور الطلبة وغيابهم وحالة دخول الأستاذ. تقدم المنهاج: مؤشر مئوي دقيق لتتبع نشاط الأساتذة ومدى التزامهم بخطة التوزيع السنوي.',
          keyPoints: ['رصد غياب وحضور الحصص السابقة', 'مؤشر مئوي لتقدم كل فوج ومعلم', 'تتبع إنجاز الحصص المستهدفة']
        },
        {
          page: 6,
          title: 'المحور الأول: إدارة الأفواج والتفويج الذكي',
          badge: 'التفويج والمقاعد',
          desc: 'التفويج الذكي، متابعة الشواغر، إدارة المقاعد، وتوزيع الطلاب حسب الفروع والمناهج بكفاءة.',
          keyPoints: ['ضبط السعة الاستيعابية لكل فوج', 'تحقيق التوازن بين الأفواج والمعلمين', 'القضاء على العجز والشواغر']
        },
        {
          page: 7,
          title: 'التفويج الذكي وإدارة السعة ورصد العجز',
          badge: 'السعة والشواغر',
          desc: 'الرؤية الشاملة: عرض إجمالي الأفواج، عدد الطلبة المسجلين، والطلبات قيد الانتظار. رصد العجز: مؤشر لعدد الشواغر في الكادر التعليمي لتوجيه التوظيف والتكليف.',
          keyPoints: ['إحصاء المقاعد الشاغرة والطلبة المفوجين', 'رصد شواغر الأساتذة وشواغر الأفواج', 'توجيه طلبات التطوع لسد النقص']
        },
        {
          page: 8,
          title: 'تفاصيل الفوج والإجراءات السريعة (ملء الشواغر)',
          badge: 'إجراءات الفوج',
          desc: 'إشغال المقاعد: شريط تقدم يوضح المقاعد المشغولة من أصل السعة الإجمالية (مثال: 13 من أصل 39 مقعداً). الإجراء المباشر: زر [إضافة طالب للفوج] لملء الشواغر بضغطة واحدة.',
          keyPoints: ['شريط تقدم نسبة إشغال المقاعد', 'زر [إضافة طالب للفوج] السريع', 'التحكم الفوري في قوام الفوج']
        },
        {
          page: 9,
          title: 'المحور الثاني: التقييم والمراجعة والمبادرات',
          badge: 'المراجعة والمعسكرات',
          desc: 'معسكرات الاختبارات، جاهزية المناهج، وملفات المبادرات الخاصة (دراسة وفرز ملفات المتطوعين لطلبة غزة).',
          keyPoints: ['الاستعداد الشامل لمعسكرات الاختبارات', 'قياس جاهزية المناهج والأفواج', 'إدارة لجان الفرز الأكاديمية']
        },
        {
          page: 10,
          title: 'إدارة معسكرات المراجعة والتواصل الآلي',
          badge: 'إدارة المعسكرات',
          desc: 'تتبع الانطلاق: عداد تنازلي ومؤشر مرئي لنسبة جاهزية المنهاج والتوزيع. التواصل الآلي: زر [إرسال التذكير الآلي للطلبة والأساتذة] لضمان الاستعداد للمعسكر بضغطة واحدة دون مراسلات فردية.',
          keyPoints: ['العداد التنازلي التفاعلي للمعسكر', 'زر [إرسال التذكير الآلي] الموحد', 'أتمتة التواصل الأكاديمي الجماعي']
        },
        {
          page: 11,
          title: 'رقابة الجاهزية التفصيلية والتدقيق المجهري',
          badge: 'الجاهزية المجهرية',
          desc: 'التدقيق المجهري: تتبع دقيق لكل فوج على حدة لمعرفة ما إذا أكمل الحصص المستهدفة (مثال: أكمل 16 من أصل 16 حصة من المقررات المستهدفة) مع اسم الأستاذ ونسبة الإنجاز.',
          keyPoints: ['بطاقة تفصيلية لكل فوج دراسي', 'مقارنة الحصص المنجزة بالمستهدفة', 'تحديد الأفواج المتأخرة لمعالجتها']
        },
        {
          page: 12,
          title: 'المبادرات الخاصة: لجان فرز ملفات المتطوعين (غزة)',
          badge: 'فرز المتطوعين',
          desc: 'أدوات الفرز: استعراض ملفات المتطوعين حسب التخصص والمرحلة. اتخاذ القرار: صلاحية قبول أو رفض الملفات عبر أزرار حاسمة: [دراسة وتوصية مؤكدة] (أزرق) أو [اعتذار بلطف] (أحمر).',
          keyPoints: ['فرز المتطوعين حسب التخصص والمسار', 'زر [دراسة وتوصية مؤكدة] للاعتماد', 'زر [اعتذار بلطف] لرفض غير المؤهلين']
        },
        {
          page: 13,
          title: 'شريط التنقل الإشرافي وأقسام لوحة الإشراف',
          badge: 'شريط التنقل',
          desc: 'الإحصائيات والتقارير: للعودة إلى لوحة القيادة والمراقبة المباشرة. الأفواج: للوصول إلى التفويج الذكي وإدارة المقاعد. متابعة الامتحانات: لإدارة معسكرات المراجعة والتذكيرات الآلية.',
          keyPoints: ['التنقل السلس بين أقسام غرفة العمليات', 'الوصول المباشر لقوائم الأساتذة والأفواج', 'متابعة الامتحانات والفرز']
        },
        {
          page: 14,
          title: 'خلاصة الإجراءات الإشرافية ومصفوفة العمليات',
          badge: 'مصفوفة الإجراءات',
          desc: 'لوحة القيادة (متابعة مراقبة الحصص ونسب الغياب) • الأفواج (إدارة التحقق من الشواغر وإضافة الطلبة) • الامتحانات (مراجعة تتبع جاهزية الأفواج للمعسكرات) • ملفات غزة (مراجعة فرز وقبول الأساتذة المتطوعين).',
          keyPoints: ['جدول شامل لمصفوفة الواجهات والوظائف', 'تصنيف نوع الإجراء (متابعة / إدارة / مراجعة)', 'المرجعية السريعة للمشرف التربوي']
        },
        {
          page: 15,
          title: 'الدعم الفوري أثناء العمل الإشرافي المباشر',
          badge: 'المساعد التفاعلي',
          desc: 'للمزيد من التفاصيل أو المساعدة أثناء تنفيذ مهامك الإشرافية، يمكنك دائماً تفعيل [دليل الاستخدام والأزرار] التفاعلي المتوفر أسفل يمين شاشتك للحصول على جولة إرشادية حية.',
          keyPoints: ['الزر البنفسجي العائم للمشرفين', 'جولة حية لكل شاشة إشرافية', 'دعم مستمر للمنظومة التعليمية']
        }
      ],
      actionsMatrix: [
        { name: 'المراقبة المباشرة', role: 'متابعة الحصص التفاعلية الجارية ورصد تأخر الأساتذة', path: '/supervisor' },
        { name: 'إضافة طالب للفوج', role: 'ملء الشواغر وإسناد الطلاب للأفواج غير المكتملة', path: '/supervisor/cohorts' },
        { name: 'إرسال التذكير الآلي', role: 'إرسال إشعار تذكير فوري لجميع الطلبة والأساتذة بالمعسكر', path: '/supervisor/exams' },
        { name: 'دراسة وتوصية مؤكدة', role: 'اعتماد وقبول طلب تطوع الأستاذ وإحالته للتدريس', path: '/supervisor/volunteers' },
        { name: 'التفويج الذكي', role: 'إدارة السعة الاستيعابية ومقاعد الأفواج', path: '/supervisor/cohorts' },
        { name: 'دليل الاستخدام والأزرار', role: 'طلب الدعم وتشغيل الجولة الإرشادية التفاعلية', path: '#' }
      ]
    },

    // ------------------------------------------------------------------------
    // المخطط التنظيمي الشامل
    // ------------------------------------------------------------------------
    overview: {
      title: 'الدليل التنظيمي الشامل لمنصة باقون التعليمية',
      subtitle: 'المخطط البانورامي للأدوار الثلاثة: الطالب، الأستاذ، والمشرف التربوي',
      pdfUrl: '/guides/baaqoon_student_guide_comprehensive.pdf',
      infographicUrl: '/guides/infographics/platform_roles_overview.png',
      workflowUrl: '/guides/infographics/platform_roles_overview.png',
      totalPages: 1,
      slides: [
        {
          page: 1,
          title: 'المخطط التنظيمي الشامل لمنظومة باقون',
          badge: 'البانوراما الشاملة',
          desc: 'تكامل المنظومة بين الطالب (نبض اليوم، البث المباشر، المعسكرات، الدروس المسجلة)، والأستاذ (إدارة المنهاج، الإجراءات السريعة، الحصص والأفواج، والتقييم)، والمشرف التربوي (لوحة القيادة، المراقبة الحية، التفويج، وفرز المتطوعين).',
          keyPoints: ['تكامل الأدوار الثلاثة في شاشة واحدة', 'خريطة شاملة لرحلة التعليم الرقمي', 'التنسيق والربط الأكاديمي الفوري']
        }
      ],
      actionsMatrix: [
        { name: 'دليل الطالب', role: 'استعراض أدلة الطالب وخطة التعلم اليومية', path: '#student' },
        { name: 'دليل الأستاذ', role: 'استعراض أدوات الأستاذ وإدارة المنهاج والحصص', path: '#teacher' },
        { name: 'دليل المشرف', role: 'استعراض غرفة العمليات الإشرافية والتفويج والفرز', path: '#supervisor' }
      ]
    }
  };

  const currentGuide = selectedRole === 'student' 
    ? guidesData.student[studentVariant]
    : guidesData[selectedRole];

  const currentSlide = currentGuide.slides[activeSlide] || currentGuide.slides[0];

  const handleNextSlide = () => {
    if (activeSlide < currentGuide.slides.length - 1) {
      setActiveSlide(prev => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Top Role Selector Bar */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-1 hidden sm:inline">
            اختر الدليل:
          </span>

          <button
            onClick={() => { setSelectedRole('student'); setActiveSlide(0); }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>دليل الطالب</span>
          </button>

          <button
            onClick={() => { setSelectedRole('teacher'); setActiveSlide(0); }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === 'teacher'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>دليل الأستاذ</span>
          </button>

          <button
            onClick={() => { setSelectedRole('supervisor'); setActiveSlide(0); }}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === 'supervisor'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-600/25 ring-2 ring-purple-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>دليل المشرف</span>
          </button>

          <button
            onClick={() => { setSelectedRole('overview'); setActiveSlide(0); }}
            className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              selectedRole === 'overview'
                ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-600/25 ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المخطط الشامل</span>
          </button>
        </div>

        {/* Student Guide 1 vs Alternative Guide 2 Toggle */}
        {selectedRole === 'student' && (
          <div className="flex items-center gap-1.5 bg-emerald-100/60 dark:bg-emerald-950/60 p-1.5 rounded-2xl border border-emerald-300/60 dark:border-emerald-800 w-full md:w-auto justify-center">
            <button
              onClick={() => { setStudentVariant('comprehensive'); setActiveSlide(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                studentVariant === 'comprehensive'
                  ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 shadow-sm'
                  : 'text-emerald-800 dark:text-emerald-300 hover:bg-white/50'
              }`}
            >
              ⭐ الدليل الأساسي (11 ص)
            </button>
            <button
              onClick={() => { setStudentVariant('alternative'); setActiveSlide(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                studentVariant === 'alternative'
                  ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 shadow-sm'
                  : 'text-emerald-800 dark:text-emerald-300 hover:bg-white/50'
              }`}
              title="دليل بديل ومختصر في حال رغبت بنسخة سريعة ومبسطة"
            >
              💡 الدليل البديل المبسط (7 ص)
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Guide Header Banner */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F2A18] via-[#2A3B22] to-[#172012] border border-[#c9b48a]/40 text-white p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#c9b48a]/20 text-[#e6d9bf] border border-[#c9b48a]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#c9b48a]" />
              <span>دليل رسمي معتمد ومصور إنفوجرافيك</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {currentGuide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-medium">
              {currentGuide.subtitle}
            </p>
          </div>

          {/* Quick PDF & Fullscreen Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <a
              href={currentGuide.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="فتح الدليل الكامل بصيغة PDF في نافذة مستقلة"
            >
              <ExternalLink className="w-4 h-4 text-[#c9b48a]" />
              <span>عرض الدليل (PDF)</span>
            </a>

            <a
              href={currentGuide.pdfUrl}
              download
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c9b48a] via-[#e5d8be] to-[#c9b48a] text-[#1F2A18] hover:brightness-105 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-black/20 hover:scale-[1.02]"
              title="تحميل الدليل بصيغة PDF عالية الدقة بجودة الطباعة"
            >
              <Download className="w-4 h-4" />
              <span>تحميل PDF</span>
            </a>

            {currentGuide.infographicUrl && (
              <button
                onClick={() => setLightboxImage({ src: currentGuide.infographicUrl, title: currentGuide.title })}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Maximize2 className="w-4 h-4 text-emerald-300" />
                <span>تكبير الإنفوجرافيك البانورامي</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* High-Resolution Infographic Banner Preview */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentGuide.infographicUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                الإنفوجرافيك البصري الشامل (خريطة التدفق)
              </h3>
            </div>
            <button
              onClick={() => setLightboxImage({ src: currentGuide.infographicUrl, title: currentGuide.title })}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>فتح وضع القراءة بملء الشاشة</span>
            </button>
          </div>

          <div 
            onClick={() => setLightboxImage({ src: currentGuide.infographicUrl, title: currentGuide.title })}
            className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 cursor-pointer shadow-inner hover:shadow-xl transition-all"
          >
            <img 
              src={currentGuide.infographicUrl} 
              alt={currentGuide.title}
              className="w-full h-auto max-h-[380px] object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <div className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-2xl">
                <Maximize2 className="w-4 h-4 text-emerald-600" />
                <span>انقر للتكبير وفحص التفاصيل والأزرار بدقة فائقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Interactive Step-by-Step Slide Navigator */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentGuide.slides.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                {currentSlide.page}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentSlide.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    صفحة {currentSlide.page} من {currentGuide.slides.length}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {currentSlide.title}
                </h3>
              </div>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handlePrevSlide}
                disabled={activeSlide === 0}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] px-1 py-1">
                {currentGuide.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                      activeSlide === idx 
                        ? 'bg-amber-600 w-6' 
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                    }`}
                    title={`انتقال للصفحة ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextSlide}
                disabled={activeSlide === currentGuide.slides.length - 1}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide Description & Key Points */}
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {currentSlide.desc}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                النقاط المحورية والتعليمات العملية:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentSlide.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Key Platform Buttons & Actions Matrix */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              أهم الأزرار والإجراءات المشروحة في هذا الدليل (وصول سريع)
            </h3>
          </div>
          {onNavigateToTour && (
            <button
              onClick={onNavigateToTour}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>تشغيل الجولة الإرشادية الحية</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentGuide.actionsMatrix.map((action, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300/40 mb-1.5">
                  <span>زر [{action.name}]</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                  {action.role}
                </p>
              </div>

              {action.path && action.path !== '#' && (
                <button
                  onClick={() => navigate(action.path)}
                  className="mt-2 w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-200 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>الانتقال للميزة في المنصة</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Lightbox / Zoom Modal for Infographics */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in"
          dir="rtl"
        >
          {/* Lightbox Header Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between gap-4 text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#c9b48a]" />
              <div>
                <h3 className="text-sm sm:text-lg font-black text-white">{lightboxImage.title}</h3>
                <span className="text-[11px] text-slate-400">معاينة عالية الدقة (Ultra HD)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                title="إعادة التعيين"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <a
                href={lightboxImage.src}
                download
                className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white transition-all cursor-pointer"
                title="تحميل الصورة كاملة بدقة فائقة"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => { setLightboxImage(null); setZoomLevel(1); }}
                className="p-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white transition-all cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div className="flex-1 w-full max-w-6xl overflow-auto flex items-center justify-center p-2 my-auto">
            <img 
              src={lightboxImage.src} 
              alt={lightboxImage.title}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-[82vh] max-w-full object-contain transition-transform duration-200 select-none shadow-2xl rounded-xl"
            />
          </div>

          <div className="text-center text-xs text-slate-400 pt-2 shrink-0">
            يمكنك استخدام أدوات التكبير والتصغير بأعلى الشاشة أو التمرير لفحص النصوص والأسهم بدقة متناهية
          </div>
        </div>
      )}
    </div>
  );
}
