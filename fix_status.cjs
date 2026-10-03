const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `    if (studentIds && studentIds.length > 0) {
      await this.prisma.cohortEnrollment.createMany({
        data: studentIds.map((id: string) => ({
          cohortId: cohort.id,
          studentId: id,
          status: 'active'
        }))
      });
    }`;

const replacement = `    if (studentIds && studentIds.length > 0) {
      await this.prisma.cohortEnrollment.createMany({
        data: studentIds.map((id: string) => ({
          cohortId: cohort.id,
          studentId: id,
          status: 'enrolled'
        }))
      });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log('done');
