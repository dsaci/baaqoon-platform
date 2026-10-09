const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /useState<'stats' \| 'teachers' \| 'students' \| 'activity'>\(initialTab as any\);/,
  `useState<'stats' | 'teachers' | 'students' | 'activity' | 'cohorts'>(initialTab as any);`
);

fs.writeFileSync(path, code);
