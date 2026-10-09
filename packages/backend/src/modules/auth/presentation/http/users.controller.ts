import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req, Post, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {

  @Get('admin/password-requests')
  async listPasswordRequests(@Req() req: any) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
    return this.prisma.$queryRawUnsafe(`
      SELECT r.id, r.created_at AS "createdAt", u.id AS "userId", u."firstName", u."lastName",
             u.email, u.phone, u."primaryRole"
      FROM users.password_reset_requests r JOIN users.users u ON u.id = r.user_id
      WHERE r.status = 'pending' ORDER BY r.created_at DESC`);
  }

  @Post('admin/password-requests/:id/:action')
  async resolvePasswordRequest(@Req() req: any, @Param('id') id: string, @Param('action') action: string) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) throw new UnauthorizedException();
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
    return this.prisma.user.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        primaryRole: body.primaryRole,
        passwordHash,
        status: 'active',
        academicBranch: body.academicBranch || null,
        curriculumType: body.curriculumType || null,
        supervisedSubjectId: body.supervisedSubjectId || null,
        nationality: body.nationality || null,
        roles: {
          create: {
            role: body.primaryRole
          }
        }
      }
    });
  }

  constructor(private readonly prisma: PrismaService) {}

  @Patch('me/profile')
  async updateMyProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string }) {
    const userId = req.user.id || req.user.userId;
    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.nationality !== undefined) updateData.nationality = body.nationality || null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        primaryRole: true,
        status: true,
        avatarUrl: true,
      }
    });
    return updated;
  }

  @Get('admin/list')
  async getAllUsers(@Req() req: any) {
    if (!['super_admin', 'admin', 'subject_supervisor'].includes(req.user.primaryRole)) {
      return { error: 'Unauthorized' };
    }
    
    return this.prisma.user.findMany({
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
        supervisedSubjectId: true,
        lastLoginAt: true,
        emailVerified: true
      }
    });
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
