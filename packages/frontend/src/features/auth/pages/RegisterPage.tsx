import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  UserPlus,
  Loader2,
  AlertCircle,
  Shield,
  Home,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import logo from "../../../assets/logo.png";
import { api } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import ThemeToggle from "../../../components/shared/ThemeToggle";
import LangToggle from "../../../components/shared/LangToggle";

const BRANCHES = [
  { value: "scientific", label: "العلمي" },
  { value: "literary", label: "الأدبي" },
  { value: "entrepreneurship", label: "الريادة والأعمال" },
  { value: "industrial", label: "الصناعي" },
  { value: "sharia", label: "الشرعي" },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "",
    countryCode: "+970",
    password: "",
    primaryRole: "student",
    branch: "scientific",
    curriculumType: "governmental",
    gradeLevel: "grade_11",
    supervisedSubjectId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const res = await api.get("/curriculum/subjects");
      return res.data;
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError("يرجى تأكيد أنك لست روبوتاً");
      return;
    }

    setIsLoading(true);

    try {
      if (!formData.email && !formData.phone) {
        setError("يجب إدخال البريد الإلكتروني أو رقم الهاتف");
        setIsLoading(false);
        return;
      }

      const formattedPhone = formData.phone
        ? `${formData.countryCode}${formData.phone}`
        : "";

      const payload = {
        ...formData,
        phone: formattedPhone,
        recaptchaToken: captchaToken,
      };

      const response = await api.post("/auth/register", payload);
      alert(
        "تم التسجيل بنجاح! حسابك الآن قيد المراجعة، يرجى انتظار تفعيل الإدارة.",
      );
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStudent = formData.primaryRole === "student";

  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#111111] py-12 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-baaqoon-gold/20 dark:bg-baaqoon-gold/10  rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-baaqoon-gold/20 dark:bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Theme and Lang controls at the top */}
      <div className="fixed top-10 right-4 left-4 flex items-center justify-between pointer-events-none z-40">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-[#111111] backdrop-blur-md border border-baaqoon-accent/20 dark:border-baaqoon-gold/20 rounded-xl text-sm font-bold text-slate-700 dark:text-baaqoon-gold hover:bg-baaqoon-gold/30 dark:hover:bg-baaqoon-gold dark:hover:text-baaqoon-accent transition-colors shadow-sm"
        >
          <Home className="w-4 h-4 text-baaqoon-accent" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto bg-white/70 dark:bg-[#111111] backdrop-blur-md p-1.5 rounded-xl border border-baaqoon-gold/20 dark:border-baaqoon-gold/20 shadow-sm">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white/60 dark:bg-[#131111] backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 border-baaqoon-accent/20 dark:border-baaqoon-gold/20 space-y-6 animate-fade-in-up mt-8 mb-8 z-10">
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <img
              src={logo}
              alt="باقون"
              className="relative w-20 h-20 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain rounded-2xl dark:bg-white p-1"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            حساب جديد
          </h2>
          <p className="text-slate-500 dark:text-baaqoon-gold font-medium">
            انضم إلى مجتمع منصة باقون
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                {t("auth.first_name")}
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                {t("auth.last_name")}
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
              نوع الحساب
            </label>
            <select
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
            >
              <option value="student" className="dark:bg-baaqoon-800">
                طالب / طالبة
              </option>
              <option value="teacher" className="dark:bg-baaqoon-800">
                أستاذ / أستاذة
              </option>
              <option
                value="subject_supervisor"
                className="dark:bg-baaqoon-800"
              >
                مشرف / موجه تربوي
              </option>
            </select>
          </div>

          {/* Supervised Subject - shown only for subject_supervisor */}
          {(formData.primaryRole === "subject_supervisor" ||
            formData.primaryRole === "teacher") && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                مادة التنسيق (اختر مادة واحدة فقط)
              </label>
              <select
                name="supervisedSubjectId"
                value={formData.supervisedSubjectId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                required={
                  formData.primaryRole === "subject_supervisor" ||
                  formData.primaryRole === "teacher"
                }
              >
                <option value="" className="dark:bg-baaqoon-800">
                  -- اختر مادة التنسيق --
                </option>
                {subjects.map((s: any) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="dark:bg-baaqoon-800"
                  >
                    {s.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Branch, Grade Level & Curriculum selection - shown only for students */}
          {isStudent && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                  الصف الدراسي
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                >
                  <option value="grade_11" className="dark:bg-baaqoon-800">
                    الصف الحادي عشر (11)
                  </option>
                  <option value="grade_12" className="dark:bg-baaqoon-800">
                    الصف الثاني عشر (التوجيهي - 12)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                    الفرع الدراسي
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                  >
                    {BRANCHES.map((b) => (
                      <option
                        key={b.value}
                        value={b.value}
                        className="dark:bg-baaqoon-800"
                      >
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
                    المنهج (نوع المدرسة)
                  </label>
                  <select
                    name="curriculumType"
                    value={formData.curriculumType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                  >
                    <option
                      value="governmental"
                      className="dark:bg-baaqoon-800"
                    >
                      منهج عام (حكومي)
                    </option>
                    <option value="azhari" className="dark:bg-baaqoon-800">
                      منهج أزهري معتمد
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
              {t("common.email")} (اختياري إذا أدخلت الهاتف)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
              رقم الهاتف (اختياري إذا أدخلت البريد)
            </label>
            <div className="flex flex-row-reverse gap-2">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="591234567"
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr"
              />
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="px-2 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr w-24 shrink-0"
              >
                <option value="+970" className="dark:bg-baaqoon-800">
                  🇵🇸 +970
                </option>
                <option value="+972" className="dark:bg-baaqoon-800">
                  🇵🇸 +972
                </option>
                <option value="+213" className="dark:bg-baaqoon-800">
                  🇩🇿 +213
                </option>
                <option value="+20" className="dark:bg-baaqoon-800">
                  🇪🇬 +20
                </option>
                <option value="+962" className="dark:bg-baaqoon-800">
                  🇯🇴 +962
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
              الجنسية
            </label>
            <select
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all"
            >
              <option value="">-- غير محدد --</option>
              <option value="فلسطيني">فلسطيني</option>
              <option value="أردني">أردني</option>
              <option value="مصري">مصري</option>
              <option value="سعودي">سعودي</option>
              <option value="إماراتي">إماراتي</option>
              <option value="كويتي">كويتي</option>
              <option value="عماني">عماني</option>
              <option value="قطري">قطري</option>
              <option value="بحريني">بحريني</option>
              <option value="يمني">يمني</option>
              <option value="عراقي">عراقي</option>
              <option value="سوري">سوري</option>
              <option value="لبناني">لبناني</option>
              <option value="سوداني">سوداني</option>
              <option value="ليبي">ليبي</option>
              <option value="تونسي">تونسي</option>
              <option value="جزائري">جزائري</option>
              <option value="مغربي">مغربي</option>
              <option value="موريتاني">موريتاني</option>
              <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-gold">
              {t("common.password")}
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-gold focus:border-baaqoon-gold outline-none transition-all text-left dir-ltr"
            />
          </div>

          <div className="flex items-start gap-2 bg-baaqoon-50 dark:bg-baaqoon-800/30 p-3 rounded-lg border border-baaqoon-100 dark:border-baaqoon-800">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 flex-shrink-0 w-4 h-4 text-baaqoon-accent border-gray-300 rounded focus:ring-baaqoon-accent"
            />
            <label
              htmlFor="terms"
              className="text-xs text-baaqoon-700 dark:text-baaqoon-gold leading-relaxed"
            >
              أتعهد بالاحترام المتبادل والمحافظة على بيئة تعليمية آمنة. نتفهم
              ظروف الحرب الصعبة، ونسعى لتوفير هذه البيئة الداعمة لجميع الطلبة.
            </label>
          </div>

          <div className="flex justify-center my-4 dir-ltr">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !captchaToken || !agreeToTerms}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-l from-baaqoon-accent to-baaqoon-gold disabled:opacity-70 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all mt-4 shadow-lg shadow-baaqoon-accent/30 hover:-translate-y-0.5"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UserPlus className="w-6 h-6" />
            )}
            {isLoading ? "جاري الإنشاء..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="text-center text-sm text-baaqoon-500 dark:text-baaqoon-400">
          لديك حساب بالفعل؟{" "}
          <Link
            to="/login"
            className="text-baaqoon-accent hover:underline font-medium"
          >
            سجل دخولك
          </Link>
        </p>
      </div>
    </div>
  );
}
