import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { CheckCircle, XCircle, Users, User, Shield, ShieldAlert, GraduationCap } from 'lucide-react';

export default function HrManagementAdminView() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users_list'],
    queryFn: async () => {
      const res = await api.get('/users/admin/list');
      return res.data;
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
      </div>
    </div>
  );
}
