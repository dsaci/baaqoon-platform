import React, { useState } from 'react';
import { Send, AlertTriangle, ShieldAlert, User, Search } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');

  // Mock data reflecting the strictly moderated backend architecture
  const [messages] = useState([
    { id: 1, text: 'السلام عليكم أستاذ، متى موعد الحصة القادمة؟', sender: 'student', status: 'safe', time: '10:00 ص' },
    { id: 2, text: 'وعليكم السلام، ستكون غداً الساعة 4 عصراً.', sender: 'me', status: 'safe', time: '10:05 ص' },
    { id: 3, text: 'ممكن نتواصل عبر الواتساب؟ رقمي 0591234567', sender: 'student', status: 'flagged', reason: 'يحتوي على رقم هاتف (معلومات شخصية)', time: '10:10 ص' },
    { id: 4, text: 'ادخلوا على هذا الرابط فيسبوك...', sender: 'student', status: 'blocked', reason: 'رابط منصة تواصل محظورة', time: '10:15 ص' },
  ]);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in-up">
      {/* Sidebar: Conversations List */}
      <div className="w-80 glass-panel flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-baaqoon-200 dark:border-baaqoon-700">
          <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white mb-4">المحادثات</h2>
          <div className="relative">
            <Search className="w-5 h-5 absolute right-3 top-2.5 text-baaqoon-400" />
            <input 
              type="text" 
              placeholder="ابحث..." 
              className="w-full pl-4 pr-10 py-2 bg-baaqoon-50 dark:bg-baaqoon-950 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg text-sm focus:outline-none focus:border-baaqoon-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Active Conversation Item */}
          <div className="p-4 border-b border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50 dark:bg-baaqoon-950 cursor-pointer flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-baaqoon-200 flex items-center justify-center shrink-0">
              <UsersIcon className="w-5 h-5 text-baaqoon-600 dark:text-baaqoon-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-baaqoon-900 dark:text-white truncate">مجموعة فوج غزة</h3>
              <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400 truncate">أحمد: ادخلوا على هذا الرابط...</p>
            </div>
            <div className="text-xs text-baaqoon-400 shrink-0">10:15 ص</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-baaqoon-200 dark:border-baaqoon-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-baaqoon-200 flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-baaqoon-600 dark:text-baaqoon-400" />
          </div>
          <div>
            <h2 className="font-bold text-baaqoon-900 dark:text-white">مجموعة فوج غزة</h2>
            <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400">12 طالب مسجل</p>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map(msg => {
            const isMe = msg.sender === 'me';
            
            // Blocked Message Handling
            if (msg.status === 'blocked') {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] text-sm text-red-800">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <ShieldAlert className="w-4 h-4" /> رسالة محجوبة تلقائياً
                    </div>
                    <p className="opacity-80 line-through mb-2">{msg.text}</p>
                    <p className="text-xs font-semibold">السبب: {msg.reason}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className={`
                    px-4 py-2.5 rounded-2xl text-sm shadow-sm
                    ${isMe 
                      ? 'bg-baaqoon-accent text-white rounded-tl-none' 
                      : 'bg-white dark:bg-baaqoon-900 border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-800 dark:text-baaqoon-100 rounded-tr-none'
                    }
                  `}>
                    {msg.text}
                  </div>
                  
                  {/* Flagged Message Warning */}
                  {msg.status === 'flagged' && user?.primaryRole === 'teacher' && (
                    <div className="flex items-center gap-1 text-xs text-baaqoon-red mt-1 bg-red-50 px-2 py-1 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      ملاحظة النظام: {msg.reason}
                    </div>
                  )}
                  
                  <div className={`text-xs text-baaqoon-400 ${isMe ? 'text-left' : 'text-right'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-900 rounded-b-xl">
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..." 
              className="flex-1 px-4 py-2.5 bg-baaqoon-50 dark:bg-baaqoon-950 border border-baaqoon-200 dark:border-baaqoon-700 rounded-full focus:outline-none focus:border-baaqoon-accent transition-colors"
            />
            <button 
              type="submit"
              className="w-12 h-12 rounded-full bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </form>
          <p className="text-xs text-baaqoon-400 mt-2 text-center">
            تتم مراجعة الرسائل آلياً لضمان بيئة آمنة للطلاب.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Icon
function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
