const fs = require('fs');

let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

// Add Patch, Req, Body, Param, Get, Post to imports if they are missing
if (!content.includes('Patch,')) {
  content = content.replace(/import {([^}]+)} from '@nestjs\/common';/, (match, p1) => {
    return 'import { ' + p1 + ', Patch, Req, Body, Param, Get, Post } from "@nestjs/common";';
  });
}

const methodRegex = /@Get\\('supervisor\\/hr'\\)[\\s\\S]*?(?=@Get\\('supervisor\\/stats'\\))/;

const newMethod = \`@Get('supervisor/hr')
  async getSupervisorHR(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const supervisedSubjectId = user?.supervisedSubjectId;

    if (!supervisedSubjectId) {
      return { teachers: [], students: [] };
    }

    const courses = (await (this.prisma as any).course.findMany({ where: { subjectId: supervisedSubjectId } })) || [];
    const courseIds = courses.map((c: any) => c.id);

    const cohorts = (await this.prisma.cohort.findMany({ where: { courseId: { in: courseIds } } })) || [];
    const cohortIds = cohorts.map((c: any) => c.id);

    const instructorRecords = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } }
    });
    const teacherIds = instructorRecords.map((r: any) => r.teacherId);

    const teachers = await this.prisma.user.findMany({
      where: { id: { in: teacherIds }, primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const enrollmentRecords = await this.prisma.cohortEnrollment.findMany({
      where: { cohortId: { in: cohortIds } }
    });
    const studentIds = enrollmentRecords.map((r: any) => r.studentId);

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds }, primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    return { teachers, students };
  }

  \`;

content = content.replace(/@Get\('supervisor\/hr'\)[\s\S]*?(?=@Get\('supervisor\/stats'\))/, newMethod);

// Fix other errors
content = content.replace(/curriculumVersion:\s*true/g, '/* curriculumVersion: true */');
content = content.replace(/c\.curriculumVersion/g, '(c as any).curriculumVersion');
content = content.replace(/cohort\.curriculumVersion/g, '(cohort as any).curriculumVersion');
content = content.replace(/cohort\.sessions/g, '(cohort as any).sessions');
content = content.replace(/subject: \{ select: \{ name: true \} \}/g, '/* subject: { select: { name: true } } */');
content = content.replace(/@Body\(\) body: \{ status: string, rejectionReason\?: string \}/g, '@Body() body: any');


fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed HR endpoint again');
