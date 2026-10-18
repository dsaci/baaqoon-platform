import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpg";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  LogOut,
  Menu,
  X,
  BookOpen,
  Activity,
  User,
  Settings,
  BarChart3,
  HelpCircle,
  ArrowRightLeft,
  ShieldCheck,
  GraduationCap,
  ShieldAlert,
  Video,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import WelcomeModal from "../shared/WelcomeModal";
import ThemeToggle from "../shared/ThemeToggle";
import LangToggle from "../shared/LangToggle";
import { useTranslation } from "react-i18next";

import ProfileModal from "../shared/ProfileModal";
import CompleteContactModal from "../shared/CompleteContactModal";
import MandatorySubjectGate from "../shared/MandatorySubjectGate";
import ForceChangePasswordGate from "../shared/ForceChangePasswordGate";
import UserAvatar from "../shared/UserAvatar";
import AppTour from "../tour/AppTour";
import PlatformGuideModal from "../guide/PlatformGuideModal";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCompleteContactOpen, setIsCompleteContactOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const isMissingEmail = !user?.email || user.email.trim() === '';
  const isMissingPhone = !user?.phone || user.phone.trim() === '';
  const isTeacherOrSupervisor = Boolean(
    user?.primaryRole === 'teacher' || 
    user?.primaryRole === 'subject_supervisor' || 
    user?.isDualRole ||
    (Array.isArray(user?.roles) && user!.roles!.includes('teacher'))
  );
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const isMissingSubject = Boolean(isTeacherOrSupervisor && !user?.supervisedSubjectId);
  const isLocked = Boolean(isMissingSubject || mustChangePassword);
  const isMissingNationality = !user?.nationality || user.nationality.trim() === '';
  const hasIncompleteContact = Boolean(user && (isMissingEmail || isMissingPhone || isMissingSubject || isMissingNationality));

  const missingFieldsList: string[] = [];
  if (isMissingSubject) {
    missingFieldsList.push(user?.primaryRole === 'teacher' ? (isRtl ? 'مادة التدريس' : 'Teaching Subject') : (isRtl ? 'مادة التنسيق' : 'Supervision Subject'));
  }
  if (isMissingNationality) {
    missingFieldsList.push(isRtl ? 'الجنسية' : 'Nationality');
  }
  if (isMissingEmail) {
    missingFieldsList.push(isRtl ? 'البريد الإلكتروني' : 'Email');
  }
  if (isMissingPhone) {
    missingFieldsList.push(isRtl ? 'رقم الهاتف' : 'Phone');
  }
  const missingContactText = missingFieldsList.join(isRtl ? ' و ' : ' & ');

  // Auto-prompt teachers who haven't set their teaching subject yet
  useEffect(() => {
    if (user && isMissingSubject) {
      setIsCompleteContactOpen(true);
    }
  }, [user?.id, isMissingSubject]);

  // Listen to open guide custom event
  useEffect(() => {
    const handleOpenGuide = () => setIsGuideOpen(true);
    window.addEventListener("baaqoon:open_guide", handleOpenGuide);
    return () => window.removeEventListener("baaqoon:open_guide", handleOpenGuide);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRoles = Array.from(
    new Set([
      user?.primaryRole,
      ...(Array.isArray(user?.roles) ? user!.roles! : []),
      ...(user?.isDualRole ? ["teacher", "subject_supervisor"] : []),
    ].filter(Boolean))
  );

  const canSwitchTeacherSupervisor = Boolean(
    user?.isDualRole ||
      (userRoles.includes("teacher") &&
        (userRoles.includes("subject_supervisor") || userRoles.includes("supervisor")))
  );

  const isInTeacherSpace = location.pathname.startsWith("/teacher");
  const isInSupervisorSpace = location.pathname.startsWith("/supervisor");
  const isTeacherWorkspace = isInTeacherSpace;
  const isSupervisorWorkspace = isInSupervisorSpace;

  // Determine navigation links based on role and active workspace
  const getNavLinks = () => {
    if (user?.primaryRole === "super_admin") {
      return [
        {
          name: t("nav.admin_dashboard", "فضاء المؤسسة (المدير)"),
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: t("nav.reports", "الإحصائيات والتقارير"), path: "/admin/reports", icon: BarChart3 },
        { name: t("nav.academic_distribution", "الإسناد الأكاديمي"), path: "/admin/distribution", icon: Calendar },
        { name: t("nav.recorded_lessons", "الدروس المسجلة 🎥"), path: "/admin/recorded-lessons", icon: Video },
        { name: t("nav.database", "قاعدة البيانات"), path: "/admin/database", icon: Users },
        {
          name: t("nav.supervisor_panel", "لوحة الإشراف التربوي"),
          path: "/supervisor/dashboard",
          icon: Activity,
        },
      ];
    }

    if (user?.primaryRole === "admin") {
      return [
        {
          name: t("nav.institution_space", "فضاء المؤسسة"),
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: t("nav.reports", "الإحصائيات والتقارير"), path: "/admin/reports", icon: BarChart3 },
        { name: t("nav.academic_distribution", "الإسناد الأكاديمي"), path: "/admin/distribution", icon: Calendar },
        { name: t("nav.recorded_lessons", "الدروس المسجلة 🎥"), path: "/admin/recorded-lessons", icon: Video },
        { name: t("nav.database", "قاعدة البيانات"), path: "/admin/database", icon: Users },
      ];
    }

    const teacherLinks = [
      {
        name: t("nav.dashboard", "الرئيسية (التدريس)"),
        path: "/teacher/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: t("nav.cohorts", "الأفواج"),
        path: "/teacher/cohorts",
        icon: Users,
      },
      {
        name: t("nav.curriculum_builder", "بناء الحصص (المناهج)"),
        path: "/teacher/curriculum",
        icon: BookOpen,
      },
      {
        name: t("nav.recorded_lessons", "الدروس المسجلة 🎥"),
        path: "/teacher/recorded-lessons",
        icon: Video,
      },
      {
        name: t("nav.assessments", "الواجبات"),
        path: "/teacher/assessments",
        icon: FileText,
      },
      {
        name: t("nav.schedule", "الجدول والحصص"),
        path: "/teacher/schedule",
        icon: Calendar,
      },
      {
        name: t("nav.textbooks", "المكتبة الرقمية"),
        path: "/teacher/textbooks",
        icon: BookOpen,
      },
      {
        name: t("nav.distribution_teacher", "التوزيع السنوي والأسبوعي"),
        path: "/teacher/distribution",
        icon: Calendar,
      },
      {
        name: t("nav.chat", "المحادثات"),
        path: "/teacher/chat",
        icon: MessageSquare,
      },
    ];

    const supervisorLinks = [
      {
        name: t("nav.dashboard", "لوحة الإشراف والتنسيق"),
        path: "/supervisor/dashboard",
        icon: LayoutDashboard,
      },
      { name: t("nav.reports", "الإحصائيات والتقارير"), path: "/supervisor/reports", icon: BarChart3 },
      { name: t("nav.teachers", "الأساتذة"), path: "/supervisor/teachers", icon: Users },
      { name: t("nav.cohorts", "الأفواج والشواغر"), path: "/supervisor/cohorts", icon: GraduationCap },
      {
        name: t("nav.recorded_lessons", "الدروس المسجلة 🎥"),
        path: "/supervisor/recorded-lessons",
        icon: Video,
      },
      { name: t("nav.distribution", "التوزيع السنوي والشهري"), path: "/supervisor/distribution", icon: Calendar },
      {
        name: t("nav.schedule_weekly", "الجدول الأسبوعي"),
        path: "/supervisor/schedule",
        icon: Calendar,
      },
      {
        name: t("nav.exam_prep", "متابعة الامتحانات"),
        path: "/supervisor/exam-prep",
        icon: BookOpen,
      },
    ];

    if (canSwitchTeacherSupervisor) {
      return isInTeacherSpace ? teacherLinks : supervisorLinks;
    }

    if (user?.primaryRole === "supervisor" || user?.primaryRole === "subject_supervisor") {
      return supervisorLinks;
    }

    if (user?.primaryRole === "teacher") {
      return teacherLinks;
    }

    if (user?.primaryRole === "student") {
      return [
        {
          name: t("nav.dashboard", "الرئيسية"),
          path: "/student/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: t("nav.recorded_lessons", "الدروس المسجلة 🎥"),
          path: "/student/recorded-lessons",
          icon: Video,
        },
        {
          name: t("nav.schedule", "الجدول والحصص"),
          path: "/student/schedule",
          icon: Calendar,
        },
        {
          name: t("nav.my_assessments", "واجباتي"),
          path: "/student/assessments",
          icon: FileText,
        },
        {
          name: t("nav.textbooks", "المكتبة الرقمية"),
          path: "/student/textbooks",
          icon: BookOpen,
        },
        {
          name: t("nav.chat", "المحادثات"),
          path: "/student/chat",
          icon: MessageSquare,
        },
      ];
    }

    return [
      {
        name: t("nav.dashboard", "الرئيسية"),
        path: `/${user?.primaryRole || "student"}/dashboard`,
        icon: LayoutDashboard,
      },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 flex" dir={isRtl ? "rtl" : "ltr"}>
      <AppTour />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-baaqoon-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 ${
          isRtl ? "right-0 border-l" : "left-0 border-r"
        } z-40 w-64 bg-white dark:bg-baaqoon-900/95 backdrop-blur-xl border-baaqoon-200 dark:border-baaqoon-800 flex flex-col shadow-2xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : isRtl
              ? "translate-x-full"
              : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between md:justify-center border-b border-baaqoon-100 dark:border-baaqoon-800 px-6 gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={logo}
              alt="باقون"
              className="w-10 h-10 mix-blend-multiply dark:mix-blend-normal object-contain"
            />
            <span className="text-xl font-bold text-baaqoon-900 dark:text-white">
              {isRtl ? "باقون" : "Baaqoon"}
            </span>
          </Link>
          {/* Mobile Close Button */}
          <button
            className="md:hidden text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-900 dark:hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {canSwitchTeacherSupervisor && (
            <div className="mb-4 p-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-emerald-950/50 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[11px] font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {isRtl ? "تبديل الصفة (تدريس / إشراف)" : "Switch Role Mode"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                  {isRtl ? "صفة ثنائية" : "Dual Role"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate("/supervisor/dashboard")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
                    isSupervisorWorkspace
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? "فضاء الإشراف" : "Supervision"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/teacher/dashboard")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all ${
                    isTeacherWorkspace
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-white"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? "فضاء التدريس" : "Teaching"}</span>
                </button>
              </div>
            </div>
          )}

          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={isLocked ? "#" : link.path}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isLocked ? "opacity-35 pointer-events-none cursor-not-allowed" : ""
                } ${
                  isActive
                    ? `${
                        isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"
                      } from-[#EDF2EB] to-[#F5F2EA] dark:from-[#2A3722]/50 dark:to-[#1F2A18]/50 text-[#394C2A] dark:text-[#A8C794] font-bold border border-[#D5CEBC]/60 dark:border-[#394C2A]/40 shadow-xs`
                    : "text-slate-600 dark:text-slate-400 hover:bg-[#F5F2EA] dark:hover:bg-slate-800/50 hover:text-[#19232D] dark:hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-baaqoon-100 dark:border-baaqoon-800">
            {/* دليل الاستخدام في القائمة الجانبية */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 mb-3 text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all border border-indigo-200/60 dark:border-indigo-800/60 text-xs sm:text-sm font-bold shadow-xs group"
            >
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>{t("guide.button", "دليل الاستخدام والأزرار")}</span>
            </button>

            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                role={user?.primaryRole}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={`text-xs text-slate-500 dark:text-slate-400 truncate dir-ltr ${isRtl ? 'text-right' : 'text-left'}`}>
                  {user?.email || 'user@baaqoon.ps'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium text-sm"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>{t("common.logout", "تسجيل الخروج")}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Watermark Logo */}
        <div className={`absolute -bottom-16 ${isRtl ? '-left-16' : '-right-16'} pointer-events-none opacity-[0.04] z-0`}>
          <img
            src={logo}
            alt="Watermark"
            className="w-[40rem] h-[40rem] mix-blend-multiply object-contain grayscale"
          />
        </div>

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-baaqoon-900/80 backdrop-blur-md border-b border-baaqoon-200 dark:border-baaqoon-800 flex items-center justify-between px-4 md:px-8 relative z-40">
          <div className="flex items-center gap-4 md:hidden">
            <button
              className="text-baaqoon-600 dark:text-baaqoon-400 hover:text-baaqoon-900 dark:hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="باقون"
                className="w-8 h-8 mix-blend-multiply dark:mix-blend-normal object-contain"
              />
              <span className="text-xl font-bold text-baaqoon-900 dark:text-white">
                {isRtl ? "باقون" : "Baaqoon"}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-baaqoon-900 dark:text-white font-medium text-lg">
            <span>
              {navLinks.find((l) => location.pathname.startsWith(l.path))
                ?.name || t("nav.dashboard", "الرئيسية")}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {canSwitchTeacherSupervisor && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    isTeacherWorkspace
                      ? "/supervisor/dashboard"
                      : "/teacher/dashboard"
                  )
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm border transition-all shadow-xs ${
                  isTeacherWorkspace
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                }`}
                title={
                  isTeacherWorkspace
                    ? "الانتقال إلى لوحة الإشراف والتنسيق الأكاديمي"
                    : "الانتقال إلى لوحة التدريس وأفواجي الدراسية"
                }
              >
                <ArrowRightLeft className="w-4 h-4 shrink-0" />
                <span>
                  {isTeacherWorkspace
                    ? isRtl
                      ? "الانتقال لفضاء الإشراف"
                      : "Switch to Supervision"
                    : isRtl
                      ? "الانتقال لفضاء التدريس"
                      : "Switch to Teaching"}
                </span>
              </button>
            )}

            <Link
              to="/"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-baaqoon-600 dark:text-baaqoon-400 hover:text-baaqoon-900 dark:hover:text-white transition-colors"
            >
              {t("common.back_to_home", "العودة للرئيسية")}
            </Link>

            {/* زر دليل الاستخدام والأزرار الشامل */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-black text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800/80 transition-all shadow-xs"
              title={t("guide.title", "دليل استخدام المنصة وشرح الأزرار بالتفصيل")}
            >
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">{t("guide.button", "دليل الاستخدام والأزرار")}</span>
            </button>

            <NotificationBell />
            <LangToggle />
            <ThemeToggle />

            <div className="h-8 w-px bg-baaqoon-200 dark:bg-baaqoon-800 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center gap-3 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/50 p-1 ${isRtl ? 'pr-3 text-right' : 'pl-3 text-left'} rounded-xl transition-colors`}
                title={t("profile.title", "الملف الشخصي")}
              >
                <div className={`hidden sm:block ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm font-semibold text-baaqoon-900 dark:text-white transition-colors">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400 capitalize">
                    {user?.isDualRole
                      ? isRtl
                        ? "مشرف منسق + أستاذ (صفة ثنائية)"
                        : "Supervisor & Teacher"
                      : user?.primaryRole === "teacher"
                        ? t("roles.teacher", "أستاذ / أستاذة")
                        : user?.primaryRole === "student"
                          ? t("roles.student", "طالب / طالبة")
                          : user?.primaryRole === "subject_supervisor" || user?.primaryRole === "supervisor"
                            ? t("roles.supervisor", "مشرف / موجه تربوي")
                            : user?.primaryRole === "admin"
                              ? t("roles.admin", "مدير منصة")
                              : user?.primaryRole === "super_admin"
                                ? t("roles.super_admin", "مدير عام")
                                : t("roles.user", "مستخدم")}
                  </p>
                </div>
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  role={user?.primaryRole}
                  size="md"
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-full mt-2 w-56 bg-white dark:bg-baaqoon-900 rounded-xl shadow-lg border border-baaqoon-100 dark:border-baaqoon-800 overflow-hidden z-50`}>
                  <div className="p-4 border-b border-baaqoon-100 dark:border-baaqoon-800">
                    <p className="text-sm font-bold text-baaqoon-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400">
                      {user?.email || "user@baaqoon.ps"}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsGuideOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors font-bold"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{t("guide.button", "دليل استخدام المنصة والأزرار")}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>{t("profile.edit", "تعديل الملف الشخصي")}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        alert(isRtl ? "سيتم فتح شاشة إعدادات التنبيهات والخصوصية." : "Settings and privacy screen will open.");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      <span>{t("profile.settings", "إعدادات الحساب")}</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-baaqoon-100 dark:border-baaqoon-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{t("common.logout", "تسجيل الخروج")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10 bg-baaqoon-50 dark:bg-baaqoon-950 dark:text-slate-100">
          {/* Missing Contact / Subject Info Urgent Banner */}
          {hasIncompleteContact && (
            <div className={`mb-6 p-4.5 rounded-2xl ${isMissingSubject ? 'bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/20 border-purple-400/50 dark:bg-purple-950/80 dark:border-purple-500/70 dark:shadow-purple-950/50' : 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/20 border-amber-500/40 dark:bg-amber-950/80 dark:border-amber-500/70 dark:shadow-amber-950/50'} border backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-md`} dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl ${isMissingSubject ? 'bg-purple-600 dark:bg-purple-500 shadow-purple-600/30' : 'bg-amber-500 dark:bg-amber-500 shadow-amber-500/30'} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm sm:text-base font-black ${isMissingSubject ? 'text-purple-950 dark:text-purple-100' : 'text-amber-950 dark:text-amber-100'}`}>
                    {isRtl 
                      ? (isMissingSubject 
                          ? `تنبيه أكاديمي هام: حسابك يفتقر إلى ${missingContactText}` 
                          : `تنبيه أمني هام: حسابك يفتقر إلى ${missingContactText}`)
                      : `Important Alert: Your account is missing ${missingContactText}`}
                  </h4>
                  <p className={`text-xs sm:text-sm ${isMissingSubject ? 'text-purple-900/90 dark:text-purple-200' : 'text-amber-900/90 dark:text-amber-200'} font-bold mt-1 leading-relaxed`}>
                    {isRtl 
                      ? (isMissingSubject 
                          ? 'يرجى تحديد مادة التدريس الخاصة بك فوراً لتتمكن إدارة المنصة والمشرفون من تفويجك وإسناد الحصص والطلاب إليك والظهور في جدول الإسناد الأكاديمي.' 
                          : 'يرجى استكمال بياناتك الإلزامية لتأمين الحساب واستلام الإشعارات وضمان إمكانية استرجاعه بسهولة في حال نسيان كلمة المرور.')
                      : 'Please complete your mandatory profile information so administrators and supervisors can assign cohorts and manage your account properly.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompleteContactOpen(true)}
                className={`px-5 py-2.5 ${isMissingSubject ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/20 dark:bg-purple-500 dark:hover:bg-purple-400 dark:text-white' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/20 dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 dark:border-amber-300/50'} text-white text-xs sm:text-sm font-black rounded-xl shadow-lg whitespace-nowrap transition-all self-stretch sm:self-auto text-center cursor-pointer`}
              >
                {isRtl ? (isMissingSubject ? 'تحديد مادة التدريس واستكمال البيانات' : 'استكمال البيانات الآن') : 'Complete Info Now'}
              </button>
            </div>
          )}

          {mustChangePassword ? (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-800 space-y-3 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  استخدام الحساب معلّق مؤقتاً
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  يلزم تعيين كلمة مرور جديدة خاصة بك لتأمين حسابك قبل الدخول للمنصة وتصفح الحصص والأفواج.
                </p>
              </div>
            </div>
          ) : isMissingSubject ? (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-800 space-y-3 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  استخدام الحساب معلّق مؤقتاً
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  يلزم تحديد وتثبيت مادة التدريس الرسمية لمواصلة استخدام المنصة وتصفح الحصص والأفواج.
                </p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      {/* Smart Welcome Modal */}
      <WelcomeModal />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Hard Mandatory Password Change Gate */}
      {mustChangePassword && (
        <ForceChangePasswordGate />
      )}

      {/* Hard Mandatory Subject Selection Gate for Teachers/Supervisors */}
      {!mustChangePassword && isMissingSubject && (
        <MandatorySubjectGate
          onSubjectAssigned={() => {
            setIsCompleteContactOpen(false);
          }}
        />
      )}

      {/* Complete Contact Info Modal - For missing email, phone or nationality */}
      {!mustChangePassword && !isMissingSubject && (
        <CompleteContactModal
          isOpen={isCompleteContactOpen}
          onClose={() => setIsCompleteContactOpen(false)}
          isMissingEmail={isMissingEmail}
          isMissingPhone={isMissingPhone}
          isMissingSubject={false}
          isMissingNationality={isMissingNationality}
        />
      )}

      {/* Platform Step-by-Step Guide Modal */}
      <PlatformGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartLiveTour={() => {
          setIsGuideOpen(false);
          window.dispatchEvent(new CustomEvent('baaqoon:start_tour'));
        }}
      />
    </div>
  );
}
