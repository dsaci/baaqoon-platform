const fs = require('fs');
const path = 'packages/frontend/src/components/layout/DashboardLayout.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');
const index = lines.findIndex(l => l.includes('coming-soon-distribution'));
if (index !== -1) {
    lines[index] = '    { name: "التفويج والإسناد", path: `/${basePath}/dashboard`, icon: Calendar },';
    fs.writeFileSync(path, lines.join('\n'));
    console.log('replaced');
}
