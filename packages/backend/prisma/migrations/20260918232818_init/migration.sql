-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "assessments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "attendance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chat";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "curriculum";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "groups";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notifications";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "scheduling";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('super_admin', 'subject_supervisor', 'tech_support', 'teacher', 'student');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('pending', 'active', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "curriculum"."AcademicBranch" AS ENUM ('scientific', 'literary', 'commercial', 'industrial', 'sharia');

-- CreateEnum
CREATE TYPE "curriculum"."GradeLevel" AS ENUM ('grade_11', 'grade_12');

-- CreateEnum
CREATE TYPE "curriculum"."CurriculumType" AS ENUM ('palestinian', 'azhari');

-- CreateEnum
CREATE TYPE "curriculum"."CurriculumStatus" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "groups"."CohortStatus" AS ENUM ('draft', 'recruiting', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "groups"."EnrollmentStatus" AS ENUM ('applied', 'enrolled', 'waitlisted', 'completed', 'withdrawn', 'suspended');

-- CreateEnum
CREATE TYPE "scheduling"."SessionStatus" AS ENUM ('scheduled', 'open', 'in_progress', 'completed', 'cancelled', 'rescheduled');

-- CreateEnum
CREATE TYPE "attendance"."AttendanceStatus" AS ENUM ('present', 'late', 'absent_excused', 'absent_unexcused', 'left_early');

-- CreateEnum
CREATE TYPE "attendance"."AttendanceEventType" AS ENUM ('joined', 'left', 'heartbeat');

-- CreateEnum
CREATE TYPE "assessments"."AssessmentType" AS ENUM ('quiz', 'assignment', 'exam', 'project');

-- CreateEnum
CREATE TYPE "assessments"."SubmissionStatus" AS ENUM ('draft', 'submitted', 'graded', 'returned', 'resubmitted');

-- CreateEnum
CREATE TYPE "chat"."ConversationType" AS ENUM ('private', 'cohort_group');

-- CreateEnum
CREATE TYPE "chat"."MessageStatus" AS ENUM ('pending_scan', 'safe', 'flagged', 'blocked', 'manual_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "chat"."ReportStatus" AS ENUM ('submitted', 'investigating', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "notifications"."NotificationType" AS ENUM ('system', 'enrollment', 'session_reminder', 'assessment', 'chat_mention');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(32),
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "avatarUrl" VARCHAR(1024),
    "primaryRole" "auth"."UserRole" NOT NULL,
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'pending',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Gaza',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'ar',
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_roles" (
    "userId" UUID NOT NULL,
    "role" "auth"."UserRole" NOT NULL,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedById" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "curriculum"."subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "nameAr" VARCHAR(150) NOT NULL,
    "nameEn" VARCHAR(150),
    "description" TEXT,
    "iconUrl" VARCHAR(1024),
    "applicableBranches" "curriculum"."AcademicBranch"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum"."courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subjectId" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "curriculumType" "curriculum"."CurriculumType" NOT NULL,
    "academicBranch" "curriculum"."AcademicBranch" NOT NULL,
    "gradeLevel" "curriculum"."GradeLevel" NOT NULL,
    "academicYear" VARCHAR(9) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum"."curriculum_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "versionTag" VARCHAR(32) NOT NULL,
    "status" "curriculum"."CurriculumStatus" NOT NULL DEFAULT 'draft',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "changelog" TEXT,
    "publishedAt" TIMESTAMPTZ,
    "publishedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "curriculum_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum"."curriculum_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "curriculumVersionId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum"."curriculum_lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unitId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "learningObjectives" TEXT[],
    "estimatedDurationMinutes" SMALLINT,
    "teacherGuide" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "curriculum_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum"."curriculum_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lessonId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "sessionPlan" TEXT,
    "recommendedDurationMinutes" SMALLINT NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "curriculum_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups"."cohorts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "status" "groups"."CohortStatus" NOT NULL DEFAULT 'draft',
    "minStudents" SMALLINT NOT NULL DEFAULT 3,
    "maxStudents" SMALLINT NOT NULL DEFAULT 12,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups"."cohort_instructors" (
    "cohortId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'primary_teacher',
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" UUID,

    CONSTRAINT "cohort_instructors_pkey" PRIMARY KEY ("cohortId","teacherId")
);

-- CreateTable
CREATE TABLE "groups"."cohort_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohortId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "groups"."EnrollmentStatus" NOT NULL DEFAULT 'applied',
    "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "withdrawnAt" TIMESTAMPTZ,
    "withdrawalReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cohort_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling"."sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohortId" UUID NOT NULL,
    "curriculumSessionId" UUID,
    "teacherId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "scheduling"."SessionStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledStartTime" TIMESTAMPTZ NOT NULL,
    "scheduledEndTime" TIMESTAMPTZ NOT NULL,
    "actualStartTime" TIMESTAMPTZ,
    "actualEndTime" TIMESTAMPTZ,
    "jitsiRoomName" VARCHAR(255),
    "jitsiJwtToken" TEXT,
    "cancellationReason" TEXT,
    "rescheduledToId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."session_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "attendance"."AttendanceStatus" NOT NULL DEFAULT 'absent_unexcused',
    "firstEntryTime" TIMESTAMPTZ,
    "lastExitTime" TIMESTAMPTZ,
    "totalDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "markedById" UUID,
    "teacherNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."attendance_events" (
    "id" BIGSERIAL NOT NULL,
    "sessionAttendanceId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "eventType" "attendance"."AttendanceEventType" NOT NULL,
    "eventTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "clientDeviceInfo" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments"."assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohortId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "assessments"."AssessmentType" NOT NULL,
    "dueDate" TIMESTAMPTZ NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments"."assessment_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessmentId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(1024) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments"."assessment_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "assessments"."SubmissionStatus" NOT NULL DEFAULT 'draft',
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "submittedAt" TIMESTAMPTZ,
    "gradedAt" TIMESTAMPTZ,
    "gradedById" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments"."submission_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submissionId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" VARCHAR(1024) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohortId" UUID,
    "type" "chat"."ConversationType" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."conversation_participants" (
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMPTZ,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "chat"."messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "chat"."MessageStatus" NOT NULL DEFAULT 'pending_scan',
    "version" INTEGER NOT NULL DEFAULT 1,
    "moderationReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "chat"."ReportStatus" NOT NULL DEFAULT 'submitted',
    "resolutionNotes" TEXT,
    "resolvedById" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,
    "type" "notifications"."NotificationType" NOT NULL DEFAULT 'system',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "curriculum"."subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "curriculum"."courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "curriculum"."courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_versions_courseId_versionTag_key" ON "curriculum"."curriculum_versions"("courseId", "versionTag");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_units_curriculumVersionId_orderIndex_key" ON "curriculum"."curriculum_units"("curriculumVersionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_lessons_unitId_orderIndex_key" ON "curriculum"."curriculum_lessons"("unitId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_sessions_lessonId_orderIndex_key" ON "curriculum"."curriculum_sessions"("lessonId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_code_key" ON "groups"."cohorts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_enrollments_cohortId_studentId_key" ON "groups"."cohort_enrollments"("cohortId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendance_sessionId_studentId_key" ON "attendance"."session_attendance"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_assessmentId_studentId_key" ON "assessments"."assessment_submissions"("assessmentId", "studentId");

-- AddForeignKey
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum"."courses" ADD CONSTRAINT "courses_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "curriculum"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum"."curriculum_versions" ADD CONSTRAINT "curriculum_versions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "curriculum"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum"."curriculum_units" ADD CONSTRAINT "curriculum_units_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "curriculum"."curriculum_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum"."curriculum_lessons" ADD CONSTRAINT "curriculum_lessons_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "curriculum"."curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum"."curriculum_sessions" ADD CONSTRAINT "curriculum_sessions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "curriculum"."curriculum_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups"."cohort_instructors" ADD CONSTRAINT "cohort_instructors_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "groups"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups"."cohort_enrollments" ADD CONSTRAINT "cohort_enrollments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "groups"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling"."sessions" ADD CONSTRAINT "sessions_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "groups"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling"."sessions" ADD CONSTRAINT "sessions_curriculumSessionId_fkey" FOREIGN KEY ("curriculumSessionId") REFERENCES "curriculum"."curriculum_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling"."sessions" ADD CONSTRAINT "sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling"."sessions" ADD CONSTRAINT "sessions_rescheduledToId_fkey" FOREIGN KEY ("rescheduledToId") REFERENCES "scheduling"."sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."session_attendance" ADD CONSTRAINT "session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "scheduling"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."session_attendance" ADD CONSTRAINT "session_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."session_attendance" ADD CONSTRAINT "session_attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."attendance_events" ADD CONSTRAINT "attendance_events_sessionAttendanceId_fkey" FOREIGN KEY ("sessionAttendanceId") REFERENCES "attendance"."session_attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessments" ADD CONSTRAINT "assessments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "groups"."cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessments" ADD CONSTRAINT "assessments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessment_attachments" ADD CONSTRAINT "assessment_attachments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"."assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessment_submissions" ADD CONSTRAINT "assessment_submissions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"."assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessment_submissions" ADD CONSTRAINT "assessment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."assessment_submissions" ADD CONSTRAINT "assessment_submissions_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments"."submission_attachments" ADD CONSTRAINT "submission_attachments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assessments"."assessment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."reports" ADD CONSTRAINT "reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."reports" ADD CONSTRAINT "reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
