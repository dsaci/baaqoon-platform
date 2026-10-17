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
  PenTool,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Zap,
  GraduationCap,
} from "lucide-react";
import ThemeToggle from "../../../components/shared/ThemeToggle";
import LangToggle from "../../../components/shared/LangToggle";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-baaqoon-gold dark:selection:bg-[#c9b48a91] scroll-smooth overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-4 z-40 px-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-white backdrop-blur-xl p-3 md:p-4 rounded-2xl pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-baaqoon-accent/20 dark:border-baaqoon-gold/20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={logo}
                alt="باقون"
                className="relative w-12 h-12 mix-blend-multiply dark:mix-blend-normal object-contain rounded-lg "
              />
            </div>
            <span className="text-2xl font-black text-baaqoon-accent thmanyahserif">
              باقون
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-baaqoon-accent thmanyahserif">
            <a
              href="#about"
              className="hover:text-baaqoon-gold transition-colors text-xl"
            >
              من نحن
            </a>
            <a
              href="#hierarchy"
              className="hover:text-baaqoon-gold transition-colors text-xl"
            >
              هيكلية المنصة
            </a>
            <a
              href="#contact"
              className="hover:text-baaqoon-gold transition-colors text-xl"
            >
              تواصل معنا
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <LangToggle />
              <ThemeToggle />
            </div>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-gradient-to-l from-baaqoon-accent to-baaqoon-gold text-white font-black rounded-xl transition-all shadow-lg shadow-baaqoon-accent/30 hover:-translate-y-0.5"
            >
              دخول
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 flex items-center justify-center relative bg-graph-paper">
        {/* Abstract Background Elements */}
        <div className="absolute -bottom-28 -left-36 w-[550px] md:w-[680px] h-[550px] md:h-[680px] bg-[#BAAA80]/35 dark:bg-[#BAAA80]/20 rounded-full blur-[130px] md:blur-[160px] pointer-events-none -z-0"></div>
        <div className="absolute -top-28 -right-36 w-[600px] md:w-[720px] h-[600px] md:h-[720px] bg-[#394C2A]/25 dark:bg-[#394C2A]/35 rounded-full blur-[140px] md:blur-[170px] pointer-events-none -z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[400px] md:h-[550px] bg-[#FAF2DF]/70 dark:bg-[#202919]/40 rounded-full blur-[110px] md:blur-[140px] pointer-events-none -z-0"></div>
        {/* <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-baaqoon-gold/30 dark:bg-baaqoon-gold/10 rounded-full blur-[120px] pointer-events-none" /> */}

        <div className="max-w-5xl mx-auto px-4 text-center z-10 space-y-10 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-baaqoon-accent/20 shadow-sm text-baaqoon-accent font-bold text-sm animate-fade-in-up">
            <GraduationCap
              size={30}
              strokeWidth={1.2}
              className="text-baaqoon-accent"
            />
            <span>منصة تعليمية متكاملة لطلاب فلسطين</span>
          </div>

          <div
            className="space-y-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-5xl thmanyahserif md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              تعلم بشغف، <br />
              <span className="text-baaqoon-gold thmanyahserif">
                وتفوق بجدارة!
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 dark:text-white font-medium max-w-3xl mx-auto leading-relaxed">
              باقون هنا لدعمك في كل خطوة نحو حلمك. نوفر لك أفضل الحصص التفاعلية،
              الاختبارات الذكية، وبيئة تعليمية محفزة تجعل من دراستك متعة حقيقية!
            </p>
          </div>

          <div
            className="flex flex-wrap gap-4 justify-center pt-8 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-l from-baaqoon-accent to-baaqoon-gold text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-baaqoon-accent/30 text-lg flex items-center gap-2 group"
            >
              <GraduationCap className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
              ابدأ رحلتك الآن
            </Link>
            <a
              href="#about"
              className="px-8 py-4 bg-white/80 backdrop-blur-md border-2 border-baaqoon-accent/20 text-baaqoon-accent font-black rounded-2xl hover:bg-baaqoon-accent hover:text-white dark:hover:bg-baaqoon-gold dark:text-baaqoon-accent transition-all text-lg flex items-center gap-2"
            >
              <BookOpen className="w-6 h-6" />
              اكتشف المنصة
            </a>
          </div>
        </div>
      </main>

      {/* About & Mission Section */}
      <section
        id="about"
        className="py-24 bg-white/50 dark:bg-[#111111] backdrop-blur-3xl border-y border-baaqoon-accent/20 dark:border-baaqoon-gold/20 relative"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-baaqoon-gold/20 dark:bg-baaqoon-gold text-baaqoon-accent dark:text-baaqoon-accent font-black rounded-full text-sm">
                  <Target className="w-4 h-4" />
                  رؤيتنا ورسالتنا
                </div>
                <h2 className="text-3xl thmanyahserif md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                  جذورنا عميقة.. <br />
                  <span className="text-baaqoon-accent">
                    وطموحنا يعانق السماء
                  </span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-baaqoon-gold leading-relaxed text-justify">
                  جاء تأسيس منصة باقون التعليمية لتشكل بارقة أمل لطلابنا في ظل
                  التحديات التي يواجهها التعليم في فلسطين، خاصة في قطاع غزة. نحن
                  نؤمن أن التعليم هو أقوى سلاح للتغيير، ولذلك وفرنا بيئة رقمية
                  متطورة تدعم الطالب والمعلم على حد سواء.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="bg-white dark:bg-[#131111] p-6 rounded-3xl border border-baaqoon-accent/20 dark:border-baaqoon-gold/20 shadow-lg shadow-baaqoon-accent/30 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#e8ede0] rounded-2xl flex items-center justify-center mb-4">
                    <Heart
                      strokeWidth={1.5}
                      className="w-6 h-6 text-baaqoon-accent"
                    />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">
                    رعاية شاملة
                  </h3>
                  <p className="text-slate-600 dark:text-baaqoon-gold text-sm leading-relaxed">
                    نقدم دعماً أكاديمياً ونفسياً للطلاب لضمان استمراريتهم
                    وتفوقهم رغم كل الظروف.
                  </p>
                </div>
                <div className="bg-white dark:bg-[#131111] p-6 rounded-3xl border border-baaqoon-accent/20 dark:border-baaqoon-gold/20  shadow-lg shadow-baaqoon-accent/30 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#f5ecd6] rounded-2xl flex items-center justify-center mb-4">
                    <Zap
                      strokeWidth={1.5}
                      className="w-6 h-6 text-baaqoon-accent"
                    />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">
                    منصة متطورة
                  </h3>
                  <p className="text-slate-600 dark:text-baaqoon-gold text-sm leading-relaxed">
                    فصول افتراضية، اختبارات ذكية، ومتابعة دقيقة للأداء باستخدام
                    أحدث التقنيات.
                  </p>
                </div>
              </div>
            </div>
            {/* Glassmorphic Illustration Card */}
            <div className="relative p-2 rounded-[2.5rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-2xl border border-white/60 dark:border-slate-700/50 rotate-0 hover:rotate-2 transition-all duration-500 group">
              <div className="absolute -inset-0.5 rounded-[2.5rem] group-hover:opacity-30 bg-baaqoon-gold transition-opacity"></div>
              <img
                src={sketchImg}
                alt="شجرة الزيتون وجذور العلم"
                className="relative w-full h-auto rounded-[2rem] dark:mix-blend-normal"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hierarchy Section */}
      <section id="hierarchy" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl thmanyahserif md:text-6xl font-black text-slate-900 dark:text-white">
              هيكلية{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-baaqoon-accent to-baaqoon-gold">
                منظمة وداعمة
              </span>
            </h2>
            <p className="text-slate-600 dark:text-baaqoon-gold max-w-2xl mx-auto text-lg">
              تعمل منظومتنا بتناغم تام بين جميع الأطراف لضمان تقديم أفضل تجربة
              تعليمية للطالب.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/60 dark:bg-[#131111] backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-baaqoon-accent/20 dark:border-[#c9b48a2b] text-center hover:-translate-y-2 transition-transform group">
              <div className="w-20 h-20 bg-[#e8ede0]  rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-baaqoon-accent/30 group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10 text-baaqoon-accent " />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                المدير العام
              </h3>
              <p className="text-slate-600 dark:text-baaqoon-gold font-medium">
                إشراف شامل على المنظومة التعليمية ومتابعة دقيقة لمؤشرات الأداء
                والجودة.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-[#131111] backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-baaqoon-accent/20 dark:border-[#c9b48a2b] text-center hover:-translate-y-2 transition-transform group">
              <div className="w-20 h-20 bg-baaqoon-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-baaqoon-accent/30 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                المنسق والمشرف
              </h3>
              <p className="text-slate-600 dark:text-baaqoon-gold font-medium">
                متابعة الفتحات التدريسية، توجيه المعلمين، وتقييم جودة المواد
                العلمية.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-[#131111] backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-baaqoon-accent/20 dark:border-[#c9b48a2b] text-center hover:-translate-y-2 transition-transform group">
              <div className="w-20 h-20 bg-[#e8ede0] to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-baaqoon-accent/30 group-hover:scale-110 transition-transform">
                <BookOpen className="w-10 h-10 text-baaqoon-accent" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                الأستاذ المبدع
              </h3>
              <p className="text-slate-600 dark:text-baaqoon-gold font-medium">
                بناء حصص تفاعلية، توليد اختبارات ذكية، ومتابعة مستمرة لتطور كل
                طالب.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-baaqoon-accent rounded-[3rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-baaqoon-accent/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-baaqoon-gold/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl thmanyahserif md:text-6xl font-black leading-tight">
              أنت محور اهتمامنا
            </h2>
            <p className="text-xl md:text-2xl font-medium text-emerald-50 max-w-2xl mx-auto">
              انضم لآلاف الطلبة الذين اختاروا التميز. واجهة دراسية مصممة خصيصاً
              لتشجيعك وتحفيزك يومياً!
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-block px-10 py-5 bg-white text-baaqoon-accent font-black rounded-2xl hover:scale-105 transition-transform shadow-xl text-xl"
              >
                دخول الطالب
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-24 bg-[#faf9f6] dark:bg-[#111111] backdrop-blur-3xl border-t border-slate-200 dark:border-baaqoon-gold/20"
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl thmanyahserif md:text-4xl font-black text-slate-900 dark:text-white mb-12">
            نحن دائماً بالقرب منك
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#131111] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-baaqoon-gold/20 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-[#e8ede0]  rounded-2xl flex items-center justify-center mb-6 text-baaqoon-accent dark:text-baaqoon-accent">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">
                البريد الإلكتروني
              </h3>
              <p className="text-slate-500 dark:text-baaqoon-gold font-medium dir-ltr">
                contact@baaqoon.ps
              </p>
            </div>
            <div className="bg-white dark:bg-[#131111] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-baaqoon-gold/20 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-baaqoon-accent rounded-2xl flex items-center justify-center mb-6 text-white dark:text-white">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">
                الهاتف
              </h3>
              <p className="text-slate-500 dark:text-baaqoon-gold font-medium dir-ltr">
                +970 59 123 4567
              </p>
            </div>
            <div className="bg-white dark:bg-[#131111] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-baaqoon-gold/20 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-[#e8ede0] rounded-2xl flex items-center justify-center mb-6 text-baaqoon-accent dark:text-baaqoon-accent">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">
                المقر الرئيسي
              </h3>
              <p className="text-slate-500 dark:text-baaqoon-gold font-medium">
                فلسطين - قطاع غزة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-[#1F2A18]">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-baaqoon-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-baaqoon-gold/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-10 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/10">
            {/* Brand */}
            <div className="space-y-5">
              <a href="#" className="inline-flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src={logo}
                    alt="شعار منصة باقون"
                    className="relative w-12 h-12 object-contain rounded-xl bg-white p-1"
                  />
                </div>

                <span className="text-2xl text-white thmanyahserif">باقون</span>
              </a>

              <p className="text-sm leading-8 text-white max-w-xs">
                منصة تعليمية فلسطينية تجمعنا على طريق العلم والأمل، وتمنح طلابنا
                الأدوات والفرص لتحقيق أحلامهم وبناء مستقبل أفضل.
              </p>

              <div className="inline-flex items-center gap-2 text-sm font-bold text-baaqoon-gold">
                <Heart className="w-4 h-4" />
                <span>بالعلم نبني المستقبل</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6">روابط سريعة</h3>

              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <a
                    href="#about"
                    className="text-white hover:text-baaqoon-gold hover:translate-x-[-4px] inline-block transition-all"
                  >
                    من نحن
                  </a>
                </li>
                <li>
                  <a
                    href="#hierarchy"
                    className="text-white hover:text-baaqoon-gold hover:translate-x-[-4px] inline-block transition-all"
                  >
                    هيكلية المنصة
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-white hover:text-baaqoon-gold hover:translate-x-[-4px] inline-block transition-all"
                  >
                    تواصل معنا
                  </a>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-white hover:text-baaqoon-gold hover:translate-x-[-4px] inline-block transition-all"
                  >
                    إنشاء حساب جديد
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-white hover:text-baaqoon-gold hover:translate-x-[-4px] inline-block transition-all"
                  >
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6">
                منصتنا التعليمية
              </h3>

              <p className="text-sm leading-7 text-baaqoon-gold mb-5">
                بيئة تعليمية تفاعلية تدعم الطالب والمعلم وتساعد على تطوير
                المهارات وتحقيق التميز الأكاديمي.
              </p>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-baaqoon-gold/15 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-baaqoon-gold" />
                </div>

                <div>
                  <p className="text-white font-bold text-sm">رحلتك تبدأ هنا</p>
                  <p className="text-xs text-baaqoon-gold mt-1">
                    تعلّم، تطوّر، وتفوّق
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6">تواصل معنا</h3>

              <ul className="space-y-5 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-baaqoon-accent/15 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-baaqoon-gold" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-baaqoon-gold mb-1">البريد الإلكتروني</p>
                    <a
                      href="mailto:contact@baaqoon.ps"
                      className="text-white hover:text-baaqoon-gold transition-colors break-all"
                    >
                      contact@baaqoon.ps
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-baaqoon-accent/15 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-baaqoon-gold" />
                  </div>

                  <div>
                    <p className="text-baaqoon-gold mb-1">الهاتف</p>
                    <a
                      href="tel:+970591234567"
                      dir="ltr"
                      className="inline-block text-white hover:text-baaqoon-gold transition-colors"
                    >
                      +970 59 123 4567
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-baaqoon-accent/15 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-baaqoon-gold" />
                  </div>

                  <div>
                    <p className="text-baaqoon-gold mb-1">مقرنا</p>
                    <p className="text-white">فلسطين - قطاع غزة</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-8 text-center md:text-right">
            <p className="text-sm text-baaqoon-gold">
              جميع الحقوق محفوظة © {new Date().getFullYear()}{" "}
              <span className="text-white thmanyahserif">منصة باقون</span>
            </p>

            <label
              href="#"
              className="inline-flex items-center gap-2 text-sm font-bold text-baaqoon-gold hover:text-baaqoon-gold transition-colors"
            >
              صُنع بالأمل من فلسطين
              <Heart className="w-4 h-4 text-baaqoon-gold" />
            </label>
          </div>
        </div>
      </footer>
    </div>
  );
}
