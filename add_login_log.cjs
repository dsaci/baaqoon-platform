const fs = require('fs');
const path = 'packages/backend/src/modules/auth/application/auth.service.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /return \{\s*accessToken: this\.jwtService\.sign\(payload\),/;
const replacement = `    // Log Activity
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          details: 'تم تسجيل الدخول بنجاح',
        }
      });
    } catch(err) {
      console.error('Failed to log activity', err);
    }

    return {
      accessToken: this.jwtService.sign(payload),`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('Login activity logged');
} else {
    console.log('Not found');
}
