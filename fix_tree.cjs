const fs = require('fs');
const path = 'packages/backend/src/modules/curriculum/presentation/http/subject.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(role === 'teacher' \|\| role === 'subject_supervisor'\) \{[\s\S]*?else return \[\]; \/\/ if teacher has no subject, return empty\s*\}/;

const newCode = `    if (role === 'subject_supervisor') {
      if (supervisedSubjectId) filterId = supervisedSubjectId;
    }
    // Teachers and Admins can see the whole tree`;

if (code.match(regex)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(path, code);
    console.log('Tree bug fixed');
} else {
    console.log('Regex did not match');
}
