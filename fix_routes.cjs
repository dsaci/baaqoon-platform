const fs = require('fs');
const path = 'packages/frontend/src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /href: '\/supervisor\/distribution'/g,
    "href: '/supervisor/coming-soon-distribution'"
);
code = code.replace(
    /href: '\/teacher\/distribution'/g,
    "href: '/teacher/coming-soon-distribution'"
);

fs.writeFileSync(path, code);
