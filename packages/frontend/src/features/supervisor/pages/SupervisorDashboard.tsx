import React, { useState } from 'react';
import { Activity, Calendar, AlertTriangle, Bell, UserX, CheckCircle, Send, MessageSquare, Users, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import SupervisorHrView from '../components/SupervisorHrView';
import ActivityLogsView from '../../admin/components/ActivityLogsView';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { Eye, Mic, Star } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuthStore();
  const [nudgeStatus, setNudgeStatus] = useState<Record<string, string>>({});
  const [remindersSent, setRemindersSent] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'stats' | 'teachers' | 'students') || 'stats';
  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students' | 'activity'>(initialTab as any);

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

  const handleNudge = (id: string) => {
    setNudgeStatus(prev => ({ ...prev, [id]: 'جاري الإرسال...' }));
    setTimeout(() => {
      setNudgeStatus(prev => ({ ...prev, [id]: 'تم التنبيه' }));
    }, 1500);
  };

  const handleSendReminders = () => {
    setRemindersSent(true);
    setTimeout(() => {
      setRemindersSent(false);
    }, 3000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 p-6 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-baaqoon-900 dark:text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-baaqoon-accent" />
          مرحباً بك {user?.firstName} {user?.lastName} - {user?.primaryRole === 'super_admin' || user?.primaryRole === 'admin' ? 'إشراف عام ومتابعة المواد (الإدارة)' : 'إشراف مادة: ' + (statsData?.supervisedSubject?.nameAr || 'غير محدد')}
        </h1>
        <p className="text-baaqoon-700 dark:text-baaqoon-300 mt-2 font-bold">
          إليك نظرة شاملة لمدارس التنسيق ومتابعة خطط المعلمين، ورصد جداولهم، وتقدم الدروس والحضور بشكل مباشر.
        </p>
      </header>

      <div className="flex border-b border-baaqoon-200 dark:border-baaqoon-800 mb-6 gap-4">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`pb-3 font-bold transition-all border-b-2 ${activeTab === 'stats' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          الإحصائيات والمتابعة
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`pb-3 font-bold transition-all border-b-2 ${activeTab === 'teachers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          أساتذة المادة
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`pb-3 font-bold transition-all border-b-2 ${activeTab === 'students' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          طلبة المادة
        </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`pb-3 font-bold transition-all border-b-2 ${activeTab === 'activity' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            سجل النشاط
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
        {/* Live Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              المراقبة المباشرة الحالية
            </h2>
            <div className="space-y-4">
              {/* Session 1 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-baaqoon-800/50 rounded-lg border border-gray-100 dark:border-baaqoon-800">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">فيزياء - ع-1</h3>
                    <p className="text-sm text-gray-500 dark:text-baaqoon-400">أ. أحمد الخطيب</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    جاري الآن
                  </span>
                </div>
              </div>
              
              {/* Session 2 */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">رياضيات - ع-3</h3>
                    <p className="text-sm text-gray-500 dark:text-baaqoon-400">أ. سارة محمد</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    تأخر الأستاذ
                  </span>
                  <button 
                    onClick={() => handleNudge('session-2')}
                    disabled={!!nudgeStatus['session-2']}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      nudgeStatus['session-2'] === 'تم التنبيه' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-baaqoon-accent text-white hover:bg-opacity-90'
                    }`}
                  >
                    {nudgeStatus['session-2'] === 'تم التنبيه' ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    {nudgeStatus['session-2'] || 'إرسال تنبيه للأستاذ'}
                  </button>
                </div>
              </div>
            </div>
          </section>

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
                  <tr className="border-b border-gray-50 dark:border-baaqoon-800/50">
                    <td className="p-3">لغة عربية - أ-2</td>
                    <td className="p-3">أ. محمود حسن</td>
                    <td className="p-3 text-red-600 font-medium">تغيب 3 طلاب</td>
                    <td className="p-3 text-green-600">حضر بالموعد</td>
                    <td className="p-3">
                      <button onClick={() => alert('تم إرسال إشعار للطلبة الثلاثة لتذكيرهم بأهمية الحضور وعدم الغياب.')} className="text-baaqoon-accent hover:underline flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        تنبيه الغائبين
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">كيمياء - ع-2</td>
                    <td className="p-3">أ. خالد يوسف</td>
                    <td className="p-3 text-green-600">حضور كامل</td>
                    <td className="p-3 text-orange-600 font-medium">حضر متأخراً 10 دقائق</td>
                    <td className="p-3">
                      <button onClick={() => alert('سيتم فتح شاشة محادثة للتواصل مع الأستاذ خالد يوسف بخصوص تأخره.')} className="text-gray-500 dark:text-baaqoon-400 hover:text-gray-800 dark:text-white flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        مراسلة الأستاذ
                      </button>
                    </td>
                  </tr>
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

        {/* Side Panel: Exam Prep & Reminders */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-baaqoon-700 dark:text-baaqoon-300" />
              التحضير للاختبارات والتذكيرات
            </h2>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-1">معسكر المراجعة الربع سنوي</h3>
              <p className="text-sm text-blue-700 mb-3">يبدأ بعد 5 أيام (متبقي 120 ساعة)</p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-baaqoon-300">إرسال تذكيرات آلية للطلبة حول المعسكر القادم للتسجيل والتحضير.</p>
              <button 
                onClick={handleSendReminders}
                disabled={remindersSent}
                className={`w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  remindersSent 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-baaqoon-900 text-white hover:bg-opacity-90'
                }`}
              >
                {remindersSent ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    تم إرسال التذكيرات (SMS/App)
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    تفعيل التذكير الآلي للجميع
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
      </>
      )}
      
      {activeTab === 'teachers' && <SupervisorHrView role="teacher" />}
      {activeTab === 'students' && <SupervisorHrView role="student" />}
        {activeTab === 'activity' && <ActivityLogsView />}

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

    </div>
  );
}
