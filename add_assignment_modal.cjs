const fs = require('fs');
const path = 'packages/frontend/src/features/assessments/pages/AssessmentsPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for Manual Assignment Modal
const stateSearch = /const \[isGenerating, setIsGenerating\] = useState\(false\);/;
const stateReplace = `const [isGenerating, setIsGenerating] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({ title: '', cohortId: '', description: '', subject: '' });
  const [isManualCreating, setIsManualCreating] = useState(false);
`;
code = code.replace(stateSearch, stateReplace);

// 2. Add Cohorts to state if not fetched
const hookSearch = /const queryClient = useQueryClient\(\);/;
const hookReplace = `const queryClient = useQueryClient();
  const { data: myCohorts = [] } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me');
      return res.data;
    },
    enabled: isTeacher
  });`;
code = code.replace(hookSearch, hookReplace);

// 3. Add Button "تكليف واجب"
const buttonSearch = /<button \n\s*onClick=\{handleGenerate\}/;
const buttonReplace = `<button 
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 dark:text-emerald-300 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                >
                  <PenTool className="w-5 h-5" />
                  تكليف بواجب
                </button>
                <button 
                  onClick={handleGenerate}`;
code = code.replace(buttonSearch, buttonReplace);

// 4. Add PenTool import
code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, (match, p1) => {
    if (p1.includes('PenTool')) return match;
    return `import { ${p1}, PenTool } from 'lucide-react';`;
});

// 5. Add Modal HTML at the end before closing div
const modalHtml = `

      {/* Manual Assignment Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
              <h2 className="text-xl font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                <PenTool className="w-6 h-6" />
                إضافة واجب / تكليف جديد
              </h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الواجب</label>
                <input 
                  type="text" 
                  value={manualFormData.title}
                  onChange={e => setManualFormData({...manualFormData, title: e.target.value})}
                  placeholder="مثال: حل تمارين الوحدة الثانية"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفوج المستهدف</label>
                <select 
                  value={manualFormData.cohortId}
                  onChange={e => setManualFormData({...manualFormData, cohortId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- اختر الفوج --</option>
                  {myCohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الدرس / الموضوع</label>
                <input 
                  type="text" 
                  value={manualFormData.subject}
                  onChange={e => setManualFormData({...manualFormData, subject: e.target.value})}
                  placeholder="مثال: المعادلات التفاضلية"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تفاصيل وبيانات الواجب</label>
                <textarea 
                  rows={4}
                  value={manualFormData.description}
                  onChange={e => setManualFormData({...manualFormData, description: e.target.value})}
                  placeholder="اكتب تفاصيل الواجب، أرقام الصفحات، أو الأسئلة المطلوبة..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
              >
                إلغاء
              </button>
              <button 
                disabled={isManualCreating || !manualFormData.title || !manualFormData.cohortId}
                onClick={async () => {
                  setIsManualCreating(true);
                  try {
                    await api.post('/assessments', manualFormData);
                    queryClient.invalidateQueries({ queryKey: ['assessments'] });
                    setIsManualModalOpen(false);
                    setManualFormData({ title: '', cohortId: '', description: '', subject: '' });
                  } catch (err) {
                    alert('حدث خطأ أثناء حفظ الواجب');
                  } finally {
                    setIsManualCreating(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isManualCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
                حفظ وإسناد الواجب
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\n  \);\n\}\n$/, `${modalHtml}\n    </div>\n  );\n}\n`);
fs.writeFileSync(path, code);
