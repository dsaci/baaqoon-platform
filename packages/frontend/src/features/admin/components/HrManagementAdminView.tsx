import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import PasswordRequestsModal from './PasswordRequestsModal';
import { CheckCircle, XCircle, Users, User, Shield, ShieldAlert, GraduationCap, Trash2 , UserPlus, Key, Bell } from 'lucide-react';

export default function HrManagementAdminView() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('all');
  const [isPasswordRequestsOpen, setIsPasswordRequestsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', supervisedSubjectId: '' });

  const { data: subjects = [] } = useQuery({
    queryKey: ['admin_subjects_list'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data;
    }
  });

  const { data: passwordRequests = [] } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data;
    },
    refetchInterval: 10000 // Poll every 10 seconds for notifications
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users_list'],
    queryFn: async () => {
      const res = await api.get('/users/admin/list');
      return res.data;
    }
  });

  
  
  const addMutation = useMutation({
    mutationFn: async (userData: any) => {
      return api.post('/users/admin/create', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      setIsAddUserOpen(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', supervisedSubjectId: '' });
    }
  });
  
  
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return api.patch(`/users/admin/${id}/password`, { password });
    },
    onSuccess: () => {
      alert('تم تغيير كلمة المرور بنجاح');
      setIsResetPasswordOpen(false);
      setNewPassword('');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      return api.patch(`/users/admin/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_pending_users'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const filteredUsers = users.filter((u: any) => roleFilter === 'all' || u.primaryRole === roleFilter);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'student': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold"><GraduationCap className="w-3 h-3"/> طالب</span>;
      case 'teacher': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold"><User className="w-3 h-3"/> أستاذ</span>;
      case 'subject_supervisor': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-bold"><Shield className="w-3 h-3"/> مشرف</span>;
      case 'admin':
      case 'super_admin': return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold"><ShieldAlert className="w-3 h-3"/> إدارة</span>;
      default: return <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md text-xs font-bold">{role}</span>;
    }
  };

  const pendingCount = users.filter((u: any) => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
          <button onClick={() => setIsPasswordRequestsOpen(true)} className="relative px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
            <Key className="w-5 h-5" /> طلبات كلمات المرور
            {passwordRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-xs text-white font-black shadow-lg ring-2 ring-white dark:ring-slate-900 border-2 border-red-200">
                  {passwordRequests.length}
                </span>
                <Bell className="absolute -top-4 -right-1 w-4 h-4 text-red-500 animate-bounce drop-shadow-md" />
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsAddUserOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم جديد
          </button>
          </div>
        </div>
        {/* Sub-tabs for filtering */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الجميع
        </button>
        <button 
          onClick={() => setRoleFilter('student')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'student' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الطلبة
        </button>
        <button 
          onClick={() => setRoleFilter('teacher')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'teacher' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الأساتذة
        </button>
        <button 
          onClick={() => setRoleFilter('subject_supervisor')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'subject_supervisor' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          المشرفون
        </button>
        
        {pendingCount > 0 && (
          <div className="mr-auto bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {pendingCount} حسابات بانتظار الموافقة
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-black">الاسم</th>
                <th className="px-6 py-4 font-black">معلومات التواصل</th>
                <th className="px-6 py-4 font-black">الدور</th>
                <th className="px-6 py-4 font-black">حالة الحساب</th>
                <th className="px-6 py-4 font-black text-center">الإجراءات (قبول/رفض/تجميد)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">{u.email || 'لا يوجد إيميل'}</div>
                    <div className="text-xs text-slate-500 font-mono" dir="ltr">{u.phone || 'لا يوجد هاتف'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(u.primaryRole)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {u.status === 'active' ? 'نشط' : u.status === 'pending' ? 'قيد الانتظار' : 'مجمد'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {u.status !== 'active' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: u.id, status: 'active' })}
                          disabled={updateStatusMutation.isPending}
                          title="قبول وتنشيط"
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedUserForReset(u); setIsResetPasswordOpen(true); }}
                        title="تغيير كلمة المرور"
                        className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors ml-1"
                      >
                        <Key className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          if(window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="حذف نهائي"
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors ml-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {u.status !== 'suspended' && (
                        <button
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من تجميد / رفض هذا الحساب؟')) {
                              updateStatusMutation.mutate({ id: u.id, status: 'suspended' });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          title="رفض / تجميد"
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    لا يوجد حسابات مسجلة في هذا القسم.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black mb-4 dark:text-white">إضافة مستخدم جديد</h2>
            <div className="space-y-4">
              <input type="text" placeholder="الاسم الأول" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
              <input type="text" placeholder="الاسم الأخير" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input type="password" placeholder="كلمة المرور (اختياري، الافتراضي: 123456)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.primaryRole} onChange={e => setNewUser({...newUser, primaryRole: e.target.value})}>
                <option value="student">طالب</option>
                <option value="teacher">أستاذ</option>
                <option value="subject_supervisor">مشرف منسق</option>
                <option value="admin">مدير (Admin)</option>
              </select>

              {newUser.primaryRole === 'student' && (
                <div className="flex gap-3 animate-fade-in-up">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">الفرع الأكاديمي</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.academicBranch} onChange={e => setNewUser({...newUser, academicBranch: e.target.value})}>
                      <option value="scientific">علمي</option>
                      <option value="literary">أدبي</option>
                      <option value="entrepreneurship">ريادة وأعمال</option>
                      <option value="industrial">صناعي</option>
                      <option value="sharia">شرعي</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">المنهج</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.curriculumType} onChange={e => setNewUser({...newUser, curriculumType: e.target.value})}>
                      <option value="governmental">حكومي</option>
                      <option value="azhari">أزهري</option>
                    </select>
                  </div>
                </div>
              )}

              {(newUser.primaryRole === 'teacher' || newUser.primaryRole === 'subject_supervisor') && (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {newUser.primaryRole === 'teacher' ? 'مادة التخصص للأستاذ' : 'مادة التنسيق والمتابعة للمشرف'}
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.supervisedSubjectId} onChange={e => setNewUser({...newUser, supervisedSubjectId: e.target.value})}>
                    <option value="">-- اختر المادة --</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddUserOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => addMutation.mutate({...newUser, password: newUser.password || '123456'})} disabled={addMutation.isPending} className="flex-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-bold w-2/3">إضافة وتفعيل</button>
            </div>
          </div>
        </div>
      )}
  
      
      {isResetPasswordOpen && selectedUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black mb-4 dark:text-white">تغيير كلمة المرور</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">للمستخدم: {selectedUserForReset.firstName} {selectedUserForReset.lastName}</p>
            <div className="space-y-4">
              <input type="password" placeholder="كلمة المرور الجديدة" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsResetPasswordOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => resetPasswordMutation.mutate({ id: selectedUserForReset.id, password: newPassword })} disabled={resetPasswordMutation.isPending || !newPassword} className="flex-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold w-2/3">حفظ الكلمة الجديدة</button>
            </div>
          </div>
        </div>
      )}
  
      
      {isPasswordRequestsOpen && (
        <PasswordRequestsModal onClose={() => setIsPasswordRequestsOpen(false)} />
      )}

      </div>
    </div>
  );
}
