import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersFacade } from "../../users/users.facade";
import { PrismaService } from "../../../core/database/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private usersFacade: UsersFacade,
    private jwtService: JwtService,
    private prisma: PrismaService, // Used only for registration creation
  ) {}

  async requestPasswordReset(data: any) {
    const identifier = (data?.identifier || '').trim();
    const newPassword = data?.newPassword || '';
    if (!identifier || newPassword.length < 6) {
      throw new ConflictException("أدخل البريد أو الهاتف وكلمة مرور جديدة (6 أحرف على الأقل)");
    }
    const user = await this.usersFacade.getUserByIdentifier(identifier);
    if (!user) {
      throw new ConflictException("لا يوجد حساب بهذا البريد أو رقم الهاتف");
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$executeRawUnsafe(
      `UPDATE users.password_reset_requests SET status='cancelled', resolved_at=now() WHERE user_id=$1::uuid AND status='pending'`,
      user.id,
    );
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO users.password_reset_requests (user_id, new_password_hash) VALUES ($1::uuid, $2)`,
      user.id,
      hash,
    );
    return { message: "تم إرسال طلب تغيير كلمة المرور إلى المدير. ستتمكن من الدخول بالكلمة الجديدة بعد موافقته." };
  }

  async register(data: any) {
    if (!data.recaptchaToken) {
      throw new UnauthorizedException("إثبات أنك لست روبوت مطلوب (reCAPTCHA)");
    }

    if (!data.email && !data.phone) {
      throw new ConflictException("يجب إدخال البريد الإلكتروني أو رقم الهاتف");
    }

    if (data.email) {
      const existingEmail = await this.usersFacade.getUserByIdentifier(
        data.email,
      );
      if (existingEmail) {
        throw new ConflictException("البريد الإلكتروني مستخدم مسبقاً");
      }
    }

    if (data.phone) {
      const existingPhone = await this.usersFacade.getUserByIdentifier(
        data.phone,
      );
      if (existingPhone) {
        throw new ConflictException("رقم الهاتف مستخدم مسبقاً");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Teachers are PENDING by default (require admin approval). Students are ACTIVE.
    const accountStatus = "pending";

    const newUser = await this.prisma.user.create({
      data: {
        email: data.email || null,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        primaryRole: data.primaryRole,
        status: accountStatus,
        phone: data.phone || null,
        academicBranch: data.branch || null,
        curriculumType: data.curriculumType || null,
        supervisedSubjectId: data.supervisedSubjectId || null,
        roles: {
          create: {
            role: data.primaryRole,
          },
        },
      },
    });

    return { message: 'تم التسجيل بنجاح. حسابك الآن قيد المراجعة من قبل الإدارة.' };
  }

  async login(userOrData: any) {
    let user;

    const identifier = userOrData.email || userOrData.phone;
    if (identifier && userOrData.password) {
      user = await this.usersFacade.getUserByIdentifier(identifier);
      if (!user) {
        throw new UnauthorizedException(
          "البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة",
        );
      }

      const isPasswordValid = await bcrypt.compare(
        userOrData.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        );
      }
    } else {
      user = userOrData;
    }

    if (user.status === "pending") {
      throw new UnauthorizedException("لا بد من تفعيل الحساب من طرف المدير.");
    }
    if (user.status !== "active") {
      throw new UnauthorizedException("هذا الحساب غير مفعل أو تم إيقافه");
    }

    const roles = user.roles?.map((r: any) => r.role) || [user.primaryRole];

    const payload = {
      sub: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: roles,
    };

        // Log Activity
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
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        status: user.status,
      },
    };
  }
}
