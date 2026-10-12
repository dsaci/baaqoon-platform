import React, { useState } from 'react';
import { 
  Activity, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Send, 
  Eye, 
  RefreshCw, 
  Radio, 
  MessageSquare,
  X,
  Volume2,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useNavigate } from 'react-router-dom';

interface LiveSessionItem {
  id: string;
  courseName: string;
  cohortName: string;
  teacherId: string;
  teacherName: string;
  status: string;
  statusDisplay?: 'in_progress' | 'delayed' | 'starting' | 'scheduled';
  statusLabel?: string;
  delayMinutes?: number;
  startTime: string;
  endTime: string;
  studentsCount?: number;
  attendedCount?: number;
}

interface LiveMonitoringWidgetProps {
  role?: 'admin' | 'supervisor';
  className?: string;
}

export default function LiveMonitoringWidget({ role = 'supervisor', className = '' }: LiveMonitoringWidgetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nudgeStatus, setNudgeStatus] = useState<Record<string, { status: 'idle' | 'sending' | 'sent' | 'error'; message?: string }>>({});
  const [selectedSessionForCustomNudge, setSelectedSessionForCustomNudge] = useState<LiveSessionItem | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: monitoringData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['liveSessionsMonitoring', role],
    queryFn: async () => {
      const res = await api.get('/sessions/monitoring');
      return res.data;
    },
    refetchInterval: 25000, // Poll live sessions every 25s
  });

  const nudgeMutation = useMutation({
    mutationFn: async ({ teacherId, sessionId, message }: { teacherId: string; sessionId?: string; message?: string }) => {
      const res = await api.post('/sessions/nudge-teacher', {
        teacherId,
        sessionId,
        message: message || 'تنبيه إشرافي مباشر: موعد الحصة الافتراضية الآن، يُرجى الالتحاق بالقاعة والبدء فوراً.',
        type: 'live_nudge'
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      const key = variables.sessionId || variables.teacherId;
      setNudgeStatus(prev => ({
        ...prev,
        [key]: { status: 'sent', message: 'تم إرسال التنبيه للأستاذ ✓' }
      }));
      showToast(`تم إرسال تنبيه إشرافي عاجل إلى ${data?.teacherName || 'الأستاذ'} بنجاح`);
      setTimeout(() => {
        setNudgeStatus(prev => ({
          ...prev,
          [key]: { status: 'idle' }
        }));
      }, 4000);
    },
    onError: (_, variables) => {
      const key = variables.sessionId || variables.teacherId;
      setNudgeStatus(prev => ({
        ...prev,
        [key]: { status: 'error', message: 'فشل الإرسال' }
      }));
      setTimeout(() => {
        setNudgeStatus(prev => ({
          ...prev,
          [key]: { status: 'idle' }
        }));
      }, 3000);
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleQuickNudge = (session: LiveSessionItem) => {
    const key = session.id || session.teacherId;
    setNudgeStatus(prev => ({
      ...prev,
      [key]: { status: 'sending', message: 'جاري الإرسال...' }
    }));

    const delayText = session.delayMinutes ? `(متأخر ${session.delayMinutes} دقيقة)` : '';
    const text = `تنبيه إشرافي عاجل: موعد حصة "${session.courseName} - ${session.cohortName}" بدأ الآن ${delayText}. الطلاب بانتظارك داخل القاعة، يرجى الدخول فوراً.`;

    nudgeMutation.mutate({
      teacherId: session.teacherId,
      sessionId: session.id,
      message: text
    });
  };

  const handleCustomNudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForCustomNudge) return;
    
    const key = selectedSessionForCustomNudge.id || selectedSessionForCustomNudge.teacherId;
    setNudgeStatus(prev => ({
      ...prev,
      [key]: { status: 'sending', message: 'جاري الإرسال...' }
    }));

    nudgeMutation.mutate({
      teacherId: selectedSessionForCustomNudge.teacherId,
      sessionId: selectedSessionForCustomNudge.id,
      message: customMessage || 'تنبيه إشرافي مباشر: موعد الحصة الافتراضية بدأ الآن، يرجى الالتحاق بالقاعة والبدء.'
    });

    setSelectedSessionForCustomNudge(null);
    setCustomMessage('');
  };

  const liveList: LiveSessionItem[] = monitoringData?.live || [];
  const inProgressCount = liveList.filter(s => s.statusDisplay === 'in_progress' || s.status === 'in_progress').length;
  const delayedCount = liveList.filter(s => s.statusDisplay === 'delayed').length;

  return (
    <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 font-sans relative ${className}`} dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-black animate-fade-in border border-emerald-400/30">
          <CheckCircle className="w-5 h-5 text-emerald-100 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold relative">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-900 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                المراقبة المباشرة الحالية
              </h2>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                بث حي
              </span>
              {monitoringData?.supervisedSubject?.nameAr && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  مادة التخصص: {monitoringData.supervisedSubject.nameAr}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              متابعة الحصص الافتراضية الجارية فورياً، رصد تأخر الأساتذة، وتوجيه التنبيهات الآنية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {delayedCount > 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {delayedCount} أستاذ متأخر
            </span>
          )}
          {inProgressCount > 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {inProgressCount} حصة جارية
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1 border border-slate-200/60 dark:border-slate-800"
            title="تحديث فوري لبيانات الحصص الحالية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* Live Sessions List */}
      <div className="space-y-3.5">
        {isLoading && (
          <div className="py-8 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs">جاري فحص الحصص المباشرة والاتصال بالقاعات...</span>
          </div>
        )}

        {!isLoading && liveList.length === 0 && (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              لا توجد حصص افتراضية مجدولة في هذا الوقت تحديداً
            </p>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              سيتم عرض أي حصة تبدأ تلقائياً هنا مع إمكانية الدخول التوجيهي أو تنبيه الأستاذ
            </p>
          </div>
        )}

        {liveList.map((session) => {
          const isDelayed = session.statusDisplay === 'delayed';
          const isInProgress = session.statusDisplay === 'in_progress' || session.status === 'in_progress';
          const key = session.id || session.teacherId;
          const currentNudge = nudgeStatus[key];

          return (
            <div
              key={session.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDelayed
                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
              }`}
            >
              {/* Session Info */}
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      isDelayed
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isDelayed ? (
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Radio className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                      isDelayed ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'
                    }`}
                  ></span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {session.courseName} - {session.cohortName}
                    </h3>

                    {/* Status Badge */}
                    {isInProgress && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        جاري الآن
                      </span>
                    )}

                    {isDelayed && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        تأخر الأستاذ ({session.delayMinutes || 8} د)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mt-1 flex-wrap">
                    <span className="text-slate-900 dark:text-slate-100 font-black">
                      {session.teacherName}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {session.attendedCount !== undefined 
                        ? `${session.attendedCount}/${session.studentsCount || 25} طالب` 
                        : `${session.studentsCount || 25} طالب مسجل`}
                    </span>
                    {session.delayMinutes && session.delayMinutes > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          تأخر {session.delayMinutes} دقائق عن موعد الحصة المجدول
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                {/* 1. دخول القاعة (للجلسات الجارية) */}
                {isInProgress && (
                  <button
                    onClick={() => navigate(`/sessions/${session.id}/room`)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
                    title="دخول القاعة الافتراضية للمراقبة المباشرة والتوجيه"
                  >
                    <Eye className="w-4 h-4" />
                    <span>دخول القاعة (زيارة إشرافية)</span>
                  </button>
                )}

                {/* 2. زر إرسال تنبيه للأستاذ (للجلسات المتأخرة) */}
                {isDelayed && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickNudge(session)}
                      disabled={currentNudge?.status === 'sending' || currentNudge?.status === 'sent'}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                        currentNudge?.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300'
                          : currentNudge?.status === 'sending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      }`}
                      title="إرسال تنبيه فوري ومباشر إلى حساب الأستاذ لتسجيل الدخول والبدء"
                    >
                      {currentNudge?.status === 'sent' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>{currentNudge.message || 'تم التنبيه بنجاح ✓'}</span>
                        </>
                      ) : currentNudge?.status === 'sending' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                          <span>جاري الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 text-rose-100 animate-bounce" />
                          <span>إرسال تنبيه للأستاذ</span>
                        </>
                      )}
                    </button>

                    {/* زر مراسلة إضافية مخصصة */}
                    <button
                      onClick={() => {
                        setSelectedSessionForCustomNudge(session);
                        setCustomMessage(`الأستاذ الفاضل ${session.teacherName}: موعد حصة "${session.courseName} - ${session.cohortName}" بدأ، نرجو الالتحاق بالقاعة الافتراضية فوراً لتنظيم الطلاب.`);
                      }}
                      className="p-2 rounded-xl text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all border border-rose-200 dark:border-rose-800"
                      title="كتابة نص تنبيه مخصص للأستاذ"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Custom Nudge Message */}
      {selectedSessionForCustomNudge && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl animate-fade-in font-sans" dir="rtl">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  إرسال تنبيه مخصص للأستاذ
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSessionForCustomNudge(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomNudgeSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
                  المستلم: <span className="text-slate-900 dark:text-white font-black">{selectedSessionForCustomNudge.teacherName}</span> ({selectedSessionForCustomNudge.courseName} - {selectedSessionForCustomNudge.cohortName})
                </p>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  نص التنبيه الإشرافي المباشر:
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="اكتب التنبيه هنا..."
                  required
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCustomMessage(`تنبيه إشرافي مباشر: موعد الحصة الافتراضية بدأ منذ دقائق، الطلاب في انتظارك داخل القاعة.`)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  الطلاب بانتظارك
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMessage(`نرجو الدخول فوراً وبدء الجلسة لضمان الالتزام بالخطة السنوية والجدول المعتمد.`)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  الالتزام بالخطة السنوية
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSessionForCustomNudge(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={nudgeMutation.isPending}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{nudgeMutation.isPending ? 'جاري الإرسال...' : 'إرسال التنبيه الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
