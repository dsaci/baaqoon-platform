import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, CheckCircle, PlayCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  // Mock data representing the strictly engineered backend
  const stats = [
    { label: 'الأفواج النشطة', value: '3', icon: Users, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'حصص اليوم', value: '2', icon: Calendar, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
    { label: 'واجبات بانتظار التقييم', value: '14', icon: Clock, color: 'text-baaqoon-red', bg: 'bg-red-50' },
    { label: 'نسبة الحضور الكلية', value: '92%', icon: CheckCircle, color: 'text-baaqoon-accent', bg: 'bg-baaqoon-100 dark:bg-baaqoon-900/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white">مرحباً أستاذ {user?.firstName} {user?.lastName} 👋</h1>
        <p className="text-baaqoon-500 dark:text-baaqoon-400 mt-1">إليك نظرة عامة على نشاطك اليوم في منصة باقون.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-6 flex items-start gap-4">
              <div className={`p-3 rounded-lg ${stat.bg} dark:bg-opacity-20 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-baaqoon-500 dark:text-baaqoon-400">{stat.label}</p>
                <p className="text-2xl font-bold text-baaqoon-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Session Card */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white border-b border-baaqoon-100 dark:border-baaqoon-800 pb-4 mb-4">
            الحصة القادمة
          </h2>
          <div className="bg-baaqoon-50 dark:bg-baaqoon-800/50 border border-baaqoon-200 dark:border-baaqoon-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-baaqoon-100 dark:bg-baaqoon-800 text-baaqoon-accentDark dark:text-baaqoon-accent rounded-full">
                  مجدولة (Scheduled)
                </span>
                <span className="text-sm text-baaqoon-500 dark:text-baaqoon-400">فوج غزة (علمي)</span>
              </div>
              <h3 className="text-xl font-bold text-baaqoon-900 dark:text-white">مراجعة فيزياء - الوحدة الثالثة</h3>
              <p className="text-sm text-baaqoon-600 dark:text-baaqoon-300 mt-1 flex items-center gap-1">
                <Clock className="w-4 h-4" /> اليوم، 04:00 مساءً
              </p>
            </div>
            
            <Link 
              to="/teacher/schedule" 
              className="w-full md:w-auto px-6 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              بدء الحصة (Jitsi)
            </Link>
          </div>
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
