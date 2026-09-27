import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

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
}
