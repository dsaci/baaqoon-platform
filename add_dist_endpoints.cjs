const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const newEndpoint = `
  @Get('admin/distribution')
  async getAdminDistribution() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        supervisors: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        courses: {
          include: {
            cohorts: {
              where: { status: { not: 'archived' } },
              include: {
                instructors: {
                  include: {
                    teacher: { select: { id: true, firstName: true, lastName: true, email: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Flatten teachers per subject for convenience
    const formattedSubjects = subjects.map(subject => {
      const teachersMap = new Map();
      subject.courses.forEach(course => {
        course.cohorts.forEach(cohort => {
          cohort.instructors.forEach(instructor => {
             if (instructor.teacher) {
               teachersMap.set(instructor.teacher.id, instructor.teacher);
             }
          });
        });
      });
      return {
        ...subject,
        courses: undefined, // remove raw courses to save bandwidth
        teachers: Array.from(teachersMap.values())
      };
    });

    const supervisors = await this.prisma.user.findMany({
      where: { primaryRole: 'subject_supervisor' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    return { subjects: formattedSubjects, supervisors };
  }

  @Patch('admin/distribution/:subjectId/supervisor/:userId')
  async assignSupervisor(@Req() req: any, @Param('subjectId') subjectId: string, @Param('userId') userId: string) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    if (userId === 'none') {
      // Unassign all supervisors from this subject
      await this.prisma.user.updateMany({
        where: { supervisedSubjectId: subjectId, primaryRole: 'subject_supervisor' },
        data: { supervisedSubjectId: null }
      });
      return { success: true };
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { supervisedSubjectId: subjectId }
      });
      return { success: true };
    }
  }
`;

if (!code.includes('admin/distribution')) {
    code = code.replace(/export class GroupsController \{/, 'export class GroupsController {\n' + newEndpoint);
    fs.writeFileSync(path, code);
    console.log('Endpoints added');
} else {
    console.log('Already added');
}
