const fs = require('fs');
const path = 'packages/frontend/src/features/scheduling/pages/TimetablePage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Import AttendanceModal
if (!code.includes('AttendanceModal')) {
    code = code.replace(
        /import \{ X, Calendar as CalendarIcon, MapPin, Map, RefreshCcw, BookOpen, AlertCircle, Trash2 \} from 'lucide-react';/,
        `import { X, Calendar as CalendarIcon, MapPin, Map, RefreshCcw, BookOpen, AlertCircle, Trash2, CheckSquare } from 'lucide-react';\nimport AttendanceModal from '../components/AttendanceModal';`
    );
}

// 2. Add state for attendance modal
if (!code.includes('isAttendanceOpen')) {
    code = code.replace(
        /const \[editingSession, setEditingSession\] = useState<any \| null>\(null\);/,
        `const [editingSession, setEditingSession] = useState<any | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);`
    );
}

// 3. Add button in the edit modal
if (!code.includes('رصد الغياب')) {
    const replacement = `{user?.primaryRole === 'teacher' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceSessionId(editingSession.id);
                      setIsAttendanceOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl transition-all"
                  >
                    <CheckSquare className="w-5 h-5" />
                    رصد الغياب
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-6 py-3.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"`;
    
    // Actually we need to target the submit button
    code = code.replace(/<button\s*type=\"submit\"[^>]*>[\s\S]*?حفظ التعديلات[\s\S]*?<\/button>/, replacement + '>حفظ التعديلات</button>');
}

// 4. Add the AttendanceModal component to the render tree
if (!code.includes('<AttendanceModal')) {
    code = code.replace(
        /<\/div>\s*<\/div>\s*\)\s*;\s*\}/,
        `  {attendanceSessionId && (
        <AttendanceModal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          sessionId={attendanceSessionId}
        />
      )}
    </div>
  );
}`
    );
}

fs.writeFileSync(path, code);
