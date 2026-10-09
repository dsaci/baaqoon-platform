import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Key, CheckCircle, XCircle } from 'lucide-react';

export default function PasswordRequestsModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data;
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'approve' | 'reject' }) => {
      return api.post(`/users/admin/password-requests/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_password_requests'] });
    }
  });

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-3xl shadow-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black dark:text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-amber-500" />
            طلبات تغيير كلمة المرور
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">جاري التحميل...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              لا توجد طلبات تغيير كلمة مرور معلقة.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-lg">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="text-sm text-slate-500 mt-1" dir="ltr" style={{ textAlign: 'right' }}>
                      {r.email || r.phone}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(r.createdAt).toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate({ id: r.id, action: 'approve' })}
                      className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> قبول
                    </button>
                    <button
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate({ id: r.id, action: 'reject' })}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body);
}
