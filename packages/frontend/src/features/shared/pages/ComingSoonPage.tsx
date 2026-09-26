import React from 'react';
import { Settings, Hammer } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
      <div className="w-24 h-24 bg-baaqoon-100 dark:bg-baaqoon-900/50 rounded-full flex items-center justify-center mb-6 relative">
        <Settings className="w-12 h-12 text-baaqoon-400 dark:text-baaqoon-600 animate-spin-slow" />
        <Hammer className="w-8 h-8 text-baaqoon-accent absolute bottom-4 right-4 animate-bounce" />
      </div>
      
      <h1 className="text-3xl font-bold text-baaqoon-900 dark:text-white mb-4">
        هذه الصفحة قيد التطوير 🛠️
      </h1>
      
      <p className="text-baaqoon-500 dark:text-baaqoon-400 max-w-md mx-auto text-lg leading-relaxed">
        نحن نعمل حالياً على إضافة ميزة "التوزيع السنوي والأسبوعي" وربطها بالمنظومة الشاملة لباقون. ستكون متاحة قريباً جداً!
      </p>
      
      <div className="mt-8">
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-baaqoon-50 dark:bg-baaqoon-800 text-baaqoon-700 dark:text-baaqoon-300 rounded-lg hover:bg-baaqoon-100 dark:hover:bg-baaqoon-700 transition-colors font-bold border border-baaqoon-200 dark:border-baaqoon-700"
        >
          العودة للصفحة السابقة
        </button>
      </div>
    </div>
  );
}
