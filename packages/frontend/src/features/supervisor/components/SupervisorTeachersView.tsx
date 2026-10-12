import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Users, User, BookOpen, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, Star, Award, Shield, FileText, Send, X, 
  Mail, Phone, Calendar, Search, Filter, RefreshCw, ChevronRight,
  TrendingUp, Sparkles, ExternalLink, HelpCircle
} from 'lucide-react';

export default function SupervisorTeachersView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned' | 'active'>('all');
  
  // Modals state
  const [selectedTeacherForDossier, setSelectedTeacherForDossier] = useState<any>(null);
  const [selectedTeacherForSurvey, setSelectedTeacherForSurvey] = useState<any>(null);
  const [selectedTeacherForClarification, setSelectedTeacherForClarification] = useState<any>(null);

  // Survey Form State
  const [surveyForm, setSurveyForm] = useState({
    evaluationType: 'survey',
    title: 'استبيان تقييم أداء ومتابعة الأستاذ',
    syllabusAdherenceScore: 5,
    pedagogicalQualityScore: 5,
    studentInteractionScore: 5,
    assessmentQualityScore: 5,
    techPlatformUseScore: 5,
    notes: '',
    recommendations: '',
    actionPlan: ''
  });

  // Clarification Form State
  const [clarificationForm, setClarificationForm] = useState({
    type: 'clarification',
    title: '',
    content: '',
    isUrgent: false
  });

  // Fetch subject teachers
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['supervisor_subject_teachers', selectedSubjectId],
    queryFn: async () => {
      const url = selectedSubjectId 
        ? `/groups/supervisor/subject-teachers?subjectId=${selectedSubjectId}`
        : '/groups/supervisor/subject-teachers';
      const res = await api.get(url);
      return res.data;
    }
  });

  // Set default subject if not selected
  React.useEffect(() => {
    if (data?.activeSubject?.id && !selectedSubjectId) {
      setSelectedSubjectId(data.activeSubject.id);
    }
  }, [data?.activeSubject?.id, selectedSubjectId]);

  // Set default subject mutation
  const setSubjectMutation = useMutation({
    mutationFn: async (subId: string) => {
      return api.patch('/groups/supervisor/set-subject', { subjectId: subId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_subject_teachers'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor_stats'] });
      alert('تم تحديث مادة التخصص الإشرافي بنجاح!');
    }
  });

  // Submit Evaluation Mutation
  const evaluationMutation = useMutation({
    mutationFn: async ({ teacherId, form }: { teacherId: string; form: any }) => {
      return api.post(`/groups/supervisor/teachers/${teacherId}/evaluations`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_subject_teachers'] });
      setSelectedTeacherForSurvey(null);
      setSurveyForm({
        evaluationType: 'survey',
        title: 'استبيان تقييم أداء ومتابعة الأستاذ',
        syllabusAdherenceScore: 5,
        pedagogicalQualityScore: 5,
        studentInteractionScore: 5,
        assessmentQualityScore: 5,
        techPlatformUseScore: 5,
        notes: '',
        recommendations: '',
        actionPlan: ''
      });
      alert('تم حفظ وتوثيق الاستبيان الإشرافي وإرسال الإشعار للأستاذ بنجاح!');
    },
    onError: () => {
      alert('حدث خطأ أثناء حفظ الاستبيان الإشرافي');
    }
  });

  // Submit Clarification Mutation
  const clarificationMutation = useMutation({
    mutationFn: async ({ teacherId, form }: { teacherId: string; form: any }) => {
      return api.post(`/groups/supervisor/teachers/${teacherId}/clarifications`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_subject_teachers'] });
      setSelectedTeacherForClarification(null);
      setClarificationForm({
        type: 'clarification',
        title: '',
        content: '',
        isUrgent: false
      });
      alert('تم إرسال التوضيح/التوجيه التربوي للأستاذ بنجاح!');
    },
    onError: () => {
      alert('حدث خطأ أثناء إرسال التوضيح التربوي');
    }
  });

  const teachersList = data?.teachers || [];
  const activeSubject = data?.activeSubject || null;
  const allSubjects = data?.allSubjects || [];

  // Filter teachers
  const filteredTeachers = teachersList.filter((t: any) => {
    const fullName = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
    const email = (t.email || '').toLowerCase();
    const phone = (t.phone || '').toLowerCase();
    const branch = (t.academicBranch || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesQuery = fullName.includes(query) || email.includes(query) || phone.includes(query) || branch.includes(query);

    if (!matchesQuery) return false;

    if (statusFilter === 'assigned') return t.totalCohorts > 0;
    if (statusFilter === 'unassigned') return t.totalCohorts === 0;
    if (statusFilter === 'active') return t.status === 'active';

    return true;
  });

  // Aggregate Subject Metrics
  const totalTeachers = teachersList.length;
  const totalAssignedCohorts = teachersList.reduce((acc: number, t: any) => acc + (t.totalCohorts || 0), 0);
  const totalSessionsTaught = teachersList.reduce((acc: number, t: any) => acc + (t.metrics?.completedSessions || 0), 0);
  const avgAttendance = teachersList.length > 0 
    ? Math.round(teachersList.reduce((acc: number, t: any) => acc + (t.metrics?.attendanceRate || 100), 0) / teachersList.length)
    : 100;
  
  // Calculate average rating
  const ratedTeachers = teachersList.filter((t: any) => t.metrics?.evaluationScore != null);
  const overallAvgRating = ratedTeachers.length > 0
    ? Math.round(ratedTeachers.reduce((acc: number, t: any) => acc + t.metrics.evaluationScore, 0) / ratedTeachers.length)
    : null;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 1. Header & Subject Coordination Context */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  كادر أساتذة المادة ومتابعة التنسيق
                  {activeSubject && (
                    <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      {activeSubject.nameAr}
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  رصد شامل ومفصل لجميع أساتذة مادة تخصصك، وجداولهم، وأفواجهم، مع إمكانية التقييم وإرسال التوضيحات والرسائل
                </p>
              </div>
            </div>
          </div>

          {/* Subject Switcher & Defaults */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-initial flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <BookOpen className="w-4 h-4 text-emerald-600 mr-2" />
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">مادة التنسيق:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allSubjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedSubjectId && selectedSubjectId !== user?.supervisedSubjectId && (
              <button
                onClick={() => setSubjectMutation.mutate(selectedSubjectId)}
                disabled={setSubjectMutation.isPending}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                title="تثبيت هذه المادة كمادة إشرافية رئيسية في حسابك"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                تثبيت كمادتي
              </button>
            )}

            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex-shrink-0"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">أساتذة المادة</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">{totalTeachers}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">كادر التخصص المعتمد</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">الأفواج المسندة</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100">{totalAssignedCohorts}</div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold mt-0.5">فوج تحت التدريس</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">الحصص المنفذة</span>
              <CheckCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-950 dark:text-purple-100">{totalSessionsTaught}</div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold mt-0.5">حصة افتراضية تمت</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">مواظبة الطلبة</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 dark:text-amber-100">{avgAttendance}%</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">متوسط نسبة الحضور</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/50 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">التقييم الإشرافي</span>
              <Star className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950 dark:text-rose-100">
              {overallAvgRating ? `${overallAvgRating}%` : 'قيد الرصد'}
            </div>
            <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold mt-0.5">متوسط استبيانات المشرف</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، الإيميل، الهاتف، الفرع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            الجميع ({teachersList.length})
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              statusFilter === 'assigned'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            مسندون لأفواج ({teachersList.filter((t: any) => t.totalCohorts > 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('unassigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              statusFilter === 'unassigned'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            بانتظار التفويج ({teachersList.filter((t: any) => t.totalCohorts === 0).length})
          </button>
        </div>
      </div>

      {/* 4. Teachers List / Detailed Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-500">جاري تحميل بيانات أساتذة المادة بتفاصيلهم الكاملة...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
            لا يوجد أساتذة مسجلين في مادة «{activeSubject?.nameAr || 'المادة المحددة'}» حتى الآن
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            يمكنك اختيار مادة أخرى من القائمة العلوية أو قيام الإدارة بإسناد أساتذة لهذا التخصص، كما يتاح لك إنشاء أفواج وإسناد الكادر بسهولة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTeachers.map((teacher: any) => {
            const initial = teacher.firstName?.[0] || 'أ';
            const hasCohorts = teacher.totalCohorts > 0;
            const evalScore = teacher.metrics?.evaluationScore;

            return (
              <div
                key={teacher.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card Header: Avatar & Main Identifiers */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                          {initial}
                        </div>
                        <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="نشط"></span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            أ. {teacher.firstName} {teacher.lastName}
                          </h3>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            أستاذ مادة
                          </span>
                          {teacher.nationality && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {teacher.nationality}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            {teacher.supervisedSubject?.nameAr || activeSubject?.nameAr || 'مادة التخصص'}
                          </span>
                          <span>•</span>
                          <span>الفرع: {teacher.academicBranch === 'scientific' ? 'علمي' : teacher.academicBranch === 'literary' ? 'أدبي' : 'مشترك'}</span>
                          <span>•</span>
                          <span>المنهج: {teacher.curriculumType === 'governmental' ? 'حكومي فلسطيني' : 'أزهري'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Evaluation Score Badge */}
                    <div className="text-left">
                      {evalScore ? (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {evalScore}%
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-bold">تقييم المشرف</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          لم يُقيّم بعد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs mb-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate" dir="ltr">{teacher.email || 'لا يوجد بريد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span dir="ltr">{teacher.phone || 'لا يوجد هاتف'}</span>
                    </div>
                  </div>

                  {/* Cohorts assigned banner */}
                  <div className="mb-4">
                    {hasCohorts ? (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>الأفواج المسندة ({teacher.cohortsTaught.length}):</span>
                          <span className="text-emerald-600 dark:text-emerald-400">إجمالي الطلبة: {teacher.cohortsTaught.reduce((s: number, c: any) => s + c.studentsCount, 0)} طالب</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.cohortsTaught.map((coh: any) => (
                            <span
                              key={coh.id}
                              className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {coh.name} ({coh.studentsCount} طالب)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>الأستاذ غير مسند لأي فوج حالياً، متاح للإسناد والتفويج في مادة التخصص.</span>
                      </div>
                    )}
                  </div>

                  {/* 4 Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2 py-3 px-2 border-y border-slate-100 dark:border-slate-800 text-center mb-4">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">{teacher.metrics?.totalSessions || 0}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">الحصص</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{teacher.metrics?.completedSessions || 0}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">المنجزة</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-blue-600 dark:text-blue-400">{teacher.metrics?.createdAssessmentsCount || 0}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">الواجبات</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-purple-600 dark:text-purple-400">{teacher.metrics?.attendanceRate || 100}%</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">الحضور</div>
                    </div>
                  </div>
                </div>

                {/* 3 Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => setSelectedTeacherForDossier(teacher)}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    الملف الشامل
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTeacherForSurvey(teacher);
                      setSurveyForm({
                        evaluationType: 'survey',
                        title: `استبيان تقييم ومتابعة أداء: أ. ${teacher.firstName} ${teacher.lastName}`,
                        syllabusAdherenceScore: 5,
                        pedagogicalQualityScore: 5,
                        studentInteractionScore: 5,
                        assessmentQualityScore: 5,
                        techPlatformUseScore: 5,
                        notes: '',
                        recommendations: '',
                        actionPlan: ''
                      });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-200 dark:border-amber-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    استبيان وتقييم
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTeacherForClarification(teacher);
                      setClarificationForm({
                        type: 'clarification',
                        title: `توجيه إشرافي بخصوص سير مادة ${activeSubject?.nameAr || ''}`,
                        content: '',
                        isUrgent: false
                      });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    توضيح ورسالة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Full Teacher Dossier & Complete Details (الملف الشامل للأستاذ) */}
      {/* ========================================================================= */}
      {selectedTeacherForDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white">
                  {selectedTeacherForDossier.firstName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    الملف الشامل: أ. {selectedTeacherForDossier.firstName} {selectedTeacherForDossier.lastName}
                  </h3>
                  <p className="text-xs text-emerald-100 font-bold mt-0.5">
                    مادة التخصص: {selectedTeacherForDossier.supervisedSubject?.nameAr || activeSubject?.nameAr} • المعرف الأكاديمي: {selectedTeacherForDossier.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherForDossier(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
              {/* Profile details grid */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  البيانات الرسمية والأكاديمية
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">البريد الإلكتروني:</span>
                    <span className="font-bold text-slate-800 dark:text-white truncate block" dir="ltr">{selectedTeacherForDossier.email || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">الهاتف للتواصل:</span>
                    <span className="font-bold text-slate-800 dark:text-white block" dir="ltr">{selectedTeacherForDossier.phone || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">الجنسية:</span>
                    <span className="font-bold text-slate-800 dark:text-white block">{selectedTeacherForDossier.nationality || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">الفرع الدراسي:</span>
                    <span className="font-bold text-slate-800 dark:text-white block">{selectedTeacherForDossier.academicBranch || 'علمي'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">المنهج:</span>
                    <span className="font-bold text-slate-800 dark:text-white block">{selectedTeacherForDossier.curriculumType || 'حكومي فلسطيني'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">حالة الحساب:</span>
                    <span className="font-bold text-emerald-600 block">نشط ومعتمد</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">تاريخ الانضمام:</span>
                    <span className="font-bold text-slate-800 dark:text-white block">{new Date(selectedTeacherForDossier.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">آخر تسجيل دخول:</span>
                    <span className="font-bold text-slate-800 dark:text-white block">
                      {selectedTeacherForDossier.lastLoginAt ? new Date(selectedTeacherForDossier.lastLoginAt).toLocaleDateString('ar-EG') : 'نشط مؤخراً'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cohorts Details */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  الأفواج المسندة والمجموعات
                </h4>
                {selectedTeacherForDossier.cohortsTaught?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTeacherForDossier.cohortsTaught.map((coh: any) => (
                      <div key={coh.id} className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                        <div>
                          <div className="font-black text-xs text-blue-950 dark:text-blue-100">{coh.name}</div>
                          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">كود الفوج: {coh.code}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs">
                          {coh.studentsCount} طالب
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-center">
                    لم يُسند للأستاذ أي فوج دراسي حتى الآن. يمكنك إسناده عبر تبويب «الأفواج والإسناد».
                  </p>
                )}
              </div>

              {/* Supervisory Evaluations History */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  سجل استبيانات وتقييمات المشرف
                </h4>
                {selectedTeacherForDossier.recentEvaluations?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeacherForDossier.recentEvaluations.map((ev: any) => (
                      <div key={ev.id} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs text-amber-900 dark:text-amber-200">{ev.title}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs">
                            النتيجة: {ev.overallScore}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <div>الالتزام: {ev.syllabusAdherenceScore}/5</div>
                          <div>التمكن: {ev.pedagogicalQualityScore}/5</div>
                          <div>التفاعل: {ev.studentInteractionScore}/5</div>
                          <div>الواجبات: {ev.assessmentQualityScore}/5</div>
                          <div>المنصة: {ev.techPlatformUseScore}/5</div>
                        </div>
                        {ev.recommendations && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900">
                            <strong>توصيات المشرف:</strong> {ev.recommendations}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 block text-left" dir="ltr">
                          {new Date(ev.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-center">
                    لا يوجد استبيانات مسجلة لهذا الأستاذ بعد. يمكنك الضغط على زر «استبيان وتقييم» لإجراء أول تقييم.
                  </p>
                )}
              </div>

              {/* Clarifications / Messages History */}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  سجل التوضيحات والتوجيهات التربوية
                </h4>
                {selectedTeacherForDossier.recentClarifications?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTeacherForDossier.recentClarifications.map((cl: any) => (
                      <div key={cl.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs text-slate-900 dark:text-white">{cl.title}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            cl.isUrgent ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cl.isUrgent ? 'عاجل' : 'توجيه تربوي'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{cl.content}</p>
                        {cl.teacherReply && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 mt-2">
                            <strong>رد الأستاذ:</strong> {cl.teacherReply}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block text-left" dir="ltr">
                          {new Date(cl.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl text-center">
                    لا توجد رسائل أو توضيحات مرسلة لهذا الأستاذ بعد.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTeacherForDossier(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Supervisory Survey & Evaluation (استبيان وتقييم المشرف للأستاذ) */}
      {/* ========================================================================= */}
      {selectedTeacherForSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white">
                  <Star className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    استبيان وتقييم إشرافي: أ. {selectedTeacherForSurvey.firstName} {selectedTeacherForSurvey.lastName}
                  </h3>
                  <p className="text-xs text-amber-100 font-bold mt-0.5">
                    مادة التخصص: {selectedTeacherForSurvey.supervisedSubject?.nameAr || activeSubject?.nameAr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherForSurvey(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                evaluationMutation.mutate({
                  teacherId: selectedTeacherForSurvey.id,
                  form: surveyForm
                });
              }}
              className="p-6 overflow-y-auto space-y-5 flex-1 text-right"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  عنوان الاستبيان / المناسبة:
                </label>
                <input
                  type="text"
                  required
                  value={surveyForm.title}
                  onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 5 Rating Criteria */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black text-slate-800 dark:text-white mb-2">
                  معايير التقييم التربوي (مقياس من 1 إلى 5):
                </h4>

                {[
                  { key: 'syllabusAdherenceScore', label: '1. الالتزام بالخطة الدراسية وتوزيع المنهاج الشهري' },
                  { key: 'pedagogicalQualityScore', label: '2. التمكن العلمي ودقة المادة والأسلوب التربوي' },
                  { key: 'studentInteractionScore', label: '3. التفاعل مع الطلبة وتحفيز المشاركة ورصد الحضور' },
                  { key: 'assessmentQualityScore', label: '4. جودة الواجبات وسرعة ودقة تصحيح استجابات الطلاب' },
                  { key: 'techPlatformUseScore', label: '5. توظيف أدوات المنصة والسبورة الرقمية' },
                ].map((crit) => (
                  <div key={crit.key} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{crit.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSurveyForm({ ...surveyForm, [crit.key]: val })}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                            (surveyForm as any)[crit.key] >= val
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Score Preview */}
                <div className="pt-2 flex justify-between items-center text-xs font-black text-amber-700 dark:text-amber-400">
                  <span>المعدل الإجمالي المحسوب:</span>
                  <span className="text-sm bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-xl">
                    {Math.round(
                      ((surveyForm.syllabusAdherenceScore +
                        surveyForm.pedagogicalQualityScore +
                        surveyForm.studentInteractionScore +
                        surveyForm.assessmentQualityScore +
                        surveyForm.techPlatformUseScore) / 25) * 100
                    )}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  نقاط القوة والملاحظات الإيجابية:
                </label>
                <textarea
                  rows={2}
                  value={surveyForm.notes}
                  onChange={(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })}
                  placeholder="أداء متميز في التفاعل وتوصيل المفاهيم الصعبة..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  التوصيات الإشرافية وخطة التحسين للأستاذ:
                </label>
                <textarea
                  rows={3}
                  value={surveyForm.recommendations}
                  onChange={(e) => setSurveyForm({ ...surveyForm, recommendations: e.target.value })}
                  placeholder="يُنصح بزيادة وتيرة التمارين التطبيقية والتأكيد على الطلاب لحل الواجب في وقته..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 -mx-6 -mb-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForSurvey(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={evaluationMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  {evaluationMutation.isPending ? 'جاري الحفظ...' : 'حفظ وتوثيق الاستبيان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Direct Supervisory Clarification & Messaging (توضيح ورسالة للأستاذ) */}
      {/* ========================================================================= */}
      {selectedTeacherForClarification && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    إرسال توضيح / توجيه تربوي
                  </h3>
                  <p className="text-xs text-emerald-100 font-bold mt-0.5">
                    إلى الأستاذ: {selectedTeacherForClarification.firstName} {selectedTeacherForClarification.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherForClarification(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clarificationMutation.mutate({
                  teacherId: selectedTeacherForClarification.id,
                  form: clarificationForm
                });
              }}
              className="p-6 space-y-4 text-right"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  نوع التواصل:
                </label>
                <select
                  value={clarificationForm.type}
                  onChange={(e) => setClarificationForm({ ...clarificationForm, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="clarification">استفسار وتوضيح حول سير الدروس والمنهاج</option>
                  <option value="guidance">توجيه تربوي وملاحظة فنية</option>
                  <option value="praise">شكر وتقدير على التميز والأداء</option>
                  <option value="urgent_alert">تنبيه إداري رسمي عاجل</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  عنوان التوضيح / الرسالة:
                </label>
                <input
                  type="text"
                  required
                  value={clarificationForm.title}
                  onChange={(e) => setClarificationForm({ ...clarificationForm, title: e.target.value })}
                  placeholder="ملاحظات حول وتيرة إنهاء الوحدة الثانية..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  نص التوضيح والتوجيه:
                </label>
                <textarea
                  rows={4}
                  required
                  value={clarificationForm.content}
                  onChange={(e) => setClarificationForm({ ...clarificationForm, content: e.target.value })}
                  placeholder="أستاذنا الفاضل، نرجو منكم مراجعة توزيع الحصص للأسبوع القادم والتأكد من إتاحة واجب للطلاب..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={clarificationForm.isUrgent}
                  onChange={(e) => setClarificationForm({ ...clarificationForm, isUrgent: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="urgentCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  تحديد كتنبيه عاجل (يصل للأستاذ مع إشعار فوري ذو أولوية)
                </label>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 -mx-6 -mb-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForClarification(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={clarificationMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {clarificationMutation.isPending ? 'جاري الإرسال...' : 'إرسال التوضيح الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
