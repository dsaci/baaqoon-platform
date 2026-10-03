const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const combinedRegex = /<div>\s*<label[^>]*>[^<]*<\/label>\s*<select\s*value=\{selectedCourseId\}[\s\S]*?<\/select>\s*<\/div>\s*<div>\s*<label[^>]*>[^<]*<\/label>\s*<select\s*value=\{selectedTeacherId\}[\s\S]*?<\/select>\s*<\/div>/;

console.log('Regex matched combined:', combinedRegex.test(code));

const replacementForm = `              {(() => {
                const selectedCourse = adminData?.courses?.find((c: any) => c.id === selectedCourseId);
                const targetSubjectId = selectedCourse?.subjectId;
                const targetBranch = selectedCourse?.academicBranch;
                const targetCurriculum = selectedCourse?.curriculumType;
                
                const availableTeachers = adminData?.teachers?.filter((t: any) => !targetSubjectId || t.supervisedSubjectId === targetSubjectId) || [];
                const availableStudents = adminData?.students?.filter((s: any) => (!targetBranch || s.academicBranch === targetBranch) && (!targetCurriculum || s.curriculumType === targetCurriculum)) || [];

                return (
                  <>
                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المادة والمنهج</label>
                      <select 
                        value={selectedCourseId}
                        onChange={e => {
                          setSelectedCourseId(e.target.value);
                          setSelectedTeacherId('');
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                        required
                      >
                        <option value="">-- اختر المادة --</option>
                        {adminData?.courses?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المعلم (حسب التخصص)</label>
                      <select 
                        value={selectedTeacherId}
                        onChange={e => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                        required
                        disabled={!selectedCourseId}
                      >
                        <option value="">-- اختر المعلم --</option>
                        {availableTeachers.map((t: any) => (
                          <option key={t.id} value={t.id}>أ. {t.firstName} {t.lastName} ({t.email})</option>
                        ))}
                      </select>
                      {selectedCourseId && availableTeachers.length === 0 && (
                        <p className="text-sm text-amber-500 mt-1 font-bold">لا يوجد معلمون مسجلون في تخصص هذه المادة.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر الطلاب (حسب الفرع والمنهج)</label>
                      <div className="w-full max-h-40 overflow-y-auto px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                        {!selectedCourseId ? (
                          <span className="text-slate-400">اختر المادة أولاً لعرض الطلاب المتوافقين</span>
                        ) : availableStudents.length === 0 ? (
                          <span className="text-slate-400">لا يوجد طلاب متوافقون مع الفرع والمنهج</span>
                        ) : (
                          <div className="space-y-2 flex flex-col items-start gap-1">
                            {availableStudents.map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIds(prev => [...prev, s.id]);
                                    } else {
                                      setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                                />
                                <span className="text-sm font-bold">{s.firstName} {s.lastName} <span className="text-slate-400 font-normal">({s.email})</span></span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}`;

if (combinedRegex.test(code)) {
    code = code.replace(combinedRegex, replacementForm);
    fs.writeFileSync(path, code);
    console.log('done');
} else {
    console.log('not found');
}
