import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { NotificationType } from "@prisma/client";
import { EmailService } from "../../email/email.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    actionUrl?: string;
    isImportant?: boolean;
    sendEmail?: boolean;
    senderName?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        actionUrl: data.actionUrl,
      },
    });

    // Determine if this is an important notification that must be linked to email
    const isImportantNotice = Boolean(data.isImportant) ||
      data.title.includes('هام') ||
      data.title.includes('عاجل') ||
      data.title.includes('إنذار') ||
      data.title.includes('توجيه إشرافي') ||
      data.title.includes('تنبيه');

    if ((isImportantNotice || data.sendEmail) && data.userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, primaryRole: true }
        });

        if (user?.email && user.email.includes('@')) {
          const fullName = `${user.firstNameAr || user.firstName || ''} ${user.lastNameAr || user.lastName || ''}`.trim() || 'مستخدم منصة باقون';
          const frontendBase = process.env.FRONTEND_URL || 'https://baaqoon-platform.vercel.app';
          const actionFullUrl = data.actionUrl
            ? (data.actionUrl.startsWith('http') ? data.actionUrl : `${frontendBase}${data.actionUrl}`)
            : `${frontendBase}/login`;

          await this.emailService.sendImportantNotificationEmail({
            recipientName: fullName,
            email: user.email,
            role: user.primaryRole,
            title: data.title,
            body: data.body,
            actionUrl: actionFullUrl,
            isUrgent: data.title.includes('عاجل') || Boolean(data.isImportant),
            senderName: data.senderName,
          });
        }
      } catch (err: any) {
        this.logger.error(`Failed to send email for notification ${notification.id} to user ${data.userId}: ${err.message}`);
      }
    }

    return notification;
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
