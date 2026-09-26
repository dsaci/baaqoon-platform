import { Injectable } from "@nestjs/common";
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";
import { User, UserRole } from "@prisma/client";

export enum Action {
  Manage = "manage",
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
}

// Map strings to classes or use strings directly for CASL subjects
// To keep it simple but powerful, we use Prisma model names as subjects
export type Subjects = InferSubjects<any> | "all";
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    switch (user.primaryRole) {
      case UserRole.super_admin:
        can(Action.Manage, "all");
        break;

      case UserRole.subject_supervisor:
        can(Action.Manage, "Cohort");
        can(Action.Manage, "Session");
        can(Action.Read, "User");
        cannot(Action.Delete, "User");
        break;

      case UserRole.teacher:
        can(Action.Read, "Cohort");
        can(Action.Manage, "Session", { teacherId: user.id });
        can(Action.Manage, "Assessment", { createdBy: user.id });
        can(Action.Read, "StudentProfile");
        break;

      case UserRole.student:
        can(Action.Read, "Cohort");
        can(Action.Read, "Session");
        can(Action.Create, "AssessmentSubmission");
        cannot(Action.Read, "AssessmentSubmission", {
          studentId: { $ne: user.id },
        });
        break;

      case UserRole.tech_support:
        can(Action.Read, "User");
        can(Action.Update, "User", {
          fieldsAllowed: ["passwordHash", "status"],
        });
        break;
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
