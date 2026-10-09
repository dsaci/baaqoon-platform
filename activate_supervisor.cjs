const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state variables
code = code.replace(
    /const \[searchParams\] = useSearchParams\(\);/,
    `const [searchParams] = useSearchParams();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);`
);

// 2. Add Handlers
code = code.replace(
    /return \(/,
    `const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsMessageModalOpen(false);
        setMessageText('');
      }, 2000);
    }, 1000);
  };

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsAlertModalOpen(false);
        setMessageText('');
      }, 2000);
    }, 1000);
  };

  return (`
);

// 3. Add Modals JSX before the final closing div
const modalsJSX = `
      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
                إرسال رسالة 
              </h3>
              {showSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-emerald-600">
                  <CheckCircle className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">تم الإرسال بنجاح!</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نص الرسالة</label>
                    <textarea 
                      required
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-slate-900 dark:text-white"
                      placeholder="اكتب رسالتك هنا للمشرف أو الأستاذ..."
                    ></textarea>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isSending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                      {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                      إرسال
                    </button>
                    <button type="button" onClick={() => setIsMessageModalOpen(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                إرسال تنبيه غياب
              </h3>
              {showSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-emerald-600">
                  <CheckCircle className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">تم إرسال التنبيه!</p>
                </div>
              ) : (
                <form onSubmit={handleSendAlert} className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800/50 text-sm font-medium mb-4">
                    سيتم إرسال إشعار رسمي للطالب وولي أمره بخصوص تجاوز الحد المسموح للغياب.
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات إضافية (اختياري)</label>
                    <textarea 
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-slate-900 dark:text-white"
                      placeholder="مثال: يرجى التواصل مع الإدارة..."
                    ></textarea>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isSending} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                      {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Bell className="w-5 h-5" />}
                      تأكيد الإرسال
                    </button>
                    <button type="button" onClick={() => setIsAlertModalOpen(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
`;

code = code.replace(/<\/div>\s*<\/div>\s*\);\s*\}/, modalsJSX + '\n}');

// 4. Update the buttons that trigger the modals
code = code.replace(
    /onClick=\{\(\) => alert\('.*?'\)\}\s*className=\"text-baaqoon-accent hover:underline flex items-center gap-1\"/g,
    `onClick={() => { setSelectedTeacher('teacher_id_here'); setIsMessageModalOpen(true); }} className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-all"`
);

code = code.replace(
    /onClick=\{\(\) => alert\('.*?'\)\}\s*className=\"text-gray-500 dark:text-baaqoon-400 hover:text-gray-800 dark:text-white flex items-center gap-1\"/g,
    `onClick={() => { setSelectedStudent('student_id_here'); setIsAlertModalOpen(true); }} className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg transition-all"`
);

fs.writeFileSync(path, code);
