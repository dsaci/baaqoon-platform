import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";
import sketchImg from "../../../assets/olive_education_sketch.jpg";
import {
  BookOpen,
  Users,
  Target,
  Shield,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Zap,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import ThemeToggle from "../../../components/shared/ThemeToggle";
import LangToggle from "../../../components/shared/LangToggle";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-baaqoon-gold dark:selection:bg-[#c9b48a91] scroll-smooth overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* ══════════════════════ Navigation Bar ══════════════════════ */}
      <nav className="fixed w-full top-4 z-40 px-3 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 md:p-4 rounded-2xl pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-baaqoon-accent/20 dark:border-baaqoon-gold/20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={logo}
                alt={t("landing.brand_name", "باقون")}
                className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl bg-white p-1 shadow-xs"
              />
            </div>
            <span className={`text-2xl font-black text-baaqoon-accent dark:text-baaqoon-gold ${isRtl ? 'thmanyahserif' : 'font-black tracking-tight'}`}>
              {t("landing.brand_name", "باقون")}
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className={`hidden md:flex items-center gap-8 text-baaqoon-accent dark:text-slate-200 font-bold ${isRtl ? 'thmanyahserif text-lg' : 'text-sm font-black'}`}>
            <a
              href="#about"
              className="hover:text-baaqoon-gold transition-colors"
            >
              {t("landing.about", "من نحن")}
            </a>
            <a
              href="#hierarchy"
              className="hover:text-baaqoon-gold transition-colors"
            >
              {t("landing.hierarchy", "هيكلية المنصة")}
            </a>
            <a
              href="#contact"
              className="hover:text-baaqoon-gold transition-colors"
            >
              {t("landing.contact", "تواصل معنا")}
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <LangToggle />
              <ThemeToggle />
            </div>

            <Link
              to="/login"
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-baaqoon-accent to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-baaqoon-accent/25 hover:-translate-y-0.5"
            >
              {t("landing.login", "دخول")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════ Hero Section ══════════════════════ */}
      <main className="flex-1 pt-32 pb-20 flex items-center justify-center relative bg-graph-paper">
        {/* Ambient Glows */}
        <div className="absolute -bottom-28 -left-36 w-[500px] md:w-[680px] h-[500px] md:h-[680px] bg-[#BAAA80]/30 dark:bg-[#BAAA80]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -top-28 -right-36 w-[550px] md:w-[720px] h-[550px] md:h-[720px] bg-[#394C2A]/20 dark:bg-[#394C2A]/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center z-10 space-y-8 mt-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-baaqoon-accent/20 dark:border-slate-800 shadow-sm text-baaqoon-accent dark:text-emerald-400 font-bold text-xs sm:text-sm animate-fade-in-up">
            <GraduationCap
              size={24}
              strokeWidth={1.5}
              className="text-baaqoon-accent dark:text-emerald-400 shrink-0"
            />
            <span>{t("landing.tagline_badge", "منصة تعليمية متكاملة لطلاب فلسطين")}</span>
          </div>

          {/* Heading */}
          <div
            className="space-y-5 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] ${isRtl ? 'thmanyahserif' : 'font-black'}`}>
              {t("landing.hero_h1_start", "تعلم بشغف،")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-baaqoon-gold via-amber-500 to-emerald-600">
                {t("landing.hero_h1_highlight", "وتفوق بجدارة!")}
              </span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
              {t(
                "landing.hero_sub",
                "باقون هنا لدعمك في كل خطوة نحو حلمك. نوفر لك أفضل الحصص التفاعلية، الاختبارات الذكية، وبيئة تعليمية محفزة تجعل من دراستك متعة حقيقية!"
              )}
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-wrap gap-4 justify-center pt-4 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-baaqoon-accent to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-baaqoon-accent/30 text-base sm:text-lg flex items-center gap-2 group cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span>{t("landing.hero_cta_start", "ابدأ رحلتك الآن")}</span>
              {isRtl ? (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </Link>

            <a
              href="#about"
              className="px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 border-baaqoon-accent/20 dark:border-slate-700 text-baaqoon-accent dark:text-slate-200 font-black rounded-2xl hover:bg-baaqoon-accent hover:text-white dark:hover:bg-slate-800 transition-all text-base sm:text-lg flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>{t("landing.hero_cta_discover", "اكتشف المنصة")}</span>
            </a>
          </div>
        </div>
      </main>

      {/* ══════════════════════ About & Mission Section ══════════════════════ */}
      <section
        id="about"
        className="py-24 bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl border-y border-baaqoon-accent/15 dark:border-slate-800 relative"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-7">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-baaqoon-gold/20 dark:bg-amber-950/40 text-baaqoon-accent dark:text-amber-300 border border-baaqoon-gold/30 dark:border-amber-800/50 font-black rounded-full text-xs sm:text-sm">
                  <Target className="w-4 h-4" />
                  <span>{t("landing.about_badge", "رؤيتنا ورسالتنا")}</span>
                </div>

                <h2 className={`text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight ${isRtl ? 'thmanyahserif' : 'font-black'}`}>
                  {t("landing.about_h2_start", "جذورنا عميقة..")} <br />
                  <span className="text-baaqoon-accent dark:text-emerald-400">
                    {t("landing.about_h2_highlight", "وطموحنا يعانق السماء")}
                  </span>
                </h2>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                  {t(
                    "landing.about_text",
                    "جاء تأسيس منصة باقون التعليمية لتشكل بارقة أمل لطلابنا في ظل التحديات التي يواجهها التعليم في فلسطين، خاصة في قطاع غزة. نحن نؤمن أن التعليم هو أقوى سلاح للتغيير، ولذلك وفرنا بيئة رقمية متطورة تدعم الطالب والأستاذ على حد سواء."
                  )}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 pt-2">
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg mb-2">
                    {t("landing.about_care_title", "رعاية شاملة")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {t(
                      "landing.about_care_desc",
                      "نقدم دعماً أكاديمياً ونفسياً للطلاب لضمان استمراريتهم وتفوقهم رغم كل الظروف."
                    )}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg mb-2">
                    {t("landing.about_tech_title", "منصة متطورة")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {t(
                      "landing.about_tech_desc",
                      "فصول افتراضية، اختبارات ذكية، ومتابعة دقيقة للأداء باستخدام أحدث التقنيات."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Illustration Artwork */}
            <div className="relative p-2 rounded-[2.5rem] bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl shadow-2xl border border-slate-200/80 dark:border-slate-700 group">
              <img
                src={sketchImg}
                alt={t("landing.sketch_alt", "شجرة الزيتون وجذور العلم")}
                className="w-full h-auto rounded-[2rem] object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ Hierarchy Section ══════════════════════ */}
      <section id="hierarchy" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className={`text-3xl md:text-5xl font-black text-slate-900 dark:text-white ${isRtl ? 'thmanyahserif' : 'font-black'}`}>
              {t("landing.hierarchy_title_start", "هيكلية")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-baaqoon-accent to-baaqoon-gold">
                {t("landing.hierarchy_title_highlight", "منظمة وداعمة")}
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
              {t(
                "landing.hierarchy_subtitle",
                "تعمل منظومتنا بتناغم تام بين جميع الأطراف لضمان تقديم أفضل تجربة تعليمية للطالب."
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Director */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 text-center hover:-translate-y-1.5 transition-transform group">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2.5">
                {t("landing.h_director_title", "المدير العام")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t(
                  "landing.h_director_desc",
                  "إشراف شامل على المنظومة التعليمية ومتابعة دقيقة لمؤشرات الأداء والجودة."
                )}
              </p>
            </div>

            {/* Card 2: Supervisor */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 text-center hover:-translate-y-1.5 transition-transform group">
              <div className="w-16 h-16 bg-baaqoon-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2.5">
                {t("landing.h_supervisor_title", "المنسق والمشرف")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t(
                  "landing.h_supervisor_desc",
                  "متابعة الفتحات التدريسية، توجيه الأساتذة، وتقييم جودة المواد العلمية."
                )}
              </p>
            </div>

            {/* Card 3: Teachers */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 text-center hover:-translate-y-1.5 transition-transform group">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2.5">
                {t("landing.h_teacher_title", "الأستاذ المبدع")}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t(
                  "landing.h_teacher_desc",
                  "بناء حصص تفاعلية، توليد اختبارات ذكية، ومتابعة مستمرة لتطور كل طالب."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ Student Focus CTA Section ══════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-700/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className={`text-3xl md:text-5xl font-black leading-tight ${isRtl ? 'thmanyahserif' : 'font-black'}`}>
              {t("landing.student_focus_title", "أنت محور اهتمامنا")}
            </h2>
            <p className="text-base sm:text-xl font-medium text-emerald-50 max-w-2xl mx-auto leading-relaxed">
              {t(
                "landing.student_focus_desc",
                "انضم لآلاف الطلبة الذين اختاروا التميز. واجهة دراسية مصممة خصيصاً لتشجيعك وتحفيزك يومياً!"
              )}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-9 py-4 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-2xl hover:scale-105 transition-transform shadow-xl text-base sm:text-lg"
              >
                <GraduationCap className="w-5 h-5" />
                <span>{t("landing.student_focus_cta", "دخول الطالب")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ Contact Section ══════════════════════ */}
      <section
        id="contact"
        className="py-20 bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-3xl border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className={`text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-10 ${isRtl ? 'thmanyahserif' : 'font-black'}`}>
            {t("landing.contact_header", "نحن دائماً بالقرب منك")}
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">
                {t("landing.contact_email_title", "البريد الإلكتروني")}
              </h3>
              <a
                href="mailto:baaqoon@gmail.com"
                dir="ltr"
                className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium hover:text-emerald-600"
              >
                baaqoon@gmail.com
              </a>
            </div>

            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-4">
                <Phone className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">
                {t("landing.contact_phone_title", "الهاتف")}
              </h3>
              <a
                href="tel:+970591234567"
                dir="ltr"
                className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium hover:text-emerald-600"
              >
                +970 59 123 4567
              </a>
            </div>

            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">
                {t("landing.contact_hq_title", "المقر الرئيسي")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                {t("landing.contact_hq_val", "فلسطين - قطاع غزة")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ Footer ══════════════════════ */}
      <footer className="relative overflow-hidden bg-[#1F2A18] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-10 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-3">
                <img
                  src={logo}
                  alt={t("landing.brand_name", "باقون")}
                  className="w-10 h-10 object-contain rounded-xl bg-white p-1"
                />
                <span className={`text-2xl font-black text-white ${isRtl ? 'thmanyahserif' : 'tracking-tight'}`}>
                  {t("landing.brand_name", "باقون")}
                </span>
              </Link>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-xs">
                {t(
                  "landing.footer_desc",
                  "منصة تعليمية فلسطينية تجمعنا على طريق العلم والأمل، وتمنح طلابنا الأدوات والفرص لتحقيق أحلامهم وبناء مستقبل أفضل."
                )}
              </p>

              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-baaqoon-gold">
                <Heart className="w-4 h-4 fill-current text-baaqoon-gold" />
                <span>{t("landing.footer_motto", "بالعلم نبني المستقبل")}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-5">
                {t("landing.footer_quick_links", "روابط سريعة")}
              </h3>

              <ul className="space-y-3 text-xs sm:text-sm font-medium text-slate-300">
                <li>
                  <a href="#about" className="hover:text-baaqoon-gold transition-colors inline-block">
                    {t("landing.footer_link_about", "من نحن")}
                  </a>
                </li>
                <li>
                  <a href="#hierarchy" className="hover:text-baaqoon-gold transition-colors inline-block">
                    {t("landing.footer_link_hierarchy", "هيكلية المنصة")}
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-baaqoon-gold transition-colors inline-block">
                    {t("landing.footer_link_contact", "تواصل معنا")}
                  </a>
                </li>
                <li>
                  <Link to="/register" className="hover:text-baaqoon-gold transition-colors inline-block">
                    {t("landing.footer_link_register", "إنشاء حساب جديد")}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-baaqoon-gold transition-colors inline-block">
                    {t("landing.footer_link_login", "تسجيل الدخول")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Feature Summary */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-5">
                {t("landing.footer_platform_title", "منصتنا التعليمية")}
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 mb-5">
                {t(
                  "landing.footer_platform_desc",
                  "بيئة تعليمية تفاعلية تدعم الطالب والأستاذ وتساعد على تطوير المهارات وتحقيق التميز الأكاديمي."
                )}
              </p>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-baaqoon-gold/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-baaqoon-gold" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">
                    {t("landing.footer_platform_card_title", "رحلتك تبدأ هنا")}
                  </p>
                  <p className="text-[11px] text-baaqoon-gold mt-0.5">
                    {t("landing.footer_platform_card_sub", "تعلّم، تطوّر، وتفوّق")}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-5">
                {t("landing.footer_contact_title", "تواصل معنا")}
              </h3>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-baaqoon-gold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-baaqoon-gold">
                      {t("landing.contact_email_title", "البريد الإلكتروني")}
                    </p>
                    <a href="mailto:baaqoon@gmail.com" dir="ltr" className="hover:text-baaqoon-gold transition-colors">
                      baaqoon@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-baaqoon-gold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-baaqoon-gold">
                      {t("landing.contact_phone_title", "الهاتف")}
                    </p>
                    <a href="tel:+970591234567" dir="ltr" className="hover:text-baaqoon-gold transition-colors">
                      +970 59 123 4567
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-baaqoon-gold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-baaqoon-gold">
                      {t("landing.contact_hq_title", "المقر")}
                    </p>
                    <p className="text-white">
                      {t("landing.contact_hq_val", "فلسطين - قطاع غزة")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer Credits */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-center md:text-right">
            <p className="text-xs sm:text-sm text-slate-300">
              {t("landing.footer_rights", { year: new Date().getFullYear(), defaultValue: `جميع الحقوق محفوظة © ${new Date().getFullYear()} منصة باقون` })}
            </p>

            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-baaqoon-gold">
              <span>{t("landing.footer_made_with", "صُنع بالأمل من فلسطين 🇵🇸")}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
