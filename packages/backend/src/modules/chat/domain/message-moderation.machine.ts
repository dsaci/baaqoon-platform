import { setup } from "xstate";
import { MessageStatus } from "@prisma/client";

export interface MessageContext {
  messageId: string;
  moderationReason?: string;
}

export type MessageEvent =
  | { type: "MARK_SAFE" }
  | { type: "FLAG"; reason: string }
  | { type: "BLOCK"; reason: string }
  | { type: "REQUIRE_REVIEW" }
  | { type: "APPROVE" }
  | { type: "REJECT" };

/**
 * XState v5 Machine for Message Moderation Pipeline
 */
export const messageModerationMachine = setup({
  types: {
    context: {} as MessageContext,
    events: {} as MessageEvent,
  },
  actions: {
    setReason: ({ context, event }) => {
      if (event.type === "FLAG" || event.type === "BLOCK") {
        context.moderationReason = event.reason;
      }
    },
  },
}).createMachine({
  id: "messageModeration",
  initial: "pending_scan",
  context: {
    messageId: "",
  },
  states: {
    pending_scan: {
      on: {
        MARK_SAFE: { target: "safe" },
        FLAG: { target: "flagged", actions: "setReason" },
        BLOCK: { target: "blocked", actions: "setReason" },
      },
    },
    flagged: {
      on: {
        REQUIRE_REVIEW: { target: "manual_review" },
        APPROVE: { target: "approved" },
        REJECT: { target: "rejected" },
      },
    },
    blocked: {
      on: {
        REQUIRE_REVIEW: { target: "manual_review" },
      },
    },
    manual_review: {
      on: {
        APPROVE: { target: "approved" },
        REJECT: { target: "rejected" },
      },
    },
    safe: { type: "final" },
    approved: { type: "final" },
    rejected: { type: "final" },
  },
});
