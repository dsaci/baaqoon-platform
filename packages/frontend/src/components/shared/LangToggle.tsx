import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LangToggle() {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-2 p-2 rounded-full hover:bg-baaqoon-100 dark:hover:bg-baaqoon-800 transition-colors text-baaqoon-600 dark:text-baaqoon-300 font-medium text-sm"
      aria-label="Toggle Language"
    >
      <Languages className="w-5 h-5" />
      <span className="uppercase">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
}
