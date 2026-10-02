const fs = require('fs');
const path = '../frontend/src/features/teacher/components/CohortRequestModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '{c.subject.name} - {c.grade}',
  '{c.subject.nameAr || c.title} - {c.gradeLevel || c.grade}'
);

fs.writeFileSync(path, code);
