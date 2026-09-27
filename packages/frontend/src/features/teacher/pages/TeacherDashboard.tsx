import React from 'react';
import { Link } from 'react-router-dom';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { Medal, BellRing } from 'lucide-react';
import { Users, Calendar, Clock, CheckCircle, PlayCircle, FileText, Video } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['teacher_sessions_dashboard'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    }
  });

  const { data: myCohorts } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me');
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
    return new Date(dateString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const totalCohorts = myCohorts?.length || 0;
  const todaySessionsCount = sessions.filter((s:any) => new Date(s.scheduledStartTime).toDateString() === new Date().toDateString()).length;
  const completedSessionsCount = sessions.filter((s:any) => s.status === 'completed').length;
  const totalStudents = myCohorts?.reduce((acc: number, c: any) => acc + (c.enrollments?.length || 0), 0) || 0;

  const stats = [
    { label: 'الأفواج النشطة', value: totalCohorts.toString(), icon: Users, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'حصص اليوم', value: todaySessionsCount.toString(), icon: Calendar, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'الحصص المنجزة', value: completedSessionsCount.toString(), icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/50' },
    { label: 'إجمالي الطلاب', value: totalStudents.toString(), icon: CheckCircle, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">مرحباً أستاذ {user?.firstName} {user?.lastName} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">إليك نظرة عامة على نشاطك اليوم في منصة باقون.</p>
      </div>

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
              
              <Link 
                to={`/sessions/${upcomingSession.id}/room`} 
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
              >
                <Video className="w-6 h-6 animate-pulse" />
                بدء الحصة (Jitsi)
              </Link>
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
    </div>
  );
}
