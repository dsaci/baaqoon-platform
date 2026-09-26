import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, ShieldAlert, User, Search, Trash2, X, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data reflecting the strictly moderated backend architecture
  const [messages, setMessages] = useState([
    { id: 1, text: 'السلام عليكم أستاذ، متى موعد الحصة القادمة؟', sender: 'student', status: 'safe', time: '10:00 ص' },
    { id: 2, text: 'وعليكم السلام، ستكون غداً الساعة 4 عصراً.', sender: 'me', status: 'safe', time: '10:05 ص' },
    { id: 3, text: 'ممكن نتواصل عبر الواتساب؟ رقمي 0591234567', sender: 'student', status: 'flagged', reason: 'يحتوي على رقم هاتف (معلومات شخصية)', time: '10:10 ص' },
    { id: 4, text: 'ادخلوا على هذا الرابط فيسبوك...', sender: 'student', status: 'blocked', reason: 'رابط منصة تواصل محظورة', time: '10:15 ص' },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      text: messageInput,
      sender: 'me',
      status: 'safe',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessageInput('');
  };

  const handleClearChats = () => {
    setMessages([]);
    setIsClearModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in-up font-sans" dir="rtl">
      {/* Sidebar: Conversations List */}
      <div className="w-80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col hidden lg:flex overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">المحادثات</h2>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث في المحادثات..." 
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Active Conversation Item */}
          <div className="p-4 rounded-2xl bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border-2 border-violet-200 dark:border-violet-800/50 cursor-pointer flex gap-4 items-center transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
              <UsersIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">مجموعة فوج غزة</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mt-1">أحمد: ادخلوا على هذا الرابط...</p>
            </div>
            <div className="text-[10px] font-black text-violet-500 shrink-0 self-start mt-1">10:15 ص</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 border border-violet-200 dark:border-violet-800/50 flex items-center justify-center shadow-sm">
              <UsersIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white mb-0.5">مجموعة فوج غزة</h2>
              <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                12 طالب متصل
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-black rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            تصفير المحادثة
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold">لا توجد رسائل هنا. ابدأ المحادثة الآن!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender === 'me';
              
              // Blocked Message Handling
              if (msg.status === 'blocked') {
                return (
                  <div key={msg.id} className="flex justify-start animate-fade-in-up">
                    <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800/50 rounded-2xl rounded-tr-none p-4 max-w-[80%] text-sm text-rose-800 dark:text-rose-300 shadow-sm">
                      <div className="flex items-center gap-2 font-black mb-2 text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-5 h-5" /> تم حجب الرسالة آلياً
                      </div>
                      <p className="opacity-70 line-through mb-3 font-medium bg-rose-100/50 dark:bg-rose-900/30 p-2 rounded-lg">{msg.text}</p>
                      <p className="text-xs font-black bg-rose-200/50 dark:bg-rose-800/50 inline-block px-2 py-1 rounded-md">السبب: {msg.reason}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={`
                      px-5 py-3.5 rounded-2xl text-sm font-bold shadow-md
                      ${isMe 
                        ? 'bg-gradient-to-l from-violet-500 to-fuchsia-600 text-white rounded-tl-sm border border-violet-400/50' 
                        : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-sm'
                      }
                    `}>
                      {msg.text}
                    </div>
                    
                    {/* Flagged Message Warning */}
                    {msg.status === 'flagged' && user?.primaryRole === 'teacher' && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 rounded-xl font-bold shadow-sm">
                        <AlertTriangle className="w-4 h-4" />
                        تنبيه النظام: {msg.reason}
                      </div>
                    )}
                    
                    <div className={`text-[10px] font-black text-slate-400 mt-1 ${isMe ? 'text-left' : 'text-right'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <form className="flex gap-3 relative" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..." 
              className="flex-1 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all font-bold shadow-sm text-slate-900 dark:text-white"
            />
            <button 
              type="submit"
              disabled={!messageInput.trim()}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white flex items-center justify-center transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
            >
              <Send className="w-6 h-6 rtl:-translate-x-1 rtl:-scale-x-100" />
            </button>
          </form>
          <p className="text-[10px] font-bold text-slate-400 mt-3 text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            تتم مراجعة الرسائل آلياً بالذكاء الاصطناعي لضمان بيئة آمنة ومحفزة.
          </p>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 max-w-md w-full animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-rose-200 dark:border-rose-800/50">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">تصفير المحادثة</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
              هل أنت متأكد من رغبتك في مسح جميع الرسائل في هذه المجموعة؟ لا يمكن التراجع عن هذه الخطوة وسيفقد جميع الطلاب الوصول لهذه الرسائل.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleClearChats}
                className="flex-1 px-5 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl transition-all shadow-lg shadow-rose-500/30 hover:-translate-y-0.5"
              >
                نعم، مسح الجميع
              </button>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl transition-all border border-slate-200 dark:border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
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
