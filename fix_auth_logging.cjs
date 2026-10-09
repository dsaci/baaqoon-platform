const fs = require('fs');
const path = 'packages/backend/src/modules/auth/application/auth.service.ts';
let code = fs.readFileSync(path, 'utf8');

const search = `      const isPasswordValid = await bcrypt.compare(
        userOrData.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        );
      }`;

const replace = `      const isPasswordValid = await bcrypt.compare(
        userOrData.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        try {
          await this.prisma.activityLog.create({
            data: {
              userId: user.id,
              action: 'failed_login',
              details: 'محاولة تسجيل دخول فاشلة: كلمة المرور خاطئة',
            }
          });
        } catch(e) {}
        throw new UnauthorizedException(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        );
      }`;

code = code.replace(search, replace);

const pendingSearch = `    if (user.status === "pending") {
      throw new UnauthorizedException("لا بد من تفعيل الحساب من طرف المدير.");
    }`;

const pendingReplace = `    if (user.status === "pending") {
      try {
        await this.prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'failed_login',
            details: 'محاولة تسجيل دخول فاشلة: الحساب قيد المراجعة',
          }
        });
      } catch(e) {}
      throw new UnauthorizedException("لا بد من تفعيل الحساب من طرف المدير.");
    }`;

code = code.replace(pendingSearch, pendingReplace);

fs.writeFileSync(path, code);
