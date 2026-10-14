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
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE users.password_reset_requests SET status='cancelled', resolved_at=now() WHERE user_id=$1::uuid AND status='pending'`,
        user.id,
      );
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO users.password_reset_requests (user_id, new_password_hash) VALUES ($1::uuid, $2)`,
        user.id,
        hash,
      );
    } catch (err) {
      try {
        await this.prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS users.password_reset_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
            new_password_hash VARCHAR(255) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
            resolved_at TIMESTAMPTZ(6)
          )
        `);
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users.password_reset_requests (user_id, new_password_hash) VALUES ($1::uuid, $2)`,
          user.id,
          hash,
        );
      } catch (innerErr) {
        throw new ConflictException("حدث خطأ أثناء إرسال طلب استعادة كلمة المرور، يرجى المحاولة لاحقاً.");
      }
    }
    return { message: "تم إرسال طلب تغيير كلمة المرور إلى المدير. ستتمكن من الدخول بالكلمة الجديدة بعد موافقته." };
  }

  async register(data: any) {
    if (!data.recaptchaToken) {
      throw new UnauthorizedException("إثبات أنك لست روبوت مطلوب (reCAPTCHA)");
    }

    if (!data.email?.trim() || !data.phone?.trim()) {
      throw new ConflictException("البريد الإلكتروني ورقم الهاتف كلاهما إجباري لاستكمال التسجيل");
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
        nationality: data.nationality || null,
        curriculumType: data.curriculumType || null,
        gradeLevel: data.gradeLevel || 'grade_11',
        supervisedSubjectId: data.supervisedSubjectId || null,
        roles: {
          create: {
            role: data.primaryRole,
          },
        },
      },
    });

    if (data.primaryRole === 'student') {
      try {
        const branch = data.branch || 'scientific';
        const grade = data.gradeLevel || 'grade_11';
        const curriculum = data.curriculumType || 'governmental';

        const courses = await this.prisma.course.findMany({
          where: {
            academicBranch: branch,
            gradeLevel: grade,
            curriculumType: curriculum,
            isActive: true
          },
          select: { id: true }
        });

        for (const course of courses) {
          const availableCohort = await this.prisma.cohort.findFirst({
            where: {
              courseId: course.id,
              status: 'active'
            },
            include: { enrollments: true },
            orderBy: { createdAt: 'asc' }
          });

          if (availableCohort && availableCohort.enrollments.length < (availableCohort.maxStudents || 30)) {
            await this.prisma.cohortEnrollment.create({
              data: {
                cohortId: availableCohort.id,
                studentId: newUser.id,
                status: 'enrolled'
              }
            });
          }
        }
      } catch (err) {
        console.error('Error auto-enrolling student on registration:', err);
      }
    }

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
      }
    } else {
      user = userOrData;
    }

    if (user.status === "pending") {
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
    }
    if (user.status !== "active") {
      throw new UnauthorizedException("هذا الحساب غير مفعل أو تم إيقافه");
    }

    const rawRoles = user.roles?.map((r: any) => (typeof r === 'string' ? r : r.role)) || [];
    const roles = Array.from(new Set([user.primaryRole, ...rawRoles]));
    const isDualRole =
      roles.includes('teacher') &&
      (roles.includes('subject_supervisor') || roles.includes('supervisor'));

    const payload = {
      sub: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: roles,
    };

    // Log Activity & Update lastLoginAt
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          details: 'تم تسجيل الدخول بنجاح',
        }
      });
    } catch(err) {
      console.error('Failed to log activity or update lastLoginAt', err);
    }

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        roles,
        isDualRole,
        supervisedSubjectId: user.supervisedSubjectId,
        status: user.status,
        phone: user.phone,
        nationality: user.nationality,
        gradeLevel: user.gradeLevel,
        academicBranch: user.academicBranch,
        curriculumType: user.curriculumType,
        avatarUrl: user.avatarUrl,
        lastLoginAt: new Date(),
      },
    };
  }

  async touchLastLogin(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });
    } catch (_) {}
  }
}
