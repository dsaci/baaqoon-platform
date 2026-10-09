const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add subjects query
if (!code.includes('admin_subjects_list')) {
    code = code.replace(
        /const \{ data: users = \[\], isLoading \} = useQuery\(\{/,
        `const { data: subjects = [] } = useQuery({
    queryKey: ['admin_subjects_list'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data;
    }
  });

  const { data: users = [], isLoading } = useQuery({`
    );
}

// 2. Add extra fields to initial newUser state
code = code.replace(
    /const \[newUser, setNewUser\] = useState\(\{ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student' \}\);/g,
    `const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', supervisedSubjectId: '' });`
);

code = code.replace(
    /setNewUser\(\{ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student' \}\);/g,
    `setNewUser({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', supervisedSubjectId: '' });`
);

// 3. Update the Add User modal UI
const oldModalContent = /<select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value=\{newUser\.primaryRole\} onChange=\{e => setNewUser\(\{\.\.\.newUser, primaryRole: e\.target\.value\}\)\}>[\s\S]*?<\/select>/;

const newModalContent = `<select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.primaryRole} onChange={e => setNewUser({...newUser, primaryRole: e.target.value})}>
                <option value="student">طالب</option>
                <option value="teacher">أستاذ</option>
                <option value="subject_supervisor">مشرف منسق</option>
                <option value="admin">مدير (Admin)</option>
              </select>

              {newUser.primaryRole === 'student' && (
                <div className="flex gap-3 animate-fade-in-up">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">الفرع الأكاديمي</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.academicBranch} onChange={e => setNewUser({...newUser, academicBranch: e.target.value})}>
                      <option value="scientific">علمي</option>
                      <option value="literary">أدبي</option>
                      <option value="entrepreneurship">ريادة وأعمال</option>
                      <option value="industrial">صناعي</option>
                      <option value="sharia">شرعي</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">المنهج</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.curriculumType} onChange={e => setNewUser({...newUser, curriculumType: e.target.value})}>
                      <option value="governmental">حكومي</option>
                      <option value="azhari">أزهري</option>
                    </select>
                  </div>
                </div>
              )}

              {(newUser.primaryRole === 'teacher' || newUser.primaryRole === 'subject_supervisor') && (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {newUser.primaryRole === 'teacher' ? 'مادة التخصص للأستاذ' : 'مادة التنسيق والمتابعة للمشرف'}
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.supervisedSubjectId} onChange={e => setNewUser({...newUser, supervisedSubjectId: e.target.value})}>
                    <option value="">-- اختر المادة --</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}`;

code = code.replace(oldModalContent, newModalContent);

fs.writeFileSync(path, code);
console.log('User creation modal updated');
