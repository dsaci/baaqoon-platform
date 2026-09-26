import { setup } from "xstate";
import { SessionStatus } from "@prisma/client";

export interface SessionContext {
  sessionId: string;
  cohortId: string;
  teacherId: string;
  jitsiRoomName?: string;
  cancellationReason?: string;
}

export type SessionEvent =
  | { type: "OPEN" }
  | { type: "START"; jitsiRoomName: string }
  | { type: "COMPLETE" }
  | { type: "CANCEL"; reason: string }
  | { type: "RESCHEDULE"; newSessionId: string };

/**
 * XState v5 Machine for Session Lifecycle
 * Enforces strict transitions according to the Master Architecture.
 */
export const sessionMachine = setup({
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
  },
  guards: {
    hasCancellationReason: ({ event }) =>
      event.type === "CANCEL" && !!event.reason && event.reason.length > 0,
  },
  actions: {
    setCancellationReason: ({ context, event }) => {
      if (event.type === "CANCEL") {
        context.cancellationReason = event.reason;
      }
    },
    setJitsiRoom: ({ context, event }) => {
      if (event.type === "START") {
        context.jitsiRoomName = event.jitsiRoomName;
      }
    },
  },
}).createMachine({
  id: "session",
  initial: "scheduled",
  context: {
    sessionId: "",
    cohortId: "",
    teacherId: "",
  },
  states: {
    scheduled: {
      on: {
        OPEN: { target: "open" },
        CANCEL: {
          guard: "hasCancellationReason",
          target: "cancelled",
          actions: "setCancellationReason",
        },
        RESCHEDULE: { target: "rescheduled" },
      },
    },
    open: {
      on: {
        START: {
          target: "in_progress",
          actions: "setJitsiRoom",
        },
        CANCEL: {
          guard: "hasCancellationReason",
          target: "cancelled",
          actions: "setCancellationReason",
        },
      },
    },
    in_progress: {
      on: {
        COMPLETE: { target: "completed" },
      },
    },
    completed: { type: "final" },
    cancelled: { type: "final" },
    rescheduled: { type: "final" },
  },
});
