import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Activity, Clock, LogIn, UserCheck, PlayCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ActivityLogsView() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity_logs'],
    queryFn: async () => {
      const res = await api.get('/groups/activity-logs');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'failed_login': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'login': return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'join_session': return <PlayCircle className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'teacher': return 'أستاذ';
      case 'student': return 'طالب';
      case 'subject_supervisor': return 'مشرف';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-emerald-500" />
        سجل النشاط الحي للمنصة
      </h2>

      {(!logs || logs.length === 0) ? (
        <div className="text-center p-12 text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          لا يوجد نشاط مسجل حتى الآن.
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
              <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {log.user.firstName} {log.user.lastName}
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-black">
                      {getRoleLabel(log.user.primaryRole)}
                    </span>
                  </h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono" dir="ltr">
                    <Clock className="w-3 h-3" />
                    {format(new Date(log.createdAt), 'hh:mm a', { locale: ar })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
