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
  Check, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Link } from 'react-router-dom';

interface ExamPrepWidgetProps {
  role: 'admin' | 'supervisor';
  className?: string;
  showDistributionLink?: boolean;
}

export default function ExamPrepWidget({ role, className = '', showDistributionLink = true }: ExamPrepWidgetProps) {
  const queryClient = useQueryClient();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['examPrepStatus'],
    queryFn: async () => {
      const res = await api.get('/syllabus/exam-prep/status');
      return res.data;
    },
    refetchInterval: 60000 // Refresh every minute
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
      setSuccessToast(res.message || 'تم إرسال وتفعيل التذكيرات الآلية بنجاح!');
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: () => {
      alert('حدث خطأ أثناء تفعيل التذكيرات الآلية. يرجى المحاولة مرة أخرى.');
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
    targetCohortsCount: 0
  };

  const isRecentlySent = reminders.isActive;
  const distributionPath = role === 'admin' ? '/admin/distribution' : '/supervisor/distribution';

  return (
    <section className={`glass-panel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-baaqoon-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative overflow-hidden font-sans ${className}`} dir="rtl">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>التحضير للاختبارات والتذكيرات</span>
        </h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {camp.semesterName} ({camp.monthNameAr} - الأسبوع {camp.weekOfMonth})
        </span>
      </div>

      {/* Main Camp Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-4 sm:p-5 mb-5 relative overflow-hidden shadow-xs">
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <h3 className="font-black text-base sm:text-lg text-blue-950 dark:text-blue-100 mb-1 leading-snug">
              {camp.title}
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium line-clamp-2">
              {camp.description}
            </p>
          </div>
        </div>

        {/* Dynamic Countdown */}
        <div className="flex items-center gap-2 mt-3 mb-2 text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-300">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>يبدأ بعد {camp.daysRemaining} أيام (متبقي {camp.hoursRemaining} ساعة)</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>جاهزية المنهاج والتوزيع الشهري</span>
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

      {/* Action Section */}
      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
          إرسال تذكيرات آلية للطلبة حول المعسكر القادم للتسجيل والتحضير.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button 
            onClick={() => sendRemindersMutation.mutate()}
            disabled={sendRemindersMutation.isPending}
            className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm ${
              isRecentlySent 
                ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-[0.99]'
            } disabled:opacity-75`}
            title={isRecentlySent ? 'تم التفعيل مؤخراً - انقر لإعادة الإرسال والتحديث' : 'تفعيل التذكير الآلي للجميع'}
          >
            {sendRemindersMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRecentlySent ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تم تفعيل التذكيرات الآلية (إعادة الإرسال)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>تفعيل التذكير الآلي للجميع</span>
              </>
            )}
          </button>

          {showDistributionLink && (
            <Link 
              to={distributionPath}
              className="px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              title="معاينة التوزيع السنوي والشهري المعتمد"
            >
              <span>خطة المنهاج</span>
              <ArrowLeft className="w-3.5 h-3.5" />
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
              المستهدفون: {reminders.targetStudentsCount} طالب في {reminders.targetCohortsCount} فوج
            </span>
            {reminders.lastSentAt && (
              <span>آخر إرسال: {new Date(reminders.lastSentAt).toLocaleDateString('ar-EG')}</span>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
