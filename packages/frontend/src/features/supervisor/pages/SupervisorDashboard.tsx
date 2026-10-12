import React, { useState } from 'react';
import { Activity, Calendar, AlertTriangle, Bell, UserX, CheckCircle, Send, MessageSquare, Users, BookOpen, BarChart3, GraduationCap, UserCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import HrManagementAdminView from '../../admin/components/HrManagementAdminView';
import SupervisorCohortsView from '../components/SupervisorCohortsView';
import SupervisorAccountabilityView from '../components/SupervisorAccountabilityView';
import SupervisorTeachersView from '../components/SupervisorTeachersView';
import { ShieldAlert } from 'lucide-react';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { Eye, Mic, Star } from 'lucide-react';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import LiveMonitoringWidget from '../../scheduling/components/LiveMonitoringWidget';

export default function SupervisorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [nudgeStatus, setNudgeStatus] = useState<Record<string, string>>({});
  const [remindersSent, setRemindersSent] = useState(false);
  const [searchParams] = useSearchParams();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const initialTab = (searchParams.get('tab') as 'stats' | 'teachers' | 'students') || 'stats';
  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students' | 'cohorts' | 'accountability'>(initialTab as any);

  
  const { data: monitoringData } = useQuery({
    queryKey: ['supervisorMonitoring'],
    queryFn: async () => {
      const res = await api.get('/sessions/monitoring');
      return res.data;
    },
  });

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['supervisorStats'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/stats');
      return res.data;
    }
  });

  const progressQuery = useQuery({
    queryKey: ['supervisorProgress'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/progress');
      return res.data;
    }
  });

  const handleNudge = async (teacherId: string, sessionId?: string) => {
    setNudgeStatus(prev => ({ ...prev, [teacherId]: 'جاري الإرسال...' }));
    try {
      await api.post('/sessions/nudge-teacher', {
        teacherId,
        sessionId,
        message: 'تنبيه إشرافي مباشر: موعد الحصة الافتراضية الآن، يُرجى الالتحاق بالقاعة والبدء.',
        type: 'live_nudge'
      });
      setNudgeStatus(prev => ({ ...prev, [teacherId]: 'تم التنبيه بنجاح ✓' }));
      setTimeout(() => {
        setNudgeStatus(prev => ({ ...prev, [teacherId]: '' }));
      }, 3000);
    } catch (err) {
      setNudgeStatus(prev => ({ ...prev, [teacherId]: 'فشل الإرسال' }));
    }
  };

  const handleSendReminders = () => {
    setRemindersSent(true);
    setTimeout(() => {
      setRemindersSent(false);
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !messageText.trim()) return;
    setIsSending(true);
    try {
      await api.post('/sessions/nudge-teacher', {
        teacherId: selectedTeacher,
        message: messageText,
        type: 'attendance_alert'
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsMessageModalOpen(false);
        setMessageText('');
      }, 1500);
    } catch (err) {
      alert('حدث خطأ أثناء إرسال التنبيه للأستاذ');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsAlertModalOpen(false);
        setMessageText('');
      }, 2000);
    }, 1000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 p-6 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-baaqoon-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-baaqoon-accent" />
            مرحباً بك {user?.firstName} {user?.lastName} - {user?.primaryRole === 'super_admin' || user?.primaryRole === 'admin' ? 'إشراف عام ومتابعة المواد (الإدارة)' : 'إشراف مادة: ' + (statsData?.supervisedSubject?.nameAr || 'غير محدد')}
          </h1>
          <p className="text-baaqoon-700 dark:text-baaqoon-300 mt-2 font-bold">
            إليك نظرة شاملة لمدارس التنسيق ومتابعة خطط المعلمين، ورصد جداولهم، وتقدم الدروس والحضور بشكل مباشر.
          </p>
        </div>
        <button
          onClick={() => navigate('/supervisor/reports')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition-all flex-shrink-0"
        >
          <BarChart3 className="w-4 h-4" />
          الإحصائيات والتقارير والنسب
        </button>
      </header>

      {/* 5 Prominent Framed Action & Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
        {/* 1. الإحصائيات والمتابعة */}
        <button 
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'stats' 
              ? 'bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white dark:from-indigo-950/60 dark:via-purple-950/30 dark:to-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            {activeTab === 'stats' ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                النشط الآن
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">مباشر</span>
            )}
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              الإحصائيات والمتابعة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              مؤشرات الأداء والرصد الحي
            </p>
          </div>
        </button>

        {/* 2. أساتذة المادة */}
        <button 
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'teachers' 
              ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/60 dark:via-teal-950/30 dark:to-slate-900 border-emerald-600 dark:border-emerald-500 shadow-md shadow-emerald-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
              {statsData?.totalTeachers || 0} أستاذ
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              أساتذة المادة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الكادر التعليمي والنشاط
            </p>
          </div>
        </button>

        {/* 3. طلبة المادة */}
        <button 
          type="button"
          onClick={() => setActiveTab('students')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'students' 
              ? 'bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/60 dark:via-sky-950/30 dark:to-slate-900 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
              {statsData?.totalStudents || 0} طالب
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              طلبة المادة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              كافة الطلبة المتاحين للتفويج والإسناد
            </p>
          </div>
        </button>

        {/* 4. الأفواج والإسناد */}
        <button 
          type="button"
          onClick={() => setActiveTab('cohorts')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'cohorts' 
              ? 'bg-gradient-to-br from-fuchsia-50/90 via-pink-50/40 to-white dark:from-fuchsia-950/60 dark:via-pink-950/30 dark:to-slate-900 border-fuchsia-600 dark:border-fuchsia-500 shadow-md shadow-fuchsia-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-fuchsia-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 font-bold group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-100/70 dark:bg-fuchsia-950/70 px-2 py-0.5 rounded-lg border border-fuchsia-200/60 dark:border-fuchsia-800/60">
              {statsData?.totalCohorts || 0} فوج
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              الأفواج والإسناد
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              إدارة الأفواج والمجموعات
            </p>
          </div>
        </button>

        {/* 5. المرافقة ومتابعة المنهاج */}
        <button 
          type="button"
          onClick={() => setActiveTab('accountability')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'accountability' 
              ? 'bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white dark:from-rose-950/60 dark:via-amber-950/30 dark:to-slate-900 border-rose-600 dark:border-rose-500 shadow-md shadow-rose-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              مرافقة فورية
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              المرافقة ومتابعة المنهاج
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الخطة السنوية والالتزام
            </p>
          </div>
        </button>
      </div>

      {activeTab === 'stats' && (
        <>
          {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-baaqoon-500">الأفواج</p>
            <p className="text-2xl font-bold text-baaqoon-900">{isLoading ? '...' : statsData?.totalCohorts || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-baaqoon-500">إجمالي الطلبة</p>
            <p className="text-2xl font-bold text-baaqoon-900">{isLoading ? '...' : statsData?.totalStudents || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-baaqoon-500">المعلمين</p>
            <p className="text-2xl font-bold text-baaqoon-900">{isLoading ? '...' : statsData?.totalTeachers || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-baaqoon-100 text-baaqoon-accent">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-baaqoon-500">التقييمات الأخيرة</p>
            <p className="text-2xl font-bold text-baaqoon-900">{isLoading ? '...' : statsData?.recentAssessments?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Monitoring Dynamic Component */}
          <LiveMonitoringWidget role="supervisor" />

          {/* Attendance Reports */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <UserX className="w-5 h-5 text-baaqoon-700 dark:text-baaqoon-300" />
              تقارير الغياب والالتزام (الجلسات السابقة)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-baaqoon-800/50 text-gray-600 dark:text-baaqoon-300 border-b border-gray-100 dark:border-baaqoon-800">
                    <th className="p-3 font-semibold">المادة والفوج</th>
                    <th className="p-3 font-semibold">الأستاذ</th>
                    <th className="p-3 font-semibold">حضور الطلبة</th>
                    <th className="p-3 font-semibold">حالة الأستاذ</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringData?.past?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">لا توجد جلسات سابقة</td>
                    </tr>
                  )}
                  {monitoringData?.past?.map((session: any) => (
                    <tr key={session.id} className="border-b border-gray-50 dark:border-baaqoon-800/50">
                      <td className="p-3">{session.courseName} - {session.cohortName}</td>
                      <td className="p-3">{session.teacherName}</td>
                      <td className={`p-3 font-medium ${session.isAbsent ? 'text-red-600' : 'text-green-600'}`}>{session.studentAttendanceText}</td>
                      <td className={`p-3 font-medium ${session.teacherStatus.includes('متأخراً') ? 'text-orange-600' : session.teacherStatus.includes('موعد') ? 'text-green-600' : 'text-red-600'}`}>{session.teacherStatus}</td>
                      <td className="p-3">
                        {session.isAbsent ? (
                          <button onClick={() => { setSelectedTeacher(session.teacherId); setIsMessageModalOpen(true); }} className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">
                            <MessageSquare className="w-4 h-4" />
                            تنبيه الأستاذ للغياب
                          </button>
                        ) : session.teacherStatus.includes('متأخراً') || session.teacherStatus.includes('لم يسجل') ? (
                          <button onClick={() => { setSelectedTeacher(session.teacherId); setIsMessageModalOpen(true); }} className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">
                            <AlertTriangle className="w-4 h-4" />
                            مراسلة الأستاذ
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Curriculum Progress Monitoring */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500" />
                متابعة نشاط الأساتذة في المنهاج (تلقائي)
              </h2>
            </div>
            <div className="space-y-4">
              {progressQuery.isLoading ? (
                <div className="text-center py-4 text-slate-500">جاري تحميل بيانات التقدم...</div>
              ) : progressQuery.data && progressQuery.data.length > 0 ? (
                progressQuery.data.map((cohortProgress: any, index: number) => {
                  const colors = [
                    { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800/50', textTitle: 'text-indigo-900 dark:text-indigo-100', textSub: 'text-indigo-700 dark:text-indigo-300', textAccent: 'text-indigo-600 dark:text-indigo-400', barBg: 'bg-indigo-200 dark:bg-indigo-900/40', barFill: 'bg-indigo-600' },
                    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/50', textTitle: 'text-emerald-900 dark:text-emerald-100', textSub: 'text-emerald-700 dark:text-emerald-300', textAccent: 'text-emerald-600 dark:text-emerald-400', barBg: 'bg-emerald-200 dark:bg-emerald-900/40', barFill: 'bg-emerald-500' },
                    { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800/50', textTitle: 'text-orange-900 dark:text-orange-100', textSub: 'text-orange-700 dark:text-orange-300', textAccent: 'text-orange-600 dark:text-orange-400', barBg: 'bg-orange-200 dark:bg-orange-900/40', barFill: 'bg-orange-500' }
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={cohortProgress.cohortId} className={`p-4 ${color.bg} rounded-lg border ${color.border}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className={`font-bold ${color.textTitle}`}>{cohortProgress.cohortName}</h3>
                          <p className={`text-xs ${color.textSub}`}>الأستاذ: {cohortProgress.teacherName}</p>
                        </div>
                        <span className={`text-sm font-bold ${color.textSub}`}>{cohortProgress.percentage}% إنجاز</span>
                      </div>
                      <div className={`w-full ${color.barBg} rounded-full h-2 mb-2`}>
                        <div className={`${color.barFill} h-2 rounded-full`} style={{ width: `${cohortProgress.percentage}%` }}></div>
                      </div>
                      <p className={`text-xs ${color.textAccent} font-medium`}>
                        أتمّ الأستاذ {cohortProgress.completedLessons} من أصل {cohortProgress.totalLessons} دروس. (تُحدّث النسبة تلقائياً بمجرد تقديم الحصة الافتراضية لمنع غفلة الأستاذ).
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">لا توجد أفواج حالياً لتتبع تقدمها.</div>
              )}
            </div>
          </section>
        </div>

        {/* Side Panel: Exam Prep & Automated Reminders (Synchronized with Annual/Monthly Syllabus) */}
        <div className="space-y-6">
          <ExamPrepWidget role="supervisor" />
        </div>
      </div>
      </>
      )}
      
      {activeTab === 'teachers' && <SupervisorTeachersView />}
      {activeTab === 'students' && <HrManagementAdminView initialRoleFilter="student" />}
        
      {activeTab === 'cohorts' && <SupervisorCohortsView />}
      {activeTab === 'accountability' && <SupervisorAccountabilityView />}

      {/* Strategic Features (Coming Soon) */}
      <ComingSoonSection 
        features={[
          {
            id: 'class_visit',
            title: 'زيارة صفية (Class Visit)',
            description: 'الانضمام إلى أي بث مباشر شغال حالياً بصلاحيات "مستمع صامت" لتقييم أداء الأستاذ دون إزعاج الطلاب.',
            icon: Eye
          },
          {
            id: 'broadcast',
            title: 'تعميم تربوي (Broadcast)',
            description: 'إرسال رسالة جماعية في المحادثات لجميع أساتذة مادة تخصصك فقط.',
            icon: Mic
          },
          {
            id: 'teacher_eval',
            title: 'تقييم الأستاذ (Teacher Evaluation)',
            description: 'استمارة تتيح لك وضع تقييم لكل أستاذ بناءً على إنجازه وتفاعله مع المنهاج.',
            icon: Star
          }
        ]} 
      />

      {/* Real Automated Modal for Messaging & Nudging Teacher */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                توجيه تنبيه / رسالة رسمية للأستاذ
              </h3>
              <button 
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {showSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <p className="font-bold text-slate-800 dark:text-white">تم إرسال التنبيه الرسمي للأستاذ بنجاح</p>
                <p className="text-xs text-slate-400">سيظهر للأستاذ في شريط الإشعارات فور دخوله</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    نص التنبيه أو التوجيه التربوي:
                  </label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب التوجيه هنا (مثال: نلفت عنايتكم إلى تسجيل غياب عدد من الطلبة في الجلسة لمتابعتهم والتحقق من التزامهم)..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? 'جاري الإرسال...' : 'إرسال التنبيه الآن'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
