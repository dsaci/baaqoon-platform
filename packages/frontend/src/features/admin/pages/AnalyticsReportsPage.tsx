import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Globe, 
  Calendar, 
  TrendingUp, 
  Layers, 
  UserCheck, 
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';

export default function AnalyticsReportsPage() {
  const { user } = useAuthStore();
  const [nationalityTab, setNationalityTab] = useState<'overall' | 'students' | 'teachers'>('overall');

  // Hourly refetch interval: 3600000 ms (1 hour)
  const { data, isLoading, isRefetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['analytics_reports'],
    queryFn: async () => {
      const res = await api.get('/groups/analytics/reports');
      return res.data;
    },
    refetchInterval: 3600000,
    staleTime: 3600000,
  });

  const formatUpdatedAt = () => {
    if (!dataUpdatedAt) return 'جاري التحميل...';
    const date = new Date(dataUpdatedAt);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm">جاري تجميع المؤشرات والإحصائيات والنسب الحية...</p>
      </div>
    );
  }

  const {
    scope,
    curriculum = {},
    nationalities = {},
    cohorts = {},
    users = {},
    sessions = {},
    recommendations = []
  } = data || {};

  const activeNationalities = nationalities[nationalityTab] || [];

  return (
    <div className="space-y-8 animate-fade-in font-sans" dir="rtl">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                لوحة الإحصائيات والتقارير المتقدمة
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                تحديث تلقائي كل ساعة
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              مؤشرات الأداء والنسب الشاملة
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium">
              تحليل دقيق للطاقة الاستيعابية، توزع المناهج (حكومي وأزهري)، الجنسيات، والتوجيهات البيداغوجية والإدارية المباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
              <span className="text-slate-400 block">آخر تحيين:</span>
              <span className="font-bold text-white text-sm">{formatUpdatedAt()}</span>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              تحديث فوري
            </button>
          </div>
        </div>

        {scope?.isSupervisor && scope?.supervisedSubjectName && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>أنت تشاهد لوحة المتابعة بصلاحية:</span>
            <span className="font-bold text-white bg-indigo-800/60 px-2 py-0.5 rounded-lg border border-indigo-700">
              مشرف مادة {scope.supervisedSubjectName}
            </span>
          </div>
        )}
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الأفواج الدراسية</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{cohorts.total || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cohorts.active || 0} فوج نشط</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">{cohorts.averageStudentsPerCohort || 0} طالب/فوج</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلاب المسجلون</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{users.totalStudents || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">نسبة الاستيعاب {cohorts.capacitySaturationRate || 0}%</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">الطاقة: {cohorts.totalMaxCapacity || 0}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الهيئة التدريسية</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{users.totalTeachers || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-bold">نسبة التأطير: {users.teacherToStudentRatio}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">{users.totalSupervisors || 0} مشرفين</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الالتزام والحضور</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{sessions.attendanceRate || 0}%</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-600 dark:text-purple-400 font-bold">{sessions.completed || 0} حصة منفذة</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">{sessions.total || 0} مجدولة</span>
          </div>
        </div>
      </div>

      {/* Grid: Curricula Breakdown & Nationality Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Curricula Distribution (حكومي vs أزهري) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                توزيع المناهج الدراسية
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-bold">مقارنة نسب التسجيل والأفواج بين المنهج الحكومي والمنهج الأزهري</p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
              {curriculum.totalCourses || 0} مقررات معتمدة
            </span>
          </div>

          <div className="space-y-5">
            {/* Governmental Curriculum Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-black text-slate-800 dark:text-slate-200 text-sm">المنهج الفلسطيني الحكومي</span>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {curriculum.governmental?.percentage || 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${curriculum.governmental?.percentage || 0}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">المقررات</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.governmental?.coursesCount || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">الأفواج</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.governmental?.cohortsCount || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">الطلاب الملتحقون</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.governmental?.studentsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Azhari Curriculum Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="font-black text-slate-800 dark:text-slate-200 text-sm">المنهج الأزهري (الفرع الشرعي)</span>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {curriculum.azhari?.percentage || 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${curriculum.azhari?.percentage || 0}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">المقررات</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.azhari?.coursesCount || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">الأفواج</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.azhari?.cohortsCount || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40">
                  <span className="block text-slate-400 text-[10px]">الطلاب الملتحقون</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{curriculum.azhari?.studentsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nationality Distribution (الجنسية كم؟) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                التوزع الجغرافي والجنسيات
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-bold">نسب وجنسيات المسجلين في المنصة</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setNationalityTab('overall')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  nationalityTab === 'overall' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setNationalityTab('students')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  nationalityTab === 'students' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الطلاب
              </button>
              <button
                onClick={() => setNationalityTab('teachers')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  nationalityTab === 'teachers' 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                المعلمون
              </button>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[310px] overflow-y-auto pr-1">
            {activeNationalities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">لا توجد بيانات جنسيات مسجلة حالياً</div>
            ) : (
              activeNationalities.map((item: any, idx: number) => {
                const colors = [
                  'bg-indigo-500', 
                  'bg-emerald-500', 
                  'bg-blue-500', 
                  'bg-purple-500', 
                  'bg-amber-500', 
                  'bg-slate-400'
                ];
                const color = colors[idx % colors.length];

                return (
                  <div key={item.name} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 dark:text-slate-400">{item.count} مستخدم</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recommendations & Pedagogical / Administrative Insights */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              توجيهات ونصائح المتابعة والتنسيق (بيداغوجية وإدارية)
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">
              توجيهات دورية ذكية مخصصة للمدير والمشرفين لمواكبة استقرار العملية التعليمية
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {recommendations.length} توجيهات مفعلة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((rec: any, idx: number) => {
            const isPedagogical = rec.type === 'pedagogical';
            const isHigh = rec.level === 'high';

            return (
              <div 
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isHigh
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    : isPedagogical
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-900/50'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isHigh
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                      : isPedagogical
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                  }`}>
                    {isHigh ? <AlertTriangle className="w-5 h-5" /> : isPedagogical ? <BookOpen className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        {rec.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isPedagogical 
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {isPedagogical ? 'توجيه بيداغوجي وتربوي' : 'إجراء إداري وتنظيمي'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {rec.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
