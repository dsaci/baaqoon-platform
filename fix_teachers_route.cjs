const fs = require('fs');
const path = 'packages/frontend/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const search = '<Route\n          path="teachers"\n          element={<PlaceholderPage title="قريباً" />}\n        />';
const replace = '<Route path="teachers" element={<Navigate to="/supervisor/dashboard?tab=teachers" replace />} />';

code = code.replace(search, replace);
fs.writeFileSync(path, code);
