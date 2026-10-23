import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req, Post, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';
import { assertNoDuplicateUser, normalizeEmail, normalizePhone, isDummyOrSyntheticEmail } from '../../application/identity-validator.util';
import { EmailService } from '../../../email/email.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {

  @Get('admin/password-requests')
  async listPasswordRequests(@Req() req: any) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
    try {
      return await this.prisma.$queryRawUnsafe(`
        SELECT r.id, r.created_at AS "createdAt", u.id AS "userId", u."firstName", u."lastName",
               u.email, u.phone, u."primaryRole"
        FROM users.password_reset_requests r JOIN users.users u ON u.id = r.user_id
        WHERE r.status = 'pending' ORDER BY r.created_at DESC`);
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
      } catch (_) {}
      return [];
    }
  }

  @Post('admin/password-requests/:id/:action')
  async resolvePasswordRequest(@Req() req: any, @Param('id') id: string, @Param('action') action: string) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT user_id, new_password_hash FROM users.password_reset_requests WHERE id=$1::uuid AND status='pending'`, id);
      if (!rows.length) return { ok: false };
      if (action === 'approve') {
        await this.prisma.user.update({ where: { id: rows[0].user_id }, data: { passwordHash: rows[0].new_password_hash } });
      }
      await this.prisma.$executeRawUnsafe(
        `UPDATE users.password_reset_requests SET status=$2, resolved_at=now() WHERE id=$1::uuid`,
        id, action === 'approve' ? 'approved' : 'rejected');
      return { ok: true };
    } catch (err) {
      return { ok: false };
    }
  }

  @Patch('admin/:id/password')
  async resetPassword(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(body.password, 12);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }

  @Post('admin/create')
  async createUser(@Req() req: any, @Body() body: any) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();

    const isDual = body.primaryRole === 'dual_teacher_supervisor' || body.isDualRole === true;
    const effectivePrimaryRole = isDual ? 'subject_supervisor' : body.primaryRole;

    if (effectivePrimaryRole === 'teacher' || effectivePrimaryRole === 'subject_supervisor' || isDual) {
      if (!body.supervisedSubjectId || !body.supervisedSubjectId.trim()) {
        throw new BadRequestException('تحديد مادة التدريس إجباري حتمي عند إنشاء حساب أستاذ أو مشرف.');
      }
      const subject = await this.prisma.subject.findUnique({ where: { id: body.supervisedSubjectId.trim() } });
      if (!subject) {
        throw new BadRequestException('مادة التدريس المحددة غير موجودة في النظام.');
      }
    }

    const { normalizedEmail, normalizedPhone, cleanFirstName, cleanLastName } =
      await assertNoDuplicateUser(this.prisma, {
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        primaryRole: effectivePrimaryRole,
      });

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(body.password || 'Baaqoon2024!', 12);

    const rolesToCreate = isDual
      ? [{ role: 'subject_supervisor' as any }, { role: 'teacher' as any }]
      : [{ role: effectivePrimaryRole as any }];

    return this.prisma.user.create({
      data: {
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        primaryRole: effectivePrimaryRole as any,
        passwordHash,
        status: 'active',
        mustChangePassword: true,
        academicBranch: body.academicBranch || null,
        curriculumType: body.curriculumType || null,
        gradeLevel: body.gradeLevel || (effectivePrimaryRole === 'student' ? 'grade_11' : null),
        supervisedSubjectId: body.supervisedSubjectId || null,
        nationality: body.nationality || null,
        roles: {
          create: rolesToCreate
        }
      }
    });
  }

  @Post('admin/nudge-inactive')
  async nudgeInactiveUser(@Req() req: any, @Body() body: { userId: string; message?: string; sendEmail?: boolean }) {
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(req.user.primaryRole)) {
      throw new UnauthorizedException();
    }
    const { userId, message, sendEmail = true } = body;
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { error: 'المستخدم غير موجود' };
    }

    const defaultMessage = targetUser.primaryRole === 'teacher'
      ? 'نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة مؤخراً، نرجو تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية وجدول الحصص.'
      : 'نلاحظ غيابك عن المنصة مؤخراً، نرجو تسجيل الدخول للاطلاع على الحصص والتكليفات المدرسية بانتظام.';

    const noteBody = message?.trim() || defaultMessage;

    // 1. In-platform Notification
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'تنبيه متابعة: إشعار غياب وخمول عن المنصة',
        body: noteBody,
        type: 'system',
        actionUrl: targetUser.primaryRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      }
    });

    // 2. Email Delivery (ربط ما يُرسل في المنصة بالبريد الإلكتروني للخامل)
    let emailSent = false;
    let emailError: string | null = null;
    if (sendEmail && targetUser.email && targetUser.email.includes('@')) {
      try {
        const emailRes = await this.emailService.sendInactiveUserNudgeEmail({
          fullName: `${targetUser.firstNameAr || targetUser.firstName || ''} ${targetUser.lastNameAr || targetUser.lastName || ''}`.trim() || 'مستخدم منصة باقون',
          email: targetUser.email,
          role: targetUser.primaryRole,
          customMessage: noteBody,
          lastLoginAt: targetUser.lastLoginAt,
          loginUrl: (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*' && process.env.FRONTEND_URL.startsWith('http'))
            ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/login`
            : 'https://baaqoon-platform.vercel.app/login'
        });
        emailSent = Boolean(emailRes?.success);
      } catch (err: any) {
        emailError = err.message;
      }
    }

    // 3. Activity Log
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'NUDGE_INACTIVE_USER',
          details: `إرسال تنبيه خمول للمستخدم ${targetUser.firstName} ${targetUser.lastName} (${targetUser.primaryRole}) عبر المنصة ${emailSent ? 'والبريد الإلكتروني' : ''}`
        }
      });
    } catch (_) {}

    return {
      success: true,
      message: `تم إرسال تنبيه المتابعة بنجاح إلى ${targetUser.firstName} ${targetUser.lastName}`,
      emailSent,
      recipientEmail: targetUser.email,
      emailError
    };
  }

  @Post('admin/nudge-inactive-bulk')
  async nudgeInactiveUsersBulk(
    @Req() req: any,
    @Body() body: { userIds?: string[]; role?: string; message?: string }
  ) {
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(req.user.primaryRole)) {
      throw new UnauthorizedException();
    }
    const { userIds, role, message } = body;

    let targetUsers: any[] = [];
    if (userIds && userIds.length > 0) {
      targetUsers = await this.prisma.user.findMany({
        where: { id: { in: userIds } }
      });
    } else {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const whereClause: any = {
        status: 'active',
        OR: [
          { lastLoginAt: null },
          { lastLoginAt: { lt: sevenDaysAgo } }
        ]
      };
      if (role && role !== 'all') {
        whereClause.primaryRole = role;
      }
      targetUsers = await this.prisma.user.findMany({ where: whereClause });
    }

    let notifiedCount = 0;
    let emailedCount = 0;

    for (const u of targetUsers) {
      const defaultMessage = u.primaryRole === 'teacher'
        ? 'نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة مؤخراً، نرجو تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية وجدول الحصص.'
        : 'نلاحظ غيابك عن المنصة مؤخراً، نرجو تسجيل الدخول للاطلاع على الحصص والتكليفات المدرسية بانتظام.';
      const noteBody = message?.trim() || defaultMessage;

      try {
        await this.prisma.notification.create({
          data: {
            userId: u.id,
            title: 'تنبيه متابعة: إشعار غياب وخمول عن المنصة',
            body: noteBody,
            type: 'system',
            actionUrl: u.primaryRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
          }
        });
        notifiedCount++;
      } catch (_) {}
    }

    const validEmailUsers = targetUsers.filter((u) => 
      u.email && typeof u.email === 'string' && u.email.includes('@') && !u.email.includes(' ') && !u.email.startsWith('null')
    );

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'BULK_NUDGE_INACTIVE_USERS',
          details: `إرسال تنبيه خمول جماعي لـ ${notifiedCount} مستخدم (جاري تسليم ${validEmailUsers.length} بريد إلكتروني)`
        }
      });
    } catch (_) {}

    // Asynchronous background email delivery
    setImmediate(async () => {
      const BATCH_SIZE = 5;
      for (let i = 0; i < validEmailUsers.length; i += BATCH_SIZE) {
        const batch = validEmailUsers.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (u) => {
            const defaultMessage = u.primaryRole === 'teacher'
              ? 'نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة مؤخراً، نرجو تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية وجدول الحصص.'
              : 'نلاحظ غيابك عن المنصة مؤخراً، نرجو تسجيل الدخول للاطلاع على الحصص والتكليفات المدرسية بانتظام.';
            const noteBody = message?.trim() || defaultMessage;

            return this.emailService.sendInactiveUserNudgeEmail({
              fullName: `${u.firstNameAr || u.firstName || ''} ${u.lastNameAr || u.lastName || ''}`.trim() || 'مستخدم منصة باقون',
              email: u.email.trim(),
              role: u.primaryRole,
              customMessage: noteBody,
              lastLoginAt: u.lastLoginAt,
              loginUrl: (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*' && process.env.FRONTEND_URL.startsWith('http'))
            ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/login`
            : 'https://baaqoon-platform.vercel.app/login'
            });
          })
        );
        if (i + BATCH_SIZE < validEmailUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    });

    return {
      success: true,
      totalUsers: targetUsers.length,
      notifiedCount,
      emailedCount: validEmailUsers.length,
      message: `تم إرسال التنبيه إلى ${notifiedCount} مستخدم في المنصة، وجاري تسليم ${validEmailUsers.length} رسالة بريد إلكتروني بنجاح.`
    };
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Patch('me/profile')
  async updateMyProfile(
    @Req() req: any, 
    @Body() body: { 
      firstName?: string; 
      lastName?: string; 
      email?: string; 
      phone?: string; 
      nationality?: string; 
      gradeLevel?: string; 
      avatarUrl?: string;
      supervisedSubjectId?: string;
    }
  ) {
    const userId = req.user.id || req.user.userId;
    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName.trim();
    if (body.lastName) updateData.lastName = body.lastName.trim();

    if (body.email) {
      const normEmail = normalizeEmail(body.email);
      if (isDummyOrSyntheticEmail(normEmail)) {
        throw new BadRequestException('يُشترط إدخال بريد إلكتروني شخصي حقيقي وفعّال (مثل Gmail أو Outlook أو Yahoo أو بريدك المعتمد) لاستلام الإشعارات والتواصل، وليس بريداً تجريبياً أو وهمياً.');
      }
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: { equals: normEmail, mode: 'insensitive' },
          id: { not: userId },
        },
      });
      if (existingEmail) {
        throw new ConflictException('البريد الإلكتروني المدخل مستخدم مسبقاً بحساب آخر');
      }
      updateData.email = normEmail;

      try {
        await this.prisma.volunteerApplication.updateMany({
          where: { convertedUserId: userId },
          data: { email: normEmail },
        });
      } catch (_) {}
    }

    if (body.phone !== undefined) {
      if (body.phone) {
        const { normalized: normPhone, tail } = normalizePhone(body.phone);
        const existingPhone = await this.prisma.user.findFirst({
          where: {
            OR: [
              { phone: normPhone },
              ...(tail ? [{ phone: { endsWith: tail } }] : []),
            ],
            id: { not: userId },
          },
        });
        if (existingPhone) {
          throw new ConflictException('رقم الهاتف المدخل مستخدم مسبقاً بحساب آخر');
        }
        updateData.phone = normPhone;
      } else {
        updateData.phone = null;
      }
    }

    if (body.nationality !== undefined) updateData.nationality = body.nationality || null;
    if (body.gradeLevel !== undefined) updateData.gradeLevel = body.gradeLevel || null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null;
    if (body.supervisedSubjectId !== undefined) {
      if (body.supervisedSubjectId && body.supervisedSubjectId.trim()) {
        const subject = await this.prisma.subject.findUnique({ where: { id: body.supervisedSubjectId.trim() } });
        if (!subject) {
          throw new BadRequestException('المادة الدراسية المحددة غير موجودة.');
        }
        updateData.supervisedSubjectId = body.supervisedSubjectId.trim();
      } else {
        const isTeacherOrSup = req.user.primaryRole === 'teacher' || req.user.primaryRole === 'subject_supervisor';
        if (isTeacherOrSup) {
          throw new BadRequestException('لا يمكن إلغاء مادة التدريس؛ تحديد المادة إجباري لمواصلة استخدام المنصة.');
        }
        updateData.supervisedSubjectId = null;
      }
    }


    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { 
        roles: true,
        supervisedSubject: { select: { id: true, nameAr: true, code: true } }
      }
    });

    if (body.supervisedSubjectId) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users.supervisor_subjects (user_id, subject_id)
           VALUES ($1::uuid, $2::uuid)
           ON CONFLICT (user_id, subject_id) DO NOTHING;`,
          userId,
          body.supervisedSubjectId
        );
      } catch (_) {}
    }

    const rawRoles = updated.roles?.map((r: any) => r.role) || [];
    const roles = Array.from(new Set([updated.primaryRole, ...rawRoles]));
    const isDualRole = roles.includes('teacher') && (roles.includes('subject_supervisor') || roles.includes('supervisor'));

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone,
      primaryRole: updated.primaryRole,
      roles,
      isDualRole,
      supervisedSubjectId: updated.supervisedSubjectId,
      supervisedSubject: updated.supervisedSubject,
      status: updated.status,
      avatarUrl: updated.avatarUrl,
      nationality: updated.nationality,
      gradeLevel: updated.gradeLevel,
      mustChangePassword: Boolean(updated.mustChangePassword),
    };
  }

  @Post('me/change-password')
  async changeMyPassword(@Req() req: any, @Body() body: { currentPassword?: string; newPassword: string }) {
    const userId = req.user.id;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود.');

    const newPassword = (body.newPassword || '').trim();
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('كلمة المرور الجديدة يجب ألا تقل عن 8 خانات وتحتوي على أحرف وأرقام.');
    }

    if (newPassword === 'Baaqoon2024!') {
      throw new BadRequestException('لا يمكن إعادة استخدام كلمة المرور الأولية المؤقتة. يرجى كتابة كلمة مرور جديدة خاصة بك.');
    }

    if (body.currentPassword) {
      const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestException('كلمة المرور الحالية غير صحيحة.');
      }
    } else if (!user.mustChangePassword) {
      throw new BadRequestException('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'password_change',
          details: 'تم تغيير كلمة المرور وتأمين الحساب بنجاح',
        },
      });
    } catch (_) {}

    return {
      success: true,
      message: 'تم تغيير كلمة المرور وتأمين حسابك بنجاح! يمكنك الآن متابعة استخدام المنصة بأمان.',
    };
  }

  @Patch('me/change-password')
  async patchMyPassword(@Req() req: any, @Body() body: any) {
    return this.changeMyPassword(req, body);
  }

  @Get('admin/list')
  async getAllUsers(@Req() req: any) {
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }
    
    let whereClause: any = {};
    if (req.user.primaryRole === 'subject_supervisor' || req.user.primaryRole === 'supervisor') {
      const supervisor = await this.prisma.user.findUnique({ where: { id: req.user.id } });
      const subjectId = supervisor?.supervisedSubjectId;

      whereClause = {
        OR: [
          ...(subjectId
            ? [
                { primaryRole: 'teacher', supervisedSubjectId: subjectId },
                { roles: { some: { role: 'teacher' } }, supervisedSubjectId: subjectId },
              ]
            : [{ primaryRole: 'teacher' }]),
          { primaryRole: 'student' } // Display all students to coordinator for easy assignment and grouping
        ]
      };
    }
    
    const users = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        primaryRole: true,
        status: true,
        createdAt: true,
        nationality: true,
        academicBranch: true,
        curriculumType: true,
        gradeLevel: true,
        supervisedSubjectId: true,
        supervisedSubject: {
          select: { id: true, nameAr: true, code: true }
        },
        roles: {
          select: { role: true }
        },
        lastLoginAt: true,
        emailVerified: true
      }
    });

    return users.map(u => {
      const rawRoles = u.roles?.map(r => r.role as string) || [];
      const roles: string[] = Array.from(new Set([u.primaryRole as string, ...rawRoles]));
      const isDualRole = roles.includes('teacher') && (roles.includes('subject_supervisor') || roles.includes('supervisor'));
      return {
        ...u,
        roles,
        isDualRole
      };
    });
  }

  @Patch('admin/:id/dual-role')
  async updateUserDualRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      enableDualRole: boolean;
      supervisedSubjectId?: string | null;
      singleRole?: 'teacher' | 'subject_supervisor';
    }
  ) {
    if (!['super_admin', 'admin'].includes(req.user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    });
    if (!targetUser) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const subjectId = (body.supervisedSubjectId && typeof body.supervisedSubjectId === 'string' && body.supervisedSubjectId.trim() !== '') 
      ? body.supervisedSubjectId 
      : targetUser.supervisedSubjectId;

    if (body.enableDualRole) {
      // Grant Dual Role: Teacher + Subject Supervisor together
      await this.prisma.user.update({
        where: { id },
        data: {
          primaryRole: 'subject_supervisor',
          supervisedSubjectId: subjectId
        }
      });

      await this.prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId: id, role: 'teacher' } },
        update: {},
        create: { userId: id, role: 'teacher', grantedById: req.user.id }
      });

      await this.prisma.userRoleAssignment.upsert({
        where: { userId_role: { userId: id, role: 'subject_supervisor' } },
        update: {},
        create: { userId: id, role: 'subject_supervisor', grantedById: req.user.id }
      });

      try {
        await this.prisma.notification.create({
          data: {
            userId: id,
            title: 'ترقية الحساب: منح الصفة الثنائية (تدريس + إشراف)',
            body: 'تمت ترقية حسابك ومنحك الصفة الثنائية (أستاذ مدرّس ومشرف منسق للمادة معاً). يمكنك التبديل بين فضاء الإشراف وفضاء التدريس من القائمة العلوية أو الجانبية مباشرة.',
            actionUrl: '/supervisor/dashboard',
            type: 'system'
          }
        });
      } catch (_) {}

      try {
        await this.prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: 'PROMOTE_DUAL_ROLE',
            details: `ترقية ومنح الصفة الثنائية (تدريس + إشراف) للمستخدم ${targetUser.firstName} ${targetUser.lastName}`
          }
        });
      } catch (_) {}
    } else {
      // Revert to single role (either teacher or subject_supervisor)
      const targetSingleRole = body.singleRole || 'teacher';
      const finalSubjectId = targetSingleRole === 'teacher'
        ? (subjectId || targetUser.supervisedSubjectId)
        : subjectId;

      await this.prisma.user.update({
        where: { id },
        data: {
          primaryRole: targetSingleRole as any,
          supervisedSubjectId: finalSubjectId
        }
      });

      await this.prisma.userRoleAssignment.deleteMany({
        where: { userId: id }
      });

      await this.prisma.userRoleAssignment.create({
        data: { userId: id, role: targetSingleRole as any, grantedById: req.user.id }
      });
    }

    const updated = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true, supervisedSubject: { select: { id: true, nameAr: true, code: true } } }
    });
    const rawRoles = updated?.roles?.map(r => r.role as string) || [];
    const roles: string[] = updated ? Array.from(new Set([updated.primaryRole as string, ...rawRoles])) : [];
    const isDualRole = roles.includes('teacher') && (roles.includes('subject_supervisor') || roles.includes('supervisor'));

    return {
      ...updated,
      roles,
      isDualRole,
      message: body.enableDualRole
        ? `تم منح الصفة الثنائية (التدريس والإشراف معاً) لـ ${targetUser.firstName} ${targetUser.lastName} بنجاح`
        : `تم تحديث صلاحية ${targetUser.firstName} ${targetUser.lastName} بنجاح`
    };
  }

  @Patch('admin/:id/details')
  async updateUserAdminDetails(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      supervisedSubjectId?: string | null;
      nationality?: string | null;
      phone?: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    }
  ) {
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(req.user.primaryRole)) {
      throw new UnauthorizedException('غير مصرح لك بتعديل بيانات المستخدمين');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const updateData: any = {};
    if (body.supervisedSubjectId !== undefined) {
      updateData.supervisedSubjectId = body.supervisedSubjectId || null;
    }
    if (body.nationality !== undefined) {
      updateData.nationality = body.nationality || null;
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone || null;
    }
    if (body.email !== undefined) {
      if (body.email && body.email.trim()) {
        const normEmail = normalizeEmail(body.email);
        if (isDummyOrSyntheticEmail(normEmail)) {
          throw new BadRequestException('يُرجى إدخال بريد إلكتروني شخصي حقيقي وليس بريداً تجريبياً أو وهمياً.');
        }
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            email: { equals: normEmail, mode: 'insensitive' },
            id: { not: id },
          },
        });
        if (existingEmail) {
          throw new ConflictException('البريد الإلكتروني المدخل مستخدم مسبقاً بحساب آخر');
        }
        updateData.email = normEmail;
      } else {
        updateData.email = null;
      }
    }
    if (body.firstName && body.firstName.trim()) {
      updateData.firstName = body.firstName.trim();
    }
    if (body.lastName && body.lastName.trim()) {
      updateData.lastName = body.lastName.trim();
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        supervisedSubject: { select: { id: true, nameAr: true, code: true } },
        roles: true
      }
    });

    if (body.supervisedSubjectId) {
      try {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users.supervisor_subjects (user_id, subject_id)
           VALUES ($1::uuid, $2::uuid)
           ON CONFLICT (user_id, subject_id) DO NOTHING;`,
          id,
          body.supervisedSubjectId
        );
      } catch (_) {}
    }

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_USER_DETAILS',
          details: `تحديث بيانات المستخدم ${updated.firstName} ${updated.lastName} (المادة: ${updated.supervisedSubject?.nameAr || 'غير محدد'}، الجنسية: ${updated.nationality || 'غير محدد'})`
        }
      });
    } catch (_) {}

    const rawRoles = updated.roles?.map(r => r.role as string) || [];
    const roles: string[] = Array.from(new Set([updated.primaryRole as string, ...rawRoles]));
    const isDualRole = roles.includes('teacher') && (roles.includes('subject_supervisor') || roles.includes('supervisor'));

    return {
      ...updated,
      roles,
      isDualRole,
      message: `تم تحديث بيانات ${updated.firstName} ${updated.lastName} بنجاح`
    };
  }

  @Patch('admin/:id/status')
  async updateUserStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: body.status as any }
    });
  }

  @Delete('admin/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }
    // Delete related
    await this.prisma.cohortInstructor.deleteMany({ where: { teacherId: id } });
    await this.prisma.cohortEnrollment.deleteMany({ where: { studentId: id } });
    await this.prisma.session.deleteMany({ where: { teacherId: id } });
    
    return this.prisma.user.delete({ where: { id } });
  }
}
