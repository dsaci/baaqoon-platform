const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const search = `    @Get('admin/password-requests')
    async listPasswordRequests(@Req() req: any) {
      if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
      return this.prisma.$queryRawUnsafe(\`
        SELECT r.id, r.created_at AS "createdAt", u.id AS "userId", u."firstName", u."lastName",
               u.email, u.phone, u."primaryRole"
        FROM users.password_reset_requests r JOIN users.users u ON u.id = r.user_id
        WHERE r.status = 'pending' ORDER BY r.created_at DESC\`);
    }`;

const replace = `    @Get('admin/password-requests')
    async listPasswordRequests(@Req() req: any) {
      if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
      const requests: any[] = await this.prisma.$queryRawUnsafe(\`
        SELECT r.id, r.created_at AS "createdAt", u.id AS "userId", u."firstName", u."lastName",
               u.email, u.phone, u."primaryRole", u."supervisedSubjectId"
        FROM users.password_reset_requests r JOIN users.users u ON u.id = r.user_id
        WHERE r.status = 'pending' ORDER BY r.created_at DESC\`);

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

        return requests.filter(r => 
          (r.primaryRole === 'teacher' && r.supervisedSubjectId === subjectId) ||
          (r.primaryRole === 'student' && studentIds.includes(r.userId))
        );
      }
      
      return requests;
    }`;

code = code.replace(search, replace);
fs.writeFileSync(path, code);
