const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const newEndpoint = `
  @Get('activity-logs')
  async getActivityLogs(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (role !== 'admin' && role !== 'super_admin' && role !== 'supervisor' && role !== 'subject_supervisor') {
      return [];
    }
    
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, primaryRole: true } }
      }
    });
  }
`;

if (!code.includes('getActivityLogs')) {
    code = code.replace(
        "export class GroupsController {",
        "export class GroupsController {" + newEndpoint
    );
    fs.writeFileSync(path, code);
    console.log('Added activity-logs endpoint');
} else {
    console.log('Already added');
}
