const fs = require('fs');
const path = 'packages/frontend/src/features/scheduling/pages/VirtualClassroom.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('AttendanceModal')) {
    code = code.replace(
        "import { useAuthStore } from '../../../store/useAuthStore';",
        "import { useAuthStore } from '../../../store/useAuthStore';\nimport AttendanceModal from '../components/AttendanceModal';"
    );

    code = code.replace(
        "const [isEnding, setIsEnding] = useState(false);",
        "const [isEnding, setIsEnding] = useState(false);\n  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);"
    );

    const oldButtons = `<button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="إعدادات الجلسة">
                <Settings className="w-4 h-4" />
              </button>
              {user?.primaryRole === 'teacher' && (
                <button`;
    const newButtons = `<button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="إعدادات الجلسة">
                <Settings className="w-4 h-4" />
              </button>
              {user?.primaryRole === 'teacher' && (
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors ml-2"
                >
                  <Users className="w-4 h-4" />
                  رصد الغياب
                </button>
              )}
              {user?.primaryRole === 'teacher' && (
                <button`;

    code = code.replace(oldButtons, newButtons);

    code = code.replace(
        /<\/div>\s*<\/div>\s*\);\s*\}/,
        `      {user?.primaryRole === 'teacher' && (
        <AttendanceModal 
          isOpen={isAttendanceModalOpen} 
          onClose={() => setIsAttendanceModalOpen(false)} 
          sessionId={sessionId!} 
        />
      )}
    </div>
  );
}`
    );

    fs.writeFileSync(path, code);
    console.log('VirtualClassroom updated with Attendance button');
} else {
    console.log('Already updated');
}
