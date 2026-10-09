const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add useQuery for monitoringData
const monitoringQuery = `
  const { data: monitoringData } = useQuery({
    queryKey: ['supervisorMonitoring'],
    queryFn: async () => {
      const res = await api.get('/sessions/monitoring');
      return res.data;
    },
  });
`;

const searchQueryPos = "const { data: statsData, isLoading } = useQuery({";
code = code.replace(searchQueryPos, monitoringQuery + "\n  " + searchQueryPos);

// 2. Replace the hardcoded sessions JSX
const searchJsx = /\{\/\* Live Monitoring \*\/\}[\s\S]*?(?=\{\/\* Strategic Features \(Coming Soon\) \*\/\}|\{activeTab === 'teachers')/g;
// I'll be safer with replacing exact strings.

const oldLiveSection = `          {/* Live Monitoring */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              المراقبة المباشرة الحالية
            </h2>
            <div className="space-y-4">
              {/* Session 1 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-baaqoon-800/50 rounded-lg border border-gray-100 dark:border-baaqoon-800">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">فيزياء - ع-1</h3>
                    <p className="text-sm text-gray-500 dark:text-baaqoon-400">أ. أحمد الخطيب</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    جاري الآن
                  </span>
                </div>
              </div>
              
              {/* Session 2 */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">رياضيات - ع-3</h3>
                    <p className="text-sm text-gray-500 dark:text-baaqoon-400">أ. سارة محمد</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    تأخر الأستاذ
                  </span>
                  <button 
                    onClick={() => handleNudge('session-2')}
                    disabled={!!nudgeStatus['session-2']}
                    className={\`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors \${
                      nudgeStatus['session-2'] === 'تم التنبيه' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-baaqoon-accent text-white hover:bg-opacity-90'
                    }\`}
                  >
                    {nudgeStatus['session-2'] === 'تم التنبيه' ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    {nudgeStatus['session-2'] || 'إرسال تنبيه للأستاذ'}
                  </button>
                </div>
              </div>
            </div>
          </section>`;

const newLiveSection = `          {/* Live Monitoring */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              المراقبة المباشرة الحالية
            </h2>
            <div className="space-y-4">
              {monitoringData?.live?.length === 0 && (
                <div className="text-center py-8 text-gray-500">لا توجد حصص جارية حالياً</div>
              )}
              {monitoringData?.live?.map((session: any) => {
                const isLate = new Date() > new Date(new Date(session.startTime).getTime() + 10*60000);
                return (
                  <div key={session.id} className={\`flex items-center justify-between p-4 rounded-lg border \${isLate ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 dark:bg-baaqoon-800/50 border-gray-100 dark:border-baaqoon-800'}\`}>
                    <div className="flex items-center gap-4">
                      <div className={\`w-3 h-3 rounded-full \${isLate ? 'bg-red-500' : 'bg-green-500 animate-pulse'}\`}></div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{session.courseName} - {session.cohortName}</h3>
                        <p className="text-sm text-gray-500 dark:text-baaqoon-400">{session.teacherName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={\`px-3 py-1 text-xs font-semibold rounded-full \${isLate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}\`}>
                        {isLate ? 'تأخر الأستاذ' : 'جاري الآن'}
                      </span>
                      {isLate && (
                        <button 
                          onClick={() => handleNudge(session.id)}
                          disabled={!!nudgeStatus[session.id]}
                          className={\`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors \${
                            nudgeStatus[session.id] === 'تم التنبيه' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-baaqoon-accent text-white hover:bg-opacity-90'
                          }\`}
                        >
                          {nudgeStatus[session.id] === 'تم التنبيه' ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          {nudgeStatus[session.id] || 'إرسال تنبيه للأستاذ'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>`;
code = code.replace(oldLiveSection, newLiveSection);


const oldPastSection = `          {/* Attendance Reports */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <UserX className="w-5 h-5 text-baaqoon-700 dark:text-baaqoon-300" />
              تقارير الغياب والالتزام (الجلسات السابقة)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-baaqoon-800/50 text-gray-600 dark:text-baaqoon-300 border-b border-gray-100 dark:border-baaqoon-800">
                    <th className="p-3 font-semibold">المادة والفوج</th>
                    <th className="p-3 font-semibold">الأستاذ</th>
                    <th className="p-3 font-semibold">حضور الطلبة</th>
                    <th className="p-3 font-semibold">حالة الأستاذ</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50 dark:border-baaqoon-800/50">
                    <td className="p-3">لغة عربية - أ-2</td>
                    <td className="p-3">أ. محمود حسن</td>
                    <td className="p-3 text-red-600 font-medium">تغيب 3 طلاب</td>
                    <td className="p-3 text-green-600">حضر بالموعد</td>
                    <td className="p-3">
                      <button onClick={() => { setSelectedTeacher('teacher_id_here'); setIsMessageModalOpen(true); }} className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-all">
                        <MessageSquare className="w-4 h-4" />
                        تنبيه الغائبين
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">كيمياء - ع-2</td>
                    <td className="p-3">أ. خالد يوسف</td>
                    <td className="p-3 text-green-600">حضور كامل</td>
                    <td className="p-3 text-orange-600 font-medium">حضر متأخراً 10 دقائق</td>
                    <td className="p-3">
                      <button onClick={() => { setSelectedStudent('student_id_here'); setIsAlertModalOpen(true); }} className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg transition-all">
                        <AlertTriangle className="w-4 h-4" />
                        مراسلة الأستاذ
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>`;

const newPastSection = `          {/* Attendance Reports */}
          <section className="glass-panel p-6 rounded-xl shadow-sm border border-gray-100 dark:border-baaqoon-800">
            <h2 className="text-xl font-semibold text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2">
              <UserX className="w-5 h-5 text-baaqoon-700 dark:text-baaqoon-300" />
              تقارير الغياب والالتزام (الجلسات السابقة)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-baaqoon-800/50 text-gray-600 dark:text-baaqoon-300 border-b border-gray-100 dark:border-baaqoon-800">
                    <th className="p-3 font-semibold">المادة والفوج</th>
                    <th className="p-3 font-semibold">الأستاذ</th>
                    <th className="p-3 font-semibold">حضور الطلبة</th>
                    <th className="p-3 font-semibold">حالة الأستاذ</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringData?.past?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">لا توجد جلسات سابقة</td>
                    </tr>
                  )}
                  {monitoringData?.past?.map((session: any) => (
                    <tr key={session.id} className="border-b border-gray-50 dark:border-baaqoon-800/50">
                      <td className="p-3">{session.courseName} - {session.cohortName}</td>
                      <td className="p-3">{session.teacherName}</td>
                      <td className={\`p-3 font-medium \${session.isAbsent ? 'text-red-600' : 'text-green-600'}\`}>{session.studentAttendanceText}</td>
                      <td className={\`p-3 font-medium \${session.teacherStatus.includes('متأخراً') ? 'text-orange-600' : session.teacherStatus.includes('موعد') ? 'text-green-600' : 'text-red-600'}\`}>{session.teacherStatus}</td>
                      <td className="p-3">
                        {session.isAbsent ? (
                          <button onClick={() => { setSelectedTeacher(session.teacherId); setIsMessageModalOpen(true); }} className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">
                            <MessageSquare className="w-4 h-4" />
                            تنبيه الأستاذ للغياب
                          </button>
                        ) : session.teacherStatus.includes('متأخراً') || session.teacherStatus.includes('لم يسجل') ? (
                          <button onClick={() => { setSelectedTeacher(session.teacherId); setIsMessageModalOpen(true); }} className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">
                            <AlertTriangle className="w-4 h-4" />
                            مراسلة الأستاذ
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>`;
code = code.replace(oldPastSection, newPastSection);

fs.writeFileSync(path, code);
