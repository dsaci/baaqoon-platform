const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /const stats = \[\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},?\s*\];/;
const match = code.match(regex);
if (match) {
    const existing = match[0];
    const newStat = "{ label: 'المشرفون', value: isLoading ? '...' : adminStats?.stats?.supervisors?.toString() || '0', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }";
    const newArray = existing.replace('const stats = [', 'const stats = [\n    ' + newStat + ',');
    code = code.replace(existing, newArray);
    
    // update grid cols
    code = code.replace('grid-cols-1 md:grid-cols-2 lg:grid-cols-4', 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5');
    
    fs.writeFileSync(path, code);
    console.log('Stats updated');
} else {
    console.log('Regex did not match');
}
