const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('useSearchParams')) {
    code = code.replace(
        "import { useAuthStore } from '../../../store/useAuthStore';",
        "import { useAuthStore } from '../../../store/useAuthStore';\nimport { useSearchParams } from 'react-router-dom';"
    );
}

if (!code.includes('const [searchParams] = useSearchParams()')) {
    code = code.replace(
        "const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students'>('stats');",
        "const [searchParams] = useSearchParams();\n  const initialTab = (searchParams.get('tab') as 'stats' | 'teachers' | 'students') || 'stats';\n  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students'>(initialTab);"
    );
    fs.writeFileSync(path, code);
    console.log('SupervisorDashboard updated to read URL params');
} else {
    console.log('Already updated');
}
