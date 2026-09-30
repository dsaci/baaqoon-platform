import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Database, Users, BookOpen, Layers, Users2, Search, Download } from 'lucide-react';


export default function AdminDatabasePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'subjects' | 'courses' | 'cohorts'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin_database'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/database');
      return res.data;
    }
  });

  const tabs = [
    { id: 'users', label: 'المستخدمون', icon: Users, count: data?.users?.length || 0 },
    { id: 'cohorts', label: 'الأفواج', icon: Users2, count: data?.cohorts?.length || 0 },
    { id: 'courses', label: 'المقررات الدراسية', icon: BookOpen, count: data?.courses?.length || 0 },
    { id: 'subjects', label: 'المواد الأساسية', icon: Layers, count: data?.subjects?.length || 0 },
  ] as const;

  const renderContent = () => {
    if (isLoading) return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;
    if (!data) return null;

    if (activeTab === 'users') {
      const filtered = data.users.filter((u: any) => 
        u.firstName.includes(searchTerm) || u.lastName.includes(searchTerm) || u.email.includes(searchTerm)
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الاسم</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">البريد الإلكتروني</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الدور</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">الحالة</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300">تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
                      {u.primaryRole === 'student' ? 'طالب' : u.primaryRole === 'teacher' ? 'معلم' : u.primaryRole === 'subject_supervisor' ? 'مشرف' : 'إدارة'}
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
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
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
                      {c.gradeLevel === 'grade_12' ? 'الثاني عشر' : 'الحادي عشر'}
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
          <button className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
            <Download className="w-4 h-4" /> تصدير تقرير (Excel)
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

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في البيانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {renderContent()}
          </div>
        </div>
      </div>
    
  );
}
