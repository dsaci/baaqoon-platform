import { setup } from "xstate";
import { EnrollmentStatus } from "@prisma/client";

export interface EnrollmentContext {
  enrollmentId: string;
  cohortId: string;
  studentId: string;
  withdrawalReason?: string;
  failureMessage?: string;
}

export type EnrollmentEvent =
  | { type: "APPROVE" }
  | { type: "WAITLIST" }
  | { type: "COMPLETE" }
  | { type: "WITHDRAW"; reason: string }
  | { type: "SUSPEND"; reason: string }
  | { type: "REINSTATE" };

/**
 * XState v5 Machine for Student Enrollment
 * Enforces strict transitions according to the Master Architecture.
 */
export const enrollmentMachine = setup({
  types: {
    context: {} as EnrollmentContext,
    events: {} as EnrollmentEvent,
  },
  guards: {
    hasWithdrawalReason: ({ event }) =>
      event.type === "WITHDRAW" && !!event.reason && event.reason.length > 0,
    hasSuspendReason: ({ event }) =>
      event.type === "SUSPEND" && !!event.reason && event.reason.length > 0,
  },
  actions: {
    setWithdrawalReason: ({ context, event }) => {
      if (event.type === "WITHDRAW") {
        context.withdrawalReason = event.reason;
      }
    },
  },
}).createMachine({
  id: "enrollment",
  initial: "applied", // Initial state mapped from DB string
  context: {
    enrollmentId: "",
    cohortId: "",
    studentId: "",
  },
  states: {
    applied: {
      on: {
        APPROVE: { target: "enrolled" },
        WAITLIST: { target: "waitlisted" },
      },
    },
    waitlisted: {
      on: {
        APPROVE: { target: "enrolled" },
      },
    },
    enrolled: {
      on: {
        COMPLETE: { target: "completed" },
        WITHDRAW: {
          guard: "hasWithdrawalReason",
          target: "withdrawn",
          actions: "setWithdrawalReason",
        },
        SUSPEND: {
          guard: "hasSuspendReason",
          target: "suspended",
        },
      },
    },
    suspended: {
      on: {
        REINSTATE: { target: "enrolled" },
        WITHDRAW: {
          guard: "hasWithdrawalReason",
          target: "withdrawn",
          actions: "setWithdrawalReason",
        },
      },
    },
    completed: {
      type: "final",
    },
    withdrawn: {
      type: "final",
    },
  },
});
