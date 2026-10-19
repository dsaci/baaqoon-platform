import React, { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./i18n";
import logo from "./assets/logo.jpg";

// Auth
import LoginPage from "./features/auth/pages/LoginPage";
import ComingSoonPage from "./features/shared/pages/ComingSoonPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import VolunteerPortalPage from "./features/auth/pages/VolunteerPortalPage";
import VolunteerManagementPage from "./features/admin/pages/VolunteerManagementPage";
import SupervisorVolunteersPage from "./features/supervisor/pages/SupervisorVolunteersPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Teacher Pages
import TeacherDashboard from "./features/teacher/pages/TeacherDashboard";
import CohortsPage from "./features/teacher/pages/CohortsPage";
import CohortDetailPage from "./features/teacher/pages/CohortDetailPage";

// Student Pages
import StudentDashboard from "./features/student/pages/StudentDashboard";
import TakeAssessmentPage from "./features/student/pages/TakeAssessmentPage";

// Admin Pages
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import AdminDatabasePage from "./features/admin/pages/AdminDatabasePage";
import DistributionAdminPage from "./features/admin/pages/DistributionAdminPage";
import AnalyticsReportsPage from "./features/admin/pages/AnalyticsReportsPage";

// Supervisor Pages
import SupervisorDashboard from "./features/supervisor/pages/SupervisorDashboard";
import SupervisorTeachersPage from "./features/supervisor/pages/SupervisorTeachersPage";
import SupervisorCohortsPage from "./features/supervisor/pages/SupervisorCohortsPage";
import ExamPrepPage from "./features/supervisor/pages/ExamPrepPage";

// Shared Pages
import VirtualClassroom from "./features/scheduling/pages/VirtualClassroom";
import SchedulePage from "./features/scheduling/pages/SchedulePage";
import TimetablePage from "./features/scheduling/pages/TimetablePage";
import ChatPage from "./features/chat/pages/ChatPage";
import AssessmentsPage from "./features/assessments/pages/AssessmentsPage";
import GradingPage from "./features/assessments/pages/GradingPage";
import SyllabusDistributionPage from "./features/curriculum/pages/SyllabusDistributionPage";
import PlaceholderPage from "./components/shared/PlaceholderPage";

// Curriculum
import TextbooksPage from "./features/curriculum/pages/TextbooksPage";
import RecordedLessonsPage from "./features/curriculum/pages/RecordedLessonsPage";

// Store
import { useAuthStore } from "./store/useAuthStore";

// ─── Protected Route ─────────────────────────────────────────────────────────
const PrivateRoute = ({
  children,
  allowedRole,
}: {
  children: JSX.Element;
  allowedRole?: string | string[];
}) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;

  const isTeacherOrSupervisor = Boolean(
    user.primaryRole === 'teacher' || 
    user.primaryRole === 'subject_supervisor' || 
    user.isDualRole ||
    (Array.isArray(user.roles) && user.roles.includes('teacher'))
  );
  if (isTeacherOrSupervisor && !user.supervisedSubjectId) {
    if (window.location.pathname.startsWith('/sessions/')) {
      return <Navigate to={`/${user.primaryRole}/dashboard`} replace />;
    }
  }

  if (user.mustChangePassword) {
    if (window.location.pathname.startsWith('/sessions/')) {
      return <Navigate to={`/${user.primaryRole}/dashboard`} replace />;
    }
  }

  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    const userRoles = Array.from(
      new Set([
        user.primaryRole,
        ...(Array.isArray(user.roles) ? user.roles : []),
        ...(user.isDualRole ? ['teacher', 'subject_supervisor'] : []),
      ])
    );

    const hasAccess = roles.some((r) => userRoles.includes(r as any));
    if (!hasAccess) {
      if (user.primaryRole === 'subject_supervisor' || user.primaryRole === 'supervisor') {
        return <Navigate to="/supervisor/dashboard" replace />;
      }
      if (user.primaryRole === 'super_admin' || user.primaryRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to={`/${user.primaryRole}/dashboard`} replace />;
    }
  }

  return children;
};

