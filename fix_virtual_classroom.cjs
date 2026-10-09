const fs = require('fs');
const path = 'packages/frontend/src/features/scheduling/pages/VirtualClassroom.tsx';
let code = fs.readFileSync(path, 'utf8');

const badCode = `          </button>
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

  const tools =`;

const fixedCode = `          </button>
        </div>
      </div>
    );
  }

  const tools =`;

code = code.replace(badCode, fixedCode);

const badEnd = `      </div>
    </div>
  );
}`;

const fixedEnd = `      </div>
      {user?.primaryRole === 'teacher' && (
        <AttendanceModal 
          isOpen={isAttendanceModalOpen} 
          onClose={() => setIsAttendanceModalOpen(false)} 
          sessionId={sessionId!} 
        />
      )}
    </div>
  );
}`;

const lastIndex = code.lastIndexOf(badEnd);
if (lastIndex !== -1) {
    code = code.substring(0, lastIndex) + fixedEnd + code.substring(lastIndex + badEnd.length);
}

fs.writeFileSync(path, code);
console.log('Fixed VirtualClassroom');
