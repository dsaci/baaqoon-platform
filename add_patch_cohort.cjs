const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const patchEndpoint = `
  @Patch('cohorts/:id')
  async updateCohort(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const { name, code, teacherId, studentIds } = body;

    const cohort = await this.prisma.cohort.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
      }
    });

    if (teacherId) {
      await this.prisma.cohortInstructor.deleteMany({ where: { cohortId: id } });
      await this.prisma.cohortInstructor.create({
        data: {
          cohortId: id,
          teacherId,
          role: 'primary_teacher'
        }
      });
    }

    if (studentIds && Array.isArray(studentIds)) {
      await this.prisma.cohortEnrollment.deleteMany({ where: { cohortId: id } });
      if (studentIds.length > 0) {
        await this.prisma.cohortEnrollment.createMany({
          data: studentIds.map((studentId: string) => ({
            cohortId: id,
            studentId,
            status: 'enrolled'
          }))
        });
      }
    }

    return cohort;
  }
`;

if (!code.includes("@Patch('cohorts/:id')")) {
  code = code.replace("@Delete('cohorts/:id')", patchEndpoint + "\n  @Delete('cohorts/:id')");
  fs.writeFileSync(path, code);
  console.log('done');
} else {
  console.log('already exists');
}
