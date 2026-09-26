import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { createActor } from "xstate";
import {
  enrollmentMachine,
  EnrollmentEvent,
} from "../domain/enrollment.machine";
import { EnrollmentStatus } from "@prisma/client";

@Injectable()
export class EnrollmentWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Executes a state transition for an enrollment.
   * Rehydrates the state machine from DB, validates transition, and saves atomically.
   */
  async transitionEnrollment(enrollmentId: string, event: EnrollmentEvent) {
    // 1. Transaction to handle optimistic locking and capacity checks
    return this.prisma.$transaction(async (tx) => {
      // Fetch current enrollment state
      const enrollment = await tx.cohortEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { cohort: true },
      });

      if (!enrollment) {
        throw new NotFoundException("تسجيل الطالب غير موجود");
      }

      // 2. Rehydrate XState Actor
      const actor = createActor(enrollmentMachine, {
        snapshot: {
          status: "active",
          value: enrollment.status, // e.g. 'applied', 'enrolled'
          context: {
            enrollmentId: enrollment.id,
            cohortId: enrollment.cohortId,
            studentId: enrollment.studentId,
            withdrawalReason: enrollment.withdrawalReason || undefined,
          },
        } as any,
      });

      actor.start();

      // 3. Validate transition
      if (!actor.getSnapshot().can(event)) {
        throw new BadRequestException(
          `لا يمكن تنفيذ الإجراء [${event.type}] لأن حالة التسجيل الحالية هي [${enrollment.status}]`,
        );
      }

      // If approving, we must check capacity (Row-Level Locking concept handled by Prisma transaction + check)
      if (event.type === "APPROVE") {
        const activeCount = await tx.cohortEnrollment.count({
          where: { cohortId: enrollment.cohortId, status: "enrolled" },
        });

        if (activeCount >= enrollment.cohort.maxStudents) {
          throw new BadRequestException(
            "لقد وصل الفوج إلى الحد الأقصى من الطلاب",
          );
        }
      }

      // 4. Execute transition
      actor.send(event);
      const nextSnapshot = actor.getSnapshot();
      const nextState = String(nextSnapshot.value) as EnrollmentStatus;

      // 5. Persist safely with Optimistic Locking
      const updated = await tx.cohortEnrollment.update({
        where: {
          id: enrollmentId,
          version: enrollment.version, // Optimistic lock condition
        },
        data: {
          status: nextState,
          withdrawalReason: nextSnapshot.context.withdrawalReason,
          version: { increment: 1 },
          ...(nextState === "withdrawn" ? { withdrawnAt: new Date() } : {}),
          ...(nextState === "completed" ? { completedAt: new Date() } : {}),
        },
      });

      // 6. Emit Domain Event
      this.eventEmitter.emit("enrollment.state_changed", {
        enrollmentId: updated.id,
        cohortId: updated.cohortId,
        studentId: updated.studentId,
        fromState: enrollment.status,
        toState: nextState,
      });

      return updated;
    });
  }
}
