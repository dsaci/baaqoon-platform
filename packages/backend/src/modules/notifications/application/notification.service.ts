import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    actionUrl?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data,
    });

    // In a real scenario, we would also emit this to a WebSocket Gateway
    // to push it to the connected user immediately in real-time.
    // this.notificationGateway.sendToUser(data.userId, notification);

    return notification;
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
