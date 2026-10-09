const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update imports
if (!code.includes('Database')) {
    code = code.replace(
        "import { Users, BookOpen, CheckCircle, Clock, UserCheck, Plus, X, Eye, Settings, BarChart3 , Edit, Trash2 } from 'lucide-react';",
        "import { Users, BookOpen, CheckCircle, Clock, UserCheck, Plus, X, Eye, Settings, BarChart3, Edit, Trash2, Database, Users2 } from 'lucide-react';"
    );
}

// 2. Replace the stats array definition
const oldStatsDefRegex = /const stats = \[\s*\{ label: 'المشرفون'[\s\S]*?\];/;
const newStatsDef = `const platformButtons = [
    { label: 'إدارة النظام وقاعدة البيانات', desc: 'تسيير المنصة الرئيسية، الأقسام، والمواد', icon: Database, color: 'text-slate-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/admin/database') },
    { label: 'الإسناد الأكاديمي', desc: 'توزيع المهام والمشرفين على المواد الدراسية', icon: Users2, color: 'text-indigo-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/admin/distribution') },
  ];

  const monitoringButtons = [
    { label: 'متابعة المشرفين المنسقين', desc: 'مراقبة أداء وعمل المشرفين (رؤية متطابقة لما يرونه)', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/supervisor/dashboard') },
    { label: 'متابعة الأساتذة', desc: 'مراقبة أداء الأساتذة ومدى تقدم الدروس', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/supervisor/dashboard?tab=teachers') },
    { label: 'متابعة الطلبة وتمدرسهم', desc: 'سجلات الطلبة ومستوى تفاعلهم وانضباطهم', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/supervisor/dashboard?tab=students') },
  ];

  const classButtons = [
    { label: 'تسيير الأفواج التربوية', desc: 'إنشاء الأفواج، تفويج الطلبة، وتوزيع الأساتذة', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('cohorts') },
    { label: 'الحصص المباشرة والنشطة', desc: 'مراقبة الدروس المباشرة ومواعيدها', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-white dark:bg-slate-900', action: () => navigate('/supervisor/schedule') },
  ];`;

code = code.replace(oldStatsDefRegex, newStatsDef);

// 3. Replace the rendering part
const oldRenderRegex = /<div className="grid grid-cols-2 md:grid-cols-5 gap-4">[\s\S]*?<\/div>\s*<\/div>/;
const newRender = `<div className="space-y-8">
        
        {/* 1. تسيير المنصة الرئيسية */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            أزرار تسيير المنصة الرئيسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformButtons.map((btn, i) => (
              <button key={i} onClick={btn.action} className={\`text-right p-5 rounded-2xl border border-slate-200 dark:border-slate-700 \${btn.bg} shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1 flex items-start gap-4\`}>
                <div className={\`p-3 bg-slate-50 dark:bg-slate-800 rounded-xl \${btn.color}\`}>
                  <btn.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{btn.label}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{btn.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. المتابعة (المستخدمين) */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-400" />
            متابعة المستخدمين والرقابة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monitoringButtons.map((btn, i) => (
              <button key={i} onClick={btn.action} className={\`text-right p-5 rounded-2xl border border-slate-200 dark:border-slate-700 \${btn.bg} shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1\`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={\`p-3 bg-slate-50 dark:bg-slate-800 rounded-xl \${btn.color}\`}>
                    <btn.icon className="w-6 h-6" />
                  </div>
                  {btn.value && <span className="text-3xl font-black text-slate-900 dark:text-white">{btn.value}</span>}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{btn.label}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{btn.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. الأفواج والدروس */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
            تسيير الدروس والأفواج
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classButtons.map((btn, i) => (
              <button key={i} onClick={btn.action} className={\`text-right p-5 rounded-2xl border border-slate-200 dark:border-slate-700 \${btn.bg} shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1\`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={\`p-3 bg-slate-50 dark:bg-slate-800 rounded-xl \${btn.color}\`}>
                    <btn.icon className="w-6 h-6" />
                  </div>
                  {btn.value && <span className="text-3xl font-black text-slate-900 dark:text-white">{btn.value}</span>}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{btn.label}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{btn.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>`;

code = code.replace(oldRenderRegex, newRender);

fs.writeFileSync(path, code);
console.log('AdminDashboard layout reorganized successfully!');
