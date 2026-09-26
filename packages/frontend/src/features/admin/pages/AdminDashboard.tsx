import React, { useState } from 'react';
import { Users, BookOpen, CheckCircle, Clock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending_teachers' | 'cohorts' | 'assignments'>('pending_teachers');

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/stats');
      return res.data;
    }
  });

  // Mock data states for demonstration
  const [pendingTeachers, setPendingTeachers] = useState([
    { id: 1, name: 'أ. أحمد الخطيب', subject: 'فيزياء', date: 'اليوم، 10:30 صباحاً', country: '🇵🇸 فلسطين' },
    { id: 2, name: 'أ. سارة عبدالله', subject: 'رياضيات', date: 'اليوم، 08:15 صباحاً', country: '🇵🇸 فلسطين' },
    { id: 3, name: 'أ. محمد بوعلام', subject: 'اللغة الفرنسية', date: 'أمس، 14:20', country: '🇩🇿 الجزائر' },
    { id: 4, name: 'أ. فاطمة الزهراء', subject: 'العلوم الإسلامية', date: 'أمس، 09:00', country: '🇩🇿 الجزائر' },
    { id: 5, name: 'أ. محمود النجار', subject: 'كيمياء', date: 'منذ يومين', country: '🇵🇸 فلسطين' },
  ]);

  const [cohorts, setCohorts] = useState([
    { id: 'ع-1', name: 'علمي - 1', students: 20, max: 20, active: true },
    { id: 'ع-2', name: 'علمي - 2', students: 15, max: 20, active: true },
    { id: 'ع-3', name: 'علمي - 3', students: 2, max: 20, active: false },
    { id: 'أ-1', name: 'أدبي - 1', students: 20, max: 20, active: true },
    { id: 'أ-2', name: 'أدبي - 2', students: 18, max: 20, active: true },
    { id: 'ص-1', name: 'صناعي - 1', students: 8, max: 20, active: true },
    { id: 'ش-1', name: 'شرعي - 1', students: 12, max: 20, active: true },
  ]);

  const [approvedCount, setApprovedCount] = useState(45);
  const [assignments, setAssignments] = useState<{teacher: string, cohort: string}[]>([]);

  // Action handlers
  const handleAccept = (id: number) => {
    setPendingTeachers(prev => prev.filter(t => t.id !== id));
    setApprovedCount(prev => prev + 1);
  };

  const handleReject = (id: number) => {
    setPendingTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateCohort = () => {
    const nextId = `ع-${cohorts.filter(c => c.id.startsWith('ع')).length + 1}`;
    setCohorts(prev => [
      { id: nextId, name: `علمي - ${nextId.split('-')[1]}`, students: 0, max: 20, active: true },
      ...prev
    ]);
  };

  const [assignmentForm, setAssignmentForm] = useState(false);

  const stats = [
    { label: 'الأساتذة المعتمدين', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/40' },
    { label: 'إجمالي الطلبة', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'الأفواج التربوية', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'الجلسات النشطة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white">مرحباً بك {user?.firstName} {user?.lastName} - لوحة تحكم الإدارة 👋</h1>
        <p className="text-baaqoon-500 dark:text-baaqoon-400 mt-1">إليك نظرة شاملة على نشاط المنصة وحالة الطلبات.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-6 flex items-start gap-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-baaqoon-500 dark:text-baaqoon-400">{stat.label}</p>
                <p className="text-2xl font-bold text-baaqoon-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Admin Panel */}
      <div className="glass-panel overflow-hidden">
        <div className="flex border-b border-baaqoon-100 dark:border-baaqoon-800">
          <button 
            onClick={() => setActiveTab('pending_teachers')}
            className={`px-6 py-4 text-sm font-bold transition-colors ${activeTab === 'pending_teachers' ? 'text-baaqoon-accent border-b-2 border-baaqoon-accent bg-baaqoon-50 dark:bg-baaqoon-950/50 dark:bg-baaqoon-800/30' : 'text-baaqoon-500 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/20'}`}
          >
            اعتماد الأساتذة
            {pendingTeachers.length > 0 && (
              <span className="mr-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded-full">
                {pendingTeachers.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('cohorts')}
            className={`px-6 py-4 text-sm font-bold transition-colors ${activeTab === 'cohorts' ? 'text-baaqoon-accent border-b-2 border-baaqoon-accent bg-baaqoon-50 dark:bg-baaqoon-950/50 dark:bg-baaqoon-800/30' : 'text-baaqoon-500 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/20'}`}
          >
            التفويج (الأفواج التربوية)
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-4 text-sm font-bold transition-colors ${activeTab === 'assignments' ? 'text-baaqoon-accent border-b-2 border-baaqoon-accent bg-baaqoon-50 dark:bg-baaqoon-950/50 dark:bg-baaqoon-800/30' : 'text-baaqoon-500 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/20'}`}
          >
            الإسناد (ربط الأستاذ بالفوج)
          </button>
        </div>

        <div className="p-6 min-h-[400px]">
          
          {/* Tab 1: Pending Teachers */}
          {activeTab === 'pending_teachers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white">طلبات انضمام الأساتذة بانتظار الموافقة</h3>
              </div>
              
              {pendingTeachers.map(teacher => (
                <div key={teacher.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-baaqoon-100 dark:border-baaqoon-800 rounded-xl bg-white dark:bg-baaqoon-900/50">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-baaqoon-100 dark:bg-baaqoon-800 flex items-center justify-center text-baaqoon-600 dark:text-baaqoon-300 font-bold">
                      {teacher.name.charAt(3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-baaqoon-900 dark:text-white">{teacher.name}</h4>
                      <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400 mt-1">تخصص: {teacher.subject} • البلد: {teacher.country} • سجل {teacher.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleAccept(teacher.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={16} /> قبول واعتماد
                    </button>
                    <button 
                      onClick={() => handleReject(teacher.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingTeachers.length === 0 && (
                <div className="text-center py-12 text-baaqoon-500 dark:text-baaqoon-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                  <p>لا يوجد طلبات انضمام معلقة. تمت معالجة جميع الطلبات.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Cohorts (التفويج) */}
          {activeTab === 'cohorts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white">الأفواج التربوية الحالية</h3>
                <button 
                  onClick={handleCreateCohort}
                  className="px-4 py-2 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-lg text-sm font-bold transition-colors shadow-md shadow-baaqoon-accent/20"
                >
                  + إنشاء فوج جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cohorts.map(cohort => (
                  <div key={cohort.id} className="p-5 border border-baaqoon-200 dark:border-baaqoon-700 rounded-xl bg-white dark:bg-baaqoon-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-baaqoon-accent"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-baaqoon-900 dark:text-white text-lg">{cohort.id}</h4>
                        <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400">{cohort.name}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${cohort.students >= cohort.max ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {cohort.students}/{cohort.max} طالب
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4">
                      <div className={`h-1.5 rounded-full ${cohort.students >= cohort.max ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(cohort.students/cohort.max)*100}%` }}></div>
                    </div>

                    <button 
                      onClick={() => alert(`سيتم فتح شاشة إدارة الفوج (${cohort.id})، والتي تتيح للمدير نقل الطلبة بين الأفواج أو تعديل تفاصيل الفوج.`)}
                      className="w-full py-2 bg-baaqoon-50 dark:bg-baaqoon-800 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg text-sm font-semibold transition-colors border border-baaqoon-200 dark:border-baaqoon-700"
                    >
                      إدارة الفوج
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Assignment (الإسناد) */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {!assignmentForm ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <ShieldCheck className="w-16 h-16 text-baaqoon-300 dark:text-baaqoon-600 dark:text-baaqoon-400 mb-2" />
                  <div>
                    <h3 className="text-xl font-bold text-baaqoon-900 dark:text-white mb-2">نظام الإسناد الآلي</h3>
                    <p className="text-baaqoon-600 dark:text-baaqoon-400 max-w-lg mx-auto">
                      هنا سيتمكن المدير من إسناد الأساتذة للأفواج التربوية.
                      مثال: إسناد "أ. أحمد الخطيب" لتدريس (فيزياء) للفوج (ع-1).
                      <br /><br />
                      بمجرد الإسناد، سيظهر الفوج تلقائياً في لوحة تحكم الأستاذ، وسيتمكن الطلاب المسجلين في هذا الفوج من الوصول لمحاضراته.
                    </p>
                  </div>
                  <button 
                    onClick={() => setAssignmentForm(true)}
                    className="mt-6 px-6 py-3 bg-baaqoon-900 dark:bg-baaqoon-100 dark:bg-baaqoon-900/50 text-white dark:text-baaqoon-900 dark:text-white rounded-lg font-bold transition-colors hover:bg-baaqoon-800 dark:hover:bg-white dark:bg-baaqoon-900 shadow-lg"
                  >
                    بدء عملية الإسناد
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto bg-baaqoon-50 dark:bg-baaqoon-900/50 p-6 rounded-xl border border-baaqoon-200 dark:border-baaqoon-700 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white mb-6 border-b border-baaqoon-200 dark:border-baaqoon-700 pb-4">إسناد جديد</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300 mb-1.5">اختر الأستاذ المعتمد</label>
                      <select className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 outline-none">
                        <option>أ. محمد النجار (كيمياء)</option>
                        <option>أ. نور الدين (رياضيات)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300 mb-1.5">اختر الفوج التربوي</label>
                      <select className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 outline-none">
                        {cohorts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                      </select>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => {
                          setAssignments(prev => [...prev, { teacher: 'أ. محمد النجار', cohort: 'ع-1' }]);
                          setAssignmentForm(false);
                        }}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors shadow-sm"
                      >
                        حفظ وتأكيد الإسناد
                      </button>
                      <button 
                        onClick={() => setAssignmentForm(false)}
                        className="px-6 py-2.5 bg-baaqoon-200 hover:bg-baaqoon-300 dark:bg-baaqoon-700 dark:hover:bg-baaqoon-600 text-baaqoon-900 dark:text-white rounded-lg font-bold transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* List of mock assignments */}
              {!assignmentForm && assignments.length > 0 && (
                <div className="mt-8 animate-fade-in-up">
                  <h4 className="font-bold text-baaqoon-900 dark:text-white mb-4">الإسنادات الحالية</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignments.map((ass, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl">
                        <CheckCircle className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">تم إسناد الفوج ({ass.cohort})</p>
                          <p className="text-emerald-700 dark:text-emerald-400 text-xs">لـ {ass.teacher}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
