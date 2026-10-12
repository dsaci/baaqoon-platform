import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Send, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Users, 
  Bell, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  AlertCircle,
  Flame,
  BookOpen,
  FileText
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ExamPrepWidgetProps {
  role: 'admin' | 'supervisor' | 'teacher' | 'student';
  className?: string;
  showDistributionLink?: boolean;
}

export default function ExamPrepWidget({ role, className = '', showDistributionLink = true }: ExamPrepWidgetProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['examPrepStatus'],
    queryFn: async () => {
      const res = await api.get('/syllabus/exam-prep/status');
      return res.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/syllabus/exam-prep/send-reminders', {
        campTitle: data?.camp?.title
      });
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['examPrepStatus'] });
      setSuccessToast(res?.message || (isRtl ? 'تم إرسال وتفعيل التذكيرات الآلية بنجاح لجميع الطلبة والأساتذة!' : 'Automated camp reminders sent successfully!'));
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: () => {
      alert(isRtl ? 'حدث خطأ أثناء تفعيل التذكيرات الآلية. يرجى المحاولة مرة أخرى.' : 'Error sending reminders. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <section className={`glass-panel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-baaqoon-800 animate-pulse ${className}`}>
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
        <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </section>
    );
  }

  const camp = data?.camp || {
    title: 'معسكر المراجعة الربع سنوي لاختبارات الفترة الأولى',
    semesterName: 'الفصل الدراسي الأول',
    monthNameAr: 'أكتوبر',
    weekOfMonth: 2,
    description: 'مراجعة شاملة ومكثفة لمقررات شهري سبتمبر وأكتوبر وتثبيت المفاهيم للاختبارات الدورية.',
    daysRemaining: 5,
    hoursRemaining: 120,
    progressPercentage: 75
  };

  const reminders = data?.reminders || {
    isActive: false,
    lastSentAt: null,
    targetStudentsCount: 0,
    targetCohortsCount: 0,
    title: camp.title,
    message: null
  };

  const isRecentlySent = reminders.isActive;
  const isManager = role === 'admin' || role === 'supervisor';

  const distributionPath = role === 'admin' 
    ? '/admin/distribution' 
    : role === 'supervisor' 
      ? '/supervisor/distribution' 
      : '/curriculum';

  return (
    <section 
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`glass-panel p-6 rounded-3xl shadow-md border ${
        isRecentlySent 
          ? 'border-amber-200/90 dark:border-amber-800/80 bg-gradient-to-br from-amber-50/40 via-white/90 to-orange-50/30 dark:from-amber-950/20 dark:via-slate-900/90 dark:to-orange-950/10' 
          : 'border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85'
      } backdrop-blur-xl relative overflow-hidden font-sans ${className}`}
    >
      {/* Decorative Glow */}
      <div className={`absolute -top-12 ${isRtl ? '-right-12' : '-left-12'} w-44 h-44 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none`} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {role === 'student' 
                  ? (isRtl ? 'تذكير رسمي: معسكر المراجعة والاختبارات' : 'Official Notice: Exam Prep Camp')
                  : role === 'teacher'
                    ? (isRtl ? 'توجيه إداري وإشرافي: انطلاق التحضير للمعسكر' : 'Administrative Directive: Exam Prep Camp')
                    : (isRtl ? 'التحضير للاختبارات ومعسكرات المراجعة' : 'Exam Prep & Review Camps')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {role === 'student' 
                ? (isRtl ? 'تذكير معتمد من إدارة المنصة والمشرف التربوي للاستعداد والتحضير' : 'Official notice sent by administration & supervisor for camp readiness')
                : role === 'teacher'
                  ? (isRtl ? 'توجيه رسمي من المشرف الأكاديمي وإدارة المنصة لتكثيف المراجعات' : 'Supervisory directive to schedule reviews and prepare cohorts')
                  : (isRtl ? 'إدارة التذكيرات الآلية ومتابعة جاهزية الأفواج وفق الخطة السنوية' : 'Manage automated reminders & track cohort syllabus readiness')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecentlySent && (
            <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5 shadow-xs animate-pulse">
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isRtl ? 'تذكير نشط' : 'Active Reminder'}</span>
            </span>
          )}

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {camp.semesterName} ({camp.monthNameAr})
          </span>
        </div>
      </div>

      {/* Main Camp Card */}
      <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl p-4 sm:p-5 mb-5 relative overflow-hidden shadow-xs">
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <h3 className="font-black text-base sm:text-lg text-blue-950 dark:text-blue-100 mb-1 leading-snug">
              {camp.title}
            </h3>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
              {role === 'teacher'
                ? (isRtl ? `يرجى من جميع الأساتذة ضبط جدول الحصص الأسبوعية وتكثيف المراجعات للطلاب تزامناً مع ${camp.title} وفق الخطة السنوية المقررة.` : `Teachers are kindly directed to adjust weekly sessions and review materials for ${camp.title}.`)
                : camp.description}
            </p>
          </div>
        </div>

        {/* Dynamic Countdown & Readiness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-800/50">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-blue-900 dark:text-blue-200">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              {isRtl 
                ? `يبدأ بعد ${camp.daysRemaining} أيام (متبقي ${camp.hoursRemaining} ساعة)` 
                : `Starts in ${camp.daysRemaining} days (${camp.hoursRemaining}h remaining)`}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-blue-800 dark:text-blue-300">
              <span>{isRtl ? 'جاهزية المنهاج والتوزيع' : 'Curriculum Readiness'}</span>
              <span>{camp.progressPercentage}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${camp.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reminder notification info */}
        {reminders.lastSentAt && (
          <div className="mt-3 pt-2 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {isRtl
                ? `تاريخ آخر إرسال للتذكير الرسمي: ${new Date(reminders.lastSentAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `Last sent reminder date: ${new Date(reminders.lastSentAt).toLocaleDateString('en-US')}`}
            </span>
          </div>
        )}
      </div>

      {/* Action Section based on role */}
      {isManager ? (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            {isRtl 
              ? 'إرسال تذكيرات آلية رسمية للطلبة والأساتذة للتحضير والتسجيل في المعسكر القادم.' 
              : 'Broadcast official camp preparation reminders to all students and teachers.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button 
              onClick={() => sendRemindersMutation.mutate()}
              disabled={sendRemindersMutation.isPending}
              className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm ${
                isRecentlySent 
                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-[0.99]'
              } disabled:opacity-75 cursor-pointer`}
              title={isRecentlySent ? 'تم التفعيل مؤخراً - انقر لإعادة الإرسال والتحديث' : 'تفعيل التذكير الآلي للجميع'}
            >
              {sendRemindersMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecentlySent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isRtl ? 'تم إرسال التذكيرات (انقر لإعادة الإرسال)' : 'Reminders Active (Click to Re-send)'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isRtl ? 'إرسال التذكير الآلي للطلبة والأساتذة' : 'Send Reminder to All'}</span>
                </>
              )}
            </button>

            {showDistributionLink && (
              <Link 
                to={distributionPath}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                title="معاينة التوزيع السنوي والشهري المعتمد"
              >
                <span>{isRtl ? 'خطة المنهاج' : 'Syllabus Plan'}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </Link>
            )}
          </div>

          {/* Success Alert Toast */}
          {successToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Meta Stats info */}
          {reminders.targetStudentsCount > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 font-bold">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isRtl ? `المستهدفون: ${reminders.targetStudentsCount} طالب في ${reminders.targetCohortsCount} فوج` : `Target: ${reminders.targetStudentsCount} students`}
              </span>
              {reminders.lastSentAt && (
                <span>{isRtl ? `آخر إرسال: ${new Date(reminders.lastSentAt).toLocaleDateString('ar-EG')}` : `Sent: ${new Date(reminders.lastSentAt).toLocaleDateString()}`}</span>
              )}
            </div>
          )}
        </div>
      ) : role === 'teacher' ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/curriculum"
            className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isRtl ? 'معاينة خطة المنهاج والتوزيع الأكاديمي' : 'View Syllabus Plan'}</span>
          </Link>
          <Link
            to="/teacher/assessments"
            className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>{isRtl ? 'إنشاء واجب أو مراجعة للفوج' : 'Create Review Assessment'}</span>
          </Link>
        </div>
      ) : (
        /* Student Actions */
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/student/schedule"
            className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4" />
            <span>{isRtl ? 'عرض جدول الحصص والمعسكرات' : 'View Sessions & Camp Schedule'}</span>
          </Link>
          <Link
            to="/curriculum"
            className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'مراجعة المناهج والكتب المقررة' : 'Review Curriculum Books'}</span>
          </Link>
        </div>
      )}
    </section>
  );
}
