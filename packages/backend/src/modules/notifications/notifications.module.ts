import { Module } from "@nestjs/common";
import { NotificationService } from "./application/notification.service";
import { NotificationEventListener } from "./infrastructure/listeners/notification.listener";

@Module({
  providers: [NotificationService, NotificationEventListener],
  exports: [NotificationService],
})
export class NotificationsModule {}
