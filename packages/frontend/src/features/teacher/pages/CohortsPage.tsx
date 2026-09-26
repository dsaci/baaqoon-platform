import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Book, Settings, MoreVertical, Plus } from 'lucide-react';

export default function CohortsPage() {
  // Mock data representing the Cohorts from the backend
  const [cohorts] = useState([
    {
      id: '1',
      name: 'فوج غزة (علمي)',
      subject: 'فيزياء',
      currentStudents: 12,
      maxStudents: 15,
      status: 'active',
      nextSession: 'اليوم، 04:00 م'
    },
    {
      id: '2',
      name: 'فوج القدس (أدبي)',
      subject: 'تاريخ',
      currentStudents: 8,
      maxStudents: 12,
      status: 'active',
      nextSession: 'غداً، 10:00 ص'
    },
    {
      id: '3',
      name: 'فوج جنين (علمي)',
      subject: 'رياضيات',
      currentStudents: 0,
      maxStudents: 10,
      status: 'registration',
      nextSession: 'لم يحدد بعد'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accentDark rounded-full">نشط</span>;
      case 'registration':
        return <span className="px-2.5 py-1 text-xs font-semibold bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accentDark rounded-full">قيد التسجيل</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-700 dark:text-baaqoon-300 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white">إدارة الأفواج</h1>
          <p className="text-baaqoon-500 dark:text-baaqoon-400 mt-1">تابع أفواجك، أدر الطلاب، وقم بتنظيم محتوى المادة.</p>
        </div>
        
        <button className="px-4 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" />
          طلب فتح فوج جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cohorts.map(cohort => (
          <div key={cohort.id} className="glass-panel flex flex-col hover:shadow-md transition-shadow">
            {/* Card Header */}
            <div className="p-5 border-b border-baaqoon-100 dark:border-baaqoon-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(cohort.status)}
                </div>
                <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white">{cohort.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-baaqoon-600 dark:text-baaqoon-400 mt-1">
                  <Book className="w-4 h-4 text-baaqoon-400" />
                  مادة الـ {cohort.subject}
                </div>
              </div>
              <button className="p-1 text-baaqoon-400 hover:text-baaqoon-700 dark:text-baaqoon-300 rounded-md transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            {/* Card Body */}
            <div className="p-5 flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-baaqoon-600 dark:text-baaqoon-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-baaqoon-400" /> السعة والطلاب
                  </span>
                  <span className="font-semibold text-baaqoon-900 dark:text-white text-dir-ltr">
                    {cohort.currentStudents} / {cohort.maxStudents}
                  </span>
                </div>
                {/* Progress Bar matching capacity limits from architecture */}
                <div className="w-full bg-baaqoon-100 dark:bg-baaqoon-900/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${cohort.currentStudents >= cohort.maxStudents ? 'bg-red-500' : 'bg-baaqoon-accent'}`} 
                    style={{ width: `${(cohort.currentStudents / cohort.maxStudents) * 100}%` }}
                  ></div>
                </div>
                {cohort.currentStudents >= cohort.maxStudents && (
                  <p className="text-xs text-red-500 font-medium">ممتلئ - نظام القفل مفعل</p>
                )}
              </div>

              <div className="bg-baaqoon-50 dark:bg-baaqoon-950 rounded-lg p-3 text-sm flex justify-between items-center border border-baaqoon-100 dark:border-baaqoon-800">
                <span className="text-baaqoon-500 dark:text-baaqoon-400">الحصة القادمة:</span>
                <span className="font-medium text-baaqoon-800 dark:text-baaqoon-100">{cohort.nextSession}</span>
              </div>
            </div>
            
            {/* Card Footer */}
            <div className="p-4 border-t border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50 dark:bg-baaqoon-950/50 rounded-b-xl flex gap-2">
              <Link
                to={`/teacher/cohorts/${cohort.id}`}
                className="flex-1 py-2 text-center bg-white dark:bg-baaqoon-900 border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-300 rounded-md text-sm font-medium hover:bg-baaqoon-50 dark:bg-baaqoon-950 transition-colors"
              >
                سجل الطلاب
              </Link>
              <button className="flex-1 py-2 bg-white dark:bg-baaqoon-900 border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-300 rounded-md text-sm font-medium hover:bg-baaqoon-50 dark:bg-baaqoon-950 transition-colors flex justify-center items-center gap-1">
                <Settings className="w-4 h-4" /> الإعدادات
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
