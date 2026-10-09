const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix monitoring buttons
const monitoringSearch = /const monitoringButtons = \[\s*\{ label: 'متابعة المشرفين المنسقين'.*?action: \(\) => navigate\('\/supervisor\/dashboard'\) \},\s*\{ label: 'مراقبة المعلمين'.*?action: \(\) => navigate\('\/supervisor\/dashboard\?tab=teachers'\) \},\s*\{ label: 'متابعة أداء الطلبة'.*?action: \(\) => navigate\('\/supervisor\/dashboard\?tab=students'\) \},\s*\];/s;

const monitoringReplace = `const monitoringButtons = [
    { label: 'متابعة المشرفين المنسقين', desc: 'متابعة عمل المشرفين وتعيين المواد لهم', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('hr') },
    { label: 'مراقبة المعلمين', desc: 'إدارة المعلمين وتفاصيلهم وحساباتهم', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('hr') },
    { label: 'متابعة أداء الطلبة', desc: 'إدارة الطلبة وحساباتهم', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('hr') },
  ];`;
code = code.replace(monitoringSearch, monitoringReplace);

// Fix class buttons
const classSearch = /const classButtons = \[\s*\{ label: 'إدارة الأفواج والمجموعات'.*?action: \(\) => setActiveTab\('cohorts'\) \},\s*\{ label: 'رصد الحصص المجدولة'.*?action: \(\) => navigate\('\/supervisor\/schedule'\) \},\s*\];/s;

const classReplace = `const classButtons = [
    { label: 'إدارة الأفواج والمجموعات', desc: 'مراقبة الأفواج التي أنشأها المشرفون', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-fuchsia-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('cohorts') },
    { label: 'رصد الحصص المجدولة', desc: 'مراقبة الحصص المجدولة في النظام', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-white dark:bg-slate-900', action: () => setActiveTab('cohorts') },
  ];`;
code = code.replace(classSearch, classReplace);

fs.writeFileSync(path, code);
