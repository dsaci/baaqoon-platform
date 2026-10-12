import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Users, UserPlus, BookOpen, Search, Filter, Loader2, CheckCircle, 
  GraduationCap, AlertTriangle, ArrowRightLeft, UserCheck, UserX, 
  ShieldAlert, RefreshCw, X, ChevronDown, ChevronUp, Sparkles, 
  Share2, Plus, ArrowRight, Check, AlertCircle, HelpCircle
} from 'lucide-react';

export default function SupervisorCohortsView() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<'all' | 'vacant' | 'teacher_vacant' | 'full'>('all');
  const [expandedCohortId, setExpandedCohortId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCohortForAddStudent, setSelectedCohortForAddStudent] = useState<any>(null);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<{ student: any; fromCohort: any } | null>(null);
  const [selectedCohortForTeacherVacancy, setSelectedCohortForTeacherVacancy] = useState<any>(null);

  // Create Cohort Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    teacherId: '',
    curriculumType: '',
    academicBranch: ''
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Transfer Form State
  const [targetCohortId, setTargetCohortId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('ملاءمة الجدول والتنسيق الأكاديمي');

  // Add Student to Cohort State
  const [studentToAddId, setStudentToAddId] = useState<string>('');

  // Teacher Vacancy Action State
  const [vacancyAction, setVacancyAction] = useState<'assign_teacher' | 'bulk_transfer'>('assign_teacher');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');
  const [bulkTargetCohortId, setBulkTargetCohortId] = useState<string>('');

  // Fetch subject teachers (to get available subjects)
  const { data: subjectTeachersData } = useQuery({
    queryKey: ['supervisor_subject_teachers_meta'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/subject-teachers');
      return res.data;
    }
  });

  const allSubjects = subjectTeachersData?.allSubjects || [];

  // Set default subject
  React.useEffect(() => {
    if (user?.supervisedSubjectId && !selectedSubjectId) {
      setSelectedSubjectId(user.supervisedSubjectId);
    } else if (allSubjects[0]?.id && !selectedSubjectId) {
      setSelectedSubjectId(allSubjects[0].id);
    }
  }, [user?.supervisedSubjectId, allSubjects, selectedSubjectId]);

  // Fetch Detailed Cohorts & Vacancies
  const { data: detailedData, isLoading: isLoadingDetailed, refetch: refetchCohorts } = useQuery({
    queryKey: ['supervisor_delegated_cohorts_detailed', selectedSubjectId],
    queryFn: async () => {
      const url = selectedSubjectId 
        ? `/groups/supervisor/delegated/cohorts-detailed?subjectId=${selectedSubjectId}`
        : '/groups/supervisor/delegated/cohorts-detailed';
      const res = await api.get(url);
      return res.data;
    }
  });

  // Fetch delegated courses
  const { data: courses = [] } = useQuery({
    queryKey: ['supervisor_delegated_courses', selectedSubjectId],
    queryFn: async () => {
      const url = selectedSubjectId 
        ? `/groups/supervisor/delegated/courses?subjectId=${selectedSubjectId}`
        : '/groups/supervisor/delegated/courses';
      const res = await api.get(url);
      return res.data;
    }
  });

  // Fetch delegated teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['supervisor_delegated_teachers', selectedSubjectId],
    queryFn: async () => {
      const url = selectedSubjectId 
        ? `/groups/supervisor/delegated/teachers?subjectId=${selectedSubjectId}`
        : '/groups/supervisor/delegated/teachers';
      const res = await api.get(url);
      return res.data;
    }
  });

  // Fetch all eligible students for creation
  const { data: allPlatformStudents = [] } = useQuery({
    queryKey: ['supervisor_delegated_students'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/delegated/students');
      return res.data;
    }
  });

  // Mutations
  const createCohortMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/groups/supervisor/delegated/cohorts', {
        name: formData.name,
        courseId: formData.courseId,
        teacherId: formData.teacherId,
        studentIds: selectedStudents
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor_stats'] });
      setIsCreateModalOpen(false);
      setStep(1);
      setFormData({ name: '', courseId: '', teacherId: '', curriculumType: '', academicBranch: '' });
      setSelectedStudents([]);
      alert('تم إنشاء الفوج بنجاح وإسناد الأستاذ والطلبة!');
    },
    onError: () => alert('حدث خطأ أثناء إنشاء الفوج')
  });

  // Transfer student mutation
  const transferStudentMutation = useMutation({
    mutationFn: async ({ studentId, fromCohortId, toCohortId, reason }: any) => {
      return api.post('/groups/supervisor/transfer-student', { studentId, fromCohortId, toCohortId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      setSelectedStudentForTransfer(null);
      setTargetCohortId('');
      alert('تم نقل الطالب بنجاح إلى الفوج الجديد!');
    },
    onError: () => alert('حدث خطأ أثناء نقل الطالب')
  });

  // Enroll single student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async ({ cohortId, studentId }: { cohortId: string; studentId: string }) => {
      return api.post(`/groups/supervisor/cohorts/${cohortId}/enroll-student`, { studentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      setSelectedCohortForAddStudent(null);
      setStudentToAddId('');
      alert('تم إلحاق الطالب بالفوج بنجاح!');
    },
    onError: () => alert('حدث خطأ أثناء إلحاق الطالب')
  });

  // Remove student from cohort mutation
  const removeStudentMutation = useMutation({
    mutationFn: async ({ cohortId, studentId }: { cohortId: string; studentId: string }) => {
      return api.delete(`/groups/supervisor/cohorts/${cohortId}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      alert('تم إزالة الطالب من الفوج وإعادته لقيد الانتظار بنجاح!');
    },
    onError: () => alert('حدث خطأ أثناء إزالة الطالب')
  });

  // Assign / Replace teacher mutation
  const assignTeacherMutation = useMutation({
    mutationFn: async ({ cohortId, teacherId }: { cohortId: string; teacherId: string }) => {
      return api.post(`/groups/supervisor/cohorts/${cohortId}/assign-teacher`, { teacherId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      setSelectedCohortForTeacherVacancy(null);
      setSubstituteTeacherId('');
      alert('تم تعيين الأستاذ البديل للفوج بنجاح!');
    },
    onError: () => alert('حدث خطأ أثناء تعيين الأستاذ')
  });

  // Bulk transfer cohort students mutation (e.g. merge cohort on teacher vacancy)
  const bulkTransferMutation = useMutation({
    mutationFn: async ({ fromCohortId, toCohortId }: { fromCohortId: string; toCohortId: string }) => {
      return api.post(`/groups/supervisor/cohorts/${fromCohortId}/bulk-transfer`, { 
        toCohortId,
        archiveOldCohort: true,
        reason: 'معالجة شغور أستاذ وضم طلبة الفوج'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      setSelectedCohortForTeacherVacancy(null);
      setBulkTargetCohortId('');
      alert('تم نقل وضم جميع طلبة الفوج الشاغر إلى الفوج المتاح بنجاح وتجميد الفوج القديم!');
    },
    onError: () => alert('حدث خطأ أثناء نقل طلبة الفوج')
  });

  const cohortsList: any[] = detailedData?.cohorts || [];
  const unassignedStudentsList: any[] = detailedData?.unassignedStudents || [];
  const summary = detailedData?.summary || {
    totalCohorts: 0,
    totalEnrolledStudents: 0,
    totalAvailableSeats: 0,
    teacherVacantCount: 0,
    unassignedStudentsCount: 0
  };

  // Filter cohorts
  const filteredCohorts = cohortsList.filter(c => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.teacher && `${c.teacher.firstName} ${c.teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (cohortFilter === 'vacant') return c.availableSeats > 0;
    if (cohortFilter === 'teacher_vacant') return c.isTeacherVacant;
    if (cohortFilter === 'full') return c.availableSeats === 0;

    return true;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                إدارة الأفواج والشواغر والتفويج الذكي
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                متابعة الطاقة الاستيعابية للأفواج، رصد الأماكن الشاغرة، نقل الطلبة، ومعالجة حالات شغور الأساتذة فورياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            {/* Subject selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <BookOpen className="w-4 h-4 text-indigo-600 mr-2" />
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المادة:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allSubjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => refetchCohorts()}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex-shrink-0"
              title="تحديث الأفواج"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDetailed ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 text-xs flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              تكوين فوج جديد
            </button>
          </div>
        </div>

        {/* 2. Top Capacity & Vacancy KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">إجمالي الأفواج</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100">{summary.totalCohorts}</div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold mt-0.5">فوج في مادة التخصص</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">المقاعد الشاغرة</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">{summary.totalAvailableSeats}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">مكان متاح لإضافة طلبة</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">الطلبة المفوجون</span>
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100">{summary.totalEnrolledStudents}</div>
            <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold mt-0.5">طالب منتظم في الأفواج</div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            summary.teacherVacantCount > 0 
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60' 
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${summary.teacherVacantCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'}`}>
                شغور الأساتذة
              </span>
              <ShieldAlert className={`w-4 h-4 ${summary.teacherVacantCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className={`text-2xl font-black ${summary.teacherVacantCount > 0 ? 'text-rose-950 dark:text-rose-100' : 'text-slate-800 dark:text-slate-200'}`}>
              {summary.teacherVacantCount}
            </div>
            <div className={`text-[11px] font-semibold mt-0.5 ${summary.teacherVacantCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500'}`}>
              {summary.teacherVacantCount > 0 ? 'أفواج بحاجة لإسناد أو ضم' : 'جميع الأفواج مسندة'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">بانتظار التفويج</span>
              <UserX className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 dark:text-amber-100">{summary.unassignedStudentsCount}</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">طالب متاح للتوزيع</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Capacity Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث باسم الفوج، الكود، الأستاذ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          <button
            onClick={() => setCohortFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              cohortFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            جميع الأفواج ({cohortsList.length})
          </button>
          <button
            onClick={() => setCohortFilter('vacant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              cohortFilter === 'vacant'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            بها أماكن شاغرة ({cohortsList.filter(c => c.availableSeats > 0).length})
          </button>
          <button
            onClick={() => setCohortFilter('teacher_vacant')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              cohortFilter === 'teacher_vacant'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            شغور أستاذ ({cohortsList.filter(c => c.isTeacherVacant).length})
          </button>
          <button
            onClick={() => setCohortFilter('full')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              cohortFilter === 'full'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            مكتملة العدد ({cohortsList.filter(c => c.availableSeats === 0).length})
          </button>
        </div>
      </div>

      {/* 4. Cohorts Cards Grid */}
      {isLoadingDetailed ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">جاري تحميل بيانات الأفواج والشواغر الاستيعابية...</p>
        </div>
      ) : filteredCohorts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
            لا توجد أفواج تطابق المعيار المحدد حالياً
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            يمكنك إنشاء فوج جديد الآن وإسناد أستاذ ومجموعة من الطلبة مباشرة عبر زر «تكوين فوج جديد».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCohorts.map((cohort) => {
            const isExpanded = expandedCohortId === cohort.id;
            const progressPercentage = Math.min(100, Math.round((cohort.enrolledCount / cohort.maxStudents) * 100));

            return (
              <div
                key={cohort.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                  cohort.isTeacherVacant 
                    ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/10' 
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                          {cohort.name}
                        </h3>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cohort.code}
                        </span>
                        {cohort.course?.academicBranch && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {cohort.course.academicBranch === 'scientific' ? 'فرع علمي' : 'فرع أدبي'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-semibold">
                        المقرر: {cohort.course?.title || 'مقرر مادة التخصص'} • المنهج: {cohort.course?.curriculumType === 'governmental' ? 'حكومي فلسطيني' : 'أزهري'}
                      </div>
                    </div>

                    {/* Vacancy / Capacity Status Badge */}
                    <div className="text-left">
                      {cohort.isTeacherVacant ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          شغور أستاذ!
                        </span>
                      ) : cohort.availableSeats > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Sparkles className="w-3.5 h-3.5" />
                          متسع ({cohort.availableSeats} شاغر)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          مكتمل العدد ({cohort.maxStudents})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teacher banner */}
                  <div className="mb-4">
                    {cohort.teacher ? (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                            {cohort.teacher.firstName?.[0] || 'أ'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800 dark:text-white">
                              أ. {cohort.teacher.firstName} {cohort.teacher.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400" dir="ltr">{cohort.teacher.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          معلم الفوج
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>يوجد شغور في مكان الأستاذ! الطلاب بدون معلم حالياً.</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCohortForTeacherVacancy(cohort);
                            setVacancyAction('assign_teacher');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex-shrink-0"
                        >
                          معالجة الشغور
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>إشغال المقاعد ({cohort.enrolledCount} من أصل {cohort.maxStudents} طالب):</span>
                      <span className={cohort.availableSeats > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                        {cohort.availableSeats > 0 ? `متبقي ${cohort.availableSeats} أماكن شاغرة` : 'لا يوجد شواغر'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progressPercentage >= 100 
                            ? 'bg-slate-500' 
                            : progressPercentage >= 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Enrolled Students preview / list */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
                    <button
                      onClick={() => setExpandedCohortId(isExpanded ? null : cohort.id)}
                      className="w-full flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        الطلبة المقيدون بهذا الفوج ({cohort.enrolledStudents.length})
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {cohort.enrolledStudents.length === 0 ? (
                          <p className="text-xs text-slate-400 p-2 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                            لا يوجد طلاب مقيدون في هذا الفوج حالياً.
                          </p>
                        ) : (
                          cohort.enrolledStudents.map((st: any) => (
                            <div
                              key={st.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="font-black text-slate-800 dark:text-white">
                                  {st.firstName} {st.lastName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {st.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} • {st.phone || st.email || 'بدون هاتف'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Transfer Button */}
                                <button
                                  onClick={() => {
                                    setSelectedStudentForTransfer({ student: st, fromCohort: cohort });
                                    setTargetCohortId('');
                                  }}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all"
                                  title="نقل الطالب إلى فوج آخر"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>

                                {/* Remove Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`هل أنت متأكد من إزالة الطالب «${st.firstName} ${st.lastName}» من الفوج وإعادته للانتظار؟`)) {
                                      removeStudentMutation.mutate({ cohortId: cohort.id, studentId: st.id });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all"
                                  title="إزالة من الفوج"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Add Student Button if capacity available */}
                  <button
                    onClick={() => {
                      setSelectedCohortForAddStudent(cohort);
                      setStudentToAddId('');
                    }}
                    disabled={cohort.availableSeats <= 0}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      cohort.availableSeats > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    إضافة طالب للفوج ({cohort.availableSeats} شاغر)
                  </button>

                  {/* Teacher Vacancy or Reassignment Action */}
                  <button
                    onClick={() => {
                      setSelectedCohortForTeacherVacancy(cohort);
                      setVacancyAction(cohort.isTeacherVacant ? 'assign_teacher' : 'assign_teacher');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-1.5"
                    title="إسناد أستاذ جديد أو ضم ونقل طلبة الفوج"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    معالجة الأستاذ / ضم
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Unassigned Students Quick Allocation Panel */}
      {/* ========================================================================= */}
      {unassignedStudentsList.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-100">
                  طلبة غير مفوجين في مادة التخصص ({unassignedStudentsList.length} طالب)
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                  هؤلاء الطلبة مسجلون بالمنصة ولم يتم إسنادهم لأي فوج حتى الآن، يمكنك إضافتهم مباشرة لأي فوج به مقاعد شاغرة.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unassignedStudentsList.slice(0, 6).map((st: any) => (
              <div key={st.id} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-black text-slate-900 dark:text-white">{st.firstName} {st.lastName}</div>
                  <div className="text-[10px] text-slate-400">{st.academicBranch === 'scientific' ? 'فرع علمي' : 'فرع أدبي'} • {st.phone || 'بدون هاتف'}</div>
                </div>
                <button
                  onClick={() => {
                    // Open add modal for first available cohort or prompt
                    const firstVacant = cohortsList.find(c => c.availableSeats > 0);
                    if (firstVacant) {
                      setSelectedCohortForAddStudent(firstVacant);
                      setStudentToAddId(st.id);
                    } else {
                      alert('جميع الأفواج الحالية مكتملة، يرجى إنشاء فوج جديد لضم الطالب.');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  تسكين بفوج
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add Student into Specific Cohort (إضافة طالب معين لفوج معين) */}
      {/* ========================================================================= */}
      {selectedCohortForAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">إضافة طالب لفوج: {selectedCohortForAddStudent.name}</h3>
                <p className="text-xs text-emerald-100 font-bold mt-0.5">
                  المقاعد الشاغرة المتاحة: {selectedCohortForAddStudent.availableSeats} من {selectedCohortForAddStudent.maxStudents}
                </p>
              </div>
              <button onClick={() => setSelectedCohortForAddStudent(null)} className="p-2 rounded-xl bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-right">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  اختر الطالب للإضافة:
                </label>
                <select
                  value={studentToAddId}
                  onChange={(e) => setStudentToAddId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اختر طالباً من قائمة الانتظار أو المنصة --</option>
                  {allPlatformStudents
                    .filter((s: any) => !selectedCohortForAddStudent.enrolledStudents?.some((e: any) => e.id === s.id))
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} - {s.email || s.phone || 'مسجل'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                💡 سيتم ضم الطالب فوراً إلى الفوج مع إرسال إشعار رسمي بحسابه ليبدأ بمتابعة الحصص الافتراضية مع الأستاذ.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedCohortForAddStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!studentToAddId || enrollStudentMutation.isPending}
                  onClick={() => {
                    enrollStudentMutation.mutate({
                      cohortId: selectedCohortForAddStudent.id,
                      studentId: studentToAddId
                    });
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20"
                >
                  {enrollStudentMutation.isPending ? 'جاري الإضافة...' : 'تأكيد إضافة الطالب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Transfer Student Between Cohorts (نقل طالب من فوج لآخر) */}
      {/* ========================================================================= */}
      {selectedStudentForTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  نقل الطالب: {selectedStudentForTransfer.student.firstName} {selectedStudentForTransfer.student.lastName}
                </h3>
                <p className="text-xs text-indigo-100 font-bold mt-0.5">
                  من الفوج الحالي: «{selectedStudentForTransfer.fromCohort.name}»
                </p>
              </div>
              <button onClick={() => setSelectedStudentForTransfer(null)} className="p-2 rounded-xl bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-right">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  اختر الفوج الجديد المستهدف (المتوفر به شواغر):
                </label>
                <select
                  value={targetCohortId}
                  onChange={(e) => setTargetCohortId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر الفوج المستهدف --</option>
                  {cohortsList
                    .filter(c => c.id !== selectedStudentForTransfer.fromCohort.id)
                    .map(c => (
                      <option key={c.id} value={c.id} disabled={c.availableSeats <= 0}>
                        {c.name} ({c.availableSeats > 0 ? `${c.availableSeats} أماكن شاغرة` : 'مكتمل'}) {c.teacher ? `- أ. ${c.teacher.firstName} ${c.teacher.lastName}` : '- شغور أستاذ'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  سبب النقل والتغيير:
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 font-bold">
                💡 سيتم نقل الطالب تلقائياً وحذفه من الفوج السابق وإضافته للفوج المختار وتوثيق الحركة في سجل الانتقالات.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTransfer(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!targetCohortId || transferStudentMutation.isPending}
                  onClick={() => {
                    transferStudentMutation.mutate({
                      studentId: selectedStudentForTransfer.student.id,
                      fromCohortId: selectedStudentForTransfer.fromCohort.id,
                      toCohortId: targetCohortId,
                      reason: transferReason
                    });
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20"
                >
                  {transferStudentMutation.isPending ? 'جاري النقل...' : 'تأكيد نقل الطالب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Teacher Vacancy Resolution / Bulk Merge (معالجة شغور أستاذ الفوج) */}
      {/* ========================================================================= */}
      {selectedCohortForTeacherVacancy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  معالجة شغور الأستاذ: فوج «{selectedCohortForTeacherVacancy.name}»
                </h3>
                <p className="text-xs text-rose-100 font-bold mt-0.5">
                  عدد الطلبة المقيدين بهذا الفوج: {selectedCohortForTeacherVacancy.enrolledCount} طالب
                </p>
              </div>
              <button onClick={() => setSelectedCohortForTeacherVacancy(null)} className="p-2 rounded-xl bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-right">
              {/* Action Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setVacancyAction('assign_teacher')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                    vacancyAction === 'assign_teacher'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1. إسناد أستاذ بديل للفوج
                </button>
                <button
                  type="button"
                  onClick={() => setVacancyAction('bulk_transfer')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                    vacancyAction === 'bulk_transfer'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  2. ضم الطلبة إلى فوج آخر متاح
                </button>
              </div>

              {vacancyAction === 'assign_teacher' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      اختر الأستاذ البديل المسند لهذا الفوج:
                    </label>
                    <select
                      value={substituteTeacherId}
                      onChange={(e) => setSubstituteTeacherId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- اختر أستاذاً من كادر المادة --</option>
                      {teachers.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          أ. {t.firstName} {t.lastName} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    سيتم تعيين الأستاذ معلماً رئيسياً لهذا الفوج فوراً وإشعاره بجدول الحصص والطلبة.
                  </p>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCohortForTeacherVacancy(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={!substituteTeacherId || assignTeacherMutation.isPending}
                      onClick={() => {
                        assignTeacherMutation.mutate({
                          cohortId: selectedCohortForTeacherVacancy.id,
                          teacherId: substituteTeacherId
                        });
                      }}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20"
                    >
                      {assignTeacherMutation.isPending ? 'جاري الإسناد...' : 'تأكيد إسناد الأستاذ البديل'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      اختر الفوج المتاح لنقل وضم كافة طلبة هذا الفوج إليه ({selectedCohortForTeacherVacancy.enrolledCount} طالب):
                    </label>
                    <select
                      value={bulkTargetCohortId}
                      onChange={(e) => setBulkTargetCohortId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- اختر الفوج المستهدف للضم --</option>
                      {cohortsList
                        .filter(c => c.id !== selectedCohortForTeacherVacancy.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (به {c.availableSeats} شاغر) {c.teacher ? `- أ. ${c.teacher.firstName} ${c.teacher.lastName}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-bold">
                    ⚠️ سيتم نقل كافة الطلاب المسجلين ({selectedCohortForTeacherVacancy.enrolledCount} طالب) إلى الفوج المستهدف دفعة واحدة، وتجميد الفوج الشاغر لمنع التضارب.
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCohortForTeacherVacancy(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={!bulkTargetCohortId || bulkTransferMutation.isPending}
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من نقل وضم جميع طلبة هذا الفوج إلى الفوج المختار؟`)) {
                          bulkTransferMutation.mutate({
                            fromCohortId: selectedCohortForTeacherVacancy.id,
                            toCohortId: bulkTargetCohortId
                          });
                        }
                      }}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20"
                    >
                      {bulkTransferMutation.isPending ? 'جاري الضم والنقل...' : 'تأكيد ضم ونقل الطلبة'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Create New Cohort Wizard (تكوين فوج جديد) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  إنشاء فوج دراسي وإسناد الأستاذ
                </h3>
                <p className="text-xs text-indigo-100 mt-1">الخطوة {step} من 3: {step === 1 ? 'بيانات الفوج والمقرر' : step === 2 ? 'إسناد أستاذ المادة' : 'تفويج وإسناد الطلبة'}</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الفوج الدراسي</label>
                    <input 
                      type="text" 
                      placeholder="مثال: فوج العلوم الحياتية - غزة 1"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المقرر الدراسي لمادة التخصص</label>
                    <select 
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="">-- اختر المقرر الدراسي --</option>
                      {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.title || course.nameAr} - {course.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} ({course.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">إسناد أستاذ المادة للفوج</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {teachers.map((teacher: any) => (
                      <div 
                        key={teacher.id}
                        onClick={() => setFormData({...formData, teacherId: teacher.id})}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          formData.teacherId === teacher.id 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm">أ. {teacher.firstName} {teacher.lastName}</div>
                          <div className="text-xs text-slate-500" dir="ltr">{teacher.email}</div>
                        </div>
                        {formData.teacherId === teacher.id && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      تم اختيار {selectedStudents.length} طالب للفوج
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStudents.length === allPlatformStudents.length) {
                          setSelectedStudents([]);
                        } else {
                          setSelectedStudents(allPlatformStudents.map((s: any) => s.id));
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {selectedStudents.length === allPlatformStudents.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الطلبة'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {allPlatformStudents.map((st: any) => (
                      <div 
                        key={st.id}
                        onClick={() => {
                          setSelectedStudents(prev => 
                            prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          selectedStudents.includes(st.id)
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{st.firstName} {st.lastName}</div>
                          <div className="text-[10px] text-slate-400">{st.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} • {st.phone || st.email}</div>
                        </div>
                        {selectedStudents.includes(st.id) && (
                          <Check className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  السابق
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 ? (!formData.name || !formData.courseId) : !formData.teacherId}
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createCohortMutation.isPending}
                  onClick={() => createCohortMutation.mutate()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  {createCohortMutation.isPending ? 'جاري الإنشاء...' : 'إتمام إنشاء الفوج'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
