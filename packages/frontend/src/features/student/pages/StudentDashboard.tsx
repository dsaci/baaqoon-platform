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
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { DownloadCloud, Trophy, LifeBuoy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import RecordedLessonPlayerModal from '../../curriculum/components/recorded-lessons/RecordedLessonPlayerModal';

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
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [enrollToast, setEnrollToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedRecordedLesson, setSelectedRecordedLesson] = useState<any>(null);
  const [isRecordedPlayerOpen, setIsRecordedPlayerOpen] = useState(false);

  const studentName = user
    ? `${user.firstName} ${user.lastName}`
    : "طالب باقون";

  const quote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

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

  // Auto-open lesson if arrived from notification URL (e.g. ?tab=recorded&lessonId=...)
  useEffect(() => {
    const lessonId = searchParams.get("lessonId");
    if (lessonId && recordedLessons.length > 0) {
      const target = recordedLessons.find((l: any) => l.id === lessonId);
      if (target) {
        setSelectedRecordedLesson(target);
        setIsRecordedPlayerOpen(true);
      }
    }
  }, [searchParams, recordedLessons]);

  const unwatchedRecordedCount = recordedLessons.filter((l: any) => !l.isViewed).length;

  const completedCount = assignments.filter(
    (a: any) => a.submissions?.length > 0
  ).length;
  const pendingCount = assignments.length - completedCount;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 min-h-screen"
    >
      {/* ══════════════════════ Hero Welcome Card ══════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 md:p-10 text-white shadow-2xl shadow-emerald-500/20">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-cyan-300/10 rounded-full blur-3xl" />
        <div className="absolute top-4 left-4 w-20 h-20 bg-emerald-300/20 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="text-emerald-100 text-sm font-medium">
                {isRtl ? "مرحباً بعودتك!" : "Welcome back!"}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                {user?.gradeLevel === 'grade_11' ? (isRtl ? 'الصف الحادي عشر (11)' : '11th Grade') : (isRtl ? 'الصف الثاني عشر (توجيهي)' : '12th Grade (Tawjihi)')}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                {user?.curriculumType === 'azhari' ? (isRtl ? 'المنهج الأزهري' : 'Azhari Curriculum') : (isRtl ? 'المنهج الحكومي' : 'Government Curriculum')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black">
              {isRtl ? `أهلاً ${studentName} 👋` : `Hello ${studentName} 👋`}
            </h1>
            <p className="text-emerald-50/90 text-lg max-w-md leading-relaxed">
              {quote}
            </p>
          </div>

          {/* Avatar / Badge */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <Award className="w-10 h-10 md:w-12 md:h-12 text-yellow-300" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                باقون 🇵🇸
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ Camp & Exam Prep Reminder Widget ══════════════════════ */}
      <ExamPrepWidget role="student" />

      {/* ══════════════════════ Quick Stats ══════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/70 dark:bg-emerald-950/40 backdrop-blur-md rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {upcomingSessions.length}
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
            حصص قادمة
          </p>
        </div>

        <div className="bg-white/70 dark:bg-violet-950/40 backdrop-blur-md rounded-2xl p-5 border border-violet-100 dark:border-violet-800/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-black text-violet-700 dark:text-violet-300">
            {pendingCount}
          </p>
          <p className="text-xs text-violet-600/70 dark:text-violet-400/70 font-medium">
            واجبات معلقة
          </p>
        </div>

        <div className="bg-white/70 dark:bg-rose-950/40 backdrop-blur-md rounded-2xl p-5 border border-rose-100 dark:border-rose-800/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
            {completedCount}
          </p>
          <p className="text-xs text-rose-600/70 dark:text-rose-400/70 font-medium">
            واجبات مُنجزة
          </p>
        </div>

        <div className="bg-white/70 dark:bg-amber-950/40 backdrop-blur-md rounded-2xl p-5 border border-amber-100 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {assignments.length}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">
            إجمالي الاختبارات
          </p>
        </div>
      </div>

      
      {/* Toast Alert */}
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

      {/* مساري الأكاديمي - أفواجي ومواد فرعي الدراسي */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              مساري الأكاديمي ومواد فرعي الدراسي
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              متابعة المواد الدراسية المقررة لفرعك الدراسي والانضمام إلى أفواجها النشطة
            </p>
          </div>

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
                الانضمام لكافة مواد فرعي الدراسي (نقرة واحدة)
              </>
            )}
          </button>
        </div>

        {/* Status notice if not all subjects enrolled */}
        {branchSubjects.length > 0 && (() => {
          const enrolledSubjectsCount = branchSubjects.filter((s: any) => s.isEnrolledInSubject).length;
          const missingCount = branchSubjects.length - enrolledSubjectsCount;
          if (missingCount > 0) {
            return (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-100">
                    أنت مسجل حالياً في <span className="font-black text-emerald-700 dark:text-emerald-400">{enrolledSubjectsCount}</span> مادة من أصل <span className="font-black">{branchSubjects.length}</span> مادة مقررة لفرعك.
                    <span className="block text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      يمكنك الانضمام مباشرة للمواد المتبقية بالضغط على زر "انضمام للفوج" أمام كل مادة أدناه أو زر "الانضمام لكافة المواد".
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Subjects & Cohorts Grid */}
        {branchSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchSubjects.map((subject: any) => {
              const isEnrolled = subject.isEnrolledInSubject;
              const targetCohortId = subject.suggestedCohortId;
              const isPending = enrollSingleMutation.isPending;

              return (
                <div
                  key={subject.subjectId}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                    isEnrolled
                      ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm'
                      : 'bg-emerald-50/30 dark:bg-slate-900/40 border-emerald-200/70 dark:border-emerald-800/40 shadow-xs'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>

                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
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
                لم يتم تفويجك في أي فوج بعد. اضغط على زر "الانضمام لكافة مواد فرعي الدراسي" أعلاه للتفويج الفوري.
              </div>
            ) : (
              studentCohorts.map((cohort: any) => (
                <div key={cohort.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{cohort.name}</h3>
                    <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md shrink-0">
                      {cohort.code}
                    </span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4 text-emerald-500" /> نشط</span>
                    <span>{cohort.course?.title || 'مساق معتمد'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════ Recorded Lessons Section ══════════════════════ */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl p-6 border border-teal-100 dark:border-teal-800/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  الدروس المسجلة والمحتوى الإثرائي والتعويضي
                </h2>
                {unwatchedRecordedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                    {unwatchedRecordedCount} جديد لم تشاهده
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                عوض ما فاتك من حصص وراجع الشروحات المسجلة بأمانة وخصوصية تامة 🛡️
              </p>
            </div>
          </div>

          <Link
            to="/student/recorded-lessons"
            className="self-start sm:self-auto px-4 py-2 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5"
          >
            <span>عرض كافة الدروس المسجلة ({recordedLessons.length})</span>
            <span>←</span>
          </Link>
        </div>

        {recordedLessons.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              لا توجد دروس مسجلة حالياً. سيصلك إشعار فوري عند نشر أي درس تعويضي من قبل أساتذتك.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {recordedLessons.slice(0, 3).map((lesson: any) => {
              const isUnwatched = !lesson.isViewed;
              return (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isUnwatched
                      ? "bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-200 dark:border-emerald-800/60 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                        {lesson.subject?.nameAr || "مادة دراسية"}
                      </span>
                      {isUnwatched ? (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          جديد
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          تمت المشاهدة
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                      {lesson.title}
                    </h4>

                    {lesson.lesson?.title && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold line-clamp-1">
                        • {lesson.lesson.title}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRecordedLesson(lesson);
                      setIsRecordedPlayerOpen(true);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isUnwatched
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isUnwatched ? "مشاهدة الدرس الآن 🎥" : "إعادة المشاهدة"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════════════════ Sessions Timeline ══════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-teal-100 dark:border-teal-800/40 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                جدول حصصي
              </h2>
              <button
                onClick={() => navigate("/student/schedule")}
                className="text-xs px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-xl font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
              >
                عرض الجدول الكامل
              </button>
            </div>

            <div className="space-y-4">
              {upcomingSessions.map((session: any, idx: number) => {
                const isNow = idx === 0;
                const sessionColors = [
                  {
                    bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
                    border: "border-emerald-200 dark:border-emerald-800/50",
                    icon: "bg-emerald-500",
                    text: "text-emerald-700 dark:text-emerald-300",
                  },
                  {
                    bg: "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40",
                    border: "border-violet-200 dark:border-violet-800/50",
                    icon: "bg-violet-500",
                    text: "text-violet-700 dark:text-violet-300",
                  },
                  {
                    bg: "from-cyan-50 to-sky-50 dark:from-cyan-950/40 dark:to-sky-950/40",
                    border: "border-cyan-200 dark:border-cyan-800/50",
                    icon: "bg-cyan-500",
                    text: "text-cyan-700 dark:text-cyan-300",
                  },
                  {
                    bg: "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40",
                    border: "border-rose-200 dark:border-rose-800/50",
                    icon: "bg-rose-500",
                    text: "text-rose-700 dark:text-rose-300",
                  },
                ];
                const c = sessionColors[idx % sessionColors.length];

                return (
                  <div
                    key={session.id}
                    className={`bg-gradient-to-l ${c.bg} rounded-2xl p-5 border ${c.border} hover:shadow-md transition-all hover:-translate-y-0.5`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shrink-0 shadow-lg`}
                        >
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          {isNow && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[11px] font-bold mb-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              🔴 مباشر الآن
                            </span>
                          )}
                          <h3
                            className={`text-base font-bold ${c.text} leading-tight`}
                          >
                            {session.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(
                                session.scheduledStartTime
                              ).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(
                                session.scheduledStartTime
                              ).toLocaleDateString("ar-EG", {
                                weekday: "long",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/sessions/${session.id}/room`)
                        }
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                          isNow
                            ? "bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 animate-pulse"
                            : "bg-white/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {isNow ? "🚀 انضم الآن" : "انتظار الموعد"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {upcomingSessions.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    لا توجد حصص قادمة حالياً
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    استغل الوقت في مراجعة دروسك! أنت رائع! ⭐
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ Motivational Banner ═══════ */}
          <div className="bg-gradient-to-l from-pink-500 via-rose-500 to-fuchsia-500 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">أنت قادر على كل شيء! 💫</h3>
              <p className="text-rose-100 text-sm mt-1">
                كل يوم يمر هو فرصة جديدة للتعلم والتقدم. واصل واصل واصل!
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════ Sidebar ══════════════════════ */}
        <div className="space-y-6">
          {/* Assignments Card */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-violet-100 dark:border-violet-800/40 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                المهام والواجبات
              </h2>
            </div>

            <div className="space-y-3">
              {assignments.map((assignment: any) => {
                const isCompleted = assignment.submissions?.length > 0;
                return (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isCompleted
                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                        : "bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`p-2.5 rounded-xl shadow-sm ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckSquare size={18} />
                        ) : (
                          <FileText size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1 line-clamp-2">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center text-[11px] text-gray-500 dark:text-gray-400 gap-1">
                          <Clock size={10} />
                          <span>
                            {new Date(
                              assignment.dueDate || new Date()
                            ).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                      </div>
                      {isCompleted && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/student/assessments/${assignment.id}/take`
                        )
                      }
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                          : "bg-gradient-to-l from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/20 hover:shadow-lg"
                      }`}
                    >
                      {isCompleted ? "✅ تم التسليم — عرض النتيجة والحل" : "🚀 ابدأ الحل الآن"}
                    </button>
                  </div>
                );
              })}

              {assignments.length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-7 h-7 text-violet-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    لا توجد واجبات حالياً!
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    استغل الوقت وراجع دروسك يا بطل! 🏅
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 rounded-2xl p-5 border border-teal-100 dark:border-teal-800/40">
            <h3 className="font-bold text-sm text-teal-800 dark:text-teal-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              اختصارات سريعة
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/student/schedule")}
                className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-3 text-center hover:shadow-md transition-all hover:-translate-y-0.5 border border-teal-100 dark:border-teal-800/30"
              >
                <Calendar className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  الجدول
                </span>
              </button>
              <button
                onClick={() => navigate("/student/textbooks")}
                className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-3 text-center hover:shadow-md transition-all hover:-translate-y-0.5 border border-teal-100 dark:border-teal-800/30"
              >
                <BookOpen className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  الكتب
                </span>
              </button>
              <button
                onClick={() => navigate("/student/assessments")}
                className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-3 text-center hover:shadow-md transition-all hover:-translate-y-0.5 border border-teal-100 dark:border-teal-800/30"
              >
                <FileText className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  الاختبارات
                </span>
              </button>
              <button
                onClick={() => navigate("/student/chat")}
                className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-3 text-center hover:shadow-md transition-all hover:-translate-y-0.5 border border-teal-100 dark:border-teal-800/30"
              >
                <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  المحادثة
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Strategic Features (Coming Soon) */}
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

    </div>
  );
}
