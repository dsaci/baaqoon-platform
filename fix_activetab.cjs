const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldState = "const [activeTab, setActiveTab] = useState<'cohorts' | 'hr' | 'requests'>('hr');";
const newState = `
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab') as 'cohorts' | 'hr' | 'requests' | null;
  const [activeTab, setActiveTab] = useState<'cohorts' | 'hr' | 'requests'>(tabParam || 'hr');

  React.useEffect(() => {
    const handleLocationChange = () => {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab') as 'cohorts' | 'hr' | 'requests' | null;
      if (tab) setActiveTab(tab);
    };

    // Keep activeTab in sync with URL
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
`;

if (code.includes(oldState)) {
    code = code.replace(oldState, newState);
    fs.writeFileSync(path, code);
    console.log('replaced activeTab');
}
