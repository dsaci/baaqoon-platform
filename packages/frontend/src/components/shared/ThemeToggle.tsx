import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, SunMoon, Check } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { themeMode, isDark, setThemeMode } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isRtl = i18n?.language ? i18n.language === 'ar' : true;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: {
    id: ThemeMode;
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    bgColor: string;
  }[] = [
    {
      id: 'light',
      labelAr: 'وضع نهاري (Light)',
      labelEn: 'Light Mode',
      descAr: 'إضاءة نهارية واضحة ومريحة',
      descEn: 'Clean daylight appearance',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      id: 'dark',
      labelAr: 'وضع ليلي (Dark)',
      labelEn: 'Dark Mode',
      descAr: 'تصميم داكن عالي التباين ومريح للعين',
      descEn: 'High contrast dark theme',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      id: 'system',
      labelAr: 'وضع النظام (System)',
      labelEn: 'System / Time-based',
      descAr: 'يتغير تلقائياً مع توقيت اليوم (نهار / ليل)',
      descEn: 'Adapts automatically to time of day',
      icon: SunMoon,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ];

  const currentOption = options.find((o) => o.id === themeMode) || options[2];
  const CurrentIcon = currentOption.icon;

  const handleSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-baaqoon-100 dark:hover:bg-baaqoon-800 transition-all text-baaqoon-700 dark:text-baaqoon-200 border border-transparent hover:border-baaqoon-200 dark:hover:border-baaqoon-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
        aria-label="خيارات المظهر (نهاري / ليلي / سيستم)"
        title={
          themeMode === 'system'
            ? isRtl
              ? 'وضع النظام (تلقائي حسب التوقيت)'
              : 'System Mode (Time-based)'
            : themeMode === 'dark'
              ? isRtl
                ? 'الوضع الليلي (Dark)'
                : 'Dark Mode'
              : isRtl
                ? 'الوضع النهاري (Light)'
                : 'Light Mode'
        }
      >
        <CurrentIcon className={`w-5 h-5 ${currentOption.iconColor} transition-transform hover:scale-110`} />
        {themeMode === 'system' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse absolute top-1.5 right-1.5" />
        )}
      </button>

      {/* 3-Mode Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            isRtl ? 'left-0' : 'right-0'
          } top-full mt-2 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-fade-in`}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {isRtl ? 'خيارات مظهر المنصة' : 'Theme Mode'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {isRtl ? '3 خيارات ذكية' : '3 Smart Modes'}
            </span>
          </div>

          {/* Options List */}
          <div className="space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-right ${
                    isSelected
                      ? 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${opt.bgColor} ${opt.iconColor} shadow-inner`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-black ${
                          isSelected
                            ? 'text-slate-950 dark:text-white'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isRtl ? opt.labelAr : opt.labelEn}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {isRtl ? opt.descAr : opt.descEn}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mr-2">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center">
            {isRtl
              ? 'الوضع التلقائي يفعّل المود الليلي مساءً والنهاري نهاراً وفق التوقيت'
              : 'System mode automatically switches based on day and night hours'}
          </div>
        </div>
      )}
    </div>
  );
}
