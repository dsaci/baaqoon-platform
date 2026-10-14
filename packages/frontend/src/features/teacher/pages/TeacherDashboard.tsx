import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { Medal, BellRing } from 'lucide-react';
import { Users, Calendar, Clock, CheckCircle, PlayCircle, FileText, Video } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import SyllabusAccountabilityWidget from '../../curriculum/components/SyllabusAccountabilityWidget';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import AttendanceModal from '../../scheduling/components/AttendanceModal';
import { useTranslation } from 'react-i18next';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['teacher_sessions_dashboard'],
    queryFn: async () => {
      const res = await api.get('/sessions?mode=teacher');
      return res.data;
    }
  });

  const { data: myCohorts } = useQuery({
    queryKey: ['myCohorts', 'teacher'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me?mode=teacher');
      return res.data;
    }
  });

  const activeCohortId = myCohorts?.[0]?.id;

  const { data: progressData } = useQuery({
    queryKey: ['cohortProgress', activeCohortId],
    queryFn: async () => {
      if (!activeCohortId) return null;
      const res = await api.get(`/groups/cohorts/${activeCohortId}/progress`);
      return res.data;
    },
    enabled: !!activeCohortId
  });

  const upcomingSession = sessions.find((s: any) => new Date(s.scheduledStartTime) >= new Date() || s.status === 'in_progress') || sessions[0];

  const getFormattedTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const totalCohorts = myCohorts?.length || 0;
  const todaySessionsCount = sessions.filter((s:any) => new Date(s.scheduledStartTime).toDateString() === new Date().toDateString()).length;
  const completedSessionsCount = sessions.filter((s:any) => s.status === 'completed').length;
  const totalStudents = myCohorts?.reduce((acc: number, c: any) => acc + (c.enrollments?.length || 0), 0) || 0;

  const stats = [
    { label: t('dashboard.active_cohorts', 'الأفواج النشطة'), value: totalCohorts.toString(), icon: Users, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: t('dashboard.today_sessions', 'حصص اليوم'), value: todaySessionsCount.toString(), icon: Calendar, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: t('dashboard.completed_sessions', 'الحصص المنجزة'), value: completedSessionsCount.toString(), icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/50' },
    { label: t('dashboard.total_students', 'إجمالي الطلاب'), value: totalStudents.toString(), icon: CheckCircle, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {t('dashboard.welcome_teacher', 'مرحباً أستاذ')} {user?.firstName} {user?.lastName} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">
          {t('dashboard.teacher_overview', 'إليك نظرة عامة على نشاطك اليوم في منصة باقون.')}
        </p>
      </div>

      {/* Smart Syllabus Accountability & Progress Tracker */}
      <SyllabusAccountabilityWidget />

      {/* Camp & Exam Prep Supervisory Directive */}
      <ExamPrepWidget role="teacher" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-6 flex items-start gap-4 transition-transform hover:-translate-y-1">
              <div className={`p-4 rounded-2xl ${stat.bg} dark:bg-opacity-20 ${stat.color} shadow-inner`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Session Card */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/50 pb-4 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full shadow-sm"></span>
            الحصة القادمة
          </h2>
          
          {isLoading ? (
             <div className="flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : upcomingSession ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 rounded-[1.5rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-black bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-700/50">
                    مجدولة (Scheduled)
                  </span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                    {upcomingSession.cohort?.name || 'فوج غير معروف'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {upcomingSession.title}
                </h3>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 
                  موعد البدء: {getFormattedTime(upcomingSession.scheduledStartTime)}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(upcomingSession.id);
                    setIsAttendanceModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base cursor-pointer"
                >
                  <Users className="w-5 h-5" />
                  رصد الغياب والحضور
                </button>
                <Link 
                  to={`/sessions/${upcomingSession.id}/room`} 
                  className="w-full sm:w-auto px-7 py-4 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 flex items-center justify-center gap-3 text-base"
                >
                  <Video className="w-5 h-5 animate-pulse" />
                  بدء الحصة (Jitsi)
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-dashed border-slate-300 dark:border-slate-700">
               <p className="text-slate-500 dark:text-slate-400 font-bold">لا يوجد حصص مجدولة قادمة.</p>
            </div>
          )}
        </div>

        {/* Action Center - أزرار سريعة ومهمة */}
        <div className="glass-panel p-6 bg-gradient-to-br from-white to-baaqoon-50 dark:from-baaqoon-900 dark:to-baaqoon-800">
          <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white border-b border-baaqoon-100 dark:border-baaqoon-700 pb-4 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-baaqoon-accent rounded-full"></span>
            الوصول السريع (Quick Actions)
          </h2>

          <button
            type="button"
            onClick={() => {
              setSelectedSessionId(upcomingSession?.id);
              setIsAttendanceModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3.5 mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl transition-all shadow-md shadow-emerald-600/20 font-black text-sm group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="block leading-tight text-sm font-black">رصد الغياب والحضور للطلبة</span>
                <span className="text-[11px] opacity-85 font-bold">تسجيل الحضور اليومي وتوثيق الحصص</span>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl group-hover:bg-white/30 transition-colors">فتح السجل ←</span>
          </button>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              to="/teacher/curriculum"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-xl transition-colors border border-blue-100 dark:border-blue-800/50 group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-bold">بناء حصة ذكية</span>
              <span className="text-xs text-center opacity-70 mt-1">من البناء التعلمي الجاهز</span>
            </Link>

            <Link 
              to="/teacher/assessments"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-xl transition-colors border border-purple-100 dark:border-purple-800/50 group"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-bold">توليد اختبار ذكي</span>
              <span className="text-xs text-center opacity-70 mt-1">أسئلة مؤتمتة فورية</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-baaqoon-100 dark:border-baaqoon-800 space-y-2">
            <Link 
              to="/teacher/distribution" 
              className="flex items-center justify-between w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-800 dark:text-baaqoon-200 rounded-xl transition-colors text-sm font-bold border border-baaqoon-200 dark:border-baaqoon-700 shadow-sm"
            >
              <span>📅 التوزيع السنوي والشهري للمنهاج</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">عرض الخطة ←</span>
            </Link>
            <Link 
              to="/teacher/textbooks" 
              className="flex items-center justify-between w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-800 dark:text-baaqoon-200 rounded-xl transition-colors text-sm font-bold border border-baaqoon-200 dark:border-baaqoon-700 shadow-sm"
            >
              <span>📚 المكتبة والكتب المدرسية</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">المقررات ←</span>
            </Link>
            <Link 
              to="/teacher/assessments" 
              className="block w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg transition-colors text-sm font-medium border border-baaqoon-200 dark:border-baaqoon-700"
            >
              + إدارة وتصحيح الواجبات
            </Link>
            <Link 
              to="/teacher/chat" 
              className="block w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg transition-colors text-sm font-medium border border-baaqoon-200 dark:border-baaqoon-700"
            >
              + الدردشة والتواصل مع الطلاب
            </Link>
          </div>
        </div>

                {/* الأفواج التي أُدرسها */}
        <div className="lg:col-span-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-8 mt-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <span className="w-2 h-6 bg-gradient-to-b from-fuchsia-500 to-pink-600 rounded-full"></span>
            الأفواج التي أُدرسها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!myCohorts || myCohorts.length === 0 ? (
              <div className="col-span-3 text-center text-slate-500 font-bold py-8">لم يتم إسنادك لأي فوج بعد.</div>
            ) : (
              myCohorts.map((cohort: any) => (
                <Link 
                  key={cohort.id} 
                  to={`/teacher/cohorts/${cohort.id}`}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-violet-400 dark:hover:border-violet-600 transition-all block group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{cohort.name}</h3>
                    <span className="text-xs font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{cohort.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-bold mb-3">
                    <Users className="w-4 h-4 text-violet-500" />
                    <span>عدد الطلبة: {cohort.enrollments?.length || 0}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-black text-violet-600 dark:text-violet-400">
                    <span>فتح سجل الفوج ومتابعة الحضور</span>
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Curriculum Progress Tracker */}
        <div className="lg:col-span-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-8 mt-2">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/50 pb-4 mb-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              متابعة تقدم المنهاج وإنجاز الدروس
            </h2>
            {progressData?.cohortName && (
              <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-sm font-black rounded-full shadow-sm">
                {progressData.cohortName}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {!progressData ? (
              <div className="col-span-2 text-center text-slate-500 font-bold py-8">جاري تحميل المنهاج...</div>
            ) : progressData.units?.length === 0 ? (
              <div className="col-span-2 text-center text-slate-500 font-bold py-8">لا يوجد منهاج مرتبط بهذا الفوج.</div>
            ) : (
              progressData.units.map((unit: any, index: number) => (
                <div key={unit.id} className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 text-base flex justify-between items-center">
                    <span>الوحدة {index + 1}: {unit.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      unit.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      unit.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {unit.status === 'completed' ? 'مكتملة ✅' : unit.status === 'in_progress' ? 'قيد الإنجاز ⏳' : 'لم تبدأ بعد'}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {unit.lessons.map((lesson: any, lIndex: number) => (
                      <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-xl border ${lesson.isCompleted ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                        {lesson.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0"></div>
                        )}
                        <span className={`text-sm font-bold ${lesson.isCompleted ? 'text-slate-500 dark:text-slate-400 line-through decoration-emerald-500/50 decoration-2' : 'text-slate-700 dark:text-slate-200'}`}>
                          الدرس {lIndex + 1}: {lesson.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-slate-400 font-bold mt-8 text-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            * يتم تحديث التقدم تلقائياً بناءً على الحصص المنجزة. ويظهر هذا التقدم لمدير المنصة والمشرف التربوي.
          </p>
        </div>
      </div>

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        sessionId={selectedSessionId}
      />
    </div>
  );
}
