import React, { useState } from 'react';
import { Activity, Calendar, AlertTriangle, Bell, UserX, CheckCircle, Send, MessageSquare, Users, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function SupervisorDashboard() {
  const { user } = useAuthStore();
  const [nudgeStatus, setNudgeStatus] = useState<Record<string, string>>({});
  const [remindersSent, setRemindersSent] = useState(false);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['supervisorStats'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/stats');
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
          مرحباً بك {user?.firstName} {user?.lastName} - لوحة تحكم المشرفين
        </h1>
        <p className="text-baaqoon-700 dark:text-baaqoon-300 mt-2">
          إليك نظرة شاملة لمدارس التنسيق ومتابعة خطط المعلمين وإنجازاتهم
        </p>
      </header>

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
                مدى تقدم الدروس (المنهاج)
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-indigo-900">الفيزياء - علمي</h3>
                    <p className="text-xs text-indigo-700">أ. أحمد الخطيب</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-700">45% إنجاز</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-indigo-600">
                  آخر تحديث: أتمّ (الفصل 2: الحركة الدورانية) اليوم.
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-orange-900">اللغة العربية - أدبي</h3>
                    <p className="text-xs text-orange-700">أ. محمود حسن</p>
                  </div>
                  <span className="text-sm font-bold text-orange-700">15% إنجاز (متأخر)</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-xs text-orange-600">
                  تحذير: الأستاذ متأخر عن الخطة الزمنية بأسبوعين.
                </p>
                <button 
                  onClick={() => alert('تم توجيهك إلى شاشة المحادثات الخاصة، حيث يمكنك مناقشة خطة تدارك التأخير في المنهاج مع الأستاذ محمود حسن.')}
                  className="mt-3 text-xs bg-orange-200 text-orange-800 px-3 py-1.5 rounded-md hover:bg-orange-300 font-bold transition-colors"
                >
                  فتح تواصل رقمي مع الأستاذ
                </button>
              </div>
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
    </div>
  );
}
