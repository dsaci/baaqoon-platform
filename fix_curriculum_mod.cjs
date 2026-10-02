const fs = require('fs');
let code = fs.readFileSync('packages/backend/src/modules/curriculum/curriculum.module.ts', 'utf8');

code = code.replace('import { SubjectController } from "./presentation/http/subject.controller";', 'import { SubjectController } from "./presentation/http/subject.controller";\nimport { CourseController } from "./presentation/http/course.controller";');
code = code.replace('controllers: [SubjectController],', 'controllers: [SubjectController, CourseController],');

fs.writeFileSync('packages/backend/src/modules/curriculum/curriculum.module.ts', code);
