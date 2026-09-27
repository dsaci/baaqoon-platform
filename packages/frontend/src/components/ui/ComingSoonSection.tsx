import React from 'react';
import { Lock } from 'lucide-react';

export default function ComingSoonSection({ features }: { features: { id: string; title: string; description: string; icon: any }[] }) {
  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-2 h-6 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></span>
        <h3 className="text-xl font-black text-slate-800 dark:text-white">
          أدوات استراتيجية (قريباً) 🚀
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.id} className="relative p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden group">
              {/* Coming Soon Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-md">
                <Lock className="w-3 h-3" /> قيد التطوير
              </div>
              
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-violet-500 transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              
              <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">{f.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
