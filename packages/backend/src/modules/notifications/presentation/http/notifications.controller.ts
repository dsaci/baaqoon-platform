import { Controller, Get, Param, UseGuards, Req, Patch, Post, Body, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { JwtAuthGuard } from "../../../auth/infrastructure/jwt-auth.guard";
import { EmailService } from "../../../email/email.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

  /**
   * Broadcast or send an Important Notification (إشعار وتعميم رسمي هام)
   * Delivers simultaneously to the in-app notification bell and the user's email inbox!
   */
  @Post("admin/broadcast-important")
  async broadcastImportantNotification(
    @Req() req: any,
    @Body()
    body: {
      userId?: string;
      userIds?: string[];
      role?: string;
      cohortId?: string;
      title: string;
      body: string;
      actionUrl?: string;
      isUrgent?: boolean;
    }
  ) {
    const callerRole = req.user?.primaryRole;
    if (!["super_admin", "admin", "subject_supervisor", "supervisor"].includes(callerRole)) {
      throw new UnauthorizedException("غير مصرح لك بإرسال الإشعارات والتعميمات الرسمية");
    }

    const { userId, userIds, role, cohortId, title, body: contentBody, actionUrl, isUrgent } = body;

    if (!title?.trim() || !contentBody?.trim()) {
      throw new BadRequestException("عنوان الإشعار ومحتواه مطلوبان");
    }

    let targetUsers: any[] = [];

    if (userId) {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, primaryRole: true }
      });
      if (u) targetUsers.push(u);
    } else if (userIds && userIds.length > 0) {
      targetUsers = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, primaryRole: true }
      });
    } else if (cohortId) {
      const enrollments = await this.prisma.cohortEnrollment.findMany({
        where: { cohortId, status: "enrolled" },
        select: { studentId: true }
      });
      const studentIds = enrollments.map((e) => e.studentId);
      targetUsers = await this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, email: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, primaryRole: true }
      });
    } else {
      const whereClause: any = { status: "active" };
      if (role && role !== "all") {
        whereClause.primaryRole = role;
      }
      targetUsers = await this.prisma.user.findMany({
        where: whereClause,
        select: { id: true, email: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, primaryRole: true }
      });
    }

    const senderFullName = `${req.user?.firstName || "إدارة"} ${req.user?.lastName || "المنصة"}`.trim();
    const frontendBase = process.env.FRONTEND_URL || "https://baaqoon-platform.vercel.app";
    const fullActionUrl = actionUrl
      ? (actionUrl.startsWith("http") ? actionUrl : `${frontendBase}${actionUrl}`)
      : `${frontendBase}/login`;

    let notifiedCount = 0;
    let emailedCount = 0;

    for (const u of targetUsers) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: u.id,
            title: title.trim(),
            body: contentBody.trim(),
            type: "system",
            actionUrl: actionUrl?.trim() || "/student/dashboard",
          },
        });
        notifiedCount++;
      } catch (_) {}

      if (u.email && u.email.includes("@")) {
        try {
          const fullName = `${u.firstNameAr || u.firstName || ""} ${u.lastNameAr || u.lastName || ""}`.trim() || "مستخدم منصة باقون";
          const res = await this.emailService.sendImportantNotificationEmail({
            recipientName: fullName,
            email: u.email,
            role: u.primaryRole,
            title: title.trim(),
            body: contentBody.trim(),
            actionUrl: fullActionUrl,
            isUrgent: Boolean(isUrgent),
            senderName: senderFullName,
          });
          if (res?.success) emailedCount++;
        } catch (_) {}
      }
    }

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: "BROADCAST_IMPORTANT_NOTIFICATION",
          details: `إرسال إشعار هام "${title}" إلى ${notifiedCount} مستخدم (تم توصيل ${emailedCount} بريد إلكتروني)`,
        },
      });
    } catch (_) {}

    return {
      success: true,
      totalTargeted: targetUsers.length,
      notifiedCount,
      emailedCount,
      message: `تم إرسال الإشعار الهام بنجاح إلى ${notifiedCount} مستخدم في المنصة، وتوصيل ${emailedCount} رسالة بريد إلكتروني.`,
    };
  }
}
