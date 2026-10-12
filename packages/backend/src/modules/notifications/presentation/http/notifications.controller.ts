import { Controller, Get, Param, UseGuards, Req, Patch, Post } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { JwtAuthGuard } from "../../../auth/infrastructure/jwt-auth.guard";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      return { notifications: [], unreadCount: 0 };
    }

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  @Patch(":id/read")
  async markAsRead(@Req() req: any, @Param("id") id: string) {
    const userId = req.user?.id;
    if (!userId) return { success: false };

    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return { success: true };
  }

  @Post("read-all")
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { success: false };

    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }
}
