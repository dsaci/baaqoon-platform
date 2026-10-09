const fs = require('fs');
const path = 'packages/frontend/src/features/assessments/pages/AssessmentsPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for Manual Assignment Modal
const stateSearch = `  const [generatorMode, setGeneratorMode] = useState<'smart' | 'manual'>('smart');`;
const stateReplace = `  const [generatorMode, setGeneratorMode] = useState<'smart' | 'manual'>('smart');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState({ title: '', cohortId: '', description: '', subject: '' });
  const [isManualCreating, setIsManualCreating] = useState(false);
  const queryClient = useQueryClient();
  const { data: myCohorts = [] } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      const res = await api.get('/groups/cohorts/me');
      return res.data;
    },
    enabled: isTeacher
  });`;
code = code.replace(stateSearch, stateReplace);

// 2. Add X icon import
code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, (match, p1) => {
    if (p1.includes('X')) return match;
    return `import { ${p1}, X } from 'lucide-react';`;
});

fs.writeFileSync(path, code);
