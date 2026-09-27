const fs = require('fs');
let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

// The relation curriculumVersion does not exist, so remove it from include block.
// Instead, just don't include it.
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
        sessions: true
      }`;
const replacement = `      /* include removed because of missing Prisma relations */`;
content = content.replace(search, replacement);

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed curriculumVersion multiline');
