import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Book, Settings, MoreVertical, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function CohortsPage() {
  const { data: myCohorts, isLoading: loadingCohorts } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me');
      return res.data;
    }
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    }
  });

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
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

      {loadingCohorts ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-baaqoon-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myCohorts?.length > 0 ? (
            myCohorts.map((cohort: any) => {
              const currentStudents = cohort.enrollments?.length || 0;
              const maxStudents = cohort.capacity || 20; // Default capacity if not set
              
              // Find next session for this cohort
              const cohortSessions = sessions.filter((s: any) => s.cohortId === cohort.id && new Date(s.scheduledStartTime) >= new Date());
              cohortSessions.sort((a: any, b: any) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
              const nextSessionStr = cohortSessions.length > 0 ? formatTime(cohortSessions[0].scheduledStartTime) : 'لا توجد حصص مجدولة';

              return (
                <div key={cohort.id} className="glass-panel flex flex-col hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-5 border-b border-baaqoon-100 dark:border-baaqoon-800 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(cohort.status || 'active')}
                      </div>
                      <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white">{cohort.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-baaqoon-600 dark:text-baaqoon-400 mt-1">
                        <Book className="w-4 h-4 text-baaqoon-400" />
                        مادة التخصص
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
                          {currentStudents} / {maxStudents}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-baaqoon-100 dark:bg-baaqoon-900/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${currentStudents >= maxStudents ? 'bg-red-500' : 'bg-baaqoon-accent'}`} 
                          style={{ width: `${Math.min((currentStudents / maxStudents) * 100, 100)}%` }}
                        ></div>
                      </div>
                      {currentStudents >= maxStudents && (
                        <p className="text-xs text-red-500 font-medium">ممتلئ - يرجى طلب فوج جديد</p>
                      )}
                    </div>

                    <div className="bg-baaqoon-50 dark:bg-baaqoon-950 rounded-lg p-3 text-sm flex justify-between items-center border border-baaqoon-100 dark:border-baaqoon-800">
                      <span className="text-baaqoon-500 dark:text-baaqoon-400">الحصة القادمة:</span>
                      <span className="font-medium text-baaqoon-800 dark:text-baaqoon-100">{nextSessionStr}</span>
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
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center text-baaqoon-500 bg-white dark:bg-baaqoon-900 rounded-xl shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
              لا يوجد لديك أفواج حالياً. تواصل مع الإدارة لإسناد أفواج إليك.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
