import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../../lib/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, FileText, Loader2, X, Check, BookOpen, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'smart' | 'manual';
  defaultCohortId?: string;
}

export default function CreateAssessmentModal({ 
  isOpen, 
  onClose, 
  defaultMode = 'smart',
  defaultCohortId 
}: CreateAssessmentModalProps) {
  const mode = defaultMode;
  
  // Smart Mode State (Tree)
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<string>(defaultCohortId || '');
  
  // Manual Mode State
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualDetails, setManualDetails] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

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

  const { data: myCohorts = [] } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      try {
        const res = await api.get('/groups/cohorts/me');
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch (e) {}
      try {
        const adminRes = await api.get('/groups/admin/data');
        if (adminRes.data?.cohorts) return adminRes.data.cohorts;
      } catch (e) {}
      return [];
    },
    enabled: isOpen
  });

  React.useEffect(() => {
    if (isOpen) {
      if (defaultCohortId) {
        setSelectedCohortId(defaultCohortId);
      } else if (!selectedCohortId && myCohorts.length > 0) {
        setSelectedCohortId(myCohorts[0].id);
      }
    }
  }, [isOpen, defaultCohortId, myCohorts]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'smart') {
        if (!selectedLesson) throw new Error('الرجاء اختيار الدرس لتوليد الاختبار الذكي');
        const targetCohort = (selectedCohortId && selectedCohortId !== 'default-cohort')
          ? selectedCohortId
          : (myCohorts[0]?.id || undefined);
        const res = await api.post('/assessments/generate', {
          cohortId: targetCohort,
          curriculumLessonId: selectedLesson.id,
          questionCount: questionCount
        });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        onClose();
        navigate(`/teacher/assessments/${res.data.id}/grade`);
      } else {
        if (!manualTitle.trim()) throw new Error('الرجاء إدخال عنوان الواجب');
        const targetCohort = (selectedCohortId && selectedCohortId !== 'default-cohort')
          ? selectedCohortId
          : (myCohorts[0]?.id || undefined);
        const res = await api.post('/assessments', {
          title: manualTitle,
          cohortId: targetCohort,
          subject: manualSubject,
          description: manualDetails,
          type: 'assignment'
        });
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        onClose();
        navigate(`/teacher/assessments/${res.data.id}/grade`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'حدث خطأ أثناء الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  const subjects = tree.filter((s: any) => s.courses && s.courses.length > 0);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-md animate-fade-in overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-violet-50/70 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 shrink-0">
              {mode === 'smart' ? <Bot className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {mode === 'smart' ? 'توليد ذكي (بناء من المنهج الفلسطيني)' : 'إنشاء واجب جديد (إدخال يدوي)'}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {mode === 'smart' ? 'توليد الأسئلة مؤتمتاً بناءً على بنك أسئلة وهيكل الدرس المدخل' : 'إنشاء واجب فارغ وإضافة التفاصيل يدوياً'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            title="إلغاء وإغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cohort Selector in Smart Mode */}
          {myCohorts.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-600" />
                الفوج المستهدف:
              </label>
              <select
                value={selectedCohortId}
                onChange={e => setSelectedCohortId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-600"
              >
                {myCohorts.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {mode === 'smart' ? (
            <div className="space-y-4">
              {isLoadingTree ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  <p className="text-sm font-bold text-slate-400">جاري قراءة هيكل المنهاج والدروس...</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                    اختر الدرس من الهيكل التعليمي:
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {subjects.map((subject: any) => (
                      <div key={subject.id} className="space-y-2">
                        <button 
                          type="button"
                          onClick={() => setSelectedSubject(selectedSubject?.id === subject.id ? null : subject)}
                          className={`w-full text-right font-black p-3 rounded-xl transition-all flex items-center justify-between ${
                            selectedSubject?.id === subject.id 
                              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{subject.nameAr}</span>
                          <span className="text-xs opacity-75 font-mono">({subject.courses?.length || 0} فروع)</span>
                        </button>

                        {selectedSubject?.id === subject.id && subject.courses.map((course: any) => (
                          <div key={course.id} className="pr-4 space-y-2 mt-2">
                            <div className="font-bold text-xs text-slate-500 dark:text-slate-400 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">
                              {course.title}
                            </div>
                            {course.versions[0]?.units?.map((unit: any) => (
                              <div key={unit.id} className="pr-3 border-r-2 border-violet-300 dark:border-violet-700 space-y-1 my-2">
                                <h4 className="font-black text-slate-600 dark:text-slate-300 text-xs py-1">{unit.title}</h4>
                                {unit.lessons.map((lesson: any) => (
                                  <button
                                    key={lesson.id}
                                    type="button"
                                    onClick={() => setSelectedLesson(lesson)}
                                    className={`w-full text-right text-xs p-2 rounded-lg transition-colors font-bold ${
                                      selectedLesson?.id === lesson.id 
                                        ? 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    • {lesson.title}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    عنوان الواجب / الاختبار
                  </label>
                  <input 
                    type="text" 
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="مثال: واجب منزلي..."
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-violet-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    الموضوع (اختياري)
                  </label>
                  <input 
                    type="text" 
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="مثال: الرياضيات، الفيزياء..."
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-violet-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  تفاصيل الواجب (مساحة للكتابة)
                </label>
                <textarea 
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="اكتب تفاصيل الواجب هنا..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-violet-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          {mode === 'smart' && (
            <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-black text-slate-700 dark:text-slate-300">حيز الأسئلة (العدد المولد):</span>
              <select 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-violet-600"
              >
                <option value={3}>3 أسئلة</option>
                <option value={5}>5 أسئلة</option>
                <option value={10}>10 أسئلة</option>
                <option value={15}>15 سؤال</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-black transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              إلغاء (رجوع)
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading || (mode === 'smart' && !selectedLesson) || (mode === 'manual' && !manualTitle.trim())}
              className="px-7 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد...</>
              ) : mode === 'smart' ? (
                <><Bot className="w-5 h-5" /> توليد ذكي ونشر</>
              ) : (
                <><Check className="w-5 h-5" /> إنشاء الواجب</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
