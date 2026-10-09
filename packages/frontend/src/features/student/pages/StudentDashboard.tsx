import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { DownloadCloud, Trophy, LifeBuoy } from 'lucide-react';

const motivationalQuotes = [
  "العلم نور والجهل ظلام… واصل طريقك يا بطل! 🌟",
  "كل خطوة تقطعها تقربك من حلمك… لا تتوقف! 🚀",
  "أنت أقوى مما تتصور… باقون وصامدون! 💪",
  "النجاح يبدأ بخطوة… وأنت بدأت بالفعل! ✨",
  "لا تقارن نفسك بالآخرين… قارن نفسك بالأمس! 🏆",
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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

  const completedCount = assignments.filter(
    (a: any) => a.submissions?.length > 0
  ).length;
  const pendingCount = assignments.length - completedCount;

  return (
    <div
      dir="rtl"
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="text-emerald-100 text-sm font-medium">
                مرحباً بعودتك!
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black">
              أهلاً {studentName} 👋
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

      
      {/* مساري الأكاديمي - أفواجي */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          مساري الأكاديمي (أفواجي)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentCohorts.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 font-bold">
              لم يتم تفويجك في أي فوج بعد. ستظهر هنا المواد التي تم تسجيلك بها فور اعتمادك.
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
                        !isCompleted &&
                        navigate(
                          `/student/assessments/${assignment.id}/take`
                        )
                      }
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default"
                          : "bg-gradient-to-l from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/20 hover:shadow-lg"
                      }`}
                    >
                      {isCompleted ? "✅ أحسنت! تم التسليم" : "🚀 ابدأ الحل الآن"}
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

    </div>
  );
}
