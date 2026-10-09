const fs = require('fs');
const path = 'packages/frontend/src/features/scheduling/pages/VirtualClassroom.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /\{user\?\.primaryRole === 'teacher' && \(\s*<button/g,
    `{user?.primaryRole === 'teacher' && (\n                <>\n                <button`
);

code = code.replace(
    /<\/button>\s*\)\}/g,
    `</button>\n                </>\n              )}`
);

fs.writeFileSync(path, code);
