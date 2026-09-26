import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { createActor } from "xstate";
import {
  submissionMachine,
  SubmissionEvent,
} from "../domain/submission.machine";
import { SubmissionStatus } from "@prisma/client";

@Injectable()
export class AssessmentWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async transitionSubmission(submissionId: string, event: SubmissionEvent) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current submission
      const submission = await tx.assessmentSubmission.findUnique({
        where: { id: submissionId },
        include: { assessment: true },
      });

      if (!submission) {
        throw new NotFoundException("تسليم الواجب غير موجود");
      }

      // Check max score limit if grading
      if (
        event.type === "GRADE" &&
        event.score > Number(submission.assessment.maxScore)
      ) {
        throw new BadRequestException(
          `العلامة تتجاوز الحد الأقصى (${submission.assessment.maxScore})`,
        );
      }

      // 2. Rehydrate XState Actor
      const actor = createActor(submissionMachine, {
        snapshot: {
          status: "active",
          value: submission.status,
          context: {
            submissionId: submission.id,
            assessmentId: submission.assessmentId,
            studentId: submission.studentId,
            score: submission.score ? Number(submission.score) : undefined,
            feedback: submission.feedback || undefined,
            gradedById: submission.gradedById || undefined,
          },
        } as any,
      });

      actor.start();

      // 3. Validate transition
      if (!actor.getSnapshot().can(event)) {
        throw new BadRequestException(
          `لا يمكن تنفيذ الإجراء [${event.type}] لأن حالة التسليم هي [${submission.status}]`,
        );
      }

      // 4. Execute transition
      actor.send(event);
      const nextSnapshot = actor.getSnapshot();
      const nextState = String(nextSnapshot.value) as SubmissionStatus;

      // 5. Persist safely with Optimistic Locking
      const updated = await tx.assessmentSubmission.update({
        where: {
          id: submissionId,
          version: submission.version,
        },
        data: {
          status: nextState,
          score: nextSnapshot.context.score,
          feedback: nextSnapshot.context.feedback,
          gradedById: nextSnapshot.context.gradedById,
          version: { increment: 1 },
          ...(nextState === "submitted" || nextState === "resubmitted"
            ? { submittedAt: new Date() }
            : {}),
          ...(nextState === "graded" ? { gradedAt: new Date() } : {}),
        },
      });

      // 6. Emit Domain Event
      this.eventEmitter.emit("submission.state_changed", {
        submissionId: updated.id,
        assessmentId: updated.assessmentId,
        studentId: updated.studentId,
        fromState: submission.status,
        toState: nextState,
      });

      return updated;
    });
  }
}
