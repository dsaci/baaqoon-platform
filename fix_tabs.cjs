const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace useState initialization for activeTab
const oldState = "const [activeTab, setActiveTab] = useState<'hr' | 'cohorts' | 'requests'>(hasPendingUsers ? 'hr' : 'cohorts');";
const newState = `
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as 'hr' | 'cohorts' | 'requests' | null;
  const [activeTab, setActiveTab] = useState<'hr' | 'cohorts' | 'requests'>(tabParam || (hasPendingUsers ? 'hr' : 'cohorts'));

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);
`;

if (code.includes(oldState)) {
    code = code.replace(oldState, newState);
    // Add useLocation to imports if not present
    if (!code.includes('useLocation')) {
        code = code.replace('import { useNavigate }', 'import { useNavigate, useLocation }');
    }
    fs.writeFileSync(path, code);
    console.log('done');
} else {
    console.log('not found');
}
