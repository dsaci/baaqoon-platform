const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('isResetPasswordOpen')) {
  // Add Key icon
  code = code.replace("Trash2 , UserPlus } from 'lucide-react';", "Trash2 , UserPlus, Key } from 'lucide-react';");
  
  // Add state
  code = code.replace("const [isAddUserOpen, setIsAddUserOpen] = useState(false);", "const [isAddUserOpen, setIsAddUserOpen] = useState(false);\n  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);\n  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);\n  const [newPassword, setNewPassword] = useState('');");

  // Add Mutation
  const resetMutation = `
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return api.patch(\`/users/admin/\${id}/password\`, { password });
    },
    onSuccess: () => {
      alert('تم تغيير كلمة المرور بنجاح');
      setIsResetPasswordOpen(false);
      setNewPassword('');
    }
  });
  `;
  code = code.replace("const deleteMutation = useMutation({", resetMutation + "\n  const deleteMutation = useMutation({");

  // Add Reset button next to Delete button
  const deleteBtnMatch = `<button onClick={() => { if(window.confirm('هل أنت متأكد؟')) deleteMutation.mutate(user.id); }} className="text-red-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50" title="حذف المستخدم">
                        <Trash2 className="w-4 h-4" />
                      </button>`;
  
  const newButtons = `<button onClick={() => { setSelectedUserForReset(user); setIsResetPasswordOpen(true); }} className="text-amber-500 hover:text-amber-600 transition-colors p-2 rounded-full hover:bg-amber-50" title="تغيير كلمة المرور">
                        <Key className="w-4 h-4" />
                      </button>
                      ` + deleteBtnMatch;

  code = code.replace(deleteBtnMatch, newButtons);

  // Add Reset Modal at the end
  const resetModalCode = `
      {isResetPasswordOpen && selectedUserForReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black mb-4 dark:text-white">تغيير كلمة المرور</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">للمستخدم: {selectedUserForReset.firstName} {selectedUserForReset.lastName}</p>
            <div className="space-y-4">
              <input type="password" placeholder="كلمة المرور الجديدة" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsResetPasswordOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => resetPasswordMutation.mutate({ id: selectedUserForReset.id, password: newPassword })} disabled={resetPasswordMutation.isPending || !newPassword} className="flex-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold w-2/3">حفظ الكلمة الجديدة</button>
            </div>
          </div>
        </div>
      )}
  `;

  code = code.replace("</div>\n    </div>\n  );\n}", resetModalCode + "\n      </div>\n    </div>\n  );\n}");

  fs.writeFileSync(path, code);
  console.log("SUCCESS");
} else {
  console.log("ALREADY APPLIED");
}
