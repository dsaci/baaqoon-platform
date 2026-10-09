const fs = require('fs');
const path = 'packages/backend/src/modules/auth/application/auth.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /academicBranch: data\.branch \|\| null,/,
    `academicBranch: data.branch || null,
        nationality: data.nationality || null,`
);

fs.writeFileSync(path, code);
