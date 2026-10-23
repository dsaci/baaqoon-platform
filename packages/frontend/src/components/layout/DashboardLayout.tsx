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
  UserCheck,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";
import { isDummyOrMissingEmail } from "../../utils/emailValidation";
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
import { useTimeGreeting } from "../../hooks/useTimeGreeting";

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const timeGreeting = useTimeGreeting();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCompleteContactOpen, setIsCompleteContactOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const isMissingEmail = isDummyOrMissingEmail(user?.email);
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
    missingFieldsList.push(isRtl ? 'البريد الإلكتروني الشخصي الحقيقي' : 'Personal Email');
  }
  if (isMissingPhone) {
    missingFieldsList.push(isRtl ? 'رقم الهاتف' : 'Phone');
  }
  const missingContactText = missingFieldsList.join(isRtl ? ' و ' : ' & ');

  // Auto-prompt teachers who haven't set their teaching subject yet, or accounts lacking a real personal email
  useEffect(() => {
    if (user && isMissingSubject) {
      setIsCompleteContactOpen(true);
    } else if (user && isMissingEmail) {
      const dismissedKey = `baaqoon_dismissed_email_prompt_${user.id}`;
      const dismissed = sessionStorage.getItem(dismissedKey);
      if (!dismissed) {
        setIsCompleteContactOpen(true);
      }
    }
  }, [user?.id, isMissingSubject, isMissingEmail]);

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
        { name: t("nav.volunteers_admin", "دراسة وفرز ملفات الأساتذة المتطوعين لطلبة غزة"), path: "/admin/volunteers", icon: UserCheck, isVolunteers: true },
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
        { name: t("nav.volunteers_admin", "دراسة وفرز ملفات الأساتذة المتطوعين لطلبة غزة"), path: "/admin/volunteers", icon: UserCheck, isVolunteers: true },
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
      { name: t("nav.volunteers_supervisor", "دراسة وفرز ملفات الأساتذة المتطوعين لطلبة غزة"), path: "/supervisor/volunteers", icon: UserCheck, isVolunteers: true },
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

  
  const isAdmin = Boolean(['super_admin', 'admin'].includes(user?.primaryRole || ''));
  const isSupervisorUser = Boolean(['subject_supervisor', 'supervisor'].includes(user?.primaryRole || '') || user?.isDualRole);
  const shouldFetchVolunteers = isAdmin || (isSupervisorUser && (isSupervisorWorkspace || !user?.isDualRole));

  const { data: pendingVolunteersData } = useQuery({
    queryKey: ['pending_volunteers_count', user?.id, isSupervisorWorkspace],
    queryFn: async () => {
      const res = await api.get('/volunteer/pending-count');
      return res.data;
    },
    enabled: Boolean(shouldFetchVolunteers),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const pendingVolunteersCount = Number(pendingVolunteersData?.count || 0);

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
        <div className="py-3.5 flex items-center justify-between md:justify-center border-b border-baaqoon-100 dark:border-baaqoon-800 px-5 gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src={logo}
              alt="باقون"
              className="w-10 h-10 mix-blend-multiply dark:mix-blend-normal object-contain rounded-xl shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black text-baaqoon-900 dark:text-white leading-tight">
                {isRtl ? "باقون" : "Baaqoon"}
              </span>
              <span className="text-[11px] font-bold text-baaqoon-accent dark:text-emerald-400 flex items-center gap-1 mt-0.5 whitespace-nowrap animate-fade-in">
                <span>{timeGreeting.icon}</span>
                <span>{timeGreeting.text}</span>
              </span>
            </div>
          </Link>
          {/* Mobile Close Button */}
          <button
            className="md:hidden text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-900 dark:hover:text-white p-1"
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

          {navLinks.map((link: any) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            const isVolunteersLink = Boolean(link.isVolunteers);
            const hasPendingFiles = isVolunteersLink && pendingVolunteersCount > 0;

            return (
              <div key={link.name} className="relative group/nav">
                {/* إذا وُجدت استمارات تحتاج للدراسة: يعلو الزر جرس صغير وعدد الملفات */}
                {hasPendingFiles && (
                  <span className={`absolute -top-2.5 ${isRtl ? 'left-3' : 'right-3'} z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-[10px] font-black shadow-lg shadow-rose-600/40 animate-bounce border-2 border-white dark:border-baaqoon-900 pointer-events-none`}>
                    <Bell className="w-2.5 h-2.5 fill-white" />
                    <span>{pendingVolunteersCount}</span>
                  </span>
                )}

                <Link
                  to={isLocked ? "#" : link.path}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                    isLocked ? "opacity-35 pointer-events-none cursor-not-allowed" : ""
                  } ${
                    hasPendingFiles
                      ? "bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 dark:from-rose-950/70 dark:via-red-950/50 dark:to-rose-950/70 text-red-700 dark:text-red-200 font-black border-2 border-red-500 dark:border-red-500 shadow-md shadow-red-500/20 hover:bg-red-100 dark:hover:bg-red-900/40 animate-pulse"
                      : isActive
                        ? `${
                            isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"
                          } from-[#EDF2EB] to-[#F5F2EA] dark:from-[#2A3722]/50 dark:to-[#1F2A18]/50 text-[#394C2A] dark:text-[#A8C794] font-bold border border-[#D5CEBC]/60 dark:border-[#394C2A]/40 shadow-xs`
                        : "text-slate-600 dark:text-slate-400 hover:bg-[#F5F2EA] dark:hover:bg-slate-800/50 hover:text-[#19232D] dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${hasPendingFiles ? 'text-red-600 dark:text-red-400' : ''}`} />
                  <span className="flex-1 truncate">{link.name}</span>
                  {hasPendingFiles && (
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                  )}
                </Link>
              </div>
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
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="باقون"
                className="w-9 h-9 mix-blend-multiply dark:mix-blend-normal object-contain rounded-xl shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-base font-black text-baaqoon-900 dark:text-white leading-tight">
                  {isRtl ? "باقون" : "Baaqoon"}
                </span>
                <span className="text-[10px] font-bold text-baaqoon-accent dark:text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
                  <span>{timeGreeting.icon}</span>
                  <span>{timeGreeting.text}</span>
                </span>
              </div>
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

            
            {/* Topbar Quick Alert Pill for Pending Volunteer Files */}
            {pendingVolunteersCount > 0 && (isAdmin || isSupervisorUser) && (
              <Link
                to={isAdmin ? "/admin/volunteers" : "/supervisor/volunteers"}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-md shadow-red-600/30 transition-all animate-pulse group cursor-pointer"
                title="دراسة وفرز ملفات الأساتذة المتطوعين لطلبة غزة"
              >
                <div className="relative">
                  <Bell className="w-3.5 h-3.5 fill-white animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-300 rounded-full animate-ping"></span>
                </div>
                <span className="hidden sm:inline">فرز ملفات المتطوعين</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-red-700 text-[10px] font-black">
                  {pendingVolunteersCount}
                </span>
              </Link>
            )}

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
            <div
              className={`mb-6 relative w-full max-w-full overflow-hidden rounded-2xl border transition-all duration-300 shadow-md hover:shadow-lg animate-fade-in ${
                isMissingSubject
                  ? 'bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1F2A18] border-purple-400/40 text-white'
                  : 'bg-gradient-to-br from-[#1F2A18] via-[#26351F] to-[#172012] border-[#c9b48a]/40 text-white'
              }`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={`h-1.5 w-full ${
                  isMissingSubject
                    ? 'bg-gradient-to-r from-purple-400 via-indigo-300 to-[#c9b48a]'
                    : 'bg-gradient-to-r from-[#c9b48a] via-[#e5d8be] to-[#394C2A]'
                }`}
              />

              <div className="p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 w-full max-w-full">
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0 w-full">
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner backdrop-blur-xs ${
                      isMissingSubject
                        ? 'bg-white/10 border border-purple-300/30 text-purple-200'
                        : 'bg-white/10 border border-[#c9b48a]/30 text-[#c9b48a]'
                    }`}
                  >
                    {isMissingSubject ? (
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black border ${
                          isMissingSubject
                            ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                            : 'bg-[#c9b48a]/20 text-[#e6d9bf] border-[#c9b48a]/40'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        {isMissingSubject
                          ? (isRtl ? 'إسناد مادة التدريس إجباري' : 'Mandatory Subject Assignment')
                          : isMissingEmail
                          ? (isRtl ? 'تنبيه أمني هام: استكمال البريد الشخصي للمتابعة' : 'Important Security Notice: Personal Email')
                          : (isRtl ? 'تنبيه أمني هام' : 'Important Security Notice')}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base lg:text-lg font-black text-white tracking-tight break-words">
                      {isRtl
                        ? (isMissingSubject
                            ? `تنبيه أكاديمي: حسابك يحتاج إلى تحديد ${missingContactText}`
                            : isMissingEmail
                            ? `تنبيه أمني: حسابك يفتقر إلى بريد إلكتروني شخصي فعلي للتواصل والمتابعة`
                            : `حسابك يفتقر إلى ${missingContactText}`)
                        : `Your account is missing ${missingContactText}`}
                    </h4>

                    <p className="text-xs sm:text-[13px] text-slate-200/90 font-medium leading-relaxed break-words max-w-3xl">
                      {isRtl
                        ? (isMissingSubject
                            ? 'يرجى تحديد مادة التدريس الخاصة بك فوراً لتتمكن إدارة المنصة والمشرفون من تفويجك وإسناد الحصص والطلاب إليك والظهور في جدول الإسناد الأكاديمي.'
                            : isMissingEmail
                            ? 'حسابك مسجل حالياً بدون بريد إلكتروني شخصي (أو ببريد نظام تجريبي). يُرجى ربط بريدك الشخصي الفعلي المعتمد (مثل Gmail أو Outlook أو Yahoo) لاستلام إشعارات الحصص والتواصل الأكاديمي وضمان استرجاع الحساب.'
                            : 'يرجى استكمال بياناتك الإلزامية لتأمين الحساب واستلام الإشعارات وضمان إمكانية استرجاعه بسهولة في حال نسيان كلمة المرور.')
                        : 'Please complete your mandatory profile information so administrators and supervisors can assign cohorts and manage your account properly.'}
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-auto shrink-0 flex items-center justify-end pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
                  <button
                    onClick={() => setIsCompleteContactOpen(true)}
                    className={`w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shrink-0 active:scale-[0.98] ${
                      isMissingSubject
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-600/25 border border-purple-400/30'
                        : 'bg-gradient-to-r from-[#c9b48a] via-[#e5d8be] to-[#c9b48a] hover:brightness-105 text-[#1F2A18] font-black shadow-black/20 border border-[#c9b48a]/80'
                    }`}
                  >
                    <span>
                      {isRtl
                        ? (isMissingSubject
                            ? 'تحديد مادة التدريس واستكمال البيانات'
                            : isMissingEmail
                            ? 'ربط البريد وتأمين الحساب الآن'
                            : 'استكمال البيانات الآن')
                        : 'Complete Info Now'}
                    </span>
                    <ArrowRightLeft className={`w-3.5 h-3.5 opacity-90 group-hover:scale-110 transition-transform ${isMissingSubject ? 'text-white' : 'text-[#1F2A18]'}`} />
                  </button>
                </div>
              </div>
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
