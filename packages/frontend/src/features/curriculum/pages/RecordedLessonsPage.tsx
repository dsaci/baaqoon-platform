import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import StudentRecordedLessonsView from "../components/recorded-lessons/StudentRecordedLessonsView";
import RecordedLessonsStaffView from "../components/recorded-lessons/RecordedLessonsStaffView";

export default function RecordedLessonsPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const lessonIdFromUrl = searchParams.get("lessonId");

  const isStudent = user?.primaryRole === "student";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      {isStudent ? (
        <StudentRecordedLessonsView initialLessonId={lessonIdFromUrl} />
      ) : (
        <RecordedLessonsStaffView />
      )}
    </div>
  );
}
