const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace('schemas = ["public", "users", "users", "curriculum", "groups", "scheduling", "attendance", "assessments", "chat", "audit", "notifications"]', 'schemas = ["public", "users", "curriculum", "groups", "scheduling", "attendance", "assessments", "chat", "audit", "notifications"]');

fs.writeFileSync('prisma/schema.prisma', code);
