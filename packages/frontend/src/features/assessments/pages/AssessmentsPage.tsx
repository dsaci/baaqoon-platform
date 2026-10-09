import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle, Bot, Loader2, PenTool, X } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import CreateAssessmentModal from '../components/CreateAssessmentModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.primaryRole === 'teacher';
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorMode, setGeneratorMode] = useState<'smart' | 'manual'>('smart');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({ title: '', cohortId: '', description: '', subject: '' });
  const [isManualCreating, setIsManualCreating] = useState(false);
  const queryClient = useQueryClient();
  const { data: myCohorts = [] } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me');
      return res.data;
    },
    enabled: isTeacher
  });

  const { data: dbAssessments = [], isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const res = await api.get('/assessments');
      return res.data;
    }
  });

  // Merge DB assessments with UI formatting
  const assessments = dbAssessments.map((dbAssessment: any) => ({
    id: dbAssessment.id,
    title: dbAssessment.title,
    cohort: dbAssessment.cohort?.name || (isTeacher ? 'فوج غزة (علمي)' : 'فيزياء'),
    dueDate: new Date(dbAssessment.dueDate).toLocaleDateString('ar-EG'),
    maxScore: dbAssessment.maxScore,
    studentStatus: 'pending', // mock for students
    studentScore: null,
    stats: {
      total: dbAssessment.cohort?.maxStudents || 15,
      submitted: 0,
      graded: 0,
      pending: 0
    }
  }));

  const handleReset = async () => {
    if (confirm('هل أنت متأكد من تصفير (حذف) جميع الاختبارات التجريبية؟')) {
      await api.delete('/assessments');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-baaqoon-accent" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">الواجبات والتقييمات</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {isTeacher ? 'إدارة التقييمات وتصحيح تسليمات الطلاب بفعالية.' : 'عرض وتسليم الواجبات المطلوبة منك بدقة واحترافية.'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          {isTeacher && (
            <>
              {/* Secondary Actions */}
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                <button 
                  onClick={handleReset}
                  className="px-4 py-3 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center gap-2"
                  title="حذف جميع الاختبارات التجريبية"
                >
                  تصفير التوليدات
                </button>
                
                <button 
                  onClick={() => { setGeneratorMode('smart'); setIsGeneratorOpen(true); }}
                  className="px-4 py-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Bot className="w-4 h-4" />
                  توليد ذكي
                </button>
              </div>

              {/* Primary Action */}
              <button 
                onClick={() => { setGeneratorMode('manual'); setIsGeneratorOpen(true); }}
                className="px-6 py-3 bg-gradient-to-l from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30 w-full md:w-auto justify-center hover:-translate-y-0.5"
              >
                <FileText className="w-5 h-5" />
                إنشاء واجب جديد
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assessments.map(assessment => (
          <div key={assessment.id} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-0 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
            {/* Assessment Info */}
            <div className="p-6 md:w-2/5 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg">
                  {assessment.cohort}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" /> آخر موعد: {assessment.dueDate}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{assessment.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">الدرجة القصوى: {assessment.maxScore}</p>
            </div>

            {/* Assessment Stats & Actions */}
            <div className="p-6 md:w-3/5 flex items-center gap-4 md:gap-8 justify-between">
              {isTeacher ? (
                <>
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{assessment.stats.submitted}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">تم التسليم</p>
                  </div>
                  <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                  
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-black text-emerald-500">{assessment.stats.graded}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" /> تم التصحيح
                    </p>
                  </div>
                  <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>

                  <div className="flex-1 text-center">
                    <p className={`text-3xl font-black ${assessment.stats.pending > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      {assessment.stats.pending}
                    </p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                      {assessment.stats.pending > 0 && <AlertCircle className="w-3 h-3 text-rose-500" />}
                      بانتظار التقييم
                    </p>
                  </div>

                  <div className="mr-auto flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        const printWindow = window.open('', '', 'width=800,height=600');
                        printWindow?.document.write(`
                          <html dir="rtl">
                            <head>
                              <title>${assessment.title}</title>
                              <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                                .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
                                .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                                .score { font-weight: bold; color: #e11d48; float: left; }
                              </style>
                            </head>
                            <body>
                              <h1>${assessment.title}</h1>
                              <div class="meta">المبحث: ${assessment.courseTitle} | نوع الواجب: ${assessment.type === 'homework' ? 'واجب منزلي' : 'اختبار قصير'}</div>
                              <div class="questions">
                                ${assessment.questions ? assessment.questions.map((q: any, i: number) => `
                                  <div class="question">
                                    <span class="score">${q.scoreWeight} درجات</span>
                                    <strong>س${i + 1}:</strong> ${q.questionTemplate.content}
                                  </div>
                                `).join('') : '<p>لا توجد أسئلة مضافة حتى الآن.</p>'}
                              </div>
                              <script>window.print(); setTimeout(() => window.close(), 500);</script>
                            </body>
                          </html>
                        `);
                        printWindow?.document.close();
                      }}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block text-center border border-slate-200 dark:border-slate-700"
                    >
                      تصدير (PDF)
                    </button>
                    <Link
                      to={`/teacher/assessments/${assessment.id}/grade`}
                      className="px-4 py-2.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md text-sm whitespace-nowrap block text-center hover:-translate-y-0.5"
                    >
                      عرض وتصحيح
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 text-center md:text-right">
                    {assessment.studentStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm font-bold">
                        <AlertCircle className="w-4 h-4" /> بانتظار التسليم
                      </span>
                    )}
                    {assessment.studentStatus === 'submitted' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-bold">
                        <CheckCircle className="w-4 h-4" /> قيد التصحيح
                      </span>
                    )}
                    {assessment.studentStatus === 'graded' && (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-bold">
                          <CheckCircle className="w-4 h-4" /> تم التصحيح
                        </span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                          الدرجة: <span className="text-emerald-600">{assessment.studentScore}</span> / {assessment.maxScore}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mr-auto flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => {
                        const printWindow = window.open('', '', 'width=800,height=600');
                        printWindow?.document.write(`
                          <html dir="rtl">
                            <head>
                              <title>${assessment.title}</title>
                              <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                                .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
                                .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                                .score { font-weight: bold; color: #e11d48; float: left; }
                              </style>
                            </head>
                            <body>
                              <h1>${assessment.title}</h1>
                              <div class="meta">المبحث: ${assessment.courseTitle} | نوع الواجب: ${assessment.type === 'homework' ? 'واجب منزلي' : 'اختبار قصير'}</div>
                              <div class="questions">
                                ${assessment.questions ? assessment.questions.map((q: any, i: number) => `
                                  <div class="question">
                                    <span class="score">${q.scoreWeight} درجات</span>
                                    <strong>س${i + 1}:</strong> ${q.questionTemplate.content}
                                  </div>
                                `).join('') : '<p>لا توجد أسئلة مضافة حتى الآن.</p>'}
                              </div>
                              <script>window.print(); setTimeout(() => window.close(), 500);</script>
                            </body>
                          </html>
                        `);
                        printWindow?.document.close();
                      }}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block text-center border border-slate-200 dark:border-slate-700"
                    >
                      تصدير (PDF)
                    </button>
                    {assessment.studentStatus === 'pending' ? (
                      <Link to={`/student/assessments/${assessment.id}/take`} className="px-6 py-2.5 bg-gradient-to-l from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-bold rounded-xl transition-all shadow-md text-sm whitespace-nowrap block text-center hover:-translate-y-0.5">
                        بدء الحل والتسليم
                      </Link>
                    ) : (
                      <button className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block border border-slate-200 dark:border-slate-700">
                        عرض الإجابة
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateAssessmentModal 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)}
        defaultMode={generatorMode}
      />


      {/* Manual Assignment Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
              <h2 className="text-xl font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                <PenTool className="w-6 h-6" />
                إضافة واجب / تكليف جديد
              </h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الواجب</label>
                <input 
                  type="text" 
                  value={manualFormData.title}
                  onChange={e => setManualFormData({...manualFormData, title: e.target.value})}
                  placeholder="مثال: حل تمارين الوحدة الثانية"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفوج المستهدف</label>
                <select 
                  value={manualFormData.cohortId}
                  onChange={e => setManualFormData({...manualFormData, cohortId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- اختر الفوج --</option>
                  {myCohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الدرس / الموضوع</label>
                <input 
                  type="text" 
                  value={manualFormData.subject}
                  onChange={e => setManualFormData({...manualFormData, subject: e.target.value})}
                  placeholder="مثال: المعادلات التفاضلية"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تفاصيل وبيانات الواجب</label>
                <textarea 
                  rows={4}
                  value={manualFormData.description}
                  onChange={e => setManualFormData({...manualFormData, description: e.target.value})}
                  placeholder="اكتب تفاصيل الواجب، أرقام الصفحات، أو الأسئلة المطلوبة..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              >
                إلغاء
              </button>
              <button 
                disabled={isManualCreating || !manualFormData.title || !manualFormData.cohortId}
                onClick={async () => {
                  setIsManualCreating(true);
                  try {
                    await api.post('/assessments', manualFormData);
                    queryClient.invalidateQueries({ queryKey: ['assessments'] });
                    setIsManualModalOpen(false);
                    setManualFormData({ title: '', cohortId: '', description: '', subject: '' });
                  } catch (err) {
                    alert('حدث خطأ أثناء حفظ الواجب');
                  } finally {
                    setIsManualCreating(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isManualCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
                حفظ وإسناد الواجب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
