import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo.jpg';
import sketchImg from '../../../assets/olive_education_sketch.jpg';
import { BookOpen, Users, Target, Shield, Heart, PenTool, Mail, MapPin, Phone } from 'lucide-react';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col bg-baaqoon-50 dark:bg-baaqoon-950 font-sans selection:bg-baaqoon-200 scroll-smooth">
      
      {/* Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50" />

      {/* Navigation */}
      <nav className="fixed w-full top-6 z-40 px-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/80 dark:bg-baaqoon-900/80 backdrop-blur-md p-4 rounded-2xl pointer-events-auto shadow-sm border border-baaqoon-200 dark:border-baaqoon-800">
          <div className="flex items-center gap-3">
            <img src={logo} alt="باقون" className="w-10 h-10 mix-blend-multiply dark:mix-blend-normal object-contain" />
            <span className="text-xl font-bold text-baaqoon-900 dark:text-white">باقون</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-baaqoon-700 dark:text-baaqoon-300">
            <a href="#about" className="hover:text-baaqoon-accent transition-colors">{t('landing.about')}</a>
            <a href="#hierarchy" className="hover:text-baaqoon-accent transition-colors">{t('landing.hierarchy')}</a>
            <a href="#contact" className="hover:text-baaqoon-accent transition-colors">{t('landing.contact')}</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <LangToggle />
              <ThemeToggle />
            </div>
            <Link to="/login" className="px-5 py-2 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-lg transition-colors shadow-md">
              {t('landing.login')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16 flex items-center justify-center relative overflow-hidden">
        {/* Sketch Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-4xl mx-auto px-4 text-center z-10 space-y-10 animate-fade-in-up mt-8">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-white dark:bg-baaqoon-900 rounded-full blur-2xl opacity-60"></div>
            <img src={logo} alt="شعار باقون" className="relative w-48 h-48 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain drop-shadow-xl" />
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-baaqoon-900 dark:text-white tracking-tight leading-tight">
              {t('landing.hero_title_1')}<br/>{t('landing.hero_title_2')}
            </h1>
            <p className="text-xl md:text-2xl text-baaqoon-600 dark:text-baaqoon-400 font-medium max-w-2xl mx-auto leading-relaxed">
              {t('landing.hero_desc')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link to="/register" className="px-8 py-3.5 bg-baaqoon-900 dark:bg-white text-white dark:text-baaqoon-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-xl text-lg">
              {t('landing.join_now')}
            </Link>
            <a href="#about" className="px-8 py-3.5 bg-white dark:bg-baaqoon-900 border-2 border-baaqoon-200 dark:border-baaqoon-800 text-baaqoon-800 dark:text-white font-bold rounded-xl hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 transition-colors text-lg">
              {t('landing.discover')}
            </a>
          </div>
        </div>
      </main>

      {/* About & Mission Section */}
      <section id="about" className="py-24 bg-white dark:bg-baaqoon-900 border-y border-baaqoon-100 dark:border-baaqoon-800">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            {/* Sketch-like Illustration */}
            <div className="relative p-2 rounded-3xl bg-white dark:bg-baaqoon-900 shadow-xl border-4 border-baaqoon-100 dark:border-baaqoon-800 rotate-1 hover:rotate-0 transition-transform duration-500">
              <img 
                src={sketchImg} 
                alt="شجرة الزيتون وجذور العلم" 
                className="w-full h-auto rounded-2xl mix-blend-multiply dark:mix-blend-lighten opacity-90"
              />
              <div className="absolute -bottom-4 -left-4 text-baaqoon-400 dark:text-baaqoon-600 bg-white dark:bg-baaqoon-900 rounded-full p-3 shadow-lg border border-baaqoon-100 dark:border-baaqoon-800">
                <PenTool className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-8">
              <div id="mission" className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-baaqoon-accent/10 text-baaqoon-accentDark dark:text-baaqoon-accent font-bold rounded-full text-sm">
                  <Target className="w-4 h-4" />
                  {t('landing.mission_title')}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-baaqoon-900 dark:text-white leading-tight">
                  {t('landing.mission_heading')}
                </h2>
                <p className={`text-lg text-baaqoon-600 dark:text-baaqoon-400 leading-relaxed ${i18n.language === 'ar' ? 'text-justify' : 'text-left'}`}>
                  {t('landing.mission_text')}
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="bg-baaqoon-50 dark:bg-baaqoon-950 p-6 rounded-2xl border border-baaqoon-100 dark:border-baaqoon-800">
                  <Heart className="w-8 h-8 text-red-500 mb-3" />
                  <h3 className="font-bold text-baaqoon-900 dark:text-white text-lg mb-2">{t('landing.care_title')}</h3>
                  <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm leading-relaxed">{t('landing.care_text')}</p>
                </div>
                <div className="bg-baaqoon-50 dark:bg-baaqoon-950 p-6 rounded-2xl border border-baaqoon-100 dark:border-baaqoon-800">
                  <Shield className="w-8 h-8 text-emerald-500 mb-3" />
                  <h3 className="font-bold text-baaqoon-900 dark:text-white text-lg mb-2">{t('landing.platform_title')}</h3>
                  <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm leading-relaxed">{t('landing.platform_text')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hierarchy Section */}
      <section id="hierarchy" className="py-24 bg-baaqoon-50 dark:bg-baaqoon-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-baaqoon-900 dark:text-white">
              {t('landing.hierarchy_title')}
            </h2>
            <p className="text-baaqoon-600 dark:text-baaqoon-400 max-w-2xl mx-auto text-lg">
              {t('landing.hierarchy_desc')}
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-baaqoon-accent/50 to-transparent -translate-x-1/2"></div>
            
            <div className="space-y-12">
              {/* Level 1 */}
              <div className="relative flex flex-col items-center">
                <div className="w-full md:w-1/2 bg-white dark:bg-baaqoon-900 p-6 rounded-2xl shadow-xl border border-baaqoon-200 dark:border-baaqoon-800 text-center relative z-10 hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-baaqoon-accent/10 dark:bg-baaqoon-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-baaqoon-accent/20 text-baaqoon-accentDark dark:text-baaqoon-accent">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-baaqoon-900 dark:text-white mb-2">{t('landing.h_admin')}</h3>
                  <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm">{t('landing.h_admin_desc')}</p>
                </div>
              </div>
              
              {/* Level 2 */}
              <div className="relative flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                <div className="w-full md:w-[40%] bg-white dark:bg-baaqoon-900 p-6 rounded-2xl shadow-lg border border-baaqoon-200 dark:border-baaqoon-800 text-center relative z-10">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white mb-2">{t('landing.h_supervisor')}</h3>
                  <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm">{t('landing.h_supervisor_desc')}</p>
                </div>
              </div>

              {/* Level 3 */}
              <div className="relative flex flex-col items-center">
                <div className="w-full md:w-1/2 bg-white dark:bg-baaqoon-900 p-6 rounded-2xl shadow-md border border-baaqoon-200 dark:border-baaqoon-800 text-center relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white mb-2">{t('landing.h_teacher')}</h3>
                  <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm">{t('landing.h_teacher_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-baaqoon-900 border-t border-baaqoon-100 dark:border-baaqoon-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-baaqoon-900 dark:text-white mb-8">
            {t('landing.contact_title')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-baaqoon-50 dark:bg-baaqoon-800 rounded-full flex items-center justify-center mb-4 text-baaqoon-600 dark:text-baaqoon-400">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-baaqoon-900 dark:text-white mb-1">{t('landing.email')}</h3>
              <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm dir-ltr">contact@baaqoon.ps</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-baaqoon-50 dark:bg-baaqoon-800 rounded-full flex items-center justify-center mb-4 text-baaqoon-600 dark:text-baaqoon-400">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-baaqoon-900 dark:text-white mb-1">{t('landing.phone')}</h3>
              <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm dir-ltr">+970 59 123 4567</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-baaqoon-50 dark:bg-baaqoon-800 rounded-full flex items-center justify-center mb-4 text-baaqoon-600 dark:text-baaqoon-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-baaqoon-900 dark:text-white mb-1">{t('landing.hq')}</h3>
              <p className="text-baaqoon-600 dark:text-baaqoon-400 text-sm">{t('landing.hq_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Strip */}
      <div className="flag-strip w-full relative z-50" />
      
      {/* Copyright Footer */}
      <footer className="bg-baaqoon-950 text-baaqoon-400 py-6 text-center text-sm">
        <p>{t('landing.rights').replace('{year}', new Date().getFullYear().toString())}</p>
      </footer>
    </div>
  );
}
