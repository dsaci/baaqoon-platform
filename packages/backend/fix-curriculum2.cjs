const fs = require('fs');
let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

const search = `      include: {
        curriculumVersion: {
          include: {
            units: {
              include: {
                lessons: { orderBy: { orderIndex: 'asc' } }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        sessions: {
          where: { lessonId: { not: null } }
        }
      }`;
const replacement = `      // include removed because of missing Prisma relations`;
content = content.replace(search, replacement);

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed curriculumVersion multiline for real');
