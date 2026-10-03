const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("label: 'المشرفون'")) {
    const oldStats = "const stats = [\n      { label: 'المعلمون', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },\n      { label: 'الطلاب', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },\n      { label: 'الأفواج النشطة', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },\n      { label: 'الحصص المجدولة', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }\n    ];";
    
    const newStats = "const stats = [\n      { label: 'المشرفون', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/40' },\n      { label: 'المعلمون', value: isLoading ? '...' : adminStats?.stats?.teachers?.toString() || '0', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },\n      { label: 'الطلاب', value: isLoading ? '...' : adminStats?.stats?.students?.toString() || '0', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },\n      { label: 'الأفواج', value: isLoading ? '...' : adminStats?.stats?.cohorts?.toString() || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },\n      { label: 'الحصص', value: isLoading ? '...' : adminStats?.stats?.activeSessions?.toString() || '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }\n    ];";
    
    // In case grid needs to be updated for 5 items instead of 4
    const oldGrid = "className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6\"";
    const newGrid = "className=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6\"";

    if (code.includes("label: 'المعلمون'")) {
        code = code.replace(oldStats, newStats);
        code = code.replace(oldGrid, newGrid);
        fs.writeFileSync(path, code);
        console.log('Frontend updated with supervisors stat');
    } else {
        console.log('Could not find stats array');
    }
}
