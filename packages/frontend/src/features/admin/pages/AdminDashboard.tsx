import React, { useState } from 'react';
import { Users, BookOpen, CheckCircle, Clock, UserCheck, Plus, X, Eye, Settings, BarChart3 , Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import CohortRequestsAdminView from '../components/CohortRequestsAdminView';
import HrManagementAdminView from '../components/HrManagementAdminView';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import { FileSpreadsheet, Megaphone, Archive } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab') as 'cohorts' | 'hr' | 'requests' | null;
  const [activeTab, setActiveTab] = useState<'cohorts' | 'hr' | 'requests'>(tabParam || 'hr');

  React.useEffect(() => {
    const handleLocationChange = () => {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab') as 'cohorts' | 'hr' | 'requests' | null;
      if (tab) setActiveTab(tab);
    };

    // Keep activeTab in sync with URL
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);


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

  const { data: pendingUsers = [] } = useQuery({
    queryKey: ['admin_pending_users'],
    queryFn: async () => {
      const res = await api.get('/users/admin/list');
      return (res.data || []).filter((u: any) => u.status === 'pending');
    }
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['cohort_requests_count'],
    queryFn: async () => {
      const res = await api.get('/groups/requests');
      return (res.data || []).filter((r: any) => r.status === 'pending');
    }
  });

  const createCohortMutation = useMutation({
    mutationFn: async (newCohort: any) => {
      const res = await api.post('/groups/cohorts', newCohort);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [editingCohort, setEditingCohort] = useState<any>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  
  const handleDeleteCohort = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الفوج "${name}"؟ هذه العملية لا يمكن التراجع عنها.`)) {
      try {
        await api.delete(`/groups/cohorts/${id}`);
        queryClient.invalidateQueries({ queryKey: ['adminData'] });
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      } catch (err) {
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };
  
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
      studentIds: selectedStudentIds
    });
  };

  const stats = [
    { label: 'الأساتذة', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
    { label: 'الطلبة', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'الأفواج', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { label: 'الحصص المجدولة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const tabs = [
    { id: 'hr' as const, label: 'إدارة الحسابات', badge: pendingUsers.length > 0 ? pendingUsers.length : undefined },
    { id: 'cohorts' as const, label: 'التفويج والإسناد', badge: undefined },
    { id: 'requests' as const, label: 'طلبات فتح أفواج', badge: pendingRequests.length > 0 ? pendingRequests.length : undefined },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">مرحباً بك {user?.firstName} {user?.lastName} - مدير المنصة 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">لوحة التحكم المركزية لإدارة جميع الموارد البشرية والأفواج التربوية.</p>
      </div>

      {/* Alert: Pending Registrations */}
      {pendingUsers.length > 0 && (
        <div 
          onClick={() => setActiveTab('hr')}
          className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center shrink-0">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-800 dark:text-amber-200">
              {pendingUsers.length} حسابات بانتظار موافقتك
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {pendingUsers.filter((u: any) => u.primaryRole === 'teacher').length} أساتذة · {pendingUsers.filter((u: any) => u.primaryRole === 'student').length} طلبة · {pendingUsers.filter((u: any) => u.primaryRole === 'subject_supervisor').length} مشرفين
            </p>
          </div>
          <span className="text-amber-600 font-bold text-sm">معالجة الآن ←</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 p-5 flex items-start gap-4 rounded-2xl shadow-sm transition-transform hover:-translate-y-1">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Admin Panel */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-black transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-violet-600 border-b-2 border-violet-600 bg-white dark:bg-slate-900/50' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
            >
              {tab.label}
              {tab.badge && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[400px]">
          
          {/* Tab: HR - Account Management */}
          {activeTab === 'hr' && (
            <HrManagementAdminView />
          )}

          {/* Tab: Cohort Requests */}
          {activeTab === 'requests' && (
            <CohortRequestsAdminView />
          )}

          {/* Tab: Cohorts & Assignments */}
          {activeTab === 'cohorts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="w-2 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-600 rounded-full"></span>
                  الأفواج التربوية ({adminStats?.recentCohorts?.length || 0})
                </h3>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> إنشاء فوج وإسناد
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : adminStats?.recentCohorts?.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-500 dark:text-slate-400 mb-4">لا يوجد أفواج تربوية بعد.</p>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors"
                  >
                    أنشئ أول فوج الآن
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {adminStats?.recentCohorts?.map((cohort: any) => {
                    const maxStudents = cohort.maxStudents || 20;
                    const enrolled = cohort.enrollments?.length || 0;
                    const isFull = enrolled >= maxStudents;
                    const teacherName = cohort.instructors?.[0]?.teacher ? `${cohort.instructors[0].teacher.firstName} ${cohort.instructors[0].teacher.lastName}` : 'غير مسند';
                    
                    return (
                      <div key={cohort.id} className="p-5 border border-slate-100 dark:border-slate-800/50 rounded-2xl bg-white dark:bg-slate-800/50 relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-violet-400 to-fuchsia-500"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900 dark:text-white text-base">{cohort.name}</h4>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingCohort(cohort)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-violet-600 transition-colors" title="تعديل الفوج">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteCohort(cohort.id, cohort.name)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-rose-600 transition-colors" title="حذف الفوج">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded inline-block">{cohort.code}</p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${isFull ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {enrolled}/{maxStudents}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-4 overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((enrolled/maxStudents)*100, 100)}%` }}></div>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <UserCheck className="w-4 h-4 text-violet-500 shrink-0" />
                          <span className="truncate">الأستاذ: {teacherName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Strategic Features (Coming Soon) */}
      <ComingSoonSection 
        features={[
          {
            id: 'export_reports',
            title: 'تصدير التقارير (Export Reports)',
            description: 'استخراج تقارير شاملة بصيغة PDF أو Excel عن عدد الطلاب، نسب الحضور، والأساتذة لتقديمها للجهات المعنية.',
            icon: FileSpreadsheet
          },
          {
            id: 'announcements',
            title: 'إعلانات عامة (Announcements)',
            description: 'إرسال تعميم فوري يظهر في أعلى الشاشة (Banner) لجميع مستخدمي المنصة دفعة واحدة.',
            icon: Megaphone
          },
          {
            id: 'archive_cohorts',
            title: 'أرشيف الأفواج (Archive)',
            description: 'أرشفة بيانات الأفواج المنتهية نهاية العام الدراسي والاحتفاظ بنتائجهم دون حذفها للرجوع إليها لاحقاً.',
            icon: Archive
          }
        ]} 
      />

      {/* Create Cohort Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                 <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-violet-600" />
                 </div>
                 إنشاء فوج جديد
               </h2>
               <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleCreateCohortSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اسم الفوج</label>
                <input 
                  type="text" 
                  value={newCohortName}
                  onChange={e => setNewCohortName(e.target.value)}
                  placeholder="مثال: فوج غزة - الفيزياء" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">رمز الفوج</label>
                <input 
                  type="text" 
                  value={newCohortCode}
                  onChange={e => setNewCohortCode(e.target.value)}
                  placeholder="مثال: GAZA-PHY-01" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold font-mono transition-all"
                  dir="ltr"
                  required
                />
              </div>

                            {(() => {
                const selectedCourse = adminData?.courses?.find((c: any) => c.id === selectedCourseId);
                const targetSubjectId = selectedCourse?.subjectId;
                const targetBranch = selectedCourse?.academicBranch;
                const targetCurriculum = selectedCourse?.curriculumType;
                
                const availableTeachers = adminData?.teachers?.filter((t: any) => !targetSubjectId || t.supervisedSubjectId === targetSubjectId) || [];
                const availableStudents = adminData?.students?.filter((s: any) => (!targetBranch || s.academicBranch === targetBranch) && (!targetCurriculum || s.curriculumType === targetCurriculum)) || [];

                return (
                  <>
                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المادة والمنهج</label>
                      <select 
                        value={selectedCourseId}
                        onChange={e => {
                          setSelectedCourseId(e.target.value);
                          setSelectedTeacherId('');
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                        required
                      >
                        <option value="">-- اختر المادة --</option>
                        {adminData?.courses?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المعلم (حسب التخصص)</label>
                      <select 
                        value={selectedTeacherId}
                        onChange={e => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                        required
                        disabled={!selectedCourseId}
                      >
                        <option value="">-- اختر المعلم --</option>
                        {availableTeachers.map((t: any) => (
                          <option key={t.id} value={t.id}>أ. {t.firstName} {t.lastName} ({t.email})</option>
                        ))}
                      </select>
                      {selectedCourseId && availableTeachers.length === 0 && (
                        <p className="text-sm text-amber-500 mt-1 font-bold">لا يوجد معلمون مسجلون في تخصص هذه المادة.</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300">اختر الطلاب (حسب الفرع والمنهج)</label>
                        {selectedCourseId && availableStudents.length > 0 && (
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds(availableStudents.map((s: any) => s.id))}
                              className="text-xs text-violet-600 hover:text-violet-700 font-bold bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded"
                            >
                              تحديد الكل
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds([])}
                              className="text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                            >
                              إلغاء التحديد
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && availableStudents.length > 0 && (
                        <div className="mb-2">
                          <input 
                            type="text" 
                            placeholder="ابحث عن طالب بالاسم أو الإيميل..." 
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                          />
                        </div>
                      )}

                      <div className="w-full max-h-48 overflow-y-auto px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                        {!selectedCourseId ? (
                          <span className="text-slate-400 text-sm">اختر المادة أولاً لعرض الطلاب المتوافقين</span>
                        ) : availableStudents.length === 0 ? (
                          <span className="text-slate-400 text-sm">لا يوجد طلاب متوافقون مع الفرع والمنهج</span>
                        ) : (
                          <div className="space-y-1 flex flex-col items-start gap-1">
                            {availableStudents
                              .filter((s: any) => 
                                !studentSearchQuery || 
                                (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                              )
                              .map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIds(prev => [...prev, s.id]);
                                    } else {
                                      setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.firstName} {s.lastName} <span className="text-slate-400 font-normal text-xs mr-1">({s.email})</span></span>
                              </label>
                            ))}
                            {availableStudents.filter((s: any) => !studentSearchQuery || (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())).length === 0 && (
                              <span className="text-slate-400 text-sm">لا يوجد نتائج بحث متطابقة.</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && (
                         <div className="mt-2 text-xs font-bold text-slate-500">
                           تم تحديد <span className="text-violet-600">{selectedStudentIds.length}</span> من أصل {availableStudents.length} طلاب مؤهلين
                         </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={createCohortMutation.isPending}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {createCohortMutation.isPending ? 'جاري الإنشاء...' : '✅ إنشاء الفوج وإسناد الأستاذ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
