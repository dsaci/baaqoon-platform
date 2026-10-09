const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Bell to lucide-react import
if (!code.includes('Bell')) {
    code = code.replace(
        /import \{ CheckCircle, XCircle, Users, User, Shield, ShieldAlert, GraduationCap, Trash2 , UserPlus, Key \} from 'lucide-react';/,
        "import { CheckCircle, XCircle, Users, User, Shield, ShieldAlert, GraduationCap, Trash2 , UserPlus, Key, Bell } from 'lucide-react';"
    );
}

// 2. Add query
if (!code.includes('admin_password_requests')) {
    code = code.replace(
        /const \{ data: users = \[\], isLoading \} = useQuery/,
        `const { data: passwordRequests = [] } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data;
    },
    refetchInterval: 10000 // Poll every 10 seconds for notifications
  });

  const { data: users = [], isLoading } = useQuery`
    );
}

// 3. Update button UI
const oldButton = /<button onClick=\{\(\) => setIsPasswordRequestsOpen\(true\)\} className="px-5 py-2\.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all\">\s*<Key className="w-5 h-5" \/> [\s\S]*?<\/button>/;

const newButton = `<button onClick={() => setIsPasswordRequestsOpen(true)} className="relative px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
            <Key className="w-5 h-5" /> طلبات كلمات المرور
            {passwordRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-xs text-white font-black shadow-lg ring-2 ring-white dark:ring-slate-900 border-2 border-red-200">
                  {passwordRequests.length}
                </span>
                <Bell className="absolute -top-4 -right-1 w-4 h-4 text-red-500 animate-bounce drop-shadow-md" />
              </span>
            )}
          </button>`;

if (code.match(oldButton)) {
    code = code.replace(oldButton, newButton);
    fs.writeFileSync(path, code);
    console.log('Button updated with notification bell');
} else {
    console.log('Regex failed');
}
