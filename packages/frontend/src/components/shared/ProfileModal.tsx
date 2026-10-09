import React, { useState } from 'react';
import { X, Save, Camera, User, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/axios';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, initialize } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await api.patch('/users/me/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
      });

      // Update local store with real data from server
      if (user) {
        initialize({ ...user, ...res.data });
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-baaqoon-100 dark:border-baaqoon-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50 dark:bg-baaqoon-950/50">
          <h2 className="text-xl font-bold text-baaqoon-900 dark:text-white">تعديل بيانات الحساب</h2>
          <button onClick={onClose} className="text-baaqoon-500 dark:text-baaqoon-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-baaqoon-100 dark:bg-baaqoon-800 border-2 border-dashed border-baaqoon-300 dark:border-baaqoon-700 flex items-center justify-center text-baaqoon-600 dark:text-baaqoon-400 font-bold text-2xl">
                {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </div>
              <button type="button" className="absolute bottom-0 right-0 p-1.5 bg-baaqoon-accent text-white rounded-full hover:bg-baaqoon-accentDark transition-colors shadow-md">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-baaqoon-900 dark:text-white text-lg">الصورة الشخصية</h3>
              <p className="text-sm text-baaqoon-500 dark:text-baaqoon-400">PNG أو JPG بحجم لا يتجاوز 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                <User className="w-4 h-4 text-baaqoon-500 dark:text-baaqoon-400" /> الاسم الأول
              </label>
              <input 
                name="firstName" value={formData.firstName} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                <User className="w-4 h-4 text-baaqoon-500 dark:text-baaqoon-400" /> اللقب (العائلة)
              </label>
              <input 
                name="lastName" value={formData.lastName} onChange={handleChange} required
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              <Mail className="w-4 h-4 text-baaqoon-500 dark:text-baaqoon-400" /> البريد الإلكتروني
            </label>
            <input 
              name="email" type="email" value={formData.email} onChange={handleChange} required dir="ltr"
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none text-left"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              <Phone className="w-4 h-4 text-baaqoon-500 dark:text-baaqoon-400" /> رقم الهاتف
            </label>
            <input 
              name="phone" type="tel" value={formData.phone} onChange={handleChange} dir="ltr" placeholder="+970 59..."
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none text-left"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              <span className="text-baaqoon-500 dark:text-baaqoon-400">🌍</span> الجنسية
            </label>
            <select 
              name="nationality" 
              value={formData.nationality} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none"
            >
              <option value="">-- غير محدد --</option>
              <option value="فلسطيني">فلسطيني</option>
              <option value="أردني">أردني</option>
              <option value="مصري">مصري</option>
              <option value="سعودي">سعودي</option>
              <option value="إماراتي">إماراتي</option>
              <option value="كويتي">كويتي</option>
              <option value="عماني">عماني</option>
              <option value="قطري">قطري</option>
              <option value="بحريني">بحريني</option>
              <option value="يمني">يمني</option>
              <option value="عراقي">عراقي</option>
              <option value="سوري">سوري</option>
              <option value="لبناني">لبناني</option>
              <option value="سوداني">سوداني</option>
              <option value="ليبي">ليبي</option>
              <option value="تونسي">تونسي</option>
              <option value="جزائري">جزائري</option>
              <option value="مغربي">مغربي</option>
              <option value="موريتاني">موريتاني</option>
              <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Success */}
          {saved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> تم حفظ التعديلات بنجاح في قاعدة البيانات ✅
            </div>
          )}

          <div className="pt-4 border-t border-baaqoon-100 dark:border-baaqoon-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-baaqoon-600 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors font-medium">
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-lg transition-colors shadow-md font-bold disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
              ) : (
                <><Save className="w-4 h-4" /> حفظ التعديلات</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
