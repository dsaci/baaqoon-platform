const fs = require('fs');
const path = 'packages/backend/src/modules/assessments/application/rapid-generation.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /text: 'سؤال افتراضي رقم ' \+ i \+ ' حول ' \+ lesson.title,/,
    "id: 'dummy-q-' + Date.now() + '-' + i, text: 'سؤال افتراضي رقم ' + i + ' حول ' + lesson.title,"
);

fs.writeFileSync(path, code);
