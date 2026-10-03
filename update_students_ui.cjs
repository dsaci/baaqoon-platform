const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add studentSearchQuery state
if (!code.includes('studentSearchQuery')) {
  code = code.replace("const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);", "const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);\n  const [studentSearchQuery, setStudentSearchQuery] = useState('');");
  
  // 2. Clear search on close
  code = code.replace("setSelectedStudentIds([]);\n                          }}", "setSelectedStudentIds([]);\n                          setStudentSearchQuery('');\n                          }}");
}

const targetRegex = /<div>\s*<label[^>]*>[^<]*\(حسب الفرع والمنهج\)<\/label>[\s\S]*?<\/div>\s*<\/div>/;

const newStudentsUI = `<div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300">اختر الطلاب (حسب الفرع والمنهج)</label>
                        {selectedCourseId && availableStudents.length > 0 && (
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds(availableStudents.map((s: any) => s.id))}
                              className="text-xs text-violet-600 hover:text-violet-700 font-bold bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded"
                            >
                              تحديد الكل
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds([])}
                              className="text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                            >
                              إلغاء التحديد
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && availableStudents.length > 0 && (
                        <div className="mb-2">
                          <input 
                            type="text" 
                            placeholder="ابحث عن طالب بالاسم أو الإيميل..." 
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                          />
                        </div>
                      )}

                      <div className="w-full max-h-48 overflow-y-auto px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                        {!selectedCourseId ? (
                          <span className="text-slate-400 text-sm">اختر المادة أولاً لعرض الطلاب المتوافقين</span>
                        ) : availableStudents.length === 0 ? (
                          <span className="text-slate-400 text-sm">لا يوجد طلاب متوافقون مع الفرع والمنهج</span>
                        ) : (
                          <div className="space-y-1 flex flex-col items-start gap-1">
                            {availableStudents
                              .filter((s: any) => 
                                !studentSearchQuery || 
                                (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                              )
                              .map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
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
                                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.firstName} {s.lastName} <span className="text-slate-400 font-normal text-xs mr-1">({s.email})</span></span>
                              </label>
                            ))}
                            {availableStudents.filter((s: any) => !studentSearchQuery || (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())).length === 0 && (
                              <span className="text-slate-400 text-sm">لا يوجد نتائج بحث متطابقة.</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && (
                         <div className="mt-2 text-xs font-bold text-slate-500">
                           تم تحديد <span className="text-violet-600">{selectedStudentIds.length}</span> من أصل {availableStudents.length} طلاب مؤهلين
                         </div>
                      )}
                    </div>`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, newStudentsUI);
    fs.writeFileSync(path, code);
    console.log('done');
} else {
    console.log('not found');
}
