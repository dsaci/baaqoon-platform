const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add the query for password requests
const querySearch = /const \{ data: pendingRequests = \[\] \} = useQuery\(\{/;
const queryReplace = `const { data: passwordRequests = [] } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data || [];
    }
  });

  const { data: pendingRequests = [] } = useQuery({`;
code = code.replace(querySearch, queryReplace);

// 2. Update the tabs badge
const tabsSearch = /const tabs = \[\s*\{ id: 'hr' as const, label: 'الموارد البشرية', badge: pendingUsers\.length > 0 \? pendingUsers\.length : undefined \},/s;
const tabsReplace = `const tabs = [
    { id: 'hr' as const, label: 'الموارد البشرية', badge: (pendingUsers.length + passwordRequests.length) > 0 ? (pendingUsers.length + passwordRequests.length) : undefined },`;
code = code.replace(tabsSearch, tabsReplace);

// 3. Add a notification banner if there are password requests
const headerSearch = /<div>\s*<h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">/s;
const headerReplace = `<div>
          {passwordRequests.length > 0 && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative flex items-center gap-3 animate-pulse">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-bold">يوجد لديك ({passwordRequests.length}) طلبات جديدة لاستعادة كلمات المرور! اذهب إلى قسم الموارد البشرية لمعالجتها.</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">`;
code = code.replace(headerSearch, headerReplace);

fs.writeFileSync(path, code);
