const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1. Remove the bad first line and replace with correct import
if (lines[0].includes('<EditCohortModal') && lines[0].includes('import React')) {
    lines[0] = "import React, { useState } from 'react';";
}

// 2. Find the correct injection point at the bottom
const lastDivIndex = lines.findLastIndex(l => l.trim() === '</div>');
if (lastDivIndex !== -1) {
    // Check if the modal is already injected nearby to avoid duplicates
    let alreadyInjected = false;
    for (let i = Math.max(0, lastDivIndex - 5); i <= lastDivIndex; i++) {
        if (lines[i].includes('<EditCohortModal isOpen=')) {
            alreadyInjected = true;
            break;
        }
    }
    
    if (!alreadyInjected) {
        lines.splice(lastDivIndex, 0, '      <EditCohortModal isOpen={!!editingCohort} onClose={() => setEditingCohort(null)} cohort={editingCohort} adminData={adminData} />');
    }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed AdminDashboard successfully!');
