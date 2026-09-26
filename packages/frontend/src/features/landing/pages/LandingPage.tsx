import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo.jpg';
import sketchImg from '../../../assets/olive_education_sketch.jpg';
import { BookOpen, Users, Target, Shield, Heart, PenTool, Mail, MapPin, Phone, Sparkles, Zap, GraduationCap } from 'lucide-react';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-200 scroll-smooth overflow-x-hidden">
      
      {/* Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50 shadow-md" />

      {/* Navigation */}
      <nav className="fixed w-full top-6 z-40 px-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 md:p-4 rounded-2xl pointer-events-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-20"></div>
              <img src={logo} alt="باقون" className="relative w-10 h-10 mix-blend-multiply dark:mix-blend-normal object-contain rounded-lg" />
            </div>
            <span className="text-xl font-black bg-gradient-to-l from-emerald-600 to-teal-500 bg-clip-text text-transparent">باقون</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600 dark:text-slate-300">
            <a href="#about" className="hover:text-emerald-500 transition-colors">من نحن</a>
            <a href="#hierarchy" className="hover:text-teal-500 transition-colors">هيكلية المنصة</a>
            <a href="#contact" className="hover:text-cyan-500 transition-colors">تواصل معنا</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <LangToggle />
              <ThemeToggle />
            </div>
            <Link to="/login" className="px-6 py-2.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5">
              دخول
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 flex items-center justify-center relative">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-cyan-300/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-100/30 dark:bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 text-center z-10 space-y-10 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-emerald-100 dark:border-emerald-800/50 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>منصة تعليمية متكاملة لطلاب فلسطين</span>
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              تعلم بشغف، <br />
              <span className="bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                وتفوق بجدارة!
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
              باقون هنا لدعمك في كل خطوة نحو حلمك. نوفر لك أفضل الحصص التفاعلية، الاختبارات الذكية، وبيئة تعليمية محفزة تجعل من دراستك متعة حقيقية!
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center pt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="px-8 py-4 bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-emerald-500/30 text-lg flex items-center gap-2 group">
              <GraduationCap className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
              ابدأ رحلتك الآن
            </Link>
            <a href="#about" className="px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-2 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-black rounded-2xl hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all text-lg flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              اكتشف المنصة
            </a>
          </div>
        </div>
      </main>

      {/* About & Mission Section */}
      <section id="about" className="py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl border-y border-emerald-100 dark:border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Glassmorphic Illustration Card */}
            <div className="relative p-3 rounded-[2.5rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-2xl border border-white/60 dark:border-slate-700/50 rotate-2 hover:rotate-0 transition-all duration-500 group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-[2.5rem] opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
              <img 
                src={sketchImg} 
                alt="شجرة الزيتون وجذور العلم" 
                className="relative w-full h-auto rounded-[2rem] mix-blend-multiply dark:mix-blend-normal"
              />
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl p-4 shadow-xl shadow-emerald-500/30 rotate-[-10deg] group-hover:rotate-0 transition-transform">
                <PenTool className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-full text-sm">
                  <Target className="w-4 h-4" />
                  رؤيتنا ورسالتنا
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                  جذورنا عميقة.. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-500 to-teal-500">وطموحنا يعانق السماء</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                  جاء تأسيس منصة باقون التعليمية لتشكل بارقة أمل لطلابنا في ظل التحديات التي يواجهها التعليم في فلسطين، خاصة في قطاع غزة. نحن نؤمن أن التعليم هو أقوى سلاح للتغيير، ولذلك وفرنا بيئة رقمية متطورة تدعم الطالب والمعلم على حد سواء.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-lg shadow-rose-100/20 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 rounded-2xl flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">رعاية شاملة</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">نقدم دعماً أكاديمياً ونفسياً للطلاب لضمان استمراريتهم وتفوقهم رغم كل الظروف.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-cyan-100 dark:border-cyan-900/30 shadow-lg shadow-cyan-100/20 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/50 rounded-2xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-cyan-500" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">منصة متطورة</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">فصول افتراضية، اختبارات ذكية، ومتابعة دقيقة للأداء باستخدام أحدث التقنيات.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hierarchy Section */}
      <section id="hierarchy" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
              هيكلية <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-500 to-cyan-500">منظمة وداعمة</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              تعمل منظومتنا بتناغم تام بين جميع الأطراف لضمان تقديم أفضل تجربة تعليمية للطالب.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-indigo-100 dark:border-indigo-900/30 text-center hover:-translate-y-2 transition-transform group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">المدير العام</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">إشراف شامل على المنظومة التعليمية ومتابعة دقيقة لمؤشرات الأداء والجودة.</p>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-amber-100 dark:border-amber-900/30 text-center hover:-translate-y-2 transition-transform md:-translate-y-8 group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">المنسق والمشرف</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">متابعة الفتحات التدريسية، توجيه المعلمين، وتقييم جودة المواد العلمية.</p>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-emerald-100 dark:border-emerald-900/30 text-center hover:-translate-y-2 transition-transform group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">الأستاذ المبدع</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium">بناء حصص تفاعلية، توليد اختبارات ذكية، ومتابعة مستمرة لتطور كل طالب.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Student CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[3rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              أنت محور اهتمامنا 🎯
            </h2>
            <p className="text-xl md:text-2xl font-medium text-emerald-50 max-w-2xl mx-auto">
              انضم لآلاف الطلبة الذين اختاروا التميز. واجهة دراسية مصممة خصيصاً لتشجيعك وتحفيزك يومياً!
            </p>
            <div className="pt-4">
              <Link to="/login" className="inline-block px-10 py-5 bg-white text-emerald-600 font-black rounded-2xl hover:scale-105 transition-transform shadow-xl text-xl">
                دخول الطالب
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-12">
            نحن دائماً بالقرب منك
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-slate-600 dark:text-slate-300">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">البريد الإلكتروني</h3>
              <p className="text-slate-500 font-medium dir-ltr">contact@baaqoon.ps</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-slate-600 dark:text-slate-300">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">الهاتف</h3>
              <p className="text-slate-500 font-medium dir-ltr">+970 59 123 4567</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-slate-600 dark:text-slate-300">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-2">المقر الرئيسي</h3>
              <p className="text-slate-500 font-medium">فلسطين - قطاع غزة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Strip */}
      <div className="flag-strip w-full relative z-50 shadow-md" />
      
      {/* Copyright Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm font-medium">
        <p>جميع الحقوق محفوظة &copy; منصة باقون {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