import LandingPage from "./features/landing/pages/LandingPage";

import { api } from "./lib/axios";

import { useThemeStore } from "./store/useThemeStore";

// ─── App Router ───────────────────────────────────────────────────────────────
function App() {
  const { user, token, initialize, logout } = useAuthStore();
  const { isDark, refreshSystemTheme } = useThemeStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark]);

  // Automatically adapt theme according to time of day when in 'system' mode
  useEffect(() => {
    const timer = setInterval(() => {
      refreshSystemTheme();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, [refreshSystemTheme]);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          initialize(res.data);
        } catch (err) {
          if (!user) logout();
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [token]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baaqoon-50 dark:bg-baaqoon-950">
        <div className="w-12 h-12 border-4 border-baaqoon-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/volunteer" element={<VolunteerPortalPage />} />
      <Route path="/apply-teacher" element={<VolunteerPortalPage />} />

      {/* Fullscreen Virtual Classroom (no sidebar) */}
      <Route
        path="/sessions/:sessionId/room"
        element={
          <PrivateRoute>
            <VirtualClassroom />
          </PrivateRoute>
        }
      />

      {/* ── Teacher Routes ─────────────────────────────────────────────────── */}
      <Route
        path="/teacher"
        element={
          <PrivateRoute allowedRole="teacher">
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="coming-soon-articles" element={<ComingSoonPage />} />
          <Route path="distribution" element={<SyllabusDistributionPage />} />
        
        <Route path="cohorts" element={<CohortsPage />} />
        <Route path="cohorts/:cohortId" element={<CohortDetailPage />} />
        <Route path="schedule" element={<TimetablePage />} />
        <Route path="curriculum" element={<SchedulePage />} />
        <Route path="recorded-lessons" element={<RecordedLessonsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route
          path="assessments/:assessmentId/grade"
          element={<GradingPage />}
        />
        <Route path="textbooks" element={<TextbooksPage />} />
      </Route>

      {/* ── Student Routes ─────────────────────────────────────────────────── */}
      <Route
        path="/student"
        element={
          <PrivateRoute allowedRole="student">
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="coming-soon-articles" element={<ComingSoonPage />} />
        <Route path="distribution" element={<SyllabusDistributionPage />} />
        <Route path="schedule" element={<TimetablePage />} />
        <Route path="recorded-lessons" element={<RecordedLessonsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="assessments/:assessmentId/take" element={<TakeAssessmentPage />} />
        <Route path="textbooks" element={<TextbooksPage />} />
      </Route>

      {/* ── Admin Routes (فضاء المؤسسة) ────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRole={["super_admin", "admin"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="reports" element={<AnalyticsReportsPage />} />
        <Route path="coming-soon-articles" element={<ComingSoonPage />} />
        <Route path="distribution" element={<DistributionAdminPage />} />
        <Route path="recorded-lessons" element={<RecordedLessonsPage />} />
        <Route path="database" element={<AdminDatabasePage />} />
        <Route path="volunteers" element={<VolunteerManagementPage />} />
      </Route>
      {/* ── Supervisor Routes (الإشراف) ──────────────────────────────────────── */}
      <Route
        path="/supervisor"
        element={
          <PrivateRoute allowedRole={["super_admin", "supervisor", "subject_supervisor"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="reports" element={<AnalyticsReportsPage />} />
        <Route path="coming-soon-articles" element={<ComingSoonPage />} />
        <Route path="distribution" element={<SyllabusDistributionPage />} />
        <Route path="recorded-lessons" element={<RecordedLessonsPage />} />
        <Route path="teachers" element={<SupervisorTeachersPage />} />
        <Route path="cohorts" element={<SupervisorCohortsPage />} />
        <Route path="volunteers" element={<SupervisorVolunteersPage />} />
        <Route path="schedule" element={<TimetablePage />} />
        <Route path="exam-prep" element={<ExamPrepPage />} />
      </Route>
    </Routes>
  );
}

export default App;
