import React, { useState } from 'react';
import { Users, BookOpen, CheckCircle, Clock, UserCheck, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending_teachers' | 'cohorts'>('cohorts');

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/stats');
      return res.data;
    }
  });

  const { data: adminData } = useQuery({
    queryKey: ['adminData'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/data');
      return res.data;
    }
  });

  const createCohortMutation = useMutation({
    mutationFn: async (newCohort: any) => {
      const res = await api.post('/groups/cohorts', newCohort);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setIsCreateModalOpen(false);
      setNewCohortName('');
      setNewCohortCode('');
      setSelectedCourseId('');
      setSelectedTeacherId('');
    }
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCode, setNewCohortCode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const handleCreateCohortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName || !newCohortCode || !selectedCourseId || !selectedTeacherId) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const course = adminData?.courses?.find((c: any) => c.id === selectedCourseId);
    if (!course || !course.versions || course.versions.length === 0) {
      alert('المادة غير مكتملة الإعداد في قاعدة البيانات (لا توجد نسخة منهج)');
      return;
    }

    createCohortMutation.mutate({
      name: newCohortName,
      code: newCohortCode,
      courseId: selectedCourseId,
      curriculumVersionId: course.versions[0].id,
      teacherId: selectedTeacherId,
      studentIds: []
    });
  };

  const stats = [
    { label: 'الأساتذة', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
    { label: 'الطلبة', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'الأفواج التربوية', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { label: 'الجلسات النشطة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">مرحباً بك {user?.firstName} {user?.lastName} - لوحة تحكم الإدارة 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">إليك نظرة شاملة على نشاط المنصة وحالة الطلبات.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 p-6 flex items-start gap-4 rounded-[2rem] shadow-lg transition-transform hover:-translate-y-1">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
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

      {/* Main Admin Panel */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
          <button 
            onClick={() => setActiveTab('cohorts')}
            className={`px-8 py-5 text-sm font-black transition-all ${activeTab === 'cohorts' ? 'text-violet-600 border-b-2 border-violet-600 bg-white dark:bg-slate-900/50' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            التفويج والإسناد
          </button>
          <button 
            onClick={() => setActiveTab('pending_teachers')}
            className={`px-8 py-5 text-sm font-black transition-all ${activeTab === 'pending_teachers' ? 'text-violet-600 border-b-2 border-violet-600 bg-white dark:bg-slate-900/50' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            الطلبات المعلقة
          </button>
        </div>

        <div className="p-8 min-h-[400px]">
          
          {/* Tab: Pending Teachers */}
          {activeTab === 'pending_teachers' && (
            <div className="space-y-4">
               <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                  <p className="font-bold">لا يوجد طلبات انضمام معلقة. تمت معالجة جميع الطلبات.</p>
                </div>
            </div>
          )}

          {/* Tab: Cohorts & Assignments */}
          {activeTab === 'cohorts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="w-2 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-600 rounded-full"></span>
                  الأفواج التربوية الحالية
                </h3>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> إنشاء فوج وإسناد
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminStats?.recentCohorts?.map((cohort: any) => (
                    <div key={cohort.id} className="p-6 border-2 border-slate-100 dark:border-slate-800/50 rounded-2xl bg-white dark:bg-slate-800/50 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-violet-400 to-fuchsia-500"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1">{cohort.name}</h4>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md inline-block">{cohort.code}</p>
                        </div>
                        <span className={`text-xs font-black px-3 py-1.5 rounded-lg ${cohort.enrollments?.length >= 20 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {cohort.enrollments?.length || 0}/20 طالب
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-6 shadow-inner overflow-hidden">
                        <div className={`h-2 rounded-full ${cohort.enrollments?.length >= 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${((cohort.enrollments?.length || 0)/20)*100}%` }}></div>
                      </div>

                      <div className="flex flex-col gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                         <p className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-violet-500" /> الأستاذ: {cohort.instructors?.[0]?.teacher ? `${cohort.instructors[0].teacher.firstName} ${cohort.instructors[0].teacher.lastName}` : 'غير مسند'}</p>
                      </div>

                      <button 
                        className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-black transition-all border-2 border-slate-200 dark:border-slate-700"
                      >
                        إدارة الفوج
                      </button>
                    </div>
                  ))}
                  {adminStats?.recentCohorts?.length === 0 && (
                     <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="font-bold">لا يوجد أفواج تربوية حالياً.</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Create Cohort Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 max-w-md w-full animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                 <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-violet-600" />
                 </div>
                 إنشاء فوج جديد
               </h2>
               <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleCreateCohortSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">اسم الفوج (مثل: فوج الأحياء - غزة)</label>
                <input 
                  type="text" 
                  value={newCohortName}
                  onChange={e => setNewCohortName(e.target.value)}
                  placeholder="أدخل اسم الفوج..." 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">رمز الفوج (مثل: GAZA-BIO-1)</label>
                <input 
                  type="text" 
                  value={newCohortCode}
                  onChange={e => setNewCohortCode(e.target.value)}
                  placeholder="أدخل الرمز..." 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold font-mono transition-all text-left dir-ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">المادة الأكاديمية</label>
                <select 
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                  required
                >
                  <option value="">-- اختر المادة --</option>
                  {adminData?.courses?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.subject?.nameAr} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">إسناد أستاذ</label>
                <select 
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                  required
                >
                  <option value="">-- اختر الأستاذ --</option>
                  {adminData?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>أ. {t.firstName} {t.lastName} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={createCohortMutation.isPending}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {createCohortMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الفوج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
