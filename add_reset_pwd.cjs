const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const resetPasswordEndpoint = `
  @Patch('admin/:id/password')
  async resetPassword(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') throw new UnauthorizedException();
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(body.password, 12);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }
`;

if (!code.includes('resetPassword')) {
  code = code.replace("export class UsersController {", "export class UsersController {\n" + resetPasswordEndpoint);
  fs.writeFileSync(path, code);
  console.log("Added resetPassword endpoint");
}
