import React, { useState } from 'react';
import axios from 'axios';
import { Bot, FileText, Loader2, X } from 'lucide-react';

interface RapidGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  defaultLessonId?: string;
}

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function RapidGeneratorModal({ isOpen, onClose, cohortId, defaultLessonId }: RapidGeneratorModalProps) {
  const [lessonId, setLessonId] = useState(defaultLessonId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (defaultLessonId) setLessonId(defaultLessonId);
  }, [defaultLessonId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/v1/assessments/generate', {
        cohortId,
        curriculumLessonId: lessonId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-baaqoon-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-baaqoon-200 dark:border-baaqoon-700 flex justify-between items-center bg-baaqoon-50/50 dark:bg-baaqoon-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-baaqoon-accent/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-baaqoon-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white">التوليد السريع (من المنهاج)</h2>
              <p className="text-xs text-baaqoon-500">سحب أسئلة جاهزة من بنك الأسئلة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-baaqoon-400 hover:text-baaqoon-600 hover:bg-baaqoon-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                  معرف الدرس (Lesson ID) - للعرض التجريبي فقط أدخل أي معرف أو اتركه فارغاً وسيتم تجربة أول درس
                </label>
                <input 
                  type="text" 
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  placeholder="مثال: c4f2... (ضع معرف الدرس هنا)"
                  className="w-full px-4 py-2.5 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800"
                />
              </div>
              
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                {loading ? 'جاري التوليد...' : 'توليد اختبار الآن'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <h3 className="font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  تم توليد الاختبار بنجاح!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                  اسم الاختبار: {result.title}
                </p>
                <p className="text-sm text-green-700 dark:text-green-500">
                  عدد الأسئلة: {result.questions?.length || 0}
                </p>
                <p className="text-sm font-bold text-green-800 dark:text-green-400 mt-2">
                  تم إدراج الاختبار في صفحة الواجبات والتقييمات الخاصة بك.
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={() => {
                    setResult(null);
                    onClose();
                    navigate('/teacher/assessments');
                  }}
                  className="w-full py-3.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  انتقال إلى صفحة التقييمات
                </button>
                <button 
                  onClick={() => { setResult(null); onClose(); }}
                  className="w-full py-2.5 text-baaqoon-500 hover:text-baaqoon-700 dark:hover:text-baaqoon-300 font-medium transition-colors"
                >
                  إغلاق هذه النافذة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
