const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('isAddUserOpen')) {
  // Add Plus icon
  code = code.replace("import { CheckCircle, XCircle, Trash2 } from 'lucide-react';", "import { CheckCircle, XCircle, Trash2, Plus, UserPlus } from 'lucide-react';");
  
  // Add state
  code = code.replace("const [roleFilter, setRoleFilter] = useState('all');", "const [roleFilter, setRoleFilter] = useState('all');\n  const [isAddUserOpen, setIsAddUserOpen] = useState(false);\n  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student' });");

  // Add Mutation
  const addMutation = `
  const addMutation = useMutation({
    mutationFn: async (userData: any) => {
      return api.post('/users/admin/create', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      setIsAddUserOpen(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student' });
    }
  });
  `;
  code = code.replace("const deleteMutation = useMutation({", addMutation + "\n  const deleteMutation = useMutation({");

  // Add button to header
  code = code.replace(
    "{/* Sub-tabs for filtering */}",
    `<div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setIsAddUserOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم جديد
          </button>
        </div>
        {/* Sub-tabs for filtering */}`
  );

  // Add Modal at the end
  const modalCode = `
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black mb-4 dark:text-white">إضافة مستخدم جديد</h2>
            <div className="space-y-4">
              <input type="text" placeholder="الاسم الأول" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
              <input type="text" placeholder="الاسم الأخير" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input type="password" placeholder="كلمة المرور (اختياري، الافتراضي: 123456)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.primaryRole} onChange={e => setNewUser({...newUser, primaryRole: e.target.value})}>
                <option value="student">طالب</option>
                <option value="teacher">معلم</option>
                <option value="subject_supervisor">مشرف مادة</option>
                <option value="admin">مدير</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddUserOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => addMutation.mutate({...newUser, password: newUser.password || '123456'})} disabled={addMutation.isPending} className="flex-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-bold w-2/3">إضافة وتفعيل</button>
            </div>
          </div>
        </div>
      )}
  `;

  code = code.replace("</div>\n    </div>\n  );\n}", modalCode + "\n      </div>\n    </div>\n  );\n}");

  fs.writeFileSync(path, code);
}
