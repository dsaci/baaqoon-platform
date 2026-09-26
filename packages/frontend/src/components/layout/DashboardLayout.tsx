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
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import WelcomeModal from "../shared/WelcomeModal";
import ThemeToggle from "../shared/ThemeToggle";
import LangToggle from "../shared/LangToggle";
import { useTranslation } from "react-i18next";

import ProfileModal from "../shared/ProfileModal";

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { t } = useTranslation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Determine navigation links based on role
  const getNavLinks = () => {
    if (user?.primaryRole === "super_admin") {
      return [
        {
          name: "فضاء المؤسسة (المدير)",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
        {
          name: "لوحة التحكم",
          path: "/supervisor/dashboard",
          icon: Activity,
        },
      ];
    }

    if (user?.primaryRole === "admin") {
      return [
        {
          name: "فضاء المؤسسة",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
      ];
    }

    if (user?.primaryRole === "supervisor") {
      return [
        {
          name: "لوحة التحكم",
          path: "/supervisor/dashboard",
          icon: LayoutDashboard,
        },
        { name: "الأساتذة", path: "/supervisor/teachers", icon: Users },
        { name: "التوزيع السنوي والأسبوعي", path: "/supervisor/distribution", icon: Calendar },
        {
          name: "الجدول الأسبوعي",
          path: "/supervisor/schedule",
          icon: Calendar,
        },
        {
          name: "متابعة الامتحانات",
          path: "/supervisor/exam-prep",
          icon: BookOpen,
        },
      ];
    }

    const baseLinks = [
      {
        name: t("nav.dashboard"),
        path: `/${user?.primaryRole}/dashboard`,
        icon: LayoutDashboard,
      },
      {
        name: t("nav.schedule"),
        path: `/${user?.primaryRole}/schedule`,
        icon: Calendar,
      },
      {
        name: t("nav.chat"),
        path: `/${user?.primaryRole}/chat`,
        icon: MessageSquare,
      },
    ];

    if (user?.primaryRole === "teacher") {
      baseLinks.splice(1, 0, {
        name: t("nav.cohorts"),
        path: "/teacher/cohorts",
        icon: Users,
      });
      baseLinks.splice(3, 0, {
        name: t("nav.assessments"),
        path: "/teacher/assessments",
        icon: FileText,
      });
      baseLinks.splice(3, 0, {
        name: "بناء الحصص (المناهج)",
          path: "/teacher/curriculum",
        icon: BookOpen,
      });
      baseLinks.push({
        name: t("nav.textbooks"),
        path: "/teacher/textbooks",
        icon: BookOpen,
      });
      baseLinks.push({
        name: "التوزيع السنوي والأسبوعي",
        path: "/teacher/distribution",
        icon: Calendar,
      });
    } else if (user?.primaryRole === "student") {
      baseLinks.splice(2, 0, {
        name: t("nav.my_assessments"),
        path: "/student/assessments",
        icon: FileText,
      });
      baseLinks.push({
        name: t("nav.textbooks"),
        path: "/student/textbooks",
        icon: BookOpen,
      });
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 flex pt-1">
      {/* Global Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50" />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-baaqoon-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 right-0 z-40 w-64 bg-white dark:bg-baaqoon-900/95 dark:bg-baaqoon-900/95 backdrop-blur-xl border-l border-baaqoon-200 dark:border-baaqoon-800 flex flex-col shadow-2xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-16 flex items-center justify-between md:justify-center border-b border-baaqoon-100 dark:border-baaqoon-800 px-6 gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={logo}
              alt="باقون"
              className="w-10 h-10 mix-blend-multiply dark:mix-blend-normal object-contain"
            />
            <span className="text-xl font-bold text-baaqoon-900 dark:text-white">
              باقون
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
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-800/50 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-baaqoon-100 dark:border-baaqoon-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Watermark Logo */}
        <div className="absolute -bottom-16 -left-16 pointer-events-none opacity-[0.04] z-0">
          <img
            src={logo}
            alt="Watermark"
            className="w-[40rem] h-[40rem] mix-blend-multiply object-contain grayscale"
          />
        </div>

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-baaqoon-900/80 dark:bg-baaqoon-900/80 backdrop-blur-md border-b border-baaqoon-200 dark:border-baaqoon-800 flex items-center justify-between px-4 md:px-8 relative z-40">
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
                باقون
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-baaqoon-900 dark:text-white font-medium text-lg">
            <span>
              {navLinks.find((l) => location.pathname.startsWith(l.path))
                ?.name || t("nav.dashboard")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-baaqoon-600 dark:text-baaqoon-400 hover:text-baaqoon-900 dark:hover:text-white transition-colors"
            >
              العودة للرئيسية
            </Link>

            <LangToggle />
            <ThemeToggle />

            <div className="h-8 w-px bg-baaqoon-200 dark:bg-baaqoon-800 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/50 p-1 pr-3 rounded-xl transition-colors text-right"
                title="الملف الشخصي"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-baaqoon-900 dark:text-white transition-colors">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400 capitalize">
                    {user?.primaryRole === "teacher"
                      ? t("auth.teacher")
                      : user?.primaryRole === "student"
                        ? t("auth.student")
                        : user?.primaryRole === "subject_supervisor"
                          ? "مشرف / موجه تربوي"
                          : user?.primaryRole === "supervisor"
                            ? "مشرف / موجه تربوي"
                            : user?.primaryRole === "admin"
                              ? "مدير منصة"
                              : user?.primaryRole === "super_admin"
                                ? "مدير عام"
                                : "مستخدم"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-baaqoon-accent/20 dark:bg-baaqoon-accent/30 flex items-center justify-center text-baaqoon-accentDark dark:text-baaqoon-accent font-bold border border-baaqoon-accent/30 dark:border-baaqoon-accent/50 transition-colors">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-baaqoon-900 rounded-xl shadow-lg border border-baaqoon-100 dark:border-baaqoon-800 overflow-hidden z-50">
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
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      تعديل الملف الشخصي
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        alert("سيتم فتح شاشة إعدادات التنبيهات والخصوصية.");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      إعدادات الحساب
                    </button>
                  </div>
                  <div className="p-2 border-t border-baaqoon-100 dark:border-baaqoon-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10 bg-baaqoon-50 dark:bg-baaqoon-950">
          <Outlet />
        </div>
      </main>

      {/* Smart Welcome Modal */}
      <WelcomeModal />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Global Bottom Flag Strip */}
      <div className="flag-strip w-full fixed bottom-0 left-0 right-0 z-50" />
    </div>
  );
}
