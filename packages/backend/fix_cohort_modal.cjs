const fs = require('fs');
const path = '../frontend/src/features/teacher/components/CohortRequestModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// Change endpoint
code = code.replace(
  "const res = await api.get('/curriculum/courses');",
  "const res = await api.get('/curriculum/subjects');"
);

// We'll replace the mapping block
const mapRegex = /\{courses\.map\(\(c: any\) => \([\s\S]*?<\/option>\n\s*\)\)\}/;
code = code.replace(
  mapRegex,
  `{courses.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nameAr}</option>
                ))}`
);

fs.writeFileSync(path, code);
