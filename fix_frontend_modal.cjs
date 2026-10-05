const fs = require('fs');
const path = 'packages/frontend/src/features/assessments/components/CreateAssessmentModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add question count state
if (!code.includes('const [questionCount, setQuestionCount]')) {
    code = code.replace(
        "const [manualTitle, setManualTitle] = useState('');",
        "const [manualTitle, setManualTitle] = useState('');\n  const [questionCount, setQuestionCount] = useState(5);"
    );
}

// 2. Increase max height for lessons container
code = code.replace('max-h-64 overflow-y-auto pr-2 custom-scrollbar', 'max-h-96 overflow-y-auto pr-2 custom-scrollbar');

// 3. Add Cancel button and Question Count dropdown in Footer
const oldFooter = `        {/* Footer */}
        <div className="p-6 border-t border-baaqoon-200 dark:border-baaqoon-700 bg-baaqoon-50/50 dark:bg-baaqoon-800/50 shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={loading || (mode === 'smart' && !selectedLesson) || (mode === 'manual' && !manualTitle.trim())}
            className="w-full py-3 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
            ) : mode === 'smart' ? (
              <><Bot className="w-5 h-5" /> توليد ذكي</>
            ) : (
              <><Check className="w-5 h-5" /> إنشاء الواجب</>
            )}
          </button>
        </div>`;

const newFooter = `        {/* Footer */}
        <div className="p-6 border-t border-baaqoon-200 dark:border-baaqoon-700 bg-baaqoon-50/50 dark:bg-baaqoon-800/50 shrink-0">
          {mode === 'smart' && (
            <div className="mb-4 flex items-center justify-between bg-white dark:bg-baaqoon-900 p-3 rounded-xl border border-baaqoon-200 dark:border-baaqoon-700">
              <span className="text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300">حيز الأسئلة (العدد المولد):</span>
              <select 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="bg-baaqoon-50 dark:bg-baaqoon-800 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg px-3 py-1.5 text-sm font-bold text-baaqoon-900 dark:text-white outline-none focus:border-baaqoon-accent"
              >
                <option value={3}>3 أسئلة</option>
                <option value={5}>5 أسئلة</option>
                <option value={10}>10 أسئلة</option>
                <option value={15}>15 سؤال</option>
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-baaqoon-200 dark:bg-baaqoon-700 hover:bg-baaqoon-300 dark:hover:bg-baaqoon-600 text-baaqoon-800 dark:text-white rounded-xl font-bold transition-colors"
            >
              إلغاء (رجوع)
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || (mode === 'smart' && !selectedLesson) || (mode === 'manual' && !manualTitle.trim())}
              className="flex-[2] py-3 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
              ) : mode === 'smart' ? (
                <><Bot className="w-5 h-5" /> توليد ذكي</>
              ) : (
                <><Check className="w-5 h-5" /> إنشاء الواجب</>
              )}
            </button>
          </div>
        </div>`;

if (code.includes('        {/* Footer */}')) {
    code = code.replace(oldFooter, newFooter);
    
    // Also pass questionCount in API
    code = code.replace(
        "curriculumLessonId: selectedLesson.id",
        "curriculumLessonId: selectedLesson.id,\n          questionCount: questionCount"
    );

    fs.writeFileSync(path, code);
    console.log('Frontend modal fixed');
} else {
    console.log('Could not find Footer');
}
