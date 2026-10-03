import React, { useState } from 'react';
import { api } from '../../../lib/axios';
import { Key, XCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/password-reset-request', { identifier, newPassword });
      setMessage(res.data.message || 'تم إرسال الطلب بنجاح.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ. يرجى التأكد من البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
          <XCircle className="w-5 h-5 text-slate-500" />
        </button>
        
        <h2 className="text-2xl font-black mb-2 dark:text-white flex items-center gap-2">
          <Key className="w-6 h-6 text-emerald-500" />
          نسيت كلمة المرور
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          أدخل بريدك الإلكتروني أو رقم هاتفك المسجل، وكلمة المرور الجديدة. سيتم تفعيلها بمجرد موافقة الإدارة.
        </p>

        {message ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold text-center">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">البريد أو الهاتف</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            
            {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال الطلب للإدارة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
