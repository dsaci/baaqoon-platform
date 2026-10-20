import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../../lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  X, Check, Loader2, Users, Calendar, Clock, CheckCircle2, 
  AlertCircle, AlertTriangle, UserCheck, UserX, MessageSquare, 
  Search, ShieldCheck, ChevronDown, CheckCheck, Save, Send,
  Sparkles, BookOpen, User
} from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  cohortId?: string;
}

export default function AttendanceModal({ isOpen, onClose, sessionId, cohortId }: AttendanceModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSupervisor = user?.primaryRole === 'supervisor' || user?.primaryRole === 'subject_supervisor' || user?.primaryRole === 'super_admin' || user?.primaryRole === 'admin';

  // State
  const [selectedCohortId, setSelectedCohortId] = useState<string>(cohortId || '');
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId || '');
  const [records, setRecords] = useState<Record<string, { status: string; notes?: string }>>({});
  const [teacherStatus, setTeacherStatus] = useState<'present' | 'late' | 'absent' | 'excused'>('present');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNudging, setIsNudging] = useState(false);
  const [nudgeSuccess, setNudgeSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync props when opening
  useEffect(() => {
    if (isOpen) {
      if (sessionId) setCurrentSessionId(sessionId);
      if (cohortId) setSelectedCohortId(cohortId);
      setToastMessage(null);
    }
  }, [isOpen, sessionId, cohortId]);

  // If no sessionId passed, fetch all accessible sessions to populate dropdowns
  const { data: allSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['attendance_selectable_sessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data || [];
    },
    enabled: isOpen && !sessionId
  });

  // Extract available cohorts from sessions
  const availableCohorts = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allSessions.forEach((s: any) => {
      if (s.cohort?.id) {
        map.set(s.cohort.id, { id: s.cohort.id, name: s.cohort.name });
      }
    });
    return Array.from(map.values());
  }, [allSessions]);

  // Filter sessions by selected cohort
  const filteredSessions = useMemo(() => {
    if (!selectedCohortId) return allSessions;
    return allSessions.filter((s: any) => s.cohortId === selectedCohortId);
  }, [allSessions, selectedCohortId]);

  // Auto-pick the first session if none selected
  useEffect(() => {
    if (!sessionId && !currentSessionId && filteredSessions.length > 0) {
      setCurrentSessionId(filteredSessions[0].id);
    }
  }, [sessionId, currentSessionId, filteredSessions]);

  const activeSessionId = sessionId || currentSessionId;

  // Fetch session attendance details
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['sessionAttendance', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;
      const res = await api.get(`/sessions/${activeSessionId}/attendance`);
      return res.data;
    },
    enabled: isOpen && !!activeSessionId
  });

  // Handle both formats: array or { session, students }
  const studentsList: any[] = useMemo(() => {
    if (!attendanceData) return [];
    if (Array.isArray(attendanceData)) return attendanceData;
    return attendanceData.students || [];
  }, [attendanceData]);

  const sessionDetails = useMemo(() => {
    if (!attendanceData || Array.isArray(attendanceData)) {
      // Find from allSessions if available
      return allSessions.find((s: any) => s.id === activeSessionId) || null;
    }
    return attendanceData.session || null;
  }, [attendanceData, allSessions, activeSessionId]);

  // Populate records on fetch
  useEffect(() => {
    if (studentsList.length > 0) {
      const initial: Record<string, { status: string; notes?: string }> = {};
      studentsList.forEach((s: any) => {
        initial[s.studentId] = {
          status: s.status || 'absent_unexcused',
          notes: s.notes || ''
        };
      });
      setRecords(initial);
    }
    if (sessionDetails) {
      if (sessionDetails.teacherStatus) {
        setTeacherStatus(sessionDetails.teacherStatus);
      }
      if (sessionDetails.cancellationReason) {
        setTeacherNotes(sessionDetails.cancellationReason);
      }
    }
  }, [studentsList, sessionDetails]);

  // Save Attendance Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payloadRecords = Object.entries(records).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        notes: data.notes
      }));
      return api.patch(`/sessions/${activeSessionId}/attendance`, {
        records: payloadRecords,
        teacherStatus: isSupervisor ? teacherStatus : undefined,
        teacherNotes: isSupervisor ? teacherNotes : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['supervisorMonitoring'] });
      queryClient.invalidateQueries({ queryKey: ['cohort_details'] });
      queryClient.invalidateQueries({ queryKey: ['teacherUpcomingSession'] });
      setToastMessage('تم حفظ وتثبيت سجل الحضور والغياب بنجاح ✓');
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1000);
    },
    onError: () => {
      alert('حدث خطأ أثناء حفظ سجل الحضور والغياب');
    }
  });

  // Nudge teacher
  const handleNudgeTeacher = async () => {
    if (!sessionDetails?.teacher?.id && !sessionDetails?.teacherId) return;
    setIsNudging(true);
    try {
      await api.post('/sessions/nudge-teacher', {
        teacherId: sessionDetails?.teacher?.id || sessionDetails?.teacherId,
        sessionId: activeSessionId,
        message: 'تنبيه إشرافي مباشر: يُرجى تسجيل الحضور والالتزام بالموعد المحدد للحصة الافتراضية.',
        type: 'attendance_alert'
      });
      setNudgeSuccess(true);
      setTimeout(() => setNudgeSuccess(false), 3000);
    } catch (err) {
      alert('تعذر إرسال التنبيه للأستاذ حالياً');
    } finally {
      setIsNudging(false);
    }
  };

  // Bulk actions
  const markAllStudents = (status: 'present' | 'absent_unexcused') => {
    setRecords(prev => {
      const next = { ...prev };
      studentsList.forEach((s: any) => {
        next[s.studentId] = {
          ...(next[s.studentId] || {}),
          status
        };
      });
      return next;
    });
  };

  // Metrics
  const stats = useMemo(() => {
    const total = studentsList.length;
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    Object.values(records).forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'late') late++;
      else if (r.status === 'absent_excused') excused++;
      else absent++;
    });

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { total, present, late, excused, absent, rate };
  }, [studentsList, records]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const q = searchQuery.toLowerCase();
    return studentsList.filter((s: any) => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [studentsList, searchQuery]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto" dir="rtl">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200/90 dark:border-slate-800 my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  رصد الغياب والحضور
                </h2>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                  {isSupervisor ? 'متابعة إشرافية وتوثيق' : 'سجل الأستاذ'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {isSupervisor 
                  ? 'متابعة التزام الأستاذ بموعد الحصة ورصد حضور وغياب طلبة الفوج' 
                  : 'توثيق حضور الطلاب بدقة لتعزيز الانضباط ومتابعة التقدم الدراسي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {toastMessage && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fade-in flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {toastMessage}
              </span>
            )}
            <button 
              onClick={onClose} 
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Controls: Session / Cohort Selector (When modal opened without fixed sessionId) */}
        {!sessionId && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                تصفية حسب الفوج الدراسي:
              </label>
              <div className="relative">
                <select
                  value={selectedCohortId}
                  onChange={(e) => {
                    setSelectedCohortId(e.target.value);
                    setCurrentSessionId('');
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">جميع الأفواج الدراسية</option>
                  {availableCohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-[2]">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">
                اختر الحصة الدراسية المراد رصدها:
              </label>
              <select
                value={currentSessionId}
                onChange={(e) => setCurrentSessionId(e.target.value)}
                disabled={isLoadingSessions || filteredSessions.length === 0}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              >
                {filteredSessions.length === 0 ? (
                  <option value="">لا توجد حصص مسجلة</option>
                ) : (
                  filteredSessions.map((s: any) => {
                    const dateStr = s.scheduledStartTime ? new Date(s.scheduledStartTime).toLocaleDateString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.cohort?.name || 'فوج'}) - {dateStr}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoadingAttendance ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
              <p className="font-bold text-sm">جاري تحميل بيانات وسجل الحصة والطلاب...</p>
            </div>
          ) : !activeSessionId ? (
            <div className="text-center p-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">يرجى تحديد الحصة الدراسية من القائمة أعلاه لبدء رصد الحضور.</p>
            </div>
          ) : (
            <>
              {/* 1. Session Info Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800">
                      {sessionDetails?.cohortName || sessionDetails?.cohort?.name || 'الفوج الدراسي'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {sessionDetails?.scheduledStartTime ? new Date(sessionDetails.scheduledStartTime).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {sessionDetails?.title || 'الحصة الدراسية'}
                  </h3>
                  {sessionDetails?.teacher && (
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      الأستاذ المسؤول: <span className="text-slate-800 dark:text-white font-black">أ. {sessionDetails.teacher.firstName} {sessionDetails.teacher.lastName}</span>
                      {sessionDetails.teacher.phone && <span className="text-slate-400 font-mono text-[11px]">({sessionDetails.teacher.phone})</span>}
                    </p>
                  )}
                </div>

                {/* Session Attendance Rate Gauge */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 block">نسبة الحضور</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.rate}%</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-black text-xs text-emerald-600">
                    {stats.present + stats.late}/{stats.total}
                  </div>
                </div>
              </div>

              {/* 2. SUPERVISOR SECTION: Monitor & Record Teacher Attendance */}
              {isSupervisor && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-slate-800 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-black text-sm text-indigo-950 dark:text-indigo-200">
                        رصد التزام وحضور الأستاذ (خاص بالمشرف)
                      </h4>
                    </div>
                    {sessionDetails?.teacher && (
                      <button
                        onClick={handleNudgeTeacher}
                        disabled={isNudging}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {nudgeSuccess ? 'تم إرسال التنبيه للأستاذ ✓' : isNudging ? 'جاري الإرسال...' : 'إرسال تنبيه مباشر للأستاذ'}
                      </button>
                    )}
                  </div>

                  {/* Teacher Status Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTeacherStatus('present')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer font-black text-xs flex flex-col items-center gap-1.5 ${
                        teacherStatus === 'present'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>حضر بالموعد المحدد</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherStatus('late')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer font-black text-xs flex flex-col items-center gap-1.5 ${
                        teacherStatus === 'late'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>متأخر عن الحصة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherStatus('absent')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer font-black text-xs flex flex-col items-center gap-1.5 ${
                        teacherStatus === 'absent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                      }`}
                    >
                      <UserX className="w-4 h-4" />
                      <span>غائب (لم يقدم الحصة)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherStatus('excused')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer font-black text-xs flex flex-col items-center gap-1.5 ${
                        teacherStatus === 'excused'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>معتذر مسبقاً بعذر</span>
                    </button>
                  </div>

                  {/* Supervisor Note */}
                  <div>
                    <input
                      type="text"
                      value={teacherNotes}
                      onChange={(e) => setTeacherNotes(e.target.value)}
                      placeholder="ملاحظات المشرف على حضور الأستاذ أو سبب الاعتذار / التأخر (اختياري)..."
                      className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* 3. STUDENTS ATTENDANCE SECTION */}
              <div className="space-y-4">
                {/* Header & Bulk Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      سجل حضور وغياب الطلبة في الحصة ({stats.total} طالب)
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        حاضر: {stats.present}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        متأخر: {stats.late}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        معذور: {stats.excused}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        غائب: {stats.absent}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Fast Bulk Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => markAllStudents('present')}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="تحديد جميع الطلبة حاضرين بنقرة واحدة"
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      تحديد الكل حاضر ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllStudents('absent_unexcused')}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="تحديد الكل غائب"
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      تحديد الكل غائب
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                {studentsList.length > 5 && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث عن طالب بالاسم أو رقم الهاتف..."
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                )}

                {/* Students List */}
                {filteredStudents.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-sm">
                    {searchQuery ? 'لا يوجد طلاب يطابقون كلمة البحث' : 'لا يوجد طلاب مقيدون في هذا الفوج الدراسي حالياً'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredStudents.map((s: any, idx: number) => {
                      const currentStatus = records[s.studentId]?.status || 'absent_unexcused';
                      return (
                        <div 
                          key={s.studentId || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0">
                              {s.firstName?.[0] || 'ط'}
                            </div>
                            <div>
                              <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 block">
                                {s.firstName} {s.lastName}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                {s.phone && <span className="font-mono">{s.phone}</span>}
                                {s.email && <span className="truncate max-w-[160px]">{s.email}</span>}
                              </div>
                            </div>
                          </div>

                          {/* 4 Status Toggle Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => setRecords(prev => ({
                                ...prev,
                                [s.studentId]: { ...(prev[s.studentId] || {}), status: 'present' }
                              }))}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              حاضر
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => setRecords(prev => ({
                                ...prev,
                                [s.studentId]: { ...(prev[s.studentId] || {}), status: 'late' }
                              }))}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              متأخر
                            </button>

                            {/* Absent Excused */}
                            <button
                              type="button"
                              onClick={() => setRecords(prev => ({
                                ...prev,
                                [s.studentId]: { ...(prev[s.studentId] || {}), status: 'absent_excused' }
                              }))}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                currentStatus === 'absent_excused'
                                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              بعذر
                            </button>

                            {/* Absent Unexcused */}
                            <button
                              type="button"
                              onClick={() => setRecords(prev => ({
                                ...prev,
                                [s.studentId]: { ...(prev[s.studentId] || {}), status: 'absent_unexcused' }
                              }))}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                                currentStatus === 'absent_unexcused'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              غائب
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            إلغاء النافذة
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoadingAttendance || !activeSessionId}
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري حفظ وتثبيت السجل...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ وتثبيت سجل الحضور والغياب</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
