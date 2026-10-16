import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle, Bot, Loader2, Plus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/useAuthStore';
import CreateAssessmentModal from '../components/CreateAssessmentModal';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function AssessmentsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();
  const isTeacher =
    user?.primaryRole === 'teacher' ||
    user?.isDualRole ||
    user?.roles?.includes('teacher') ||
    window.location.pathname.startsWith('/teacher');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorMode, setGeneratorMode] = useState<'smart' | 'manual'>('smart');
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const queryClient = useQueryClient();

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
    cohort: dbAssessment.cohort?.name || (isTeacher ? 'فوج عام' : 'مبحث عام'),
    courseTitle: dbAssessment.cohort?.course?.title || dbAssessment.cohort?.name || 'المنهاج الفلسطيني',
    type: dbAssessment.type || 'homework',
    questions: dbAssessment.questions,
    dueDate: dbAssessment.dueDate ? new Date(dbAssessment.dueDate).toLocaleDateString('ar-EG') : 'غير محدد',
    maxScore: dbAssessment.maxScore || 20,
    studentStatus: 'pending',
    studentScore: null,
    stats: {
      total: dbAssessment.cohort?.maxStudents || 15,
      submitted: dbAssessment.submissions?.length || 0,
      graded: dbAssessment.submissions?.filter((s: any) => s.status === 'graded')?.length || 0,
      pending: dbAssessment.submissions?.filter((s: any) => s.status !== 'graded')?.length || 0
    }
  }));

  const handleReset = async () => {
    if (confirm('هل أنت متأكد من تصفير (حذف) جميع الاختبارات والتكليفات التجريبية؟')) {
      await api.delete('/assessments');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        <p className="text-sm font-bold text-slate-500">جاري تحميل سجل الواجبات والتقييمات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 text-white shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {t('assessments.title', 'الواجبات والتقييمات')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {isTeacher 
                ? (isRtl ? 'إدارة التكليفات والواجبات المنزلية، وتصحيح تسليمات الطلاب بفعالية.' : 'Manage assignments, homework, and efficiently grade student submissions.')
                : (isRtl ? 'عرض وتسليم الواجبات المطلوبة منك بدقة واحترافية.' : 'View and submit assigned homework and assessments with ease.')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          {isTeacher && (
            <>
              {/* Secondary Actions */}
              <div className={`flex items-center gap-2 ${isRtl ? 'border-l pl-3' : 'border-r pr-3'} border-slate-200 dark:border-slate-700`}>
                <button 
                  onClick={handleReset}
                  className="px-4 py-3 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center gap-2"
                  title={isRtl ? "حذف جميع التكليفات التجريبية" : "Reset generated assessments"}
                >
                  {isRtl ? 'تصفير التوليدات' : 'Reset'}
                </button>
                
                <button 
                  onClick={() => { setGeneratorMode('smart'); setIsGeneratorOpen(true); }}
                  className="px-4 py-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Bot className="w-4 h-4" />
                  {t('assessments.generate_smart_quiz', 'توليد ذكي')}
                </button>
              </div>

              {/* Primary Action Button: Create Assignment */}
              <button 
                type="button"
                onClick={() => setIsAssignmentModalOpen(true)}
                className={`px-6 py-3 ${isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30 w-full md:w-auto justify-center hover:-translate-y-0.5 cursor-pointer`}
              >
                <Plus className="w-5 h-5" />
                {t('assessments.create_new', 'إنشاء واجب جديد')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State vs List */}
      {assessments.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">لا توجد واجبات أو تكليفات حالياً</h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {isTeacher 
              ? 'يمكنك البدء بإنشاء أول واجب منزلي أو تكليف وتحديده لطلبة الفوج فوراً.' 
              : 'لم يقم المعلمون بإسناد أي واجبات لفوجك بعد. ستظهر هنا فور إسنادها.'}
          </p>
          {isTeacher && (
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/25 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              إنشاء أول واجب الآن
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {assessments.map(assessment => (
            <div key={assessment.id} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-0 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
              {/* Assessment Info */}
              <div className={`p-6 md:w-2/5 border-b md:border-b-0 ${isRtl ? 'md:border-l' : 'md:border-r'} border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg">
                    {assessment.cohort}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {t('assessments.due_date', 'آخر موعد')}: {assessment.dueDate}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{assessment.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {t('assessments.max_score', 'الدرجة القصوى')}: {assessment.maxScore}
                </p>
              </div>

              {/* Assessment Stats & Actions */}
              <div className="p-6 md:w-3/5 flex items-center gap-4 md:gap-8 justify-between">
                {isTeacher ? (
                  <>
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{assessment.stats.submitted}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {t('assessments.submissions_count', 'تم التسليم')}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-black text-emerald-500">{assessment.stats.graded}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {t('assessments.graded', 'تم التصحيح')}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>

                    <div className="flex-1 text-center">
                      <p className={`text-3xl font-black ${assessment.stats.pending > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {assessment.stats.pending}
                      </p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                        {assessment.stats.pending > 0 && <AlertCircle className="w-3 h-3 text-rose-500" />}
                        {t('assessments.pending_grade', 'بانتظار التقييم')}
                      </p>
                    </div>

                    <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} flex flex-col gap-2`}>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '', 'width=800,height=600');
                          printWindow?.document.write(`
                            <html dir="${isRtl ? 'rtl' : 'ltr'}">
                              <head>
                                <title>${assessment.title}</title>
                                <style>
                                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                  h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                                  .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
                                  .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                                  .score { font-weight: bold; color: #e11d48; float: ${isRtl ? 'left' : 'right'}; }
                                </style>
                              </head>
                              <body>
                                <h1>${assessment.title}</h1>
                                <div class="meta">${isRtl ? 'المبحث' : 'Subject'}: ${assessment.courseTitle} | ${isRtl ? 'نوع الواجب' : 'Type'}: ${assessment.type === 'homework' ? (isRtl ? 'واجب منزلي' : 'Homework') : (isRtl ? 'اختبار قصير' : 'Quiz')}</div>
                                <div class="questions">
                                  ${assessment.questions && assessment.questions.length > 0 ? assessment.questions.map((q: any, i: number) => `
                                    <div class="question">
                                      <span class="score">${q.scoreWeight || 1} ${isRtl ? 'درجات' : 'pts'}</span>
                                      <strong>Q${i + 1}:</strong> ${q.questionTemplate?.content || q.questionTemplate?.questionTextAr || q.content || 'سؤال بدون نص'}
                                    </div>
                                  `).join('') : `<div class="question"><p>${assessment.description || 'لا توجد أسئلة مضافة'}</p></div>`}
                                </div>
                                <script>window.print(); setTimeout(() => window.close(), 500);</script>
                              </body>
                            </html>
                          `);
                          printWindow?.document.close();
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block text-center border border-slate-200 dark:border-slate-700"
                      >
                        {isRtl ? 'تصدير (PDF)' : 'Export (PDF)'}
                      </button>
                      <Link
                        to={`/teacher/assessments/${assessment.id}/grade`}
                        className={`px-4 py-2.5 ${isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md text-sm whitespace-nowrap block text-center hover:-translate-y-0.5`}
                      >
                        {t('assessments.grading', isRtl ? 'عرض وتصحيح' : 'Grade Submissions')}
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`flex-1 text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
                      {assessment.studentStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm font-bold">
                          <AlertCircle className="w-4 h-4" /> {isRtl ? 'بانتظار التسليم' : 'Pending Submission'}
                        </span>
                      )}
                      {assessment.studentStatus === 'submitted' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-bold">
                          <CheckCircle className="w-4 h-4" /> {isRtl ? 'قيد التصحيح' : 'Grading in progress'}
                        </span>
                      )}
                      {assessment.studentStatus === 'graded' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-bold">
                            <CheckCircle className="w-4 h-4" /> {t('assessments.graded', 'تم التصحيح')}
                          </span>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                            {t('assessments.score', 'الدرجة')}: <span className="text-emerald-600">{assessment.studentScore}</span> / {assessment.maxScore}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} flex flex-col sm:flex-row gap-2`}>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '', 'width=800,height=600');
                          printWindow?.document.write(`
                            <html dir="${isRtl ? 'rtl' : 'ltr'}">
                              <head>
                                <title>${assessment.title}</title>
                                <style>
                                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                  h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                                  .meta { color: #666; margin-bottom: 30px; font-size: 14px; }
                                  .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                                  .score { font-weight: bold; color: #e11d48; float: ${isRtl ? 'left' : 'right'}; }
                                </style>
                              </head>
                              <body>
                                <h1>${assessment.title}</h1>
                                <div class="meta">${isRtl ? 'المبحث' : 'Subject'}: ${assessment.courseTitle} | ${isRtl ? 'نوع الواجب' : 'Type'}: ${assessment.type === 'homework' ? (isRtl ? 'واجب منزلي' : 'Homework') : (isRtl ? 'اختبار قصير' : 'Quiz')}</div>
                                <div class="questions">
                                  ${assessment.questions && assessment.questions.length > 0 ? assessment.questions.map((q: any, i: number) => `
                                    <div class="question">
                                      <span class="score">${q.scoreWeight || 1} ${isRtl ? 'درجات' : 'pts'}</span>
                                      <strong>Q${i + 1}:</strong> ${q.questionTemplate?.content || q.questionTemplate?.questionTextAr || q.content || 'سؤال بدون نص'}
                                    </div>
                                  `).join('') : `<div class="question"><p>${assessment.description || 'لا توجد أسئلة مضافة'}</p></div>`}
                                </div>
                                <script>window.print(); setTimeout(() => window.close(), 500);</script>
                              </body>
                            </html>
                          `);
                          printWindow?.document.close();
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block text-center border border-slate-200 dark:border-slate-700"
                      >
                        {isRtl ? 'تصدير (PDF)' : 'Export (PDF)'}
                      </button>
                      {assessment.studentStatus === 'pending' ? (
                        <Link to={`/student/assessments/${assessment.id}/take`} className={`px-6 py-2.5 ${isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-bold rounded-xl transition-all shadow-md text-sm whitespace-nowrap block text-center hover:-translate-y-0.5`}>
                          {isRtl ? 'بدء الحل والتسليم' : 'Start Assessment'}
                        </Link>
                      ) : (
                        <Link to={`/student/assessments/${assessment.id}/take`} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm whitespace-nowrap block text-center border border-slate-200 dark:border-slate-700">
                          {isRtl ? 'عرض الإجابة والنتيجة' : 'View Submission'}
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Generator Modal */}
      <CreateAssessmentModal 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)}
        defaultMode={generatorMode}
      />

      {/* Manual Assignment Creation Modal */}
      <CreateAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['assessments'] });
        }}
      />
    </div>
  );
}
