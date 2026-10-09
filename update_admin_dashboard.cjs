const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('useNavigate')) {
    code = code.replace(
        "import { useAuthStore } from '../../../store/useAuthStore';",
        "import { useAuthStore } from '../../../store/useAuthStore';\nimport { useNavigate } from 'react-router-dom';"
    );
}

if (!code.includes('const navigate = useNavigate();')) {
    code = code.replace(
        "const { user } = useAuthStore();",
        "const { user } = useAuthStore();\n  const navigate = useNavigate();"
    );
}

const oldStats = `  const stats = [
    { label: 'المشرفون', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'المعلمون', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
    { label: 'الطلبة', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'الأفواج', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { label: 'الحصص النشطة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];`;

const newStats = `  const stats = [
    { label: 'المشرفون', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => navigate('/supervisor/dashboard') },
    { label: 'المعلمون', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40', action: () => navigate('/supervisor/dashboard?tab=teachers') },
    { label: 'الطلبة', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', action: () => navigate('/supervisor/dashboard?tab=students') },
    { label: 'الأفواج', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', action: () => setActiveTab('cohorts') },
    { label: 'الحصص النشطة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', action: () => navigate('/supervisor/schedule') },
  ];`;

const oldRender = `        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className={\`p-4 rounded-2xl border border-slate-100 dark:border-slate-800 \${stat.bg} shadow-sm relative overflow-hidden group\`}>
              <div className="flex justify-between items-start mb-4">
                <div className={\`p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm \${stat.color}\`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>`;

const newRender = `        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <button 
              key={i} 
              onClick={stat.action}
              className={\`w-full text-right p-4 rounded-2xl border border-slate-100 dark:border-slate-800 \${stat.bg} shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1\`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={\`p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm \${stat.color}\`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>`;

code = code.replace(oldStats, newStats);
code = code.replace(oldRender, newRender);

fs.writeFileSync(path, code);
console.log('AdminDashboard updated');
