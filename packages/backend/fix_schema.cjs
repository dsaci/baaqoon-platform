const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(/@@schema\("auth"\)/g, '@@schema("users")');

// Replace "auth" in the schemas array with "users"
code = code.replace(/schemas\s*=\s*\[(.*?)\]/, (match, p1) => {
  return `schemas = [${p1.replace(/"auth"/g, '"users"')}]`;
});

fs.writeFileSync('prisma/schema.prisma', code);
