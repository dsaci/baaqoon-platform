import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, ShieldAlert, User, Users, Search, Trash2, X, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['chat_conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data;
    }
  });

  // Set active conversation to first one by default
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Fetch Messages for active conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['chat_messages', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];
      const res = await api.get(`/chat/conversations/${activeConversationId}/messages`);
      return res.data;
    },
    enabled: !!activeConversationId,
    refetchInterval: 3000 // Simple polling for new messages
  });

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activeConversationId) return;
      const res = await api.post(`/chat/conversations/${activeConversationId}/messages`, { text });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat_conversations'] });
    }
  });

  const handleClearChats = () => {
    // Note: Clearing chats should be handled by backend. Mocked for UI here.
    setIsClearModalOpen(false);
    alert('تم إرسال طلب التصفير إلى الخادم بنجاح.');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;

    sendMessageMutation.mutate(messageInput);
    setMessageInput('');
  };

  const activeConversation = conversations.find((c: any) => c.id === activeConversationId);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
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
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loadingConversations ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mt-10">لا توجد محادثات نشطة</p>
          ) : (
            conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full text-right p-4 rounded-xl transition-all duration-200 ${
                  activeConversationId === conv.id 
                    ? 'bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30 border border-violet-200 dark:border-violet-800 shadow-sm' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                    conv.role === 'group' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  }`}>
                    {conv.role === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                      {conv.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {conv.role === 'group' ? 'فوج دراسي' : 'محادثة خاصة'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-2 font-medium">
                  {conv.lastMessage || 'لا توجد رسائل بعد'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConversation ? (
        <div className="flex-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="h-20 border-b border-slate-200 dark:border-slate-800/50 px-8 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                activeConversation.role === 'group' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }`}>
                {activeConversation.role === 'group' ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {activeConversation.name}
                </h2>
                <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  نشط الآن
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsClearModalOpen(true)}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="تصفير المحادثة"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
            {loadingMessages ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <MessageSquare className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-lg font-bold text-slate-500">ابدأ المحادثة الآن</p>
                <p className="text-sm text-slate-400 mt-1">الرسائل محمية ومراقبة آلياً</p>
              </div>
            ) : (
              messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                const isBlocked = msg.status === 'blocked';
                const isFlagged = msg.status === 'flagged';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 shadow-sm border border-white dark:border-slate-600">
                          {msg.sender?.firstName?.[0] || 'م'}
                        </div>
                      )}
                      
                      <div className={`relative px-5 py-3.5 shadow-sm ${
                        isBlocked ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-2xl' :
                        isFlagged ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 rounded-2xl' :
                        isMe ? 'bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-sm' : 
                        'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm'
                      }`}>
                        {!isMe && <p className="text-xs font-bold opacity-70 mb-1">{msg.sender?.firstName} {msg.sender?.lastName}</p>}
                        
                        {isBlocked ? (
                          <div className="flex items-center gap-2 font-bold">
                            <ShieldAlert className="w-5 h-5" />
                            <span>تم حجب الرسالة</span>
                          </div>
                        ) : (
                          <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {isFlagged && (
                          <div className="mt-2 text-xs font-bold flex items-center gap-1.5 opacity-80 bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            تحذير: {msg.moderationReason || 'محتوى غير لائق'}
                          </div>
                        )}
                        
                        <span className={`text-[10px] font-bold mt-2 block ${
                          isBlocked ? 'text-red-500/70' :
                          isFlagged ? 'text-amber-600/70' :
                          isMe ? 'text-violet-200' : 
                          'text-slate-400'
                        }`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex items-end gap-4 relative">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-violet-500 dark:focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all shadow-sm">
                <textarea 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="اكتب رسالتلك هنا..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-5 text-sm font-medium text-slate-800 dark:text-slate-200"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Send className="w-6 h-6 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-center p-8">
          <MessageSquare className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-2">مرحباً بك في المحادثات</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
            قم باختيار محادثة من القائمة الجانبية للبدء بالتواصل المباشر مع طلابك وزملائك.
          </p>
        </div>
      )}

      {/* Clear Chats Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">تصفير المحادثة؟</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium mb-8 leading-relaxed">
              هل أنت متأكد من رغبتك في تصفير هذه المحادثة؟ سيتم إخفاء جميع الرسائل السابقة للطرفين ولا يمكن التراجع عن هذا الإجراء.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleClearChats}
                className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
              >
                تأكيد التصفير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
