import React from 'react';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Link } from 'react-router-dom';

export default function ExamPrepPage() {
  const { data: cohortsData } = useQuery({
    queryKey: ['supervisor_progress_examprep'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/progress');
      return res.data || [];
    }
  });

  const palestinianCampsSchedule = [
    {
      id: 1,
      title: 'معسكر المراجعة الربع سنوي لاختبارات الفترة الأولى',
      semester: 'الفصل الدراسي الأول',
      months: 'سبتمبر - أكتوبر',
      timing: 'نهاية أكتوبر / بداية نوفمبر',
      isCurrent: true,
      description: 'مراجعة مكثفة ومباشرة لمقررات شهري سبتمبر وأكتوبر (فروع اللغة العربية، التربية الإسلامية، الرياضيات، العلوم) وحل بنوك الأسئلة المعتمدة.',
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 2,
      title: 'معسكر المراجعة الشاملة لاختبارات نهاية الفصل الدراسي الأول',
      semester: 'الفصل الدراسي الأول',
      months: 'نوفمبر - ديسمبر',
      timing: 'منتصف إلى نهاية ديسمبر',
      isCurrent: false,
      description: 'حل نماذج الامتحانات الوزارية الاسترشادية الشاملة لمنهاج الفصل الدراسي الأول كاملاً ورصد الجاهزية.',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    },
    {
      id: 3,
      title: 'فترة الراحة البيداغوجية وعطلة منتصف العام',
      semester: 'استراحة ما بين الفصلين',
      months: 'شهر يناير (شهر راحة)',
      timing: 'طوال شهر يناير',
      isCurrent: false,
      description: 'شهر استراحة رسمي بين الفصلين الدراسيين، يخصص لمراجعات علاجية اختيارية وجدولة الفصل الثاني.',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
    },
    {
      id: 4,
      title: 'معسكر مراجعة واختبارات الفترة الثالثة (منتصف الفصل الثاني)',
      semester: 'الفصل الدراسي الثاني',
      months: 'فبراير - مارس',
      timing: 'نهاية مارس',
      isCurrent: false,
      description: 'تثبيت دروس النصف الأول من الفصل الثاني وتكثيف التطبيقات التحصيلية لطلبة الصف 11 والتوجيهي.',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    },
    {
      id: 5,
      title: 'معسكر المراجعة النهائية المكثفة لامتحانات الثانوية العامة (التوجيهي)',
      semester: 'الفصل الدراسي الثاني',
      months: 'أبريل - مايو',
      timing: 'طوال شهر مايو',
      isCurrent: false,
      description: 'المعسكر المركزي الشامل لمحاكاة امتحانات التوجيهي الوزارية الرسمية والتدريب على إدارة الوقت ونماذج الأسئلة الموضوعية والمقالية.',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
    },
    {
      id: 6,
      title: 'العطلة الصيفية الرسمية',
      semester: 'عطلة نهاية العام',
      months: 'يونيو - يوليو - أغسطس (3 أشهر)',
      timing: 'فترة الصيف',
      isCurrent: false,
      description: 'إعلان النتائج الرسمية وعطلة الصيف تمهيداً للعام الدراسي الجديد.',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-lg border border-indigo-200 dark:border-indigo-800">
              المنهاج الفلسطيني المعتمد (فصلان دراسيان)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            التحضير للاختبارات ومعسكرات المراجعة المعتمدة
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 text-sm sm:text-base">
            إدارة المعسكرات الدورية، إرسال التذكيرات الآلية للطلبة، ومتابعة جاهزية الأفواج وفق التوزيع السنوي والشهري.
          </p>
        </div>

        <Link
          to="/supervisor/distribution"
          className="self-start md:self-center px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2 shadow-xs"
        >
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>استعراض الخطة والتوزيع السنوي والشهري</span>
        </Link>
      </div>

      {/* Main Dynamic Interactive Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ExamPrepWidget role="supervisor" showDistributionLink={false} />

          {/* Cohorts Readiness Grid */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>جاهزية الأفواج للمعسكر والاختبارات القادمة</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">مُحدث تلقائياً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cohortsData && cohortsData.length > 0 ? (
                cohortsData.map((cohort: any) => (
                  <div key={cohort.cohortId} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{cohort.cohortName}</h4>
                        <p className="text-xs text-slate-500 font-medium">الأستاذ: {cohort.teacherName}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cohort.percentage >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                        {cohort.percentage}% إنجاز
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${cohort.percentage}%` }} />
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      أتم {cohort.completedLessons} من أصل {cohort.totalLessons} حصص من المقررات المستهدفة.
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-slate-400 text-sm font-bold">
                  لا توجد أفواج مسندة تحت المتابعة حالياً.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Side Timeline: Palestinian 2-Semester Annual Plan */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>الجدول الزمني السنوي لمعسكرات المراجعة</span>
            </h3>

            <div className="space-y-4">
              {palestinianCampsSchedule.map((camp) => (
                <div 
                  key={camp.id} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    camp.isCurrent 
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs' 
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/60 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${camp.badgeColor}`}>
                      {camp.semester}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {camp.timing}
                    </span>
                  </div>

                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                    {camp.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {camp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
