import React, { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./i18n";
import logo from "./assets/logo.jpg";

// Auth
import LoginPage from "./features/auth/pages/LoginPage";
import ComingSoonPage from "./features/shared/pages/ComingSoonPage";
import RegisterPage from "./features/auth/pages/RegisterPage";

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

// Supervisor Pages
import SupervisorDashboard from "./features/supervisor/pages/SupervisorDashboard";

// Shared Pages
import VirtualClassroom from "./features/scheduling/pages/VirtualClassroom";
import SchedulePage from "./features/scheduling/pages/SchedulePage";
import TimetablePage from "./features/scheduling/pages/TimetablePage";
import ChatPage from "./features/chat/pages/ChatPage";
import AssessmentsPage from "./features/assessments/pages/AssessmentsPage";
import GradingPage from "./features/assessments/pages/GradingPage";
import PlaceholderPage from "./components/shared/PlaceholderPage";

// Curriculum
import TextbooksPage from "./features/curriculum/pages/TextbooksPage";

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

  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.primaryRole)) {
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

// ─── App Router ───────────────────────────────────────────────────────────────
function App() {
  const { user, token, initialize, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        try {
          const res = await api.get('/auth/me');
          initialize(res.data);
        } catch (err) {
          logout();
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [token, user, initialize, logout]);

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
        <Route path="distribution" element={<ComingSoonPage />} />
        <Route path="cohorts" element={<CohortsPage />} />
        <Route path="cohorts/:cohortId" element={<CohortDetailPage />} />
        <Route path="schedule" element={<TimetablePage />} />
        <Route path="curriculum" element={<SchedulePage />} />
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
        <Route path="schedule" element={<TimetablePage />} />
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
        <Route path="distribution" element={<ComingSoonPage />} />
        <Route
          path="database"
          element={<PlaceholderPage title="قريباً" />}
        />
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
        <Route path="distribution" element={<ComingSoonPage />} />
        <Route
          path="teachers"
          element={<PlaceholderPage title="قريباً" />}
        />
        <Route path="schedule" element={<TimetablePage />} />
        <Route
          path="exam-prep"
          element={<PlaceholderPage title="قريباً" />}
        />
      </Route>
    </Routes>
  );
}

export default App;
