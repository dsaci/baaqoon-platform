const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const search = `    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }
    
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },`;

const replace = `    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }
    
    let whereClause = {};
    if (req.user.primaryRole === 'subject_supervisor') {
      const supervisor = await this.prisma.user.findUnique({ where: { id: req.user.id } });
      const subjectId = supervisor?.supervisedSubjectId;
      if (!subjectId) return [];

      const courses = await this.prisma.course.findMany({ where: { subjectId }, select: { id: true } });
      const courseIds = courses.map(c => c.id);
      
      const cohorts = await this.prisma.cohort.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } });
      const cohortIds = cohorts.map(c => c.id);
      
      const enrollments = await this.prisma.cohortEnrollment.findMany({ where: { cohortId: { in: cohortIds } }, select: { studentId: true } });
      const studentIds = enrollments.map(e => e.studentId);

      whereClause = {
        OR: [
          { primaryRole: 'teacher', supervisedSubjectId: subjectId },
          { primaryRole: 'student', id: { in: studentIds } }
        ]
      };
    }
    
    return this.prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },`;

code = code.replace(search, replace);

fs.writeFileSync(path, code);
