const fs = require('fs');
const path = 'packages/frontend/src/store/useAuthStore.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /status\?: string;/,
    `status?: string;\n  phone?: string;\n  nationality?: string;`
);

fs.writeFileSync(path, code);
