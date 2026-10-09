const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/PasswordRequestsModal.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('createPortal')) {
  code = code.replace("import React from 'react';", "import React from 'react';\nimport { createPortal } from 'react-dom';");
  code = code.replace("return (", "return createPortal(");
  // Find the last ");" before "}"
  const lines = code.split('\n');
  const returnIdx = lines.findLastIndex(l => l.trim() === ');');
  if (returnIdx !== -1) {
    lines[returnIdx] = lines[returnIdx].replace(");", ", document.body);");
  }
  code = lines.join('\n');
  fs.writeFileSync(path, code);
}
