const fs = require('fs');
const path = 'packages/frontend/src/components/shared/ProfileModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add nationality to formData type inference if not there
code = code.replace(
    /const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/,
    `const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || ''
  });`
);

// 2. Fix handleChange type
code = code.replace(
    /const handleChange = \(e: React\.ChangeEvent<HTMLInputElement \| HTMLTextAreaElement>\) => \{/,
    `const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {`
);

fs.writeFileSync(path, code);
console.log('ProfileModal TS errors fixed');
