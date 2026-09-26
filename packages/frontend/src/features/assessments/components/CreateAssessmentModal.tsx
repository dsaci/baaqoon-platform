import React, { useState } from 'react';
import { api } from '../../../lib/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, FileText, Loader2, X, Check, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'smart' | 'manual';
}

export default function CreateAssessmentModal({ isOpen, onClose, defaultMode = 'smart' }: CreateAssessmentModalProps) {
  const mode = defaultMode;
  
  // Smart Mode State (Tree)
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  
  // Manual Mode State
  const [manualTitle, setManualTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: tree = [], isLoading: isLoadingTree } = useQuery({
    queryKey: ['curriculumTree'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects/tree');
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'smart') {
        if (!selectedLesson) throw new Error('الرجاء اختيار الدرس لتوليد الاختبار الذكي');
        const res = await api.post('/assessments/generate', {
          cohortId: 'dummy-cohort',
          curriculumLessonId: selectedLesson.id
        });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        navigate(`/teacher/assessments/${res.data.id}/grade`);
      } else {
        if (!manualTitle.trim()) throw new Error('الرجاء إدخال عنوان الواجب');
        const res = await api.post('/assessments', {
          title: manualTitle,
        });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        navigate(`/teacher/assessments/${res.data.id}/grade`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'حدث خطأ أثناء الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  const subjects = tree.filter((s: any) => s.courses && s.courses.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-baaqoon-900 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden animate-slide-up mx-4 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-baaqoon-200 dark:border-baaqoon-700 flex justify-between items-center bg-baaqoon-50/50 dark:bg-baaqoon-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-baaqoon-accent/10 flex items-center justify-center">
              {mode === 'smart' ? <Bot className="w-5 h-5 text-baaqoon-accent" /> : <FileText className="w-5 h-5 text-baaqoon-accent" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white">
                {mode === 'smart' ? 'توليد ذكي (بناء من المنهج)' : 'إنشاء واجب جديد (إدخال يدوي)'}
              </h2>
              <p className="text-xs text-baaqoon-500">
                {mode === 'smart' ? 'توليد الأسئلة تلقائياً بناءً على هيكل الدرس المدخل' : 'إنشاء واجب فارغ وإضافة التفاصيل يدوياً'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-baaqoon-400 hover:text-baaqoon-600 hover:bg-baaqoon-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

          {mode === 'smart' ? (
            <div className="space-y-4">
              {isLoadingTree ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-baaqoon-accent" /></div>
              ) : (
                <div className="glass-panel p-4 rounded-2xl border border-baaqoon-200 dark:border-baaqoon-700">
                  <h3 className="text-sm font-bold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-baaqoon-accent" />
                    اختر الدرس من الهيكل التعليمي:
                  </h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {subjects.map((subject: any) => (
                      <div key={subject.id} className="space-y-2">
                        <button 
                          onClick={() => setSelectedSubject(selectedSubject?.id === subject.id ? null : subject)}
                          className={`w-full text-right font-bold p-3 rounded-xl transition-colors ${selectedSubject?.id === subject.id ? 'bg-baaqoon-accent text-white' : 'bg-baaqoon-50 dark:bg-baaqoon-800 text-baaqoon-800 dark:text-baaqoon-100 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-700'}`}
                        >
                          {subject.nameAr}
                        </button>

                        {selectedSubject?.id === subject.id && subject.courses.map((course: any) => (
                          <div key={course.id} className="pr-4 space-y-2 mt-2">
                            <div className="font-bold text-sm text-baaqoon-700 dark:text-baaqoon-300 mb-2 border-b border-baaqoon-100 dark:border-baaqoon-800 pb-1">
                              {course.title}
                            </div>
                            {course.versions[0]?.units?.map((unit: any) => (
                              <div key={unit.id} className="pr-4 border-r-2 border-baaqoon-200 dark:border-baaqoon-700 space-y-1 my-2">
                                <h4 className="font-semibold text-baaqoon-600 dark:text-baaqoon-400 text-xs py-1">{unit.title}</h4>
                                {unit.lessons.map((lesson: any) => (
                                  <button
                                    key={lesson.id}
                                    onClick={() => setSelectedLesson(lesson)}
                                    className={`w-full text-right text-xs p-2 rounded-lg transition-colors ${selectedLesson?.id === lesson.id ? 'bg-baaqoon-100 dark:bg-baaqoon-700 text-baaqoon-800 dark:text-white font-bold' : 'text-baaqoon-500 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/50'}`}
                                  >
                                    - {lesson.title}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                  عنوان الواجب / الاختبار (إدخال يدوي)
                </label>
                <input 
                  type="text" 
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="مثال: واجب منزلي في القواعد..."
                  className="w-full px-4 py-3 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white"
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm leading-relaxed">
                <strong>ملاحظة:</strong> في وضع الإدخال اليدوي، سيتم إنشاء ملف واجب فارغ يمكنك لاحقاً إضافة الأسئلة إليه بشكل مباشر، دون الارتباط بهيكل المنهج.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-baaqoon-200 dark:border-baaqoon-700 bg-baaqoon-50/50 dark:bg-baaqoon-800/50 shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={loading || (mode === 'smart' && !selectedLesson) || (mode === 'manual' && !manualTitle.trim())}
            className="w-full py-3 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
            ) : mode === 'smart' ? (
              <><Bot className="w-5 h-5" /> توليد ذكي</>
            ) : (
              <><Check className="w-5 h-5" /> إنشاء الواجب</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
