const fs = require('fs');
const path = 'packages/frontend/src/features/scheduling/pages/TimetablePage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Import AttendanceModal
if (!code.includes('AttendanceModal')) {
    code = code.replace(
        /import \{ (.*) \} from 'lucide-react';/,
        `import { $1, CheckSquare } from 'lucide-react';\nimport AttendanceModal from '../components/AttendanceModal';`
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
const searchStr = `<div className="pt-4 flex gap-4">
                <button
                  type="submit"`;
const replaceStr = `<div className="pt-4 flex gap-4">
                {user?.primaryRole === 'teacher' && (
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
                  type="submit"`;

code = code.replace(searchStr, replaceStr);

// 4. Add the AttendanceModal component to the render tree at the VERY END of the component
if (!code.includes('<AttendanceModal')) {
    const endTarget = `{/* Delete Confirmation Modal */}`;
    const modalJSX = `
      {attendanceSessionId && (
        <AttendanceModal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          sessionId={attendanceSessionId}
        />
      )}
      
      {/* Delete Confirmation Modal */}`;
      
    code = code.replace(endTarget, modalJSX);
}

fs.writeFileSync(path, code);
