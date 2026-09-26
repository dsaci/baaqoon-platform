import { SetMetadata } from "@nestjs/common";
import { Action, Subjects } from "./casl-ability.factory";

export interface PolicyHandler {
  handle(ability: any): boolean;
}

export type PolicyHandlerCallback = (ability: any) => boolean;

export const CHECK_POLICIES_KEY = "check_policy";

export const CheckPolicies = (...handlers: PolicyHandlerCallback[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
