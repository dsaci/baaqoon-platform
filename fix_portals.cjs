const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('createPortal')) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { createPortal } from 'react-dom';");
}

// 1. Add User Modal
const addUserSearch = /\{isAddUserOpen && \(\s*<div className="fixed inset-0/g;
const addUserReplace = `{isAddUserOpen && createPortal(\n        <div className="fixed inset-0`;
code = code.replace(addUserSearch, addUserReplace);

const addUserEndSearch = /<\/div>\s*<\/div>\s*\)\}/g;
// Wait, I need to be careful with the end tag!
// The structure is:
/*
      {isAddUserOpen && (
        <div className="fixed inset-0 ...">
          ...
        </div>
      )}
*/
// It's safer to just replace the closing tag of the condition.
// I can do a manual string replace.
