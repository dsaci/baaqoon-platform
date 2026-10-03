const fs = require('fs');
const filePath = 'packages/backend/src/modules/auth/application/auth.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /if \(user\.status === "pending"\) \{[\s\S]*?\}/;
code = code.replace(regex, `if (user.status === "pending") {
      throw new UnauthorizedException("لا بد من تفعيل الحساب من طرف المدير.");
    }`);

fs.writeFileSync(filePath, code);
console.log('Fixed auth service properly!');
