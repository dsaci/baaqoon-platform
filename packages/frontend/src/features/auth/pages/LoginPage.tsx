import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  LogIn,
  Loader2,
  AlertCircle,
  FlaskConical,
  Home,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import { api } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import { useTranslation } from "react-i18next";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import ThemeToggle from "../../../components/shared/ThemeToggle";
import LangToggle from "../../../components/shared/LangToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // ── Demo login (real backend) ───────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      if (user.primaryRole === "student") navigate("/student/dashboard");
      else if (user.primaryRole === "teacher") navigate("/teacher/dashboard");
      else if (
        user.primaryRole === "subject_supervisor" ||
        user.primaryRole === "supervisor"
      )
        navigate("/supervisor/dashboard");
      else navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const { t } = useTranslation();

  // ... inside component handleDemoLogin and handleLogin ...

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#111111] relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-baaqoon-gold/20 dark:bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-baaqoon-gold/20 dark:bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Theme and Lang controls at the top */}
      <div className="absolute top-10 right-4 left-4 flex items-center justify-between pointer-events-none z-40">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-[#111111] backdrop-blur-md border border-baaqoon-accent/20 dark:border-baaqoon-gold/20 rounded-xl text-sm font-bold text-slate-700 dark:text-baaqoon-gold hover:bg-baaqoon-gold/30 dark:hover:bg-baaqoon-gold dark:hover:text-baaqoon-accent transition-colors shadow-sm"
        >
          <Home className="w-4 h-4 text-baaqoon-accent" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto bg-white/70 dark:bg-[#111111] backdrop-blur-md p-1.5 rounded-xl border border-baaqoon-accent/20 dark:border-baaqoon-gold/20 shadow-sm">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white/60 dark:bg-[#131111] backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 dark:border-baaqoon-gold/20 space-y-8 animate-fade-in-up mt-8 mb-8 z-10">
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <img
              src={logo}
              alt="باقون"
              className="relative w-20 h-20 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain rounded-2xl dark:bg-white p-1"
            />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            تسجيل الدخول
          </h2>
          <p className="text-slate-500 dark:text-baaqoon-gold font-medium">
            مرحباً بعودتك إلى منصة باقون 👋
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-baaqoon-gold">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-baaqoon-700 bg-white/50 dark:bg-baaqoon-800/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr shadow-sm"
              placeholder="user@example.com أو 059..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-baaqoon-gold">
              {t("common.password")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-baaqoon-700 bg-white/50 dark:bg-baaqoon-800/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-l from-baaqoon-accent to-baaqoon-gold disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all mt-4 shadow-lg shadow-baaqoon-accent/30 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            {isLoading ? t("common.loading") : t("common.login")}
          </button>

          <div className="text-right mt-2 mb-4">
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-sm text-baaqoon-accent hover:text-baaqoon-gold font-bold transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </form>
        {isForgotOpen && (
          <ForgotPasswordModal onClose={() => setIsForgotOpen(false)} />
        )}

        <p className="text-center text-sm text-baaqoon-500 dark:text-baaqoon-400">
          {t("auth.no_account")}{" "}
          <Link
            to="/register"
            className="text-baaqoon-accent hover:text-baaqoon-gold font-medium"
          >
            {t("common.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
