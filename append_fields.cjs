const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

const searchStr = `<div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 md:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> الجنسية</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.nationality || 'غير محدد'}</div>
                </div>`;

const additionalDetails = `<div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 md:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> الجنسية</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.nationality || 'غير محدد'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">تاريخ التسجيل بالمنصة</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white dir-ltr text-right">
                    {selectedUserForView.createdAt ? new Date(selectedUserForView.createdAt).toLocaleString('ar-EG') : '—'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">آخر تسجيل دخول</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white dir-ltr text-right">
                    {selectedUserForView.lastLoginAt ? new Date(selectedUserForView.lastLoginAt).toLocaleString('ar-EG') : 'لم يدخل بعد'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">حالة البريد الإلكتروني</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedUserForView.emailVerified ? 'مؤكد' : 'غير مؤكد'}
                    </div>
                  </div>
                  <span className={\`w-3 h-3 rounded-full \${selectedUserForView.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}\`}></span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">المعرف الفريد (ID)</span>
                  <div className="text-sm font-mono text-slate-500 dir-ltr text-right break-all">
                    {selectedUserForView.id}
                  </div>
                </div>`;

code = code.replace(searchStr, additionalDetails);
fs.writeFileSync(path, code);
