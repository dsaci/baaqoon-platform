import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req, Post, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

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
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(body.password || 'Baaqoon2024!', 12);

    const isDual = body.primaryRole === 'dual_teacher_supervisor' || body.isDualRole === true;
    const effectivePrimaryRole = isDual ? 'subject_supervisor' : body.primaryRole;
    const rolesToCreate = isDual
      ? [{ role: 'subject_supervisor' as any }, { role: 'teacher' as any }]
      : [{ role: effectivePrimaryRole as any }];

    return this.prisma.user.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        primaryRole: effectivePrimaryRole as any,
        passwordHash,
        status: 'active',
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
  async nudgeInactiveUser(@Req() req: any, @Body() body: { userId: string; message?: string }) {
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(req.user.primaryRole)) {
      throw new UnauthorizedException();
    }
    const { userId, message } = body;
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { error: 'المستخدم غير موجود' };
    }

    const defaultMessage = targetUser.primaryRole === 'teacher'
      ? 'نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة لفترة. يرجى تسجيل الدخول لمتابعة الأفواج والخطط الدراسية وجدول الحصص.'
      : 'نلفت انتباهك إلى غيابك عن المنصة لفترة. يرجى تسجيل الدخول لمتابعة دروسك والتكليفات المدرسية بانتظام.';

    const noteBody = message?.trim() || defaultMessage;

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'تنبيه متابعة: إشعار غياب وخمول عن المنصة',
        body: noteBody,
        type: 'system',
        actionUrl: targetUser.primaryRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      }
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'NUDGE_INACTIVE_USER',
          details: `إرسال تنبيه خمول للمستخدم ${targetUser.firstName} ${targetUser.lastName} (${targetUser.primaryRole})`
        }
      });
    } catch (_) {}

    return {
      success: true,
      message: `تم إرسال تنبيه المتابعة بنجاح إلى ${targetUser.firstName} ${targetUser.lastName}`
    };
  }

  constructor(private readonly prisma: PrismaService) {}

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
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.nationality !== undefined) updateData.nationality = body.nationality || null;
    if (body.gradeLevel !== undefined) updateData.gradeLevel = body.gradeLevel || null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null;
    if (body.supervisedSubjectId !== undefined) {
      updateData.supervisedSubjectId = body.supervisedSubjectId || null;
    }

    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE users.users ALTER COLUMN "avatarUrl" TYPE TEXT`);
    } catch (_) {}

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
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO users.supervisor_subjects (user_id, subject_id)
          VALUES ('${userId}', '${body.supervisedSubjectId}')
          ON CONFLICT (user_id, subject_id) DO NOTHING;
        `);
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
    };
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

    const subjectId = body.supervisedSubjectId !== undefined ? (body.supervisedSubjectId || null) : targetUser.supervisedSubjectId;

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
      await this.prisma.user.update({
        where: { id },
        data: {
          primaryRole: targetSingleRole as any,
          supervisedSubjectId: subjectId
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
      updateData.email = body.email || null;
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
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO users.supervisor_subjects (user_id, subject_id)
          VALUES ('${id}', '${body.supervisedSubjectId}')
          ON CONFLICT (user_id, subject_id) DO NOTHING;
        `);
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
