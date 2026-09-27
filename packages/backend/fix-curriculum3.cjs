const fs = require('fs');
const lines = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8').split('\n');

const newLines = [];
let i = 0;
while (i < lines.length) {
  if (lines[i].includes('curriculumVersion: {') && lines[i-1].includes('include: {') && lines[i-2].includes('where: { id },')) {
    // skip until closing brace of include
    while (!lines[i].includes('      }')) {
      i++;
    }
    // skip the closing brace of include
    i++;
  } else {
    newLines.push(lines[i]);
    i++;
  }
}

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', newLines.join('\n'));
console.log('Removed curriculumVersion from include');
