import { Module } from "@nestjs/common";
import { NotificationService } from "./application/notification.service";
import { NotificationEventListener } from "./infrastructure/listeners/notification.listener";
import { NotificationsController } from "./presentation/http/notifications.controller";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationService, NotificationEventListener],
  exports: [NotificationService],
})
export class NotificationsModule {}
