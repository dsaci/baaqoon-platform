import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationService } from "../../application/notification.service";
import { PrismaService } from "../../../../core/database/prisma.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationEventListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent("enrollment.state_changed", { async: true })
  async handleEnrollmentStateChanged(payload: any) {
    if (payload.toState === "enrolled") {
      const cohort = await this.prisma.cohort.findUnique({
        where: { id: payload.cohortId },
      });
      if (!cohort) return;

      await this.notificationService.createNotification({
        userId: payload.studentId,
        title: "تم قبول التسجيل",
        body: `تم قبول تسجيلك رسمياً في الفوج: ${cohort.name}`,
        type: NotificationType.enrollment,
      });
    }
  }

  @OnEvent("submission.state_changed", { async: true })
  async handleSubmissionStateChanged(payload: any) {
    if (payload.toState === "graded") {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: payload.assessmentId },
      });
      if (!assessment) return;

      await this.notificationService.createNotification({
        userId: payload.studentId,
        title: "تم رصد الدرجة",
        body: `تم تصحيح تقييمك في: ${assessment.title}`,
        type: NotificationType.assessment,
      });
    }
  }
}
