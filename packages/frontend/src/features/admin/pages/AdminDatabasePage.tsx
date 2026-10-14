import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Database, Users, BookOpen, Layers, Users2, Search, Download, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { getUserActivityStatus } from '../../../utils/activityStatus';


export default function AdminDatabasePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'subjects' | 'courses' | 'cohorts'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [userIdleOnly, setUserIdleOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_database'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/database');
      return res.data;
    }
  });

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const res = await api.get('/groups/admin/export-database', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `baaqoon_database_full_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('حدث خطأ أثناء تصدير قاعدة البيانات بصيغة Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'المستخدمون', icon: Users, count: data?.users?.length || 0 },
    { id: 'cohorts', label: 'الأفواج', icon: Users2, count: data?.cohorts?.length || 0 },
    { id: 'courses', label: 'المقررات الدراسية', icon: BookOpen, count: data?.courses?.length || 0 },
    { id: 'subjects', label: 'المواد الأساسية', icon: Layers, count: data?.subjects?.length || 0 },
  ] as const;

  const renderContent = () => {
    if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>;
    if (!data) return null;

    if (activeTab === 'users') {
      const q = searchTerm.toLowerCase();
      let filtered = data.users.filter((u: any) => 
        (u.firstName && u.firstName.toLowerCase().includes(q)) || 
        (u.lastName && u.lastName.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );

      if (userIdleOnly) {
        filtered = filtered.filter((u: any) => getUserActivityStatus(u.lastLoginAt, u.createdAt).isIdle);
      }

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الاسم</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">البريد الإلكتروني</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">رقم الهاتف</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الجنسية / الفرع</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الدور</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">حالة النشاط / آخر دخول</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const act = getUserActivityStatus(u.lastLoginAt, u.createdAt);
                return (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs" dir="ltr">{u.email || '-'}</td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-bold">{u.nationality || 'غير محدد'}</div>
                      {u.supervisedSubject?.nameAr ? (
                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                          مادة: {u.supervisedSubject.nameAr}
                        </div>
                      ) : (u.primaryRole === 'teacher' || u.primaryRole === 'subject_supervisor') ? (
                        <div className="text-[10px] font-black text-rose-500 mt-0.5">
                          ⚠️ يحتاج تحديد مادة
                        </div>
                      ) : (u.academicBranch ? (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {u.academicBranch === 'scientific' ? 'علمي' : u.academicBranch === 'literary' ? 'أدبي' : u.academicBranch}
                        </div>
                      ) : null)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
                        {u.primaryRole === 'student' ? (u.gradeLevel === 'grade_11' ? 'طالب (صف 11)' : 'طالب (توجيهي)') : u.primaryRole === 'teacher' ? 'معلم' : u.primaryRole === 'subject_supervisor' ? 'مشرف' : 'إدارة'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {u.status === 'active' ? 'نشط' : u.status === 'pending' ? 'قيد المراجعة' : 'محظور'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${act.badgeClass}`}>
                          {act.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {act.formattedLastLogin}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'cohorts') {
      const filtered = data.cohorts.filter((c: any) => c.name.includes(searchTerm) || c.code.includes(searchTerm));
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">اسم الفوج</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الكود</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">المعلم</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الطلبة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{c.code}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {c.instructors?.[0]?.teacher ? `${c.instructors[0].teacher.firstName} ${c.instructors[0].teacher.lastName}` : 'غير محدد'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                      {c.enrollments?.length || 0} طالب
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'courses') {
      const filtered = data.courses.filter((c: any) => c.title.includes(searchTerm));
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">المقرر</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الكود</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">المادة الأساسية</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الصف</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">نوع المنهج</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{c.title}</td>
                  <td className="p-4 text-slate-500 font-mono text-sm">{c.code}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{c.subject?.nameAr}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                      {c.gradeLevel === 'grade_12' ? 'الثاني عشر (توجيهي)' : 'الحادي عشر (11)'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      c.curriculumType === 'azhari' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {c.curriculumType === 'azhari' ? 'أزهري معتمد' : 'حكومي عام'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'subjects') {
      const filtered = data.subjects.filter((s: any) => s.nameAr.includes(searchTerm));
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">المادة</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">المقررات المرتبطة</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{s.nameAr}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
                      {s.courses?.length || 0} مقررات
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      s.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {s.isActive ? 'مفعلة' : 'غير مفعلة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    
      <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Database className="w-8 h-8 text-violet-500" />
              قاعدة البيانات المركزية
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              استعراض وتحليل جميع البيانات المسجلة في منصة باقون.
            </p>
          </div>
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تصدير Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير قاعدة البيانات الشاملة (Excel)</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-2xl shadow-lg overflow-hidden">
          {/* Header Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 flex items-center gap-3 whitespace-nowrap transition-all border-b-2 relative ${
                    activeTab === tab.id
                      ? 'border-violet-600 bg-white dark:bg-slate-900/50 text-violet-700 dark:text-violet-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-violet-600' : 'opacity-50'}`} />
                  <span className="font-black">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-violet-100 dark:bg-violet-900/50' : 'bg-slate-200 dark:bg-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في البيانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
            </div>

            {activeTab === 'users' && (
              <button
                onClick={() => setUserIdleOnly(!userIdleOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                  userIdleOnly
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>الخاملون والمنقطعون فقط</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                  {data?.users?.filter((u: any) => getUserActivityStatus(u.lastLoginAt, u.createdAt).isIdle).length || 0}
                </span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </div>
    
  );
}
