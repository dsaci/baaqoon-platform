const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add states for View Details Modal
code = code.replace(
    /const \[selectedUserForReset, setSelectedUserForReset\] = useState<any \| null>\(null\);/,
    `const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [selectedUserForView, setSelectedUserForView] = useState<any | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);`
);

// 2. Add 'Eye' import if not present
if (!code.includes('Eye,')) {
    code = code.replace(
        /import \{ (.*?) \} from 'lucide-react';/,
        `import { $1, Eye, BookOpen, MapPin, GraduationCap } from 'lucide-react';`
    );
}

// 3. Add the 'View Details' button in the Actions column
const actionsButtonSearch = /<button[\s\S]*?onClick=\{\(\) => \{ setSelectedUserForReset\(u\); setIsResetPasswordOpen\(true\); \}\}/;
const actionsButtonReplace = `<button
                        onClick={() => { setSelectedUserForView(u); setIsViewDetailsOpen(true); }}
                        title="عرض كل التفاصيل"
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors ml-1"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setSelectedUserForReset(u); setIsResetPasswordOpen(true); }}`;
code = code.replace(actionsButtonSearch, actionsButtonReplace);

// 4. Add the View Details Modal JSX at the end
const viewDetailsModalJSX = `
      {isViewDetailsOpen && selectedUserForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                تفاصيل حساب المستخدم
              </h2>
              <button onClick={() => setIsViewDetailsOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">الاسم الأول</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.firstName}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">اسم العائلة</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.lastName}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">البريد الإلكتروني</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">{selectedUserForView.email || '—'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">رقم الهاتف</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono" dir="ltr">{selectedUserForView.phone || '—'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">الدور وصلاحيات الحساب</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedUserForView.primaryRole === 'student' ? 'طالب' : 
                       selectedUserForView.primaryRole === 'teacher' ? 'أستاذ' : 
                       selectedUserForView.primaryRole === 'subject_supervisor' ? 'مشرف منسق' : 'مدير'}
                    </div>
                  </div>
                  {getRoleBadge(selectedUserForView.primaryRole)}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">حالة الحساب</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedUserForView.status === 'active' ? 'نشط' : selectedUserForView.status === 'pending' ? 'بانتظار التفعيل' : 'مجمد'}
                    </div>
                  </div>
                  <span className={\`w-3 h-3 rounded-full \${selectedUserForView.status === 'active' ? 'bg-emerald-500' : selectedUserForView.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}\`}></span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 md:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> الجنسية</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.nationality || 'غير محدد'}</div>
                </div>

                {selectedUserForView.primaryRole === 'student' && (
                  <>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> الفرع الأكاديمي</span>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {selectedUserForView.academicBranch === 'scientific' ? 'علمي' :
                         selectedUserForView.academicBranch === 'literary' ? 'أدبي' :
                         selectedUserForView.academicBranch === 'industrial' ? 'صناعي' :
                         selectedUserForView.academicBranch === 'entrepreneurship' ? 'ريادة وأعمال' :
                         selectedUserForView.academicBranch === 'sharia' ? 'شرعي' : selectedUserForView.academicBranch || 'غير محدد'}
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><BookOpen className="w-4 h-4" /> المنهج</span>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {selectedUserForView.curriculumType === 'governmental' ? 'حكومي' :
                         selectedUserForView.curriculumType === 'azhari' ? 'أزهري' : selectedUserForView.curriculumType || 'غير محدد'}
                      </div>
                    </div>
                  </>
                )}

                {(selectedUserForView.primaryRole === 'teacher' || selectedUserForView.primaryRole === 'subject_supervisor') && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50 md:col-span-2">
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> {selectedUserForView.primaryRole === 'teacher' ? 'مادة التدريس' : 'مادة التنسيق والإشراف'}
                    </span>
                    <div className="text-lg font-black text-purple-900 dark:text-purple-200">
                      {subjects.find((s:any) => s.id === selectedUserForView.supervisedSubjectId)?.nameAr || 'غير محدد (ربما يدرس أكثر من مادة أو يحتاج إسناد)'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <button onClick={() => setIsViewDetailsOpen(false)} className="w-full px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(
    /\{isPasswordRequestsOpen && \(/,
    viewDetailsModalJSX + '\n\n      {isPasswordRequestsOpen && ('
);

fs.writeFileSync(path, code);
