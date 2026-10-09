import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, ArrowRight, AlertCircle, CheckCircle, 
  PenTool, Square, Circle, Eraser, Type, MousePointer2, 
  Undo, Redo, Download, Share2, Users, MessageSquare, Hand,
  Mic, Video, MonitorUp, Settings, Maximize2
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import AttendanceModal from '../components/AttendanceModal';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function VirtualClassroom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('pen');
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'chat' | 'participants'

  useEffect(() => {
    const roomName = `baaqoon_session_${sessionId}`;
    const displayName = `${user?.firstName} ${user?.lastName}`;

    const loadJitsi = () => {
      if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          toolbarButtons: ['microphone', 'camera', 'desktop', 'fullscreen', 'settings'],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DEFAULT_BACKGROUND: '#18181b', // zinc-900
        },
        userInfo: {
          displayName,
          email: user?.email,
        },
      });

      jitsiApiRef.current.addEventListeners({
        videoConferenceJoined: () => setIsLoading(false),
        readyToClose: () => handleEndSession(),
      });
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = loadJitsi;
      script.onerror = () => {
        setError('تعذر تحميل خوادم البث المباشر. يرجى التحقق من اتصالك بالإنترنت.');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } else {
      loadJitsi();
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [sessionId, user]);

  const handleEndSession = async () => {
    setIsEnding(true);
    setTimeout(() => {
      navigate(-1);
    }, 1000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <div className="glass-panel p-8 text-center max-w-md bg-zinc-900 border border-zinc-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">خطأ في الانضمام</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            العودة للسابق
          </button>
              {user?.primaryRole === 'teacher' && (
        <AttendanceModal 
          isOpen={isAttendanceModalOpen} 
          onClose={() => setIsAttendanceModalOpen(false)} 
          sessionId={sessionId!} 
        />
      )}
    </div>
  );
}

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'تحديد' },
    { id: 'pen', icon: PenTool, label: 'قلم حر' },
    { id: 'eraser', icon: Eraser, label: 'ممحاة' },
    { id: 'text', icon: Type, label: 'نص' },
    { id: 'rect', icon: Square, label: 'مربع' },
    { id: 'circle', icon: Circle, label: 'دائرة' },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Top control bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 px-3 py-1.5 rounded-lg"
          >
            <ArrowRight className="w-4 h-4" />
            خروج من القاعة
          </button>
          
          <div className="h-6 w-px bg-zinc-800"></div>
          
          <div>
            <h1 className="font-bold text-sm">مراجعة فيزياء - الوحدة الثالثة</h1>
            <p className="text-xs text-zinc-500">فوج غزة (علمي) • أ. أحمد الخطيب</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            {isLoading
              ? <Loader2 className="w-3 h-3 animate-spin text-red-500" />
              : <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            }
            <span className="text-xs font-bold text-red-500">REC 00:14:32</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="مشاركة الشاشة">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="إعدادات القاعة">
              <Settings className="w-4 h-4" />
            </button>
            {user?.primaryRole === 'teacher' && (
              <button
                onClick={handleEndSession}
                disabled={isEnding || isLoading}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors ml-2 disabled:opacity-50"
              >
                {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                إنهاء الحصة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Interactive Whiteboard Area */}
        <div className="flex-1 relative flex flex-col bg-zinc-950">
          {/* Floating Whiteboard Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-1.5 flex items-center gap-1 z-10">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  title={tool.label}
                  className={`p-2 rounded-lg transition-all ${activeTool === tool.id ? 'bg-baaqoon-accent text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            
            <div className="w-px h-6 bg-zinc-700 mx-1"></div>
            
            <div className="flex gap-1 items-center px-2">
              <button className="w-6 h-6 rounded-full bg-white dark:bg-baaqoon-900 border-2 border-zinc-700 hover:scale-110 transition-transform"></button>
              <button className="w-6 h-6 rounded-full bg-red-500 border-2 border-zinc-700 hover:scale-110 transition-transform"></button>
              <button className="w-6 h-6 rounded-full bg-blue-500 border-2 border-zinc-700 hover:scale-110 transition-transform"></button>
              <button className="w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-white hover:scale-110 transition-transform"></button>
            </div>
            
            <div className="w-px h-6 bg-zinc-700 mx-1"></div>

            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg" title="تراجع">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg" title="إعادة">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Dummy Canvas Grid Background */}
          <div className="flex-1 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}>
            {/* Mockup drawing */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="text-emerald-400 font-bold text-3xl opacity-80" style={{ fontFamily: 'cursive' }}>
                F = G \frac{"{m_1 m_2}"}{"{r^2}"}
              </div>
              <svg width="400" height="200" className="mt-4 opacity-50">
                <circle cx="50" cy="100" r="30" fill="none" stroke="#60a5fa" strokeWidth="3" />
                <circle cx="350" cy="100" r="40" fill="none" stroke="#f87171" strokeWidth="3" />
                <path d="M 90 100 L 300 100" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="5,5" />
                <text x="180" y="90" fill="#a1a1aa" fontSize="14">r (المسافة)</text>
              </svg>
            </div>
          </div>
          
          {/* Mini-map / Zoom controls */}
          <div className="absolute bottom-4 left-4 bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center gap-2 shadow-lg">
            <span className="text-xs text-zinc-500 font-bold">100%</span>
            <button className="p-1 hover:bg-zinc-800 rounded"><Maximize2 className="w-3 h-3 text-zinc-400" /></button>
          </div>
        </div>

        {/* Right: Communications & Video Panel */}
        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col z-20 shadow-2xl shrink-0">
          
          {/* Tabs */}
          <div className="flex p-2 bg-zinc-950/50">
            <button 
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'video' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Video className="w-3.5 h-3.5" />
              الكاميرا ({isLoading ? '0' : '15'})
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              الدردشة
            </button>
            <button 
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'participants' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Hand className="w-3.5 h-3.5" />
              مشاركات
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative bg-zinc-950 flex flex-col">
            
            {/* VIDEO TAB (Jitsi Embed) */}
            <div className={`absolute inset-0 flex flex-col ${activeTab === 'video' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div ref={jitsiContainerRef} className="flex-1 w-full h-full" />
              {isLoading && (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-baaqoon-accent animate-spin" />
                  <p className="text-sm text-zinc-400">جاري الاتصال بخوادم البث...</p>
                </div>
              )}
            </div>

            {/* CHAT TAB MOCKUP */}
            {activeTab === 'chat' && (
              <div className="absolute inset-0 flex flex-col bg-zinc-900 z-10">
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500">16:05 - محمد أحمد</span>
                    <div className="bg-zinc-800 text-zinc-200 p-2 rounded-lg text-sm rounded-tr-none w-fit max-w-[90%]">
                      أستاذ ممكن تعيد نقطة تأثير المسافة في القانون؟
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] text-zinc-500">16:06 - أنت</span>
                    <div className="bg-baaqoon-accent/20 text-baaqoon-300 border border-baaqoon-accent/30 p-2 rounded-lg text-sm rounded-tl-none w-fit max-w-[90%]">
                      أكيد محمد، ركز معي الآن على السبورة سأقوم برسمها.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                  <div className="flex items-center gap-2 bg-zinc-900 rounded-lg border border-zinc-800 px-3 py-2 focus-within:border-baaqoon-accent transition-colors">
                    <input type="text" placeholder="اكتب رسالة..." className="bg-transparent text-sm w-full outline-none text-white placeholder-zinc-600" />
                    <button className="text-baaqoon-accent"><ArrowRight className="w-4 h-4 rotate-180" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* PARTICIPANTS TAB MOCKUP */}
            {activeTab === 'participants' && (
              <div className="absolute inset-0 flex flex-col bg-zinc-900 z-10 p-2 overflow-y-auto space-y-1">
                {[
                  { name: 'أنت (المنشئ)', role: 'أستاذ', hand: false },
                  { name: 'محمد أحمد', role: 'طالب', hand: true },
                  { name: 'سارة خالد', role: 'طالب', hand: false },
                  { name: 'عمر يوسف', role: 'طالب', hand: true },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-[10px] text-zinc-500">{p.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.hand && <Hand className="w-3.5 h-3.5 text-amber-500" />}
                      <Mic className="w-3.5 h-3.5 text-red-400 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
