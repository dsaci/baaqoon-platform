import React, { useState } from 'react';
import { X, Save, Camera, User, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

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
    phone: '',
    bio: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      initialize({ ...user, firstName: formData.firstName, lastName: formData.lastName });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-baaqoon-100 dark:border-baaqoon-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50 dark:bg-baaqoon-950/50">
          <h2 className="text-xl font-bold text-baaqoon-900 dark:text-white">الملف الشخصي والبيانات</h2>
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
              <h3 className="font-bold text-baaqoon-900 dark:text-white text-lg">الصورة الرمزية</h3>
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

          <div className="pt-4 border-t border-baaqoon-100 dark:border-baaqoon-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-baaqoon-600 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors font-medium">
              إلغاء
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-lg transition-colors shadow-md font-bold">
              <Save className="w-4 h-4" />
              حفظ البيانات
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
