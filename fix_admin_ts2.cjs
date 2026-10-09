const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const tabTypeRegex = /useState<'cohorts' \| 'hr' \| 'requests'>\(tabParam \|\| 'hr'\)/;
if (code.match(tabTypeRegex)) {
    code = code.replace(tabTypeRegex, "useState<'cohorts' | 'hr' | 'requests' | 'activity'>(tabParam as any || 'hr')");
    fs.writeFileSync(path, code);
    console.log('Fixed activeTab type');
}
