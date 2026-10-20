import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Search, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Eye, 
  Award, 
  Plus, 
  FileText,
  Video,
  BookOpen,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  CalendarDays,
  X
} from 'lucide-react';
import RapidGeneratorModal from '../../assessments/components/RapidGeneratorModal';
import CreateAssignmentModal from '../../assessments/components/CreateAssignmentModal';
import AttendanceModal from '../../scheduling/components/AttendanceModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useTranslation } from 'react-i18next';

const getInitials = (name: string) => {
  if (!name) return 'ط';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.substring(0, 2);
};

export const CohortDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { cohortId } = useParams();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'students' | 'schedule' | 'assignments'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<string | null>(null);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<any | null>(null);

  // Fetch real cohort details and student roster
  const { data, isLoading, error } = useQuery({
    queryKey: ['cohort_details', cohortId],
    queryFn: async () => {
      const res = await api.get(`/groups/cohorts/${cohortId || 'default'}`);
      return res.data;
    },
    enabled: !!cohortId
  });

  const { cohort, students = [], stats, sessions = [], assessments = [] } = data || {};

  const filteredStudents = students.filter((s: any) => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || '').includes(searchQuery)
  );

  const activeStudentsCount = stats?.activeStudentsCount ?? students.filter((s: any) => s.status === 'active').length;
  const avgAttendance = stats?.avgAttendance ?? 0;
  const atRiskStudentsCount = stats?.atRiskStudentsCount ?? 0;
  const topStudents = stats?.topStudents ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-baaqoon-950 flex flex-col items-center justify-center p-6" dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm">
          {isRtl ? "جاري تحميل سجل وبيانات الفوج..." : "Loading cohort details & roster..."}
        </p>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-baaqoon-950 flex flex-col items-center justify-center p-6 text-center" dir={isRtl ? "rtl" : "ltr"}>
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {isRtl ? "تعذر العثور على الفوج المدرسي" : "Cohort not found"}
        </h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          {isRtl ? "يرجى التأكد من الرابط أو العودة للوحة التحكم." : "Please check the URL or return to dashboard."}
        </p>
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="px-5 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl text-sm"
        >
          {isRtl ? "العودة للوحة الأستاذ" : "Back to Teacher Dashboard"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-baaqoon-950 flex flex-col p-6 font-sans text-baaqoon-900 dark:text-white pb-16" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="p-2.5 hover:bg-gray-200 dark:hover:bg-baaqoon-800 rounded-xl text-baaqoon-700 dark:text-baaqoon-300 transition-colors bg-white dark:bg-baaqoon-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            title="العودة للوحة الأستاذ"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-baaqoon-900 dark:text-white">
                {cohort.name}
              </h1>
              <span className="font-mono text-xs font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
                {cohort.code}
              </span>
              {cohort.subjectName && (
                <span className="text-xs font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {cohort.subjectName}
                </span>
              )}
              <span className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                {activeStudentsCount} {t("cohorts.active_students", "طالب نشط")}
              </span>
            </div>
            <p className="text-sm font-bold text-baaqoon-500 dark:text-baaqoon-400 mt-1">
              {t("cohorts.cohort_desc", "متابعة حضور الطلاب الفعلي، التكليفات المدرسية، وجدول الحصص الافتراضية.")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            type="button"
            onClick={() => {
              setSelectedSessionForAttendance(sessions[0]?.id || null);
              setIsAttendanceModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>{t("cohorts.record_attendance", "رصد الغياب والحضور")}</span>
          </button>
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-baaqoon-50 dark:bg-baaqoon-900 dark:hover:bg-baaqoon-800 text-baaqoon-accentDark border border-baaqoon-200 dark:border-baaqoon-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>{t("cohorts.generate_quiz", "توليد اختبار / حصة")}</span>
          </button>
          <button 
            onClick={() => setIsAssignmentModalOpen(true)}
            className={`flex items-center justify-center gap-2 ${
              isRtl ? 'bg-gradient-to-r' : 'bg-gradient-to-l'
            } from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md shadow-violet-500/20 cursor-pointer`}
          >
            <Plus size={18} />
            <span>{t("cohorts.create_assignment", "إنشاء واجب للفوج")}</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="border-b border-gray-200 dark:border-baaqoon-800 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'students', label: t("cohorts.students_tab", "الطلاب"), count: students.length },
            { id: 'schedule', label: t("cohorts.sessions_tab", "الحصص والجدول"), count: sessions.length },
            { id: 'assignments', label: t("cohorts.assignments_tab", "الواجبات والتكليفات"), count: assessments.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-baaqoon-accent text-baaqoon-accent font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id 
                  ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Students Tab Content */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6 flex-1">
          {/* Aggregate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 bg-white dark:bg-baaqoon-900">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl text-emerald-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">متوسط الحضور الفعلي</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{avgAttendance}%</span>
                  <span className="text-xs text-emerald-600 font-bold">معدل التزام الفوج</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 bg-white dark:bg-baaqoon-900">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">طلاب بحاجة لمتابعة (أقل من 70%)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-600">{atRiskStudentsCount} طلاب</span>
                  <span className="text-xs text-slate-400 font-bold">يتطلب تنبيه</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 bg-white dark:bg-baaqoon-900">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl text-indigo-600">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">الحصص المنفذة والمجدولة</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{sessions.length} حصص</span>
                  <span className="text-xs text-indigo-600 font-bold">ضمن الخطة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white dark:bg-baaqoon-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-baaqoon-850">
              <div className="relative w-full max-w-md">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder={t("cohorts.search_student", "ابحث عن طالب بالاسم أو الهاتف أو البريد...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${isRtl ? 'pl-4 pr-11' : 'pr-4 pl-11'} py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-baaqoon-900 text-slate-900 dark:text-white`}
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {t("common.total_students", "إجمالي الطلاب")}: {students.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead className="bg-slate-50 dark:bg-baaqoon-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5 font-black text-xs uppercase tracking-wider">{t("cohorts.student_col", "الطالب")}</th>
                    <th className="px-6 py-3.5 font-black text-xs uppercase tracking-wider">{t("cohorts.enrollment_status", "حالة التسجيل")}</th>
                    <th className="px-6 py-3.5 font-black text-xs uppercase tracking-wider">{t("cohorts.attendance_col", "نسبة الحضور الفعلي")}</th>
                    <th className="px-6 py-3.5 font-black text-xs uppercase tracking-wider">{t("cohorts.last_activity", "آخر نشاط")}</th>
                    <th className="px-6 py-3.5 font-black text-xs uppercase tracking-wider text-center">{t("cohorts.actions_col", "التواصل والمتابعة")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-baaqoon-800">
                  {filteredStudents.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-baaqoon-850/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{student.name}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              {student.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {student.email}
                                </span>
                              )}
                              {student.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3" />
                                  {student.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle size={12} />
                            مسجل ونشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertCircle size={12} />
                            معلق / بانتظار
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-52">
                        <div className="flex items-center gap-3">
                          <span className="w-9 font-black text-xs text-slate-800 dark:text-slate-100">{student.attendance}%</span>
                          <div className="flex-1 h-2.5 bg-slate-100 dark:bg-baaqoon-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                student.attendance >= 80 ? 'bg-emerald-500' : 
                                student.attendance >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.max(5, student.attendance)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1 font-bold">
                          حضر {student.attendedCount} من {student.totalSessionsCount} حصص
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400">
                        {student.lastActivity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedStudentForProgress(student)}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="عرض تفاصيل الحضور والتقدم"
                          >
                            <Eye size={13} />
                            {t("cohorts.view_progress", "عرض التقدم")}
                          </button>
                          <Link 
                            to="/teacher/chat" 
                            className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700 font-bold text-xs bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 px-3 py-1.5 rounded-lg transition-colors border border-violet-100 dark:border-violet-800"
                            title="مراسلة في الدردشة"
                          >
                            <Mail size={13} />
                            {t("cohorts.message_student", "مراسلة")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                        لا يوجد طلاب يطابقون كلمة البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary Card - Top Students */}
          {topStudents.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 dark:from-baaqoon-900 dark:to-baaqoon-850 p-6 rounded-2xl border border-amber-200/80 dark:border-baaqoon-800 shadow-xs">
              <h3 className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-4 text-base">
                <Award className="text-amber-500 w-5 h-5" />
                الطلبة الأكثر التزاماً وحضوراً هذا الشهر
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topStudents.map((student: any, idx: number) => (
                  <div key={student.id || idx} className="flex items-center gap-3.5 bg-white dark:bg-baaqoon-900 p-4 rounded-xl border border-amber-100 dark:border-baaqoon-800 shadow-2xs">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      #{idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">نسبة الحضور: {student.attendance}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200 dark:border-baaqoon-800">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">جدول وحصص هذا الفوج</h3>
              <p className="text-xs font-bold text-slate-500">الحصص المجدولة والمباشرة والمنجزة لهذا الفوج الدراسي</p>
            </div>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="px-5 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-black rounded-xl text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              جدولة حصة جديدة في التقويم
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-baaqoon-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-black text-slate-700 dark:text-slate-300 text-sm">لا توجد حصص مجدولة لهذا الفوج حتى الآن.</p>
              <p className="text-xs text-slate-400 font-bold">يمكنك جدولة حصص عبر التقويم الأسبوعي.</p>
              <button
                onClick={() => navigate('/teacher/schedule')}
                className="px-6 py-2.5 bg-baaqoon-accent text-white font-black rounded-xl text-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                الانتقال لجدول الحصص
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session: any) => {
                const startTime = new Date(session.scheduledStartTime);
                const isPast = session.status === 'completed' || startTime < new Date();

                return (
                  <div 
                    key={session.id} 
                    className="p-5 bg-white dark:bg-baaqoon-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          session.status === 'completed' 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        }`}>
                          {session.status === 'completed' ? 'حصة منجزة' : 'حصة مجدولة'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {startTime.toLocaleDateString('ar-EG', { weekday: 'long', month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {session.title}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>الساعة {startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/sessions/${session.id}/room`}
                          className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Video className="w-3.5 h-3.5" />
                          {isPast ? 'مراجعة قاعة الحصة' : 'دخول الحصة الآن (Jitsi)'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionForAttendance(session.id);
                            setIsAttendanceModalOpen(true);
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          رصد الحضور
                        </button>
                      </div>
                      <button
                        onClick={() => navigate('/teacher/schedule')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700"
                      >
                        تفاصيل الجدول ←
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* 5. Assignments Tab Content */}
      {activeTab === 'assignments' && (
        <div className="space-y-4 flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200 dark:border-baaqoon-800">
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">واجبات وتكليفات الفوج</h3>
              <p className="text-xs font-bold text-slate-500">إدارة الواجبات والأنشطة ومتابعة تصحيح وتسليمات طلبة هذا الفوج</p>
            </div>
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إنشاء واجب جديد لهذا الفوج
            </button>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-baaqoon-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-black text-slate-700 dark:text-slate-300 text-sm">لم يتم تكليف أي واجبات لهذا الفوج حتى الآن.</p>
              <p className="text-xs text-slate-400 font-bold">انقر على الزر أدناه لإرسال أول تكليف أو واجب منزلي للطلاب.</p>
              <button
                onClick={() => setIsAssignmentModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl text-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5 shadow-md shadow-violet-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                إنشاء وتعيين أول واجب الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((item: any) => (
                <div key={item.id} className="p-5 bg-white dark:bg-baaqoon-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">{item.title}</h4>
                    <div className="text-xs font-bold text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">الدرجة: {item.maxScore}</span>
                      <span>•</span>
                      <span>آخر موعد: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ar-EG') : '-'}</span>
                      {item.submissionsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-black">
                            تم تسليم {item.submissionsCount} (تم تصحيح {item.gradedCount})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/teacher/assessments/${item.id}/grade`}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-black rounded-xl text-xs border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    عرض وتصحيح
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RapidGeneratorModal 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)} 
        cohortId={cohortId || ''} 
      />

      <CreateAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        defaultCohortId={cohortId}
      />

      {/* Student Progress Detail Modal */}
      {selectedStudentForProgress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-baaqoon-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-lg border border-white/20">
                  {getInitials(selectedStudentForProgress.name)}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedStudentForProgress.name}</h3>
                  <p className="text-violet-100 text-xs font-bold mt-0.5">
                    {cohort.name} • {selectedStudentForProgress.status === 'active' ? 'طالب نشط ومسجل' : 'معلق'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForProgress(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Contact info cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-baaqoon-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">البريد الإلكتروني</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {selectedStudentForProgress.email || 'غير مسجل'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-baaqoon-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold block mb-1">رقم الهاتف</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono block">
                    {selectedStudentForProgress.phone || 'غير مسجل'}
                  </span>
                </div>
              </div>

              {/* Attendance KPI */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">نسبة الحضور الفعلي في الفوج</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {selectedStudentForProgress.attendance}%
                  </span>
                </div>
                <div className="w-full h-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, selectedStudentForProgress.attendance)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>حضر {selectedStudentForProgress.attendedCount || 0} من إجمالي {selectedStudentForProgress.totalSessionsCount || sessions.length} حصص</span>
                  <span>آخر نشاط: {selectedStudentForProgress.lastActivity}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Link
                  to="/teacher/chat"
                  onClick={() => setSelectedStudentForProgress(null)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Mail size={15} />
                  مراسلة الطالب في المحادثات
                </Link>
                <button
                  onClick={() => setSelectedStudentForProgress(null)}
                  className="py-3 px-5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-baaqoon-800 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        sessionId={selectedSessionForAttendance || undefined}
        cohortId={cohortId}
      />
    </div>
  );
};

export default CohortDetailPage;
