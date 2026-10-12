import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  BookOpen, 
  ArrowLeft, 
  Sparkles,
  ShieldAlert,
  Flame,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SyllabusAccountabilityWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher_accountability_pacing'],
    queryFn: async () => {
      const res = await api.get('/syllabus/accountability/teacher');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-lg animate-pulse">
        <div className="h-6 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  const { pacingInfo, reports = [] } = data || {};

  if (reports.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/70 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden" dir="rtl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              المنسق الآلي لمتابعة المنهاج
            </span>
            <span className="text-xs text-slate-400 font-bold">
              شهر {pacingInfo?.monthNameAr} (الأسبوع {pacingInfo?.weekOfMonth} من الفصل {pacingInfo?.semester})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-500" />
            مؤشر المرافقة والالتزام بالخطة الشهرية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            يقيس النظام الذكي تقدمك تلقائياً مقارنة بالتوزيع السنوي والشهري المعتمد لضمان استيفاء المقرر دون تأخر.
          </p>
        </div>

        <Link
          to="/teacher/distribution"
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2.5 rounded-xl transition-all shadow-sm flex-shrink-0"
        >
          <span>تصفح التوزيع السنوي المعتمد</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cohorts Accountability Cards */}
      <div className="grid grid-cols-1 gap-5">
        {reports.map((report: any) => {
          const pacing = report.currentPacing;
          const isDelayed = pacing.status === 'delayed';
          const isSlightDelay = pacing.status === 'slight_delay';
          const isOnTrack = pacing.status === 'on_track' || pacing.status === 'ahead';

          return (
            <div 
              key={report.cohortId}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                isDelayed 
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60' 
                  : isSlightDelay
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
                  : 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {report.courseTitle} - {report.cohortName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pacing.badgeBg}`}>
                      {pacing.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {report.totalStudents} طلاب مسجلون بالفوج
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs shadow-sm">
                  <div>
                    <span className="block text-slate-400 text-[10px]">الحصص المنفذة:</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{pacing.completedSessions} حصة</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">المطلوبة حتى الآن:</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{pacing.expectedSessions} حصة</span>
                  </div>
                </div>
              </div>

              {/* What must be presented this week according to Palestinian syllabus */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                      المقرر تقديمه هذا الأسبوع وفق الخطة المعتمدة لشهر {pacing.monthNameAr}:
                    </span>
                    <div className="bg-white/80 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {pacing.currentMonthTopics}
                    </div>
                  </div>
                </div>

                {/* Action Alert Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <p className={`text-xs font-bold flex items-center gap-1.5 ${pacing.statusColor}`}>
                    {isDelayed ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {report.actionRequired}
                  </p>

                  <Link
                    to="/teacher/schedule"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs shadow-md transition-all self-stretch sm:self-auto justify-center"
                  >
                    <PlusCircle className="w-4 h-4" />
                    جدولة حصة بالجدول الأسبوعي
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
