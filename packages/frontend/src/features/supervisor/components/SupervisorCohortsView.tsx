import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Users, UserPlus, BookOpen, Search, Filter, Loader2, CheckCircle, 
  GraduationCap, AlertTriangle, ArrowRightLeft, UserCheck, UserX, 
  ShieldAlert, RefreshCw, X, ChevronDown, ChevronUp, Sparkles, 
  Share2, Plus, ArrowRight, Check, AlertCircle, HelpCircle, Clock,
  Tag, Info, ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import CohortRequestsAdminView from '../../admin/components/CohortRequestsAdminView';
import AttendanceModal from '../../scheduling/components/AttendanceModal';
import { getUserActivityStatus } from '../../../utils/activityStatus';

interface SupervisorCohortsViewProps {
  initialSubjectId?: string;
}

export default function SupervisorCohortsView({ initialSubjectId }: SupervisorCohortsViewProps = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');

  React.useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState<'all' | 'vacant' | 'teacher_vacant' | 'full'>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'grade_11' | 'grade_12'>('all');
  const [curriculumFilter, setCurriculumFilter] = useState<'all' | 'governmental' | 'azhari'>('all');
  const [expandedCohortId, setExpandedCohortId] = useState<string | null>(null);

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedCohortForAttendance, setSelectedCohortForAttendance] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [selectedCohortForAddStudent, setSelectedCohortForAddStudent] = useState<any>(null);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<{ student: any; fromCohort: any } | null>(null);
  const [selectedCohortForTeacherVacancy, setSelectedCohortForTeacherVacancy] = useState<any>(null);
  const [allowExceptionsInAddStudent, setAllowExceptionsInAddStudent] = useState(false);
  const [allowExceptionsInCreateCohort, setAllowExceptionsInCreateCohort] = useState(false);

  // Cohort Requests Query
  const { data: cohortRequests = [] } = useQuery({
    queryKey: ['cohort_requests_supervisor_counter'],
    queryFn: async () => {
      const res = await api.get('/groups/requests');
      return res.data || [];
    }
  });
  const pendingRequestsCount = Array.isArray(cohortRequests) ? cohortRequests.filter((r: any) => r.status === 'pending').length : 0;

  // Create Cohort Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    courseId: '',
    teacherId: '',
    maxStudents: 25,
    curriculumType: '',
    academicBranch: ''
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState<'all' | 'scientific' | 'literary'>('all');

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
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    } else if (user?.supervisedSubjectId && !selectedSubjectId) {
      setSelectedSubjectId(user.supervisedSubjectId);
    } else if (allSubjects[0]?.id && !selectedSubjectId) {
      setSelectedSubjectId(allSubjects[0].id);
    }
  }, [initialSubjectId, user?.supervisedSubjectId, allSubjects, selectedSubjectId]);

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

  // Auto-select default course for creation modal if not yet set
  React.useEffect(() => {
    if (isCreateModalOpen && !formData.courseId && courses.length > 0) {
      setFormData(prev => ({
        ...prev,
        courseId: courses[0].id,
        curriculumType: courses[0].curriculumType || '',
        academicBranch: courses[0].academicBranch || ''
      }));
    }
  }, [isCreateModalOpen, courses, formData.courseId]);

  // Selected course in creation modal
  const selectedCourseInModal = courses.find((c: any) => c.id === formData.courseId);
  const effectiveSubjectIdForModal = selectedCourseInModal?.subjectId || selectedSubjectId;

  // Fetch delegated teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['supervisor_delegated_teachers', effectiveSubjectIdForModal],
    queryFn: async () => {
      const url = effectiveSubjectIdForModal 
        ? `/groups/supervisor/delegated/teachers?subjectId=${effectiveSubjectIdForModal}`
        : '/groups/supervisor/delegated/teachers';
      const res = await api.get(url);
      return res.data;
    }
  });

  // Combine teachers from delegated query and subject teachers meta to guarantee complete coverage
  const availableTeachers = React.useMemo(() => {
    const map = new Map<string, any>();
    (teachers || []).forEach((t: any) => map.set(t.id, t));
    (subjectTeachersData?.teachers || []).forEach((t: any) => {
      if (!map.has(t.id)) {
        map.set(t.id, {
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          primaryRole: t.primaryRole,
          status: t.status,
          nationality: t.nationality
        });
      }
    });
    return Array.from(map.values());
  }, [teachers, subjectTeachersData?.teachers]);

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
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        maxStudents: Number(formData.maxStudents) || 25,
        courseId: formData.courseId,
        teacherId: formData.teacherId || undefined,
        studentIds: selectedStudents
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor_delegated_cohorts_detailed'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor_stats'] });
      setIsCreateModalOpen(false);
      setStep(1);
      setFormData({ name: '', code: '', courseId: '', teacherId: '', maxStudents: 25, curriculumType: '', academicBranch: '' });
      setSelectedStudents([]);
      alert('تم إنشاء الفوج بنجاح وإسناد الأستاذ والطلبة!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الفوج';
      alert(msg);
    }
  });

  const handleOpenCreateModal = () => {
    const defaultCourse = courses[0];
    const currentSub = allSubjects.find((s: any) => s.id === selectedSubjectId) || allSubjects[0];
    const subCode = currentSub?.code ? currentSub.code.toUpperCase() : 'COH';
    const rndCode = Math.floor(100 + Math.random() * 900);
    const suggestedCode = `${subCode}-${new Date().getFullYear().toString().slice(-2)}${rndCode}`;

    setFormData({
      name: '',
      code: suggestedCode,
      courseId: defaultCourse?.id || '',
      teacherId: '',
      maxStudents: 25,
      curriculumType: defaultCourse?.curriculumType || '',
      academicBranch: defaultCourse?.academicBranch || ''
    });
    setSelectedStudents([]);
    setTeacherSearch('');
    setStudentSearch('');
    setStudentBranchFilter('all');
    setStep(1);
    setIsCreateModalOpen(true);
  };

  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportSubjectExcel = async () => {
    try {
      setIsExportingExcel(true);
      const url = selectedSubjectId 
        ? `/groups/supervisor/export-database?subjectId=${selectedSubjectId}`
        : '/groups/supervisor/export-database';
      const res = await api.get(url, { responseType: 'blob' });
      const currentSub = allSubjects.find((s: any) => s.id === selectedSubjectId) || allSubjects[0];
      const subName = currentSub?.code ? currentSub.code : 'subject';
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `baaqoon_${subName}_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert('حدث خطأ أثناء تصدير بيانات المادة إلى Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

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

    if (gradeFilter !== 'all' && c.course?.gradeLevel !== gradeFilter) return false;
    if (curriculumFilter !== 'all' && c.course?.curriculumType !== curriculumFilter) return false;

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
            {allSubjects.length > 1 ? (
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
            ) : allSubjects[0] ? (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-800 dark:text-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>مادة التخصص: {allSubjects[0].nameAr}</span>
              </div>
            ) : null}

            <button
              onClick={() => refetchCohorts()}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex-shrink-0"
              title="تحديث الأفواج"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDetailed ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={() => setIsRequestsModalOpen(true)}
              className="relative px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold rounded-xl flex items-center gap-2 transition-all text-xs flex-shrink-0 shadow-xs"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>طلبات فتح الأفواج</span>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                  {pendingRequestsCount} جديد
                </span>
              )}
            </button>

            <button 
              onClick={() => {
                setSelectedCohortForAttendance(undefined);
                setIsAttendanceModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 text-xs flex-shrink-0 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              رصد الغياب والحضور
            </button>

            <button 
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 text-xs flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              تكوين فوج جديد
            </button>

            <button 
              onClick={handleExportSubjectExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 text-xs flex-shrink-0 disabled:opacity-50"
              title="تصدير بيانات وأفواج وطلبة المادة إلى ملف Excel كامل"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير المادة (Excel)</span>
                </>
              )}
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
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
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

        {/* Level and Curriculum quick filter pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] ml-1">تصفية المستوى:</span>
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${gradeFilter === 'all' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              كل المستويات
            </button>
            <button
              onClick={() => setGradeFilter('grade_11')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${gradeFilter === 'grade_11' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              الصف 11 (حادي عشر)
            </button>
            <button
              onClick={() => setGradeFilter('grade_12')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${gradeFilter === 'grade_12' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              الصف 12 (توجيهي)
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] ml-1">تصفية المنهج:</span>
            <button
              onClick={() => setCurriculumFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${curriculumFilter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              كل المناهج
            </button>
            <button
              onClick={() => setCurriculumFilter('governmental')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${curriculumFilter === 'governmental' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              منهاج حكومي
            </button>
            <button
              onClick={() => setCurriculumFilter('azhari')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${curriculumFilter === 'azhari' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              منهاج أزهري
            </button>
          </div>
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
                        {cohort.course?.gradeLevel && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {cohort.course.gradeLevel === 'grade_11' ? 'الصف 11 (حادي عشر)' : 'الصف 12 (توجيهي)'}
                          </span>
                        )}
                        {cohort.course?.academicBranch && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {cohort.course.academicBranch === 'scientific' ? 'فرع علمي' : 'فرع أدبي'}
                          </span>
                        )}
                        {cohort.course?.curriculumType && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {cohort.course.curriculumType === 'governmental' ? 'منهاج حكومي فلسطيني' : 'منهاج أزهري'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-semibold flex items-center gap-2 flex-wrap">
                        <span>المقرر: <strong className="text-slate-700 dark:text-slate-200">{cohort.course?.title || 'مقرر مادة التخصص'}</strong></span>
                        <span>•</span>
                        <span>المستوى: <strong className="text-purple-700 dark:text-purple-400">{cohort.course?.gradeLevel === 'grade_11' ? 'الصف الحادي عشر' : 'الصف الثاني عشر / توجيهي'}</strong></span>
                        <span>•</span>
                        <span>المنهج: <strong className="text-emerald-700 dark:text-emerald-400">{cohort.course?.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'}</strong></span>
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
                          cohort.enrolledStudents.map((st: any) => {
                            const act = getUserActivityStatus(st.lastLoginAt, st.createdAt);
                            return (
                              <div
                                key={st.id}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${act.dotClass}`} title={act.label} />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-slate-800 dark:text-white">
                                        {st.firstName} {st.lastName}
                                      </span>
                                      {act.isIdle && (
                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                                          خامل
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {st.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} • {st.phone || st.email || 'بدون هاتف'} • آخر دخول: {act.formattedLastLogin}
                                    </div>
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
                          );
                        })
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

                  {/* Cohort Attendance Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCohortForAttendance(cohort.id);
                      setIsAttendanceModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="رصد الغياب والحضور لهذا الفوج"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    رصد الحضور
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
            {unassignedStudentsList.slice(0, 6).map((st: any) => {
              const act = getUserActivityStatus(st.lastLoginAt, st.createdAt);
              return (
              <div key={st.id} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${act.dotClass}`} title={act.label} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 dark:text-white">{st.firstName} {st.lastName}</span>
                      {act.isIdle && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          خامل
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{st.academicBranch === 'scientific' ? 'فرع علمي' : 'فرع أدبي'} • آخر دخول: {act.formattedLastLogin}</div>
                  </div>
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
            );
          })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Add Student into Specific Cohort (إضافة طالب معين لفوج معين) */}
      {/* ========================================================================= */}
      {selectedCohortForAddStudent && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">إضافة طالب لفوج: {selectedCohortForAddStudent.name}</h3>
                <p className="text-xs text-emerald-100 font-bold mt-0.5">
                  المقاعد الشاغرة المتاحة: {selectedCohortForAddStudent.availableSeats} من {selectedCohortForAddStudent.maxStudents}
                </p>
              </div>
              <button onClick={() => setSelectedCohortForAddStudent(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-right">
              {/* Cohort Spec Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>مواصفات الفوج والمقرر:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedCohortForAddStudent.availableSeats} مقعد شاغر</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedCohortForAddStudent.course?.gradeLevel && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {selectedCohortForAddStudent.course.gradeLevel === 'grade_11' ? 'الصف 11 (حادي عشر)' : 'الصف 12 (توجيهي)'}
                    </span>
                  )}
                  {selectedCohortForAddStudent.course?.academicBranch && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {selectedCohortForAddStudent.course.academicBranch === 'scientific' ? 'الفرع العلمي' : 'الفرع الأدبي'}
                    </span>
                  )}
                  {selectedCohortForAddStudent.course?.curriculumType && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedCohortForAddStudent.course.curriculumType === 'governmental' ? 'منهاج حكومي فلسطيني' : 'منهاج أزهري'}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    اختر الطالب للإضافة:
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={allowExceptionsInAddStudent}
                      onChange={(e) => setAllowExceptionsInAddStudent(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>إتاحة طلاب الفروع الأخرى (حالات استثنائية)</span>
                  </label>
                </div>
                {(() => {
                  const isCohortScientific = selectedCohortForAddStudent.course?.academicBranch === 'scientific';
                  const isCohortLiterary = selectedCohortForAddStudent.course?.academicBranch === 'literary';

                  const eligibleStudents = allPlatformStudents
                    .filter((s: any) => {
                      if (selectedCohortForAddStudent.enrolledStudents?.some((e: any) => e.id === s.id)) return false;
                      if (!allowExceptionsInAddStudent) {
                        if (isCohortScientific && s.academicBranch === 'literary') return false;
                        if (isCohortLiterary && s.academicBranch === 'scientific') return false;
                      }
                      return true;
                    })
                    .sort((a: any, b: any) => {
                      const aCross = (isCohortScientific && a.academicBranch === 'literary') || (isCohortLiterary && a.academicBranch === 'scientific');
                      const bCross = (isCohortScientific && b.academicBranch === 'literary') || (isCohortLiterary && b.academicBranch === 'scientific');
                      if (aCross && !bCross) return 1;
                      if (!aCross && bCross) return -1;
                      const aMatch = (a.gradeLevel === selectedCohortForAddStudent.course?.gradeLevel ? 2 : 0) + (a.curriculumType === selectedCohortForAddStudent.course?.curriculumType ? 1 : 0);
                      const bMatch = (b.gradeLevel === selectedCohortForAddStudent.course?.gradeLevel ? 2 : 0) + (b.curriculumType === selectedCohortForAddStudent.course?.curriculumType ? 1 : 0);
                      return bMatch - aMatch;
                    });

                  return (
                    <select
                      value={studentToAddId}
                      onChange={(e) => setStudentToAddId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- اختر طالباً من قائمة الانتظار أو المنصة ({eligibleStudents.length} طالب مؤهل) --</option>
                      {eligibleStudents.map((s: any) => {
                        const isCrossBranch = (isCohortScientific && s.academicBranch === 'literary') || (isCohortLiterary && s.academicBranch === 'scientific');
                        const isExactGrade = s.gradeLevel === selectedCohortForAddStudent.course?.gradeLevel;
                        const gradeText = s.gradeLevel === 'grade_11' ? 'صف 11' : s.gradeLevel === 'grade_12' ? 'صف 12' : (s.gradeLevel || 'غير محدد');
                        const branchText = s.academicBranch === 'scientific' ? 'علمي' : s.academicBranch === 'literary' ? 'أدبي' : (s.academicBranch || 'عام');
                        const currText = s.curriculumType === 'governmental' ? 'حكومي' : 'أزهري';
                        return (
                          <option key={s.id} value={s.id}>
                            {isCrossBranch ? `⚠️ [استثناء - فرع ${branchText}] ` : ''}{s.firstName} {s.lastName} {isExactGrade ? '⭐' : ''} (فرع: {branchText} • مستوى: {gradeText} • منهج: {currText})
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                💡 سيتم ضم الطالب فوراً إلى الفوج مع إرسال إشعار رسمي بحسابه ليبدأ بمتابعة الحصص الافتراضية مع الأستاذ.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedCohortForAddStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {enrollStudentMutation.isPending ? 'جاري الإضافة...' : 'تأكيد إضافة الطالب'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: Transfer Student Between Cohorts (نقل طالب من فوج لآخر) */}
      {/* ========================================================================= */}
      {selectedStudentForTransfer && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  نقل الطالب: {selectedStudentForTransfer.student.firstName} {selectedStudentForTransfer.student.lastName}
                </h3>
                <p className="text-xs text-indigo-100 font-bold mt-0.5">
                  من الفوج الحالي: «{selectedStudentForTransfer.fromCohort.name}»
                </p>
              </div>
              <button onClick={() => setSelectedStudentForTransfer(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
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
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {transferStudentMutation.isPending ? 'جاري النقل...' : 'تأكيد نقل الطالب'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: Teacher Vacancy Resolution / Bulk Merge (معالجة شغور أستاذ الفوج) */}
      {/* ========================================================================= */}
      {selectedCohortForTeacherVacancy && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  معالجة شغور الأستاذ: فوج «{selectedCohortForTeacherVacancy.name}»
                </h3>
                <p className="text-xs text-rose-100 font-bold mt-0.5">
                  عدد الطلبة المقيدين بهذا الفوج: {selectedCohortForTeacherVacancy.enrolledCount} طالب
                </p>
              </div>
              <button onClick={() => setSelectedCohortForTeacherVacancy(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
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
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
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
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
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
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 disabled:opacity-50"
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
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 disabled:opacity-50"
                    >
                      {bulkTransferMutation.isPending ? 'جاري الضم والنقل...' : 'تأكيد ضم ونقل الطلبة'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: Create New Cohort Wizard (تكوين فوج جديد) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-right" dir="rtl">
          <div className="relative w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-fade-in max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    إنشاء فوج دراسي وإسناد الأستاذ
                  </h3>
                  <p className="text-xs text-indigo-100/90 font-medium mt-0.5">
                    إعداد بيانات الفوج، تعيين المدرس المعتمد، وتوزيع الطلبة
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Step 1 */}
                <div 
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 cursor-pointer transition-all ${
                    step === 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : step > 1 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === 1 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50 shadow-md shadow-indigo-600/30' 
                      : step > 1 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">بيانات الفوج</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                {/* Step 2 */}
                <div 
                  onClick={() => {
                    if (formData.name.trim() && formData.courseId) setStep(2);
                  }}
                  className={`flex items-center gap-2 ${formData.name.trim() && formData.courseId ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} transition-all ${
                    step === 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : step > 2 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === 2 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50 shadow-md shadow-indigo-600/30' 
                      : step > 2 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">إسناد الأستاذ</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                {/* Step 3 */}
                <div 
                  onClick={() => {
                    if (formData.name.trim() && formData.courseId && formData.teacherId) setStep(3);
                  }}
                  className={`flex items-center gap-2 ${formData.name.trim() && formData.courseId && formData.teacherId ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} transition-all ${
                    step === 3 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === 3 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50 shadow-md shadow-indigo-600/30' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">تفويج الطلبة</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* STEP 1: بيانات الفوج والمقرر */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Step 1 Banner */}
                  <div className="bg-gradient-to-r from-indigo-50/80 to-violet-50/60 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">الخطوة 1 من 3: بيانات الفوج والمقرر الدراسي</h4>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-medium mt-0.5">
                        حدد اسم الفوج ورمزه، واختر المقرر التخصصي المعتمد وحدد الطاقة الاستيعابية
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-indigo-600 text-white shadow-xs">
                      المرحلة الأولى
                    </span>
                  </div>

                  {/* Two columns for name and code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cohort Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        اسم الفوج الدراسي <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text" 
                          placeholder="مثال: فوج الرياضيات التأسيسي - غزة 1"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {/* Cohort Code */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          رمز الفوج الأكاديمي (الكود)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const sub = allSubjects.find((s: any) => s.id === selectedSubjectId) || allSubjects[0];
                            const pfx = (sub?.code || 'COH').toUpperCase();
                            const rnd = Math.floor(100 + Math.random() * 900);
                            setFormData({ ...formData, code: `${pfx}-${new Date().getFullYear().toString().slice(-2)}${rnd}` });
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          توليد جديد
                        </button>
                      </div>
                      <div className="relative">
                        <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input 
                          type="text" 
                          placeholder="مثال: MATH-26101"
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none uppercase transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      المقرر الدراسي لمادة التخصص <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select 
                        value={formData.courseId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          const selectedC = courses.find((c: any) => c.id === cId);
                          const newBranch = selectedC?.academicBranch || '';
                          setFormData({
                            ...formData,
                            courseId: cId,
                            curriculumType: selectedC?.curriculumType || '',
                            academicBranch: newBranch
                          });
                          if (newBranch === 'scientific') {
                            setStudentBranchFilter('scientific');
                          } else if (newBranch === 'literary') {
                            setStudentBranchFilter('literary');
                          }
                        }}
                        className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- اضغط لاختيار المقرر الدراسي المعتمد --</option>
                        {courses.map((course: any) => {
                          const gradeText = course.gradeLevel === 'grade_11' ? 'الصف 11 (حادي عشر)' : course.gradeLevel === 'grade_12' ? 'الصف 12 (توجيهي)' : (course.gradeLevel || '');
                          const branchText = course.academicBranch === 'scientific' ? 'علمي' : course.academicBranch === 'literary' ? 'أدبي' : (course.academicBranch || '');
                          const currText = course.curriculumType === 'governmental' ? 'منهاج حكومي فلسطيني' : 'منهاج أزهري';
                          return (
                            <option key={course.id} value={course.id}>
                              {course.title || course.nameAr} • {gradeText} • {branchText} ({currText})
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Selected Course Preview Card */}
                  {(() => {
                    const selectedC = courses.find((c: any) => c.id === formData.courseId);
                    if (!selectedC) return null;
                    const sub = allSubjects.find((s: any) => s.id === selectedSubjectId) || allSubjects[0];
                    return (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {selectedC.title || selectedC.nameAr}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              المادة: {selectedC.subject?.nameAr || sub?.nameAr || 'المادة المعتمدة'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedC.gradeLevel && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {selectedC.gradeLevel === 'grade_11' ? 'الصف 11 (حادي عشر)' : 'الصف 12 (توجيهي)'}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            {selectedC.academicBranch === 'scientific' ? 'الفرع العلمي' : 'الفرع الأدبي'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            {selectedC.curriculumType === 'governmental' ? 'منهاج حكومي' : 'منهاج أزهري'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Capacity Selector */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex justify-between items-center mb-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          الطاقة الاستيعابية القصوى للفوج
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          الحد الأقصى للطلبة المقيدين بهذا الفوج
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-xs font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {formData.maxStudents} مقعد دراسي
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                      {[15, 20, 25, 30, 40].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setFormData({ ...formData, maxStudents: cap })}
                          className={`py-2 px-1 text-xs font-black rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                            formData.maxStudents === cap
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 ring-2 ring-indigo-200 dark:ring-indigo-900 scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-black">{cap}</span>
                          <span className="text-[9px] sm:text-[10px] opacity-75">{cap === 25 ? 'الموصى به ⭐' : 'طالب'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guidance Info Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      سيتم ربط هذا الفوج تلقائياً بنسخة المنهاج المعتمدة للمقرر، وتجهيزه لإسناد الأستاذ والطلبة في الخطوتين التاليتين مباشرة.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: إسناد أستاذ المادة */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        اختر أستاذ المادة المسؤول عن الفوج <span className="text-rose-500">*</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        الأساتذة المعتمدون لمادة التخصص ({availableTeachers.length} أستاذ)
                      </p>
                    </div>
                    {/* Search */}
                    <div className="relative sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="بحث بالاسم أو البريد أو الهاتف..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Teachers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                    {availableTeachers
                      .filter((t: any) => {
                        if (!teacherSearch.trim()) return true;
                        const q = teacherSearch.toLowerCase();
                        const full = `${t.firstName} ${t.lastName}`.toLowerCase();
                        return full.includes(q) || 
                               (t.email && t.email.toLowerCase().includes(q)) ||
                               (t.phone && t.phone.toLowerCase().includes(q));
                      })
                      .map((teacher: any) => {
                        const isSelected = formData.teacherId === teacher.id;
                        return (
                          <div 
                            key={teacher.id}
                            onClick={() => setFormData({...formData, teacherId: teacher.id})}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected 
                                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500' 
                                : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isSelected 
                                   ? 'bg-indigo-600 text-white' 
                                   : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                أ.
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>أ. {teacher.firstName} {teacher.lastName}</span>
                                  {teacher.nationality && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                      {teacher.nationality}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[160px]" dir="ltr">
                                  {teacher.email || teacher.phone || 'مسجل'}
                                </div>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {availableTeachers.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      لا يوجد أساتذة مسندون لهذه المادة حالياً
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: تفويج وإسناد الطلبة */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {(() => {
                    const selectedCourse = courses.find((c: any) => c.id === formData.courseId);
                    const isScientificCourse = selectedCourse?.academicBranch === 'scientific';
                    const isLiteraryCourse = selectedCourse?.academicBranch === 'literary';

                    const baseFilteredStudents = allPlatformStudents.filter((st: any) => {
                      if (!allowExceptionsInCreateCohort) {
                        if (isScientificCourse && st.academicBranch === 'literary') return false;
                        if (isLiteraryCourse && st.academicBranch === 'scientific') return false;
                      }
                      return true;
                    });

                    return (
                      <>
                        {/* Notice Banner */}
                        {isScientificCourse && (
                          <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-xs text-blue-900 dark:text-blue-200 font-bold flex items-center gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 text-blue-600" />
                            <span>
                              مقرر «{selectedCourse?.title}» مخصص للفرع العلمي (تم استبعاد طلاب الفرع الأدبي تلقائياً لمنع التضارب الأكاديمي).
                            </span>
                          </div>
                        )}
                        {isLiteraryCourse && (
                          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
                            <span>
                              مقرر «{selectedCourse?.title}» مخصص للفرع الأدبي (تم استبعاد طلاب الفرع العلمي تلقائياً لمنع التضارب الأكاديمي).
                            </span>
                          </div>
                        )}

                        {/* Controls Header */}
                        <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                تم اختيار <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedStudents.length}</span> من أصل <span className="font-black">{formData.maxStudents}</span> مقعد
                              </span>
                              {selectedStudents.length > formData.maxStudents && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                  تجاوزت السعة المقترحة
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={allowExceptionsInCreateCohort}
                                  onChange={(e) => setAllowExceptionsInCreateCohort(e.target.checked)}
                                  className="w-3 h-3 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>إظهار حالات الاستثناء من الفروع الأخرى</span>
                              </label>

                              {/* Filter branch tabs */}
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                                {!isLiteraryCourse && (
                                  <button
                                    type="button"
                                    onClick={() => setStudentBranchFilter('scientific')}
                                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${studentBranchFilter === 'scientific' || (isScientificCourse && !allowExceptionsInCreateCohort) ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                                  >
                                    {isScientificCourse && !allowExceptionsInCreateCohort ? 'طلبة الفرع العلمي' : 'علمي'}
                                  </button>
                                )}
                                {!isScientificCourse && (
                                  <button
                                    type="button"
                                    onClick={() => setStudentBranchFilter('literary')}
                                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${studentBranchFilter === 'literary' || (isLiteraryCourse && !allowExceptionsInCreateCohort) ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                                  >
                                    {isLiteraryCourse && !allowExceptionsInCreateCohort ? 'طلبة الفرع الأدبي' : 'أدبي'}
                                  </button>
                                )}
                                {(!isScientificCourse && !isLiteraryCourse) || allowExceptionsInCreateCohort ? (
                                  <button
                                    type="button"
                                    onClick={() => setStudentBranchFilter('all')}
                                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${studentBranchFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                                  >
                                    الكل
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input 
                                type="text"
                                placeholder="بحث باسم الطالب أو الهاتف..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            {/* Select/Deselect All */}
                            {(() => {
                              const visibleStudents = baseFilteredStudents.filter((st: any) => {
                                if (!isScientificCourse && !isLiteraryCourse && studentBranchFilter !== 'all' && st.academicBranch !== studentBranchFilter) return false;
                                if (!studentSearch.trim()) return true;
                                const q = studentSearch.toLowerCase();
                                const full = `${st.firstName} ${st.lastName}`.toLowerCase();
                                return full.includes(q) || (st.phone && st.phone.includes(q));
                              });
                              const isAllVisibleSelected = visibleStudents.length > 0 && visibleStudents.every((st: any) => selectedStudents.includes(st.id));
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAllVisibleSelected) {
                                      const visibleIds = visibleStudents.map((s: any) => s.id);
                                      setSelectedStudents(prev => prev.filter(id => !visibleIds.includes(id)));
                                    } else {
                                      const visibleIds = visibleStudents.map((s: any) => s.id);
                                      setSelectedStudents(prev => Array.from(new Set([...prev, ...visibleIds])));
                                    }
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:underline mr-auto sm:mr-0"
                                >
                                  {isAllVisibleSelected ? 'إلغاء تحديد الظاهرين' : `تحديد الكل الظاهر (${visibleStudents.length})`}
                                </button>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Students Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                          {baseFilteredStudents
                            .filter((st: any) => {
                              if (!isScientificCourse && !isLiteraryCourse && studentBranchFilter !== 'all' && st.academicBranch !== studentBranchFilter) return false;
                              if (!studentSearch.trim()) return true;
                              const q = studentSearch.toLowerCase();
                              const full = `${st.firstName} ${st.lastName}`.toLowerCase();
                              return full.includes(q) || (st.phone && st.phone.includes(q));
                            })
                            .map((st: any) => {
                              const isSelected = selectedStudents.includes(st.id);
                              return (
                                <div 
                                  key={st.id}
                                  onClick={() => {
                                    setSelectedStudents(prev => 
                                      prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                                    );
                                  }}
                                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-xs ring-1 ring-indigo-500'
                                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                                        : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 flex-wrap">
                                        <span>{st.firstName} {st.lastName}</span>
                                        {st.gradeLevel && (
                                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                            {st.gradeLevel === 'grade_11' ? 'صف 11' : 'صف 12'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span className={`px-1.5 py-0.2 rounded font-bold ${st.academicBranch === 'scientific' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                                          {st.academicBranch === 'scientific' ? 'علمي' : 'أدبي'}
                                        </span>
                                        {((isScientificCourse && st.academicBranch === 'literary') || (isLiteraryCourse && st.academicBranch === 'scientific')) && (
                                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                            ⚠️ استثناء
                                          </span>
                                        )}
                                        {st.curriculumType && (
                                          <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            {st.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'}
                                          </span>
                                        )}
                                        {st.phone && <span dir="ltr">{st.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-all"
                >
                  إلغاء
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 ? (!formData.name.trim() || !formData.courseId) : !formData.teacherId}
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createCohortMutation.isPending}
                  onClick={() => createCohortMutation.mutate()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {createCohortMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>إتمام إنشاء الفوج وتثبيت الطلبة</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Requests Modal for Supervisor */}
      {isRequestsModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto text-right">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    طلبات فتح الأفواج من الأساتذة
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    مراجعة طلبات الأساتذة لفتح أفواج جديدة واعتمادها مع إسناد الفوج للأستاذ مقدم الطلب أو أستاذ بديل
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestsModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <CohortRequestsAdminView />
          </div>
        </div>,
        document.body
      )}

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        cohortId={selectedCohortForAttendance}
      />
    </div>
  );
}
