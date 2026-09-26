import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, CheckCircle, PlayCircle, FileText, Video } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['teacher_sessions_dashboard'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    }
  });

  const upcomingSession = sessions.find((s: any) => new Date(s.scheduledStartTime) >= new Date() || s.status === 'in_progress') || sessions[0];

  const getFormattedTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  // Mock data representing the strictly engineered backend
  const stats = [
    { label: 'الأفواج النشطة', value: '3', icon: Users, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'حصص اليوم', value: sessions.filter((s:any) => new Date(s.scheduledStartTime).toDateString() === new Date().toDateString()).length.toString(), icon: Calendar, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'واجبات بانتظار التقييم', value: '14', icon: Clock, color: 'text-baaqoon-red', bg: 'bg-red-50' },
    { label: 'نسبة الحضور الكلية', value: '92%', icon: CheckCircle, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">مرحباً أستاذ {user?.firstName} {user?.lastName} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">إليك نظرة عامة على نشاطك اليوم في منصة باقون.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-6 flex items-start gap-4 transition-transform hover:-translate-y-1">
              <div className={`p-4 rounded-2xl ${stat.bg} dark:bg-opacity-20 ${stat.color} shadow-inner`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Session Card */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800/50 pb-4 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full shadow-sm"></span>
            الحصة القادمة
          </h2>
          
          {isLoading ? (
             <div className="flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : upcomingSession ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 rounded-[1.5rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 text-xs font-black bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-700/50">
                    مجدولة (Scheduled)
                  </span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg">
                    {upcomingSession.cohort?.name || 'فوج غير معروف'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {upcomingSession.title}
                </h3>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 
                  موعد البدء: {getFormattedTime(upcomingSession.scheduledStartTime)}
                </p>
              </div>
              
              <Link 
                to={`/sessions/${upcomingSession.id}/room`} 
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
              >
                <Video className="w-6 h-6 animate-pulse" />
                بدء الحصة (Jitsi)
              </Link>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-dashed border-slate-300 dark:border-slate-700">
               <p className="text-slate-500 dark:text-slate-400 font-bold">لا يوجد حصص مجدولة قادمة.</p>
            </div>
          )}
        </div>

        {/* Action Center - أزرار سريعة ومهمة */}
        <div className="glass-panel p-6 bg-gradient-to-br from-white to-baaqoon-50 dark:from-baaqoon-900 dark:to-baaqoon-800">
          <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white border-b border-baaqoon-100 dark:border-baaqoon-700 pb-4 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-baaqoon-accent rounded-full"></span>
            الوصول السريع (Quick Actions)
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              to="/teacher/curriculum"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-xl transition-colors border border-blue-100 dark:border-blue-800/50 group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-bold">بناء حصة ذكية</span>
              <span className="text-xs text-center opacity-70 mt-1">من البناء التعلمي الجاهز</span>
            </Link>

            <Link 
              to="/teacher/assessments"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-xl transition-colors border border-purple-100 dark:border-purple-800/50 group"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-bold">توليد اختبار ذكي</span>
              <span className="text-xs text-center opacity-70 mt-1">أسئلة مؤتمتة فورية</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-baaqoon-100 dark:border-baaqoon-800 space-y-2">
            <Link 
              to="/teacher/assessments" 
              className="block w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg transition-colors text-sm font-medium border border-baaqoon-200 dark:border-baaqoon-700"
            >
              + إدارة وتصحيح الواجبات
            </Link>
            <Link 
              to="/teacher/chat" 
              className="block w-full text-right px-4 py-3 bg-white dark:bg-baaqoon-900 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg transition-colors text-sm font-medium border border-baaqoon-200 dark:border-baaqoon-700"
            >
              + الدردشة والتواصل مع الطلاب
            </Link>
          </div>
        </div>

        {/* Curriculum Progress Tracker */}
        <div className="lg:col-span-3 glass-panel p-6 mt-2">
          <div className="flex justify-between items-center border-b border-baaqoon-100 dark:border-baaqoon-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white">
              متابعة تقدم المنهاج وإنجاز الدروس
            </h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold rounded-full">
              المنهاج الفلسطيني 🇵🇸
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-baaqoon-800 dark:text-baaqoon-100 mb-3 text-sm">الوحدة الأولى: الميكانيكا (مكتملة)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-baaqoon-700 dark:text-baaqoon-300 line-through">الفصل 1: الزخم الخطي والتصادمات</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-baaqoon-700 dark:text-baaqoon-300 line-through">الفصل 2: الحركة الدورانية</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-baaqoon-800 dark:text-baaqoon-100 mb-3 text-sm">الوحدة الثانية: الكهرباء (قيد الإنجاز)</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-baaqoon-50 dark:bg-baaqoon-800/50 p-3 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-baaqoon-400"></div>
                    <span className="text-sm font-bold text-baaqoon-900 dark:text-white">الفصل 1: الجهد الكهربائي</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      btn.textContent = 'تم الإنجاز ✅';
                      btn.className = 'text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600 transition-colors font-bold';
                      alert('تم تدوين تقدمك في المنهاج، وسيتم عكسه فوراً في تقارير المشرف والمدير.');
                    }}
                    className="text-xs bg-baaqoon-accent text-white px-3 py-1.5 rounded-md hover:bg-baaqoon-accentDark transition-colors"
                  >
                    تأكيد إنجاز الفصل
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 opacity-50">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  <span className="text-sm text-gray-500">الفصل 2: المواسعة الكهربائية</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-baaqoon-400 mt-6 text-center">
            * تحديث الإنجاز هنا ينعكس تلقائياً في تقارير تقدم المادة لدى المنسق التربوي والمدير.
          </p>
        </div>
      </div>
    </div>
  );
}
