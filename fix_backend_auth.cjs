const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/req\.user\.primaryRole !== 'super_admin' && req\.user\.primaryRole !== 'admin'/g, "!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)");

fs.writeFileSync(path, code);
