const fs = require('fs');
let code = fs.readFileSync('packages/backend/src/modules/auth/application/auth.service.ts', 'utf8');
code = code.replace(/throw new UnauthorizedException\(.*?pending.*?/, 'throw new UnauthorizedException(\"لا بد من تفعيل الحساب من طرف المدير.\");');
fs.writeFileSync('packages/backend/src/modules/auth/application/auth.service.ts', code);
console.log('Fixed auth service');
