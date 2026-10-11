import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  BookOpen, 
  Users, 
  Sparkles, 
  ShieldAlert,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function SupervisorAccountabilityView() {
  const queryClient = useQueryClient();
  const [warningStatus, setWarningStatus] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['supervisor_accountability_pacing'],
    queryFn: async () => {
      const res = await api.get('/syllabus/accountability/supervisor');
      return res.data;
    }
  });

  const sendWarningMutation = useMutation({
    mutationFn: async (payload: { teacherId: string; cohortId: string; cohortName: string; delaySessions: number; monthNameAr: string }) => {
      return api.post('/syllabus/accountability/warn-teacher', payload);
    },
    onSuccess: (_, variables) => {
      setWarningStatus(prev => ({ ...prev, [variables.cohortId]: 'تم إرسال الإنذار الرسمي بنجاح ✓' }));
      setTimeout(() => {
        setWarningStatus(prev => ({ ...prev, [variables.cohortId]: '' }));
      }, 3500);
    },
    onError: (_, variables) => {
      setWarningStatus(prev => ({ ...prev, [variables.cohortId]: 'فشل الإرسال' }));
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">جاري فحص التزام الأساتذة بالتوزيع السنوي والشهري...</p>
      </div>
    );
  }

  const { pacingInfo, summary = {}, reports = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">نسبة الالتزام بالمنهاج</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {summary.adherenceRate || 0}%
          </div>
          <p className="text-xs text-slate-500">من إجمالي الأفواج المتابعة لشهر {pacingInfo?.monthNameAr}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">أفواج ملتزمة بالوتيرة</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {summary.onTrackCount || 0}
          </div>
          <p className="text-xs text-slate-500">تسير بدقة وفق التوزيع الشهري</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">أفواج متأخرة عن الخطة</span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mb-1">
            {summary.delayedCount || 0}
          </div>
          <p className="text-xs text-slate-500">تتطلب تنبيهاً وحصصاً استدراكية</p>
        </div>
      </div>

      {/* Accountability List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              سجل محاسبة الأساتذة وتتبع وتيرة المنهاج
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              مقارنة آلية حية بين عدد الحصص المنفذة والدروس المستهدفة لشهر {pacingInfo?.monthNameAr}.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {reports.length} أفواج تحت الرقابة
          </span>
        </div>

        <div className="space-y-4">
          {reports.map((item: any) => {
            const isDelayed = item.status === 'delayed';
            const isSlightDelay = item.status === 'slight_delay';
            const currentStatusText = isDelayed 
              ? `متأخر بـ ${item.delaySessions} حصص` 
              : isSlightDelay
              ? `تأخر طفيف (${item.delaySessions} حصة)`
              : 'ملتزم بالخطة الزمنية ✓';

            const statusClass = isDelayed
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
              : isSlightDelay
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';

            const feedback = warningStatus[item.cohortId];

            return (
              <div 
                key={item.cohortId} 
                className={`p-5 rounded-2xl border transition-all ${
                  isDelayed 
                    ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50' 
                    : isSlightDelay
                    ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {item.courseTitle} - {item.cohortName}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClass}`}>
                        {currentStatusText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">
                      الأستاذ المشرف: <span className="text-indigo-600 dark:text-indigo-400">{item.teacherName}</span> ({item.studentCount} طلاب)
                    </p>
                  </div>

                  {/* Sessions comparison */}
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                    <div>
                      <span className="block text-slate-400 text-[10px]">المنفذ:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{item.completedSessions} حصة</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">المتوقع:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{item.expectedSessions} حصة</span>
                    </div>
                  </div>
                </div>

                {/* Topics from Palestinian Monthly Syllabus */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    المفردات المستهدفة لشهر {item.monthNameAr}:
                  </span>
                  <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px]">
                    {item.currentMonthTopics}
                  </div>
                </div>

                {/* Accountability Actions */}
                <div className="mt-3 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-xs">
                    {feedback ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{feedback}</span>
                    ) : isDelayed ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        يتطلب تنبيهاً إلزامياً للأستاذ بجدولة حصص تعويضية عاجلة
                      </span>
                    ) : (
                      <span className="text-slate-400">الوتيرة منتظمة ولا تتطلب تدخلاً</span>
                    )}
                  </div>

                  {item.teacherId && (isDelayed || isSlightDelay) && (
                    <button
                      onClick={() => sendWarningMutation.mutate({
                        teacherId: item.teacherId,
                        cohortId: item.cohortId,
                        cohortName: item.cohortName,
                        delaySessions: item.delaySessions,
                        monthNameAr: item.monthNameAr
                      })}
                      disabled={sendWarningMutation.isPending || !!feedback}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      إرسال إنذار تأخير رسمي
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
