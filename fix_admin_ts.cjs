const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const statsRegex = /\{\/\* Stats Grid \*\/\}[\s\S]*?<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">\s*\{stats\.map\(\(stat, idx\) => \{[\s\S]*?\}\)\}\s*<\/div>/;
if (code.match(statsRegex)) {
    code = code.replace(statsRegex, '');
    console.log('Removed orphaned stats JSX');
} else {
    console.log('Orphaned stats JSX not found');
}

const tabTypeRegex = /useState<'hr' \| 'cohorts' \| 'requests'>\('hr'\)/;
if (code.match(tabTypeRegex)) {
    code = code.replace(tabTypeRegex, "useState<'hr' | 'cohorts' | 'requests' | 'activity'>('hr')");
    console.log('Fixed activeTab type');
} else {
    console.log('activeTab type not found');
}

fs.writeFileSync(path, code);
