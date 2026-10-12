import React, { useState, useRef } from 'react';
import { X, Save, Camera, User, Phone, Mail, CheckCircle, Loader2, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/axios';
import UserAvatar, { PRESET_AVATARS } from './UserAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, initialize } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    gradeLevel: user?.gradeLevel || 'grade_11'
  });
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatarUrl || 'preset:anime_male_1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadNote, setUploadNote] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
    setError('');
  };

  // Handle Image Upload with Size Validation & Client-Side Canvas Compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }

    // Size requirement: Max 500 KB limit enforced
    const MAX_ALLOWED_BYTES = 500 * 1024; // 500 KB
    if (file.size > MAX_ALLOWED_BYTES) {
      setUploadNote(`حجم الصورة الأصلية (${(file.size / 1024).toFixed(0)} KB) تم ضغطها وتصغيرها تلقائياً لتكون خفيفة وسريعة.`);
    } else {
      setUploadNote(`تم تحميل الصورة بنجاح (${(file.size / 1024).toFixed(0)} KB) وتمت معالجتها.`);
    }

    setError('');

    // Client-side compression to square avatar (160x160)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 160;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Center Crop
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        
        // Export ultra-lightweight JPEG (< 20KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedAvatar(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        gradeLevel: formData.gradeLevel,
        avatarUrl: selectedAvatar,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up font-sans" dir="rtl">
      <div className="bg-white dark:bg-baaqoon-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-baaqoon-100 dark:border-baaqoon-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50/60 dark:bg-baaqoon-950/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-baaqoon-900 dark:text-white">تعديل بيانات الحساب والصورة</h2>
              <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400 font-bold">تخصيص الهوية الرمزية، الرسوم الكرتونية، والمعلومات الشخصية</p>
            </div>
          </div>
          <button onClick={onClose} className="text-baaqoon-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Avatar Selector Section */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Current Active Avatar Display */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full ring-4 ring-violet-500/30 overflow-hidden shadow-lg bg-white dark:bg-slate-900 flex items-center justify-center">
                  <UserAvatar 
                    avatarUrl={selectedAvatar} 
                    name={formData.firstName}
                    role={user?.primaryRole}
                    size="2xl"
                    className="w-full h-full"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-95"
                  title="رفع صورة من جهازك"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Controls & Requirements */}
              <div className="flex-1 text-center sm:text-right space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    الصورة الرمزية (الأنمي والكرتون)
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    بدون ملامح
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  اختر من الرسوم الرمزية الجميلة المعتمدة (بدون ملامح وجه مع نظارات وشعر وأذنين)، أو ارفع صورتك الخاصة باشتراط الحجم الصغير.
                </p>

                {/* Upload Action */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageFileChange} 
                    accept="image/png,image/jpeg,image/webp" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-violet-600" />
                    <span>رفع صورة من جهازك</span>
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">
                    (شرط الحجم: أقل من 500KB)
                  </span>
                </div>

                {uploadNote && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    ✓ {uploadNote}
                  </p>
                )}
              </div>
            </div>

            {/* Presets Grid (Faceless Anime & Cartoon with Glasses) */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5">
                نماذج الرسوم المعتمدة حسب الجنس والحساب (اضغط للاختيار):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedAvatar === preset.id;
                  const Component = preset.Component;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.id);
                        setUploadNote('');
                      }}
                      className={`p-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center group ${
                        isSelected 
                          ? 'bg-violet-100 dark:bg-violet-950/60 ring-2 ring-violet-600 shadow-sm scale-105' 
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:scale-102'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-xs shrink-0">
                        <Component className="w-full h-full" />
                      </div>
                      <span className={`text-[10px] font-black truncate w-full ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-violet-600" /> الاسم الأول
              </label>
              <input 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-violet-600" /> اللقب (العائلة)
              </label>
              <input 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-violet-600" /> البريد الإلكتروني
              </label>
              <input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none text-left transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-violet-600" /> رقم الهاتف
              </label>
              <input 
                name="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={handleChange} 
                dir="ltr" 
                placeholder="+970 59..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none text-left transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                <span>🌍</span> الجنسية
              </label>
              <select 
                name="nationality" 
                value={formData.nationality} 
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
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

            {user?.primaryRole === 'student' && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
                  <span>🎓</span> الصف الدراسي
                </label>
                <select 
                  name="gradeLevel" 
                  value={formData.gradeLevel} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                >
                  <option value="grade_11">الصف الحادي عشر (11)</option>
                  <option value="grade_12">الصف الثاني عشر (التوجيهي - 12)</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-black border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Success Message */}
          {saved && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> 
              <span>تم حفظ التعديلات والصورة بنجاح في قاعدة البيانات ✅</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-bold text-xs"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-md shadow-violet-600/20 font-black text-xs disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
              ) : (
                <><Save className="w-4 h-4" /> حفظ التعديلات والصورة</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
