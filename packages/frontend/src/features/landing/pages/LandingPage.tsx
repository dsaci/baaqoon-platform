import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo.jpg';
import sketchImg from '../../../assets/olive_education_sketch.jpg';
import { 
  BookOpen, 
  Users, 
  Target, 
  Shield, 
  Heart, 
  Mail, 
  MapPin, 
  Phone, 
  Zap, 
  GraduationCap 
} from 'lucide-react';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language !== 'en';

  return (
    <div className="min-h-screen flex flex-col bg-graph-paper font-sans selection:bg-[#BAAA80]/30 selection:text-[#1F2A18] scroll-smooth overflow-x-hidden">
      
      {/* ── 1. Top Floating Navigation Bar (Frosted Glass Effect) ─────────── */}
      <header className="fixed w-full top-4 z-40 px-4 md:px-8 pointer-events-none">
        <div className="max-w-6xl mx-auto flex justify-between items-center bg-white/80 dark:bg-[#121711]/80 backdrop-blur-xl py-2.5 px-5 md:px-7 rounded-2xl md:rounded-full pointer-events-auto shadow-[0_8px_30px_rgba(31,42,24,0.06)] border border-white/60 dark:border-zinc-800 transition-all">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl font-black text-[#19232D] dark:text-white tracking-tight font-display">
              باقون
            </span>
            <img 
              src={logo} 
              alt="شعار باقون" 
              className="h-9 w-auto object-contain rounded transition-transform group-hover:scale-105" 
            />
          </Link>
          
          {/* Centered Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-bold text-[#19232D] dark:text-zinc-200 text-sm">
            <a href="#about" className="hover:text-[#394C2A] dark:hover:text-[#A8C794] transition-colors">
              من نحن
            </a>
            <a href="#hierarchy" className="hover:text-[#394C2A] dark:hover:text-[#A8C794] transition-colors">
              هيكلية المنصة
            </a>
            <a href="#contact" className="hover:text-[#394C2A] dark:hover:text-[#A8C794] transition-colors">
              تواصل معنا
            </a>
          </nav>

          {/* Action Button & Toggles */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <ThemeToggle />
              <LangToggle />
            </div>
            <Link 
              to="/login" 
              className="px-5 py-2 rounded-xl text-white font-bold text-sm bg-gradient-to-l from-[#BAAA80] to-[#4D5A35] hover:opacity-95 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              دخول
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section with Atmospheric Blur & Glowing Fog ─────────────── */}
      <main className="flex-1 pt-32 md:pt-40 pb-20 flex items-center justify-center relative overflow-hidden">
        {/* Ambient Fog & Atmospheric Blur Orbs (البلور والضبابية) */}
        <div className="absolute -bottom-28 -left-36 w-[550px] md:w-[680px] h-[550px] md:h-[680px] bg-[#BAAA80]/35 dark:bg-[#BAAA80]/20 rounded-full blur-[130px] md:blur-[160px] pointer-events-none -z-0" />
        <div className="absolute -top-28 -right-36 w-[600px] md:w-[720px] h-[600px] md:h-[720px] bg-[#394C2A]/25 dark:bg-[#394C2A]/35 rounded-full blur-[140px] md:blur-[170px] pointer-events-none -z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[400px] md:h-[550px] bg-[#FAF2DF]/70 dark:bg-[#202919]/40 rounded-full blur-[110px] md:blur-[140px] pointer-events-none -z-0" />

        <div className="max-w-4xl mx-auto px-4 text-center z-10 space-y-7 relative">
          
          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 dark:bg-zinc-800/85 backdrop-blur-md border border-[#E2DDD3] dark:border-zinc-700 shadow-xs text-xs md:text-sm font-bold text-[#2A3722] dark:text-zinc-200 animate-fade-in-up">
            <GraduationCap className="w-4 h-4 text-[#394C2A]" />
            <span>منصة تعليمية متكاملة لطلاب فلسطين</span>
          </div>

          {/* Main Typography */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.12]">
              <span className="block text-[#19232D] dark:text-white">
                تعلّم بشغف،
              </span>
              <span className="block text-[#394C2A] dark:text-[#A8C794] mt-2 font-display">
                وتفوّق بجدارة!
              </span>
            </h1>
            <p className="text-base md:text-xl text-[#4A5568] dark:text-zinc-300 font-medium max-w-2xl mx-auto leading-relaxed pt-2">
              باقون هنا لدعمك في كل خطوة نحو حلمك. نوفر لك أفضل الحصص التفاعلية، الاختبارات الذكية، وبيئة تعليمية محفزة تجعل من دراستك متعة حقيقية!
            </p>
          </div>
          
          {/* Action CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link 
              to="/register" 
              className="px-8 py-3.5 rounded-2xl text-white font-black text-base md:text-lg bg-gradient-to-l from-[#BAAA80] to-[#4D5A35] hover:opacity-95 shadow-lg shadow-[#394C2A]/20 hover:shadow-xl transition-all flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0"
            >
              <GraduationCap className="w-5 h-5" />
              <span>ابدأ رحلتك الآن</span>
            </Link>
            <a 
              href="#about" 
              className="px-8 py-3.5 rounded-2xl text-[#19232D] dark:text-white font-black text-base md:text-lg bg-white/85 dark:bg-zinc-800/85 backdrop-blur-md border border-[#DFDACF] dark:border-zinc-700 hover:bg-[#F4EFE6] dark:hover:bg-zinc-700/60 shadow-xs transition-all flex items-center gap-2.5 hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5 text-[#394C2A] dark:text-[#A8C794]" />
              <span>اكتشف المنصة</span>
            </a>
          </div>
        </div>
      </main>

      {/* ── 3. About & Vision Section ("رؤيتنا ورسالتنا") ────────────────────── */}
      <section id="about" className="py-20 md:py-24 bg-graph-paper border-t border-[#E8E4DA] dark:border-zinc-800/80 relative overflow-hidden">
        {/* Ambient Blur */}
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-[#394C2A]/20 dark:bg-[#394C2A]/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 -left-40 w-[550px] h-[550px] bg-[#BAAA80]/30 dark:bg-[#BAAA80]/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Framed Olive Tree Artistic Sketch Card */}
            <div className="order-2 lg:order-1">
              <div className="rounded-[2.5rem] p-3 md:p-4 bg-[#F5F2EA]/90 dark:bg-zinc-800/70 backdrop-blur-md border-2 border-[#D5CEBC] dark:border-zinc-700 shadow-md">
                <img 
                  src={sketchImg} 
                  alt="شجرة الزيتون وجذور العلم في فلسطين" 
                  className="rounded-3xl w-full h-auto object-cover max-h-[460px] mx-auto mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
            </div>

            {/* Vision Text Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/85 dark:bg-zinc-800/85 backdrop-blur-md border border-[#E2DDD3] dark:border-zinc-700 text-[#394C2A] dark:text-[#A8C794] text-xs font-bold shadow-2xs mb-4">
                  <Target className="w-3.5 h-3.5" />
                  <span>رؤيتنا ورسالتنا</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight font-display">
                  <span className="block text-[#19232D] dark:text-white">جذورنا عميقة..</span>
                  <span className="block text-[#394C2A] dark:text-[#A8C794] mt-1">وطموحنا يعانق السماء</span>
                </h2>
                <p className="text-base md:text-lg text-[#4A5568] dark:text-zinc-300 leading-relaxed text-justify mt-4">
                  جاء تأسيس منصة باقون التعليمية لتشكل بارقة أمل لطلابنا في ظل التحديات التي يواجهها التعليم في فلسطين، خاصة في قطاع غزة. نحن نؤمن أن التعليم هو أقوى سلاح للتغيير، ولذلك وفرنا بيئة رقمية متطورة تدعم الطالب والمعلم على حد سواء.
                </p>
              </div>
              
              {/* Feature Highlights with Frosted Glass */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-5 rounded-3xl border border-[#E8E4DA] dark:border-zinc-700 shadow-xs">
                  <div className="w-11 h-11 bg-[#EDF2EB] dark:bg-[#2A3722] text-[#394C2A] dark:text-[#A8C794] rounded-2xl flex items-center justify-center mb-3">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-[#19232D] dark:text-white text-base md:text-lg mb-1.5">رعاية شاملة</h3>
                  <p className="text-xs md:text-sm text-[#4A5568] dark:text-zinc-400 leading-relaxed">
                    نقدم دعماً أكاديمياً ونفسياً للطلاب لضمان استمراريتهم وتفوقهم رغم كل الظروف.
                  </p>
                </div>

                <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-5 rounded-3xl border border-[#E8E4DA] dark:border-zinc-700 shadow-xs">
                  <div className="w-11 h-11 bg-[#F8F5E9] dark:bg-[#3A3522] text-[#8E8759] dark:text-[#BAAA80] rounded-2xl flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-[#19232D] dark:text-white text-base md:text-lg mb-1.5">منصة متطورة</h3>
                  <p className="text-xs md:text-sm text-[#4A5568] dark:text-zinc-400 leading-relaxed">
                    فصول افتراضية، اختبارات ذكية، ومتابعة دقيقة للأداء باستخدام أحدث التقنيات.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Platform Hierarchy Section ───────────────────────────────────── */}
      <section id="hierarchy" className="py-20 md:py-24 bg-graph-paper border-t border-[#E8E4DA] dark:border-zinc-800/80 relative overflow-hidden">
        {/* Ambient Blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-[#BAAA80]/20 dark:bg-[#1F2A18]/60 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-10 -right-20 w-[450px] h-[450px] bg-[#394C2A]/15 dark:bg-[#394C2A]/25 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#19232D] dark:text-white font-display">
              هيكلية <span className="text-[#394C2A] dark:text-[#A8C794]">منظمة وداعمة</span>
            </h2>
            <p className="text-[#4A5568] dark:text-zinc-400 max-w-2xl mx-auto text-base md:text-lg">
              تعمل منظومتنا بتناغم تام بين جميع الأطراف لضمان تقديم أفضل تجربة تعليمية للطالب.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-7 rounded-[2rem] shadow-xs border border-[#E8E4DA] dark:border-zinc-700 text-center hover:-translate-y-1 transition-all group">
              <div className="w-16 h-16 bg-[#EDF2EB] dark:bg-[#2A3722] text-[#394C2A] dark:text-[#A8C794] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs group-hover:scale-105 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#19232D] dark:text-white mb-2">المدير العام</h3>
              <p className="text-xs md:text-sm text-[#4A5568] dark:text-zinc-400 font-medium leading-relaxed">
                إشراف شامل على المنظومة التعليمية ومتابعة دقيقة لمؤشرات الأداء والجودة.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-7 rounded-[2rem] shadow-xs border border-[#E8E4DA] dark:border-zinc-700 text-center hover:-translate-y-1 transition-all group">
              <div className="w-16 h-16 bg-[#F8F5E9] dark:bg-[#3A3522] text-[#8E8759] dark:text-[#BAAA80] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#19232D] dark:text-white mb-2">المنسق والمشرف</h3>
              <p className="text-xs md:text-sm text-[#4A5568] dark:text-zinc-400 font-medium leading-relaxed">
                متابعة الفتحات التدريسية، توجيه المعلمين، وتقييم جودة المواد العلمية.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-7 rounded-[2rem] shadow-xs border border-[#E8E4DA] dark:border-zinc-700 text-center hover:-translate-y-1 transition-all group">
              <div className="w-16 h-16 bg-[#EDF2EB] dark:bg-[#2A3722] text-[#394C2A] dark:text-[#A8C794] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs group-hover:scale-105 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#19232D] dark:text-white mb-2">الأستاذ المبدع</h3>
              <p className="text-xs md:text-sm text-[#4A5568] dark:text-zinc-400 font-medium leading-relaxed">
                بناء حصص تفاعلية، توليد اختبارات ذكية، ومتابعة مستمرة لتطور كل طالب.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Student Call to Action Banner ─────────────────────────────────── */}
      <section className="py-16 px-4 bg-graph-paper relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-gradient-to-l from-[#394C2A] to-[#1F2A18] rounded-[2.5rem] p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl border border-[#4B6337]/50">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#BAAA80]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black leading-tight font-display">
              أنت محور اهتمامنا 🎯
            </h2>
            <p className="text-base md:text-xl font-medium text-[#E5EADD] max-w-2xl mx-auto leading-relaxed">
              انضم لآلاف الطلبة الذين اختاروا التميز. واجهة دراسية مصممة خصيصاً لتشجيعك وتحفيزك يومياً!
            </p>
            <div className="pt-2">
              <Link 
                to="/login" 
                className="inline-block px-9 py-3.5 bg-gradient-to-l from-[#BAAA80] to-[#8E8759] text-[#19232D] font-black rounded-2xl hover:opacity-95 transition-all shadow-md text-base md:text-lg hover:scale-105 active:scale-100"
              >
                دخول الطالب
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Contact Cards Section ────────────────────────────────────────── */}
      <section id="contact" className="py-16 bg-graph-paper border-t border-[#E8E4DA] dark:border-zinc-800 relative overflow-hidden">
        {/* Ambient Blur */}
        <div className="absolute -bottom-20 right-1/4 w-[550px] h-[400px] bg-[#BAAA80]/25 dark:bg-[#BAAA80]/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -top-20 left-10 w-[400px] h-[400px] bg-[#394C2A]/15 dark:bg-[#394C2A]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid sm:grid-cols-3 gap-6">
            
            {/* البريد الإلكتروني */}
            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-6 rounded-3xl shadow-xs border border-[#E8E4DA] dark:border-zinc-700 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 bg-[#F5F2EA] dark:bg-zinc-700/60 rounded-2xl flex items-center justify-center mb-3 text-[#394C2A] dark:text-[#A8C794]">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#19232D] dark:text-white text-sm mb-1">البريد الإلكتروني</h3>
              <p className="text-xs text-[#4A5568] dark:text-zinc-400 dir-ltr font-mono">contact@baaqoon.ps</p>
            </div>

            {/* الهاتف */}
            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-6 rounded-3xl shadow-xs border border-[#E8E4DA] dark:border-zinc-700 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 bg-[#F5F2EA] dark:bg-zinc-700/60 rounded-2xl flex items-center justify-center mb-3 text-[#394C2A] dark:text-[#A8C794]">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#19232D] dark:text-white text-sm mb-1">الهاتف</h3>
              <p className="text-xs text-[#4A5568] dark:text-zinc-400 dir-ltr font-mono">+970 59 123 4567</p>
            </div>

            {/* المقر الرئيسي */}
            <div className="bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xl p-6 rounded-3xl shadow-xs border border-[#E8E4DA] dark:border-zinc-700 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 bg-[#F5F2EA] dark:bg-zinc-700/60 rounded-2xl flex items-center justify-center mb-3 text-[#394C2A] dark:text-[#A8C794]">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#19232D] dark:text-white text-sm mb-1">المقر الرئيسي</h3>
              <p className="text-xs text-[#4A5568] dark:text-zinc-400">فلسطين - قطاع غزة</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. The Bottom Banner (البانر السفلي - مطابقة تامة للصورة 1) ────────── */}
      <footer className="bg-[#1F2A18] text-[#D8E0D2] pt-16 pb-8 border-t border-[#2A3722]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          
          {/* Main 4 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Column 1: Brand & Vision (اليمين) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-xs shrink-0">
                  <img src={logo} alt="باقون" className="w-full h-full object-contain" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight font-display">
                  باقون
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#A0AD96] leading-relaxed">
                منصة تعليمية فلسطينية تجمعنا على طريق العلم والأمل، وتمنح طلابنا الأدوات والفرص لتحقيق أحلامهم وبناء مستقبل أفضل.
              </p>
              <div className="flex items-center gap-2 text-xs md:text-sm text-white/90 font-bold pt-1">
                <span>بالعلم نبني المستقبل</span>
                <Heart className="w-4 h-4 text-[#BAAA80] fill-[#BAAA80]/20" />
              </div>
            </div>

            {/* Column 2: Quick Links (روابط سريعة) */}
            <div>
              <h4 className="text-white font-bold text-sm md:text-base mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5 text-xs md:text-sm text-[#A0AD96]">
                <li>
                  <a href="#about" className="hover:text-white transition-colors block">
                    من نحن
                  </a>
                </li>
                <li>
                  <a href="#hierarchy" className="hover:text-white transition-colors block">
                    هيكلية المنصة
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors block">
                    تواصل معنا
                  </a>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors block">
                    إنشاء حساب جديد
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors block">
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Our Educational Platform (منصتنا التعليمية) */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm md:text-base">منصتنا التعليمية</h4>
              <p className="text-xs md:text-sm text-[#A0AD96] leading-relaxed">
                بيئة تعليمية تفاعلية تدعم الطالب والمعلم وتساعد على تطوير المهارات وتحقيق التميز الأكاديمي.
              </p>
              {/* Journey Box Card */}
              <div className="bg-[#283522] border border-[#35432D] p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm font-bold text-white">رحلتك تبدأ هنا</p>
                  <p className="text-[11px] text-[#A0AD96] mt-0.5">تعلّم، تطوّر، وتفوّق</p>
                </div>
                <div className="w-10 h-10 bg-[#34442B] text-[#BAAA80] rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Column 4: Contact Information (تواصل معنا) */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm md:text-base mb-4">تواصل معنا</h4>
              
              <div className="flex items-start gap-3 text-xs md:text-sm text-[#A0AD96]">
                <Mail className="w-4 h-4 text-[#BAAA80] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#7A8A70]">البريد الإلكتروني</span>
                  <span className="text-white/90 dir-ltr font-mono text-xs">contact@baaqoon.ps</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs md:text-sm text-[#A0AD96]">
                <Phone className="w-4 h-4 text-[#BAAA80] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#7A8A70]">الهاتف</span>
                  <span className="text-white/90 dir-ltr font-mono text-xs">+970 59 123 4567</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs md:text-sm text-[#A0AD96]">
                <MapPin className="w-4 h-4 text-[#BAAA80] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-[#7A8A70]">مقرنا</span>
                  <span className="text-white/90 text-xs">فلسطين - قطاع غزة</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sub-Footer Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-[#2A3722] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A9881]">
            <span>جميع الحقوق محفوظة © 2026 منصة باقون</span>
            <span className="flex items-center gap-1.5">
              <span>صُنع بالأمل من فلسطين</span>
              <span className="text-[#BAAA80]">♡</span>
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
