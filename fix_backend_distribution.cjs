const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

// The block to replace:
const oldEndpointRegex = /@Get\('admin\/distribution'\)[\s\S]*?(?=@Patch\('admin\/distribution\/:subjectId\/supervisor\/:userId'\))/;

const newEndpoint = `@Get('admin/distribution')
  async getAdminDistribution() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        supervisors: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    const courses = await this.prisma.course.findMany({
      select: { id: true, subjectId: true }
    });

    const cohorts = await this.prisma.cohort.findMany({
      where: { status: { not: 'archived' } },
      select: { id: true, courseId: true }
    });

    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohorts.map(c => c.id) } },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    const formattedSubjects = subjects.map(subject => {
      const subjectCourses = courses.filter(c => c.subjectId === subject.id).map(c => c.id);
      const subjectCohorts = cohorts.filter(c => subjectCourses.includes(c.courseId)).map(c => c.id);
      
      const teachersMap = new Map();
      instructors.filter(inst => subjectCohorts.includes(inst.cohortId)).forEach(inst => {
        if (inst.teacher) teachersMap.set(inst.teacher.id, inst.teacher);
      });

      return {
        ...subject,
        teachers: Array.from(teachersMap.values())
      };
    });

    const supervisors = await this.prisma.user.findMany({
      where: { primaryRole: 'subject_supervisor' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    return { subjects: formattedSubjects, supervisors };
  }

  `;

if (code.match(oldEndpointRegex)) {
    code = code.replace(oldEndpointRegex, newEndpoint);
    fs.writeFileSync(path, code);
    console.log('Backend endpoints fixed');
} else {
    console.log('Regex did not match');
}
