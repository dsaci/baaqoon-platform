import { setup } from "xstate";
import { SubmissionStatus } from "@prisma/client";

export interface SubmissionContext {
  submissionId: string;
  assessmentId: string;
  studentId: string;
  score?: number;
  feedback?: string;
  gradedById?: string;
}

export type SubmissionEvent =
  | { type: "SUBMIT" }
  | { type: "GRADE"; score: number; feedback?: string; gradedById: string }
  | { type: "RETURN"; feedback: string; gradedById: string }
  | { type: "RESUBMIT" };

/**
 * XState v5 Machine for Assessment Submission Lifecycle
 */
export const submissionMachine = setup({
  types: {
    context: {} as SubmissionContext,
    events: {} as SubmissionEvent,
  },
  guards: {
    hasFeedbackForReturn: ({ event }) =>
      event.type === "RETURN" && !!event.feedback && event.feedback.length > 0,
    isValidScore: ({ event }) => event.type === "GRADE" && event.score >= 0,
  },
  actions: {
    assignGrade: ({ context, event }) => {
      if (event.type === "GRADE") {
        context.score = event.score;
        context.feedback = event.feedback;
        context.gradedById = event.gradedById;
      }
    },
    assignReturnFeedback: ({ context, event }) => {
      if (event.type === "RETURN") {
        context.feedback = event.feedback;
        context.gradedById = event.gradedById;
      }
    },
  },
}).createMachine({
  id: "submission",
  initial: "draft",
  context: {
    submissionId: "",
    assessmentId: "",
    studentId: "",
  },
  states: {
    draft: {
      on: {
        SUBMIT: { target: "submitted" },
      },
    },
    submitted: {
      on: {
        GRADE: {
          guard: "isValidScore",
          target: "graded",
          actions: "assignGrade",
        },
        RETURN: {
          guard: "hasFeedbackForReturn",
          target: "returned",
          actions: "assignReturnFeedback",
        },
      },
    },
    returned: {
      on: {
        RESUBMIT: { target: "resubmitted" },
      },
    },
    resubmitted: {
      on: {
        GRADE: {
          guard: "isValidScore",
          target: "graded",
          actions: "assignGrade",
        },
        RETURN: {
          guard: "hasFeedbackForReturn",
          target: "returned",
          actions: "assignReturnFeedback",
        },
      },
    },
    graded: {
      // Once graded, it could theoretically be re-graded, but we'll treat it as final for this flow
      type: "final",
    },
  },
});
