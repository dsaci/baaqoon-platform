import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Clock,
  Video,
  FileText,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
  Sparkles,
  TrendingUp,
  Star,
  Zap,
  Heart,
  Target,
  Flame,
  Plus,
  CheckCircle2,
  Layers,
  Loader2,
  X,
  AlertCircle,
  Play,
  ShieldCheck,
  User,
  GraduationCap,
  Send,
  Radio,
  BookMarked,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  Smile,
  Compass
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { DownloadCloud, Trophy, LifeBuoy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import RecordedLessonPlayerModal from '../../curriculum/components/recorded-lessons/RecordedLessonPlayerModal';

/**
 * Helper to extract YouTube video ID
 */
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

const motivationalQuotes = [
  "العلم نور والجهل ظلام… واصل طريقك يا بطل! 🌟",
  "كل خطوة تقطعها تقربك من حلمك… لا تتوقف! 🚀",
  "أنت أقوى مما تتصور… باقون وصامدون! 💪",
  "النجاح يبدأ بخطوة… وأنت بدأت بالفعل! ✨",
  "لا تقارن نفسك بالآخرين… قارن نفسك بالأمس! 🏆",
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Tab State: 'today' | 'subjects' | 'recorded' | 'assignments'
  const initialTab = searchParams.get("tab") || "today";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [enrollToast, setEnrollToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedRecordedLesson, setSelectedRecordedLesson] = useState<any>(null);
  const [isRecordedPlayerOpen, setIsRecordedPlayerOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [selectedExceptionCourseId, setSelectedExceptionCourseId] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');

  const studentName = user
    ? `${user.firstName} ${user.lastName}`
    : "طالب باقون";

  const [quote] = useState(
    () => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  // Queries
  const { data: studentCohorts = [] } = useQuery({
    queryKey: ["studentCohorts"],
    queryFn: async () => {
      const res = await api.get("/groups/cohorts/me");
      return res.data;
    },
  });

  const { data: branchSubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["student_subjects_cohorts"],
    queryFn: async () => {
      const res = await api.get("/groups/student/subjects-and-cohorts");
      return res.data || [];
    },
  });

  const enrollAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/groups/student/enroll-all-branch-cohorts");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["studentCohorts"] });
      queryClient.invalidateQueries({ queryKey: ["student_subjects_cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["studentSessions"] });
      setEnrollToast({ message: data?.message || "تم تفويجك بنجاح في جميع مواد فرعك الدراسي!", type: 'success' });
      setTimeout(() => setEnrollToast(null), 5000);
    },
    onError: (err: any) => {
      setEnrollToast({ message: err?.response?.data?.message || "حدث خطأ أثناء الانضمام للمواد", type: 'error' });
      setTimeout(() => setEnrollToast(null), 5000);
    }
  });

  const enrollSingleMutation = useMutation({
    mutationFn: async (cohortId: string) => {
      const res = await api.post(`/groups/student/enroll-cohort/${cohortId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["studentCohorts"] });
      queryClient.invalidateQueries({ queryKey: ["student_subjects_cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["studentSessions"] });
      setEnrollToast({ message: data?.message || "تم الانضمام للفوج بنجاح!", type: 'success' });
      setTimeout(() => setEnrollToast(null), 5000);
    },
    onError: (err: any) => {
      setEnrollToast({ message: err?.response?.data?.message || "تعذر الانضمام للفوج حالياً", type: 'error' });
      setTimeout(() => setEnrollToast(null), 5000);
    }
  });

  const { data: availableExceptionCourses = [], isLoading: isLoadingExceptionCourses } = useQuery({
    queryKey: ["student_available_exception_courses"],
    queryFn: async () => {
      const res = await api.get("/groups/student/available-exception-courses");
      return res.data || [];
    },
    enabled: isExceptionModalOpen,
  });

  const requestExceptionMutation = useMutation({
    mutationFn: async ({ courseId, reason }: { courseId: string; reason: string }) => {
      const res = await api.post("/groups/student/request-exception-course", { courseId, reason });
      return res.data;
    },
    onSuccess: (data) => {
      setIsExceptionModalOpen(false);
      setSelectedExceptionCourseId('');
      setExceptionReason('');
      setEnrollToast({ message: data?.message || "تم إرسال طلبك الاستثنائي بنجاح للمشرف والإدارة!", type: 'success' });
      setTimeout(() => setEnrollToast(null), 6000);
    },
    onError: (err: any) => {
      setEnrollToast({ message: err?.response?.data?.message || "تعذر إرسال الطلب حالياً", type: 'error' });
      setTimeout(() => setEnrollToast(null), 5000);
    }
  });

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ["studentSessions"],
    queryFn: async () => {
      const res = await api.get("/sessions/student/me");
      return res.data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["studentAssessments"],
    queryFn: async () => {
      const res = await api.get("/assessments/student/me");
      return res.data;
    },
  });

  const { data: recordedLessons = [] } = useQuery({
    queryKey: ["studentRecordedLessons"],
    queryFn: async () => {
      const res = await api.get("/curriculum/recorded-lessons");
      return res.data || [];
    },
  });

  // Auto-open lesson if arrived from URL (?lessonId=... or ?tab=recorded)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["today", "subjects", "recorded", "assignments"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    const lessonId = searchParams.get("lessonId");
    if (lessonId && recordedLessons.length > 0) {
      const target = recordedLessons.find((l: any) => l.id === lessonId);
      if (target) {
        setActiveTab("recorded");
        setSelectedRecordedLesson(target);
        setIsRecordedPlayerOpen(true);
      }
    }
  }, [searchParams, recordedLessons]);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };

  const unwatchedRecordedCount = recordedLessons.filter((l: any) => !l.isViewed).length;
  const completedCount = assignments.filter((a: any) => a.submissions?.length > 0).length;
  const pendingCount = assignments.length - completedCount;
  const enrolledSubjectsCount = branchSubjects.filter((s: any) => s.isEnrolledInSubject).length;
  const missingSubjectsCount = branchSubjects.length - enrolledSubjectsCount;

  // Find next or ongoing session
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 min-h-screen"
    >
      {/* ══════════════════════ Toast Alert ══════════════════════ */}
      {enrollToast && (
        <div 
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-black transition-all animate-in fade-in slide-in-from-top-4 ${
            enrollToast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {enrollToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{enrollToast.message}</span>
          <button onClick={() => setEnrollToast(null)} className="p-1 hover:bg-black/5 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════ Compact & Elegant Hero Header ══════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl shadow-emerald-600/15">
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/25">
                <GraduationCap className="w-3.5 h-3.5 text-yellow-300" />
                {user?.academicBranch === 'scientific' ? 'الفرع العلمي' : 'الفرع الأدبي'}
              </span>
              <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                {user?.gradeLevel === 'grade_11' ? 'الصف الحادي عشر (11)' : 'الصف الثاني عشر (توجيهي)'}
              </span>
              <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                {user?.curriculumType === 'azhari' ? 'المنهج الأزهري' : 'المنهج الحكومي'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
              <span>أهلاً بك يا {studentName}</span>
              <span className="text-xl">👋</span>
            </h1>

            <p className="text-emerald-50/90 text-sm md:text-base font-medium max-w-xl">
              {quote}
            </p>
          </div>

          {/* Quick Status / Next Live Class CTA */}
          <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            {nextSession ? (
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
                  <span>الحصة القادمة:</span>
                </div>
                <div className="font-black text-sm text-white line-clamp-1 max-w-[200px]">
                  {nextSession.title}
                </div>
                <div className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(nextSession.scheduledStartTime).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs text-emerald-100 font-bold">لا توجد حصص مباشرة الآن</div>
                <div className="text-[11px] text-white/80">استغل وقتك في حل الواجبات ومراجعة الدروس!</div>
              </div>
            )}

            {nextSession && (
              <button
                onClick={() => navigate(`/sessions/${nextSession.id}/room`)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-xs rounded-xl transition-all shadow-md hover:scale-105 shrink-0 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>دخول الحصة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════ Progressive Tabs Bar (التدرج في الطرح) ══════════════════════ */}
      <div className="sticky top-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => changeTab("today")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "today"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Zap className={`w-4 h-4 ${activeTab === "today" ? "text-yellow-300 fill-yellow-300" : "text-emerald-500"}`} />
          <span>نبض اليوم وحصصي</span>
          {upcomingSessions.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "today" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}>
              {upcomingSessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => changeTab("subjects")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "subjects"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeTab === "subjects" ? "text-yellow-300" : "text-teal-500"}`} />
          <span>موادي وأفواجي</span>
          {missingSubjectsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === "subjects" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}>
            {branchSubjects.length > 0 ? `${enrolledSubjectsCount}/${branchSubjects.length}` : studentCohorts.length}
          </span>
        </button>

        <button
          onClick={() => changeTab("recorded")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "recorded"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Video className={`w-4 h-4 ${activeTab === "recorded" ? "text-yellow-300" : "text-cyan-500"}`} />
          <span>الدروس المسجلة</span>
          {unwatchedRecordedCount > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "recorded" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
            }`}>
              {unwatchedRecordedCount} جديد
            </span>
          )}
        </button>

        <button
          onClick={() => changeTab("assignments")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "assignments"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CheckSquare className={`w-4 h-4 ${activeTab === "assignments" ? "text-yellow-300" : "text-violet-500"}`} />
          <span>الواجبات والمهام</span>
          {pendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === "assignments" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
            }`}>
              {pendingCount} مطلوب
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════ TAB 1: نبض اليوم وحصصي (Today's Live Pulse) ══════════════════════ */}
      {activeTab === "today" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div 
              onClick={() => changeTab("today")}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs cursor-pointer hover:border-emerald-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">حصص قادمة</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
                {upcomingSessions.length}
              </div>
            </div>

            <div 
              onClick={() => changeTab("assignments")}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40 shadow-xs cursor-pointer hover:border-violet-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">واجبات معلقة</span>
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-violet-700 dark:text-violet-400 mt-2">
                {pendingCount}
              </div>
            </div>

            <div 
              onClick={() => changeTab("recorded")}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">دروس غير مشاهدة</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">
                {unwatchedRecordedCount}
              </div>
            </div>

            <div 
              onClick={() => changeTab("subjects")}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/40 shadow-xs cursor-pointer hover:border-cyan-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">المواد المسجلة</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-cyan-700 dark:text-cyan-400 mt-2">
                {branchSubjects.length > 0 ? `${enrolledSubjectsCount}/${branchSubjects.length}` : studentCohorts.length}
              </div>
            </div>
          </div>

          {/* Exam Prep Reminders (Compact) */}
          <ExamPrepWidget role="student" />

          {/* Live Sessions Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">جدول الحصص المباشرة</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">الحصص التفاعلية مع أساتذتك عبر الإنترنت</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/student/schedule")}
                    className="text-xs px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold hover:bg-emerald-100 transition-all flex items-center gap-1"
                  >
                    <span>الجدول الكامل</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-10 space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">لا توجد حصص مباشرة مقررة اليوم</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      يمكنك استثمار هذا الوقت في مراجعة بنك الدروس المسجلة أو إنهاء واجباتك المتبقية!
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={() => changeTab("recorded")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
                      >
                        🎥 فتح الدروس المسجلة
                      </button>
                      <button
                        onClick={() => changeTab("assignments")}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                      >
                        📝 فتح الواجبات
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session: any, idx: number) => {
                      const isNow = idx === 0;
                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isNow
                              ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-300 dark:border-emerald-700 shadow-sm"
                              : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                              isNow ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}>
                              <Video className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {isNow && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-[10px] font-black">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    مباشر الآن أو قريباً
                                  </span>
                                )}
                                <span className="text-xs font-mono font-bold text-slate-400">
                                  {session.cohort?.name || "فوج معتمد"}
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                {session.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                  {new Date(session.scheduledStartTime).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(session.scheduledStartTime).toLocaleDateString("ar-EG", {
                                    weekday: "long",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/sessions/${session.id}/room`)}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm ${
                              isNow
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25 animate-pulse"
                                : "bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isNow ? "🚀 انضم الآن" : "انتظار الموعد"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Motivational Card */}
              <div className="bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-600 rounded-3xl p-5 text-white shadow-md flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-black text-sm">أنت أمل المستقبل وصانع الغد! 🇵🇸</h3>
                  <p className="text-emerald-50 text-xs mt-0.5">
                    كل ساعة تبذلها في طلب العلم هي خطوة راسخة نحو البناء والتميز.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Sidebar */}
            <div className="space-y-4">
              {/* Quick Links */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>الوصول السريع</span>
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => navigate("/student/textbooks")}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-right transition-all border border-slate-200/60 dark:border-slate-700/60 group cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="font-black text-xs text-slate-800 dark:text-white">المكتبة والكتب</div>
                    <div className="text-[10px] text-slate-400">المناهج الرسمية</div>
                  </button>

                  <button
                    onClick={() => navigate("/student/chat")}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-right transition-all border border-slate-200/60 dark:border-slate-700/60 group cursor-pointer"
                  >
                    <Send className="w-5 h-5 text-cyan-600 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="font-black text-xs text-slate-800 dark:text-white">المحادثة والمساعدة</div>
                    <div className="text-[10px] text-slate-400">التواصل مع الأساتذة</div>
                  </button>

                  <button
                    onClick={() => navigate("/student/schedule")}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-right transition-all border border-slate-200/60 dark:border-slate-700/60 group cursor-pointer"
                  >
                    <Calendar className="w-5 h-5 text-violet-600 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="font-black text-xs text-slate-800 dark:text-white">جدول الأسبوع</div>
                    <div className="text-[10px] text-slate-400">مواعيد كل الحصص</div>
                  </button>

                  <button
                    onClick={() => changeTab("recorded")}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right transition-all border border-slate-200/60 dark:border-slate-700/60 group cursor-pointer"
                  >
                    <Video className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="font-black text-xs text-slate-800 dark:text-white">الدروس المسجلة</div>
                    <div className="text-[10px] text-slate-400">{recordedLessons.length} درس مسجل</div>
                  </button>
                </div>
              </div>

              {/* Pending Assignments Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    <span>واجبات عاجلة</span>
                  </h3>
                  <button
                    onClick={() => changeTab("assignments")}
                    className="text-xs text-violet-600 font-bold hover:underline"
                  >
                    عرض الكل ({assignments.length})
                  </button>
                </div>

                {assignments.filter((a: any) => !a.submissions?.length).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      رائع! لا توجد واجبات معلقة حالياً
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignments
                      .filter((a: any) => !a.submissions?.length)
                      .slice(0, 3)
                      .map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {task.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(task.dueDate || new Date()).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/student/assessments/${task.id}/take`)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-black shrink-0 transition-all shadow-xs"
                          >
                            حل الآن
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB 2: موادي وأفواجي (Subjects & Cohorts) ══════════════════════ */}
      {activeTab === "subjects" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <span>مواد فرعي الدراسي والأفواج النشطة</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                  المقررات المعتمدة لفرعك ({user?.academicBranch === 'scientific' ? 'العلمي' : 'الأدبي'}) والأفواج التي تدرسها
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsExceptionModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>طلب مادة استثنائية (خارج الفرع)</span>
                </button>

                <button
                  onClick={() => enrollAllMutation.mutate()}
                  disabled={enrollAllMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {enrollAllMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الانضمام لكافة المواد...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      الانضمام لكافة مواد فرعي (نقرة واحدة)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notice if not fully enrolled */}
            {branchSubjects.length > 0 && missingSubjectsCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-100">
                  أنت مسجل حالياً في <span className="font-black text-emerald-700 dark:text-emerald-400">{enrolledSubjectsCount}</span> مادة من أصل <span className="font-black">{branchSubjects.length}</span> مادة مقررة لفرعك.
                  <span className="block text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    اضغط على زر "الانضمام لكافة مواد فرعي" للتسجيل التلقائي في الأفواج المفتوحة دفعة واحدة.
                  </span>
                </div>
              </div>
            )}

            {/* Subjects Grid */}
            {isLoadingSubjects ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                جاري تحميل المواد الدراسية...
              </div>
            ) : branchSubjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {branchSubjects.map((subject: any) => {
                  const isEnrolled = subject.isEnrolledInSubject;
                  const targetCohortId = subject.suggestedCohortId;
                  const isPending = enrollSingleMutation.isPending;

                  return (
                    <div
                      key={subject.subjectId}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                        isEnrolled
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                          : 'bg-emerald-50/30 dark:bg-slate-900/40 border-emerald-200/70 dark:border-emerald-800/40'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-600" />

                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {subject.subjectName}
                          </h3>
                          <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                            {subject.subjectCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                          {subject.courseTitle}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold">
                        {isEnrolled ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 w-full justify-between">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              مسجل بالفوج:
                            </span>
                            <span className="font-black truncate max-w-[140px]">{subject.enrolledCohortName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[11px] text-slate-400 font-bold">لم تنضم بعد</span>
                            {targetCohortId ? (
                              <button
                                onClick={() => enrollSingleMutation.mutate(targetCohortId)}
                                disabled={isPending}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                انضمام للفوج
                              </button>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                                بانتظار فتح فوج
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentCohorts.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 font-bold">
                    لم يتم تفويجك في أي فوج بعد. اضغط على زر "الانضمام لكافة مواد فرعي" أعلاه للتفويج الفوري.
                  </div>
                ) : (
                  studentCohorts.map((cohort: any) => (
                    <div key={cohort.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-base text-slate-800 dark:text-white leading-tight">{cohort.name}</h3>
                        <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                          {cohort.code}
                        </span>
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> نشط</span>
                        <span>{cohort.course?.title || 'مساق معتمد'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB 3: الدروس المسجلة (Recorded Lessons) ══════════════════════ */}
      {activeTab === "recorded" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-[#E5E0D5] dark:border-zinc-700 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D5]/70 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#394C2A] to-[#1F2A18] text-[#BAAA80] flex items-center justify-center shadow-md shadow-[#1F2A18]/20 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-[#19232D] dark:text-white">
                      بنك الدروس المسجلة والمحتوى الإثرائي
                    </h2>
                    {unwatchedRecordedCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FAF5E6] dark:bg-[#322A1A] text-[#8E793E] dark:text-[#E2C97F] border border-[#D5C189]/50 animate-pulse">
                        {unwatchedRecordedCount} درس جديد لم تشاهده
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold mt-0.5">
                    عوض ما فاتك من حصص وراجع الشروحات بدقة HD بأمانة وموثوقية 🛡️
                  </p>
                </div>
              </div>

              <Link
                to="/student/recorded-lessons"
                className="self-start sm:self-auto px-4 py-2 bg-[#F5F2EA] dark:bg-zinc-700 hover:bg-[#EAE4D5] dark:hover:bg-zinc-600 text-[#394C2A] dark:text-[#A8C794] rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 border border-[#DFDACF] dark:border-zinc-600 shadow-2xs"
              >
                <span>فتح الفهرس الكامل ({recordedLessons.length})</span>
                <span>←</span>
              </Link>
            </div>

            {recordedLessons.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[#DFDACF] dark:border-zinc-700 bg-[#FAF7F2]/60 dark:bg-zinc-900/40">
                <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                  لا توجد دروس مسجلة حالياً. سيصلك إشعار فوري عند نشر أي درس تعويضي من قبل أساتذتك.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                {recordedLessons.map((lesson: any) => {
                  const isUnwatched = !lesson.isViewed;
                  const ytId = getYouTubeId(lesson.mediaUrl);
                  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

                  return (
                    <div
                      key={lesson.id}
                      className={`bg-white dark:bg-zinc-800 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-lg hover:-translate-y-1 ${
                        isUnwatched
                          ? "border-[#BAAA80] dark:border-[#5D532E] ring-1 ring-[#BAAA80]/20"
                          : "border-[#E5E0D5] dark:border-zinc-700"
                      }`}
                    >
                      <div>
                        {/* 16:9 Thumbnail Cover */}
                        <div
                          onClick={() => {
                            setSelectedRecordedLesson(lesson);
                            setIsRecordedPlayerOpen(true);
                          }}
                          className="relative aspect-video w-full bg-[#1F2A18] overflow-hidden cursor-pointer"
                        >
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={lesson.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#394C2A] to-[#1F2A18] flex flex-col items-center justify-center p-4 text-center text-white/90">
                              <GraduationCap className="w-10 h-10 text-[#BAAA80] mb-2 opacity-80" />
                              <span className="text-xs font-bold text-white/90 line-clamp-2">{lesson.title}</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-[#FAF7F2] border border-white/20 flex items-center gap-1 shadow-sm">
                              <BookOpen className="w-2.5 h-2.5 text-[#BAAA80]" />
                              <span>{lesson.subject?.nameAr || "المادة"}</span>
                            </span>

                            {isUnwatched ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#BAAA80] to-[#8E8759] text-[#19232D] shadow-sm flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>جديد</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>تمت المشاهدة</span>
                              </span>
                            )}
                          </div>

                          {/* Hover Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-[#BAAA80] group-hover:text-[#19232D] transition-all duration-300">
                              <Play className="w-5 h-5 fill-current translate-x-0.5" />
                            </div>
                          </div>

                          {/* Bottom Tag */}
                          <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-[10px] text-white/90 font-bold z-10">
                            <span className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10 text-[#BAAA80]">
                              HD 1080p
                            </span>
                            <span className="text-white/80">
                              {lesson.isGlobalSubject ? "متاح للجميع" : (lesson.cohort?.name || "فوجك")}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-2.5">
                          <h4
                            onClick={() => {
                              setSelectedRecordedLesson(lesson);
                              setIsRecordedPlayerOpen(true);
                            }}
                            className="text-sm font-black text-[#19232D] dark:text-white group-hover:text-[#394C2A] dark:group-hover:text-[#A8C794] transition-colors line-clamp-1 cursor-pointer"
                          >
                            {lesson.title}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-[#E5E0D5]/60 dark:border-zinc-700/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <User className="w-3 h-3 text-[#394C2A] dark:text-[#A8C794] shrink-0" />
                              <span className="truncate">
                                {lesson.creator ? `${lesson.creator.firstName} ${lesson.creator.lastName}` : "أستاذ المادة"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(lesson.createdAt).toLocaleDateString("ar-EG", {
                                  month: "short",
                                  day: "numeric"
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="p-3 bg-[#FAF7F2]/60 dark:bg-zinc-900/40 border-t border-[#E5E0D5] dark:border-zinc-700/60">
                        <button
                          onClick={() => {
                            setSelectedRecordedLesson(lesson);
                            setIsRecordedPlayerOpen(true);
                          }}
                          className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isUnwatched
                              ? "bg-gradient-to-l from-[#BAAA80] to-[#394C2A] hover:opacity-95 text-white shadow-xs hover:-translate-y-0.5"
                              : "bg-white dark:bg-zinc-800 hover:bg-[#F5F2EA] dark:hover:bg-zinc-700 text-[#19232D] dark:text-zinc-200 border border-[#DFDACF] dark:border-zinc-700"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isUnwatched ? "مشاهدة الدرس الآن 🎥" : "إعادة المشاهدة"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB 4: الواجبات والمهام (Assignments & Tasks) ══════════════════════ */}
      {activeTab === "assignments" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    قائمة الواجبات والاختبارات التقييمية
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    حل التكليفات والاختبارات لمتابعة مستواك الأكاديمي أولاً بأول
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-violet-50 text-violet-700 border border-violet-200">
                  إجمالي: {assignments.length}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  مكتمل: {completedCount}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  معلق: {pendingCount}
                </span>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <Star className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد واجبات أو اختبارات حالياً</p>
                <p className="text-xs text-slate-400 mt-1">أحسنت! أنت منجز لجميع مهامك الأكاديمية 🏅</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment: any) => {
                  const isCompleted = assignment.submissions?.length > 0;
                  return (
                    <div
                      key={assignment.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isCompleted
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-white dark:bg-slate-900 border-violet-200/80 dark:border-violet-800/40 shadow-xs hover:border-violet-400"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
                          }`}>
                            {isCompleted ? "✅ تم التسليم" : "⏳ مطلوب حله"}
                          </span>

                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(assignment.dueDate || new Date()).toLocaleDateString("ar-EG")}
                          </span>
                        </div>

                        <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {assignment.title}
                        </h3>
                        {assignment.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1.5 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => navigate(`/student/assessments/${assignment.id}/take`)}
                          className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                            isCompleted
                              ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                              : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20"
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>عرض النتيجة والحل</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>ابدأ الحل الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ Strategic Features (Coming Soon) ══════════════════════ */}
      <ComingSoonSection 
        features={[
          {
            id: 'offline',
            title: 'العمل بدون إنترنت (Offline Sync)',
            description: 'تحميل المكتبة والامتحانات لحلها والإنترنت مقطوع، وإرسال النتيجة آلياً عند عودة الاتصال.',
            icon: DownloadCloud
          },
          {
            id: 'trophies',
            title: 'سجل إنجازاتي (My Trophies)',
            description: 'لوحة تظهر أوسمتك، نقاطك، وترتيبك بين زملائك في الفوج لرفع حماسك.',
            icon: Trophy
          },
          {
            id: 'help',
            title: 'طلب مساعدة سريع (Ask for Help)',
            description: 'إرسال تنبيه سريع للأستاذ أثناء المذاكرة بضغطة زر عند مواجهة صعوبة في فهم الدرس.',
            icon: LifeBuoy
          }
        ]} 
      />

      {/* ══════════════════════ Modals ══════════════════════ */}
      {/* Recorded Lesson Player Modal */}
      {selectedRecordedLesson && (
        <RecordedLessonPlayerModal
          lesson={selectedRecordedLesson}
          isOpen={isRecordedPlayerOpen}
          onClose={() => {
            setIsRecordedPlayerOpen(false);
            setSelectedRecordedLesson(null);
          }}
          onViewRecorded={(lessonId) => {
            queryClient.setQueryData(["studentRecordedLessons"], (old: any[] = []) =>
              old.map((l) => (l.id === lessonId ? { ...l, isViewed: true, hasAcceptedPledge: true } : l))
            );
          }}
        />
      )}

      {/* Exception Course Request Modal */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-right animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    طلب دراسة مادة استثنائية (خارج فرعك)
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    فرعك الحالي: <span className="text-emerald-600 dark:text-emerald-400 font-black">{user?.academicBranch === 'scientific' ? 'علمي' : 'أدبي'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExceptionModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 font-bold space-y-1">
                <p>💡 هذا الطلب مخصص للطلاب الراغبين في دراسة مادة إضافية خارج خطتهم الدراسية (مثل رغبة طالب أدبي في دراسة الرياضيات العلمي للتحضير لامتحان القبول الجامعي).</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">يصل الطلب مباشرة لإدارة المنصة ومشرف المادة لمراجعته وتعيين فوج دراسي لك.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المادة المطلوبة استثنائياً: <span className="text-rose-500">*</span>
                </label>
                {isLoadingExceptionCourses ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري تحميل المواد المتاحة...
                  </div>
                ) : (
                  <select
                    value={selectedExceptionCourseId}
                    onChange={(e) => setSelectedExceptionCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">-- اضغط لاختيار المادة والمقرر --</option>
                    {availableExceptionCourses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.subject?.nameAr} • الفرع {c.academicBranch === 'scientific' ? 'العلمي' : 'الأدبي'} ({c.gradeLevel === 'grade_11' ? 'صف 11' : 'صف 12'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سبب أو مبرر طلب دراسة المادة:
                </label>
                <textarea
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="مثال: أرغب بالالتحاق بفوج الرياضيات تحضيراً لامتحان القبول الجامعي أو تقوية نفسي في المادة..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExceptionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!selectedExceptionCourseId || requestExceptionMutation.isPending}
                onClick={() => {
                  requestExceptionMutation.mutate({
                    courseId: selectedExceptionCourseId,
                    reason: exceptionReason
                  });
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                {requestExceptionMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    إرسال الطلب للإدارة
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}