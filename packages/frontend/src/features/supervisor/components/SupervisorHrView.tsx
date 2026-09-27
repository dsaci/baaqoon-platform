import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Users, Mail, Phone } from 'lucide-react';

export default function SupervisorHrView({ role }: { role: 'teacher' | 'student' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['supervisor_hr'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/hr');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const usersList = role === 'teacher' ? data?.teachers || [] : data?.students || [];
  const title = role === 'teacher' ? 'أساتذة مادة التخصص' : 'طلبة مادة التخصص';

  return (
    <div className="bg-white dark:bg-baaqoon-900 rounded-2xl p-6 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
      <h2 className="text-xl font-bold text-baaqoon-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-baaqoon-accent" />
        {title} ({usersList.length})
      </h2>

      {usersList.length === 0 ? (
        <div className="text-center p-12 text-slate-500">
          <p className="font-bold">لا يوجد {role === 'teacher' ? 'أساتذة' : 'طلبة'} مسجلين في مادة تخصصك حتى الآن.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersList.map((u: any) => (
            <div key={u.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {u.firstName?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</h3>
                  <p className="text-xs text-slate-500">{role === 'teacher' ? 'أستاذ المادة' : 'طالب'}</p>
                </div>
              </div>
              <div className="space-y-1 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span dir="ltr">{u.email || 'لا يوجد إيميل'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{u.phone || 'لا يوجد هاتف'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
