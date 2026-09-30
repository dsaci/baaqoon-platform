import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch('me/profile')
  async updateMyProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const userId = req.user.id || req.user.userId;
    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;

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
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
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
      }
    });
  }

  @Patch('admin/:id/status')
  async updateUserStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: body.status as any }
    });
  }

  @Delete('admin/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }
    // Delete related
    await this.prisma.cohortInstructor.deleteMany({ where: { teacherId: id } });
    await this.prisma.cohortEnrollment.deleteMany({ where: { studentId: id } });
    await this.prisma.session.deleteMany({ where: { teacherId: id } });
    
    return this.prisma.user.delete({ where: { id } });
  }
}
