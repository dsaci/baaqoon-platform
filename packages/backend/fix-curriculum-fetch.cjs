const fs = require('fs');
let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

const search = `    if (!cohort || !(cohort as any).curriculumVersion) return { units: [] };`;
const replacement = `    
    const curriculumVersion = await (this.prisma as any).curriculumVersion.findUnique({
      where: { id: cohort?.curriculumVersionId },
      include: {
        units: { include: { lessons: { orderBy: { orderIndex: 'asc' } } }, orderBy: { orderIndex: 'asc' } }
      }
    });
    
    const sessions = await this.prisma.session.findMany({
      where: { cohortId: id, lessonId: { not: null } }
    });

    if (cohort) {
      (cohort as any).curriculumVersion = curriculumVersion;
      (cohort as any).sessions = sessions;
    }

    if (!cohort || !(cohort as any).curriculumVersion) return { units: [] };`;

content = content.replace(search, replacement);

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Injected manual fetch for getCohortProgress');
