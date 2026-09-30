const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const oldStr1 = "const navLinks = [...getNavLinks(), { name: \"مقالات وتدريبات وامتحانات (قيد التطوير)\", path: `/${user?.primaryRole?.includes('admin') ? 'admin' : user?.primaryRole?.includes('supervisor') ? 'supervisor' : user?.primaryRole || 'student'}/coming-soon`, icon: BookOpen }];";
const oldStr2 = "const navLinks = [...getNavLinks(), { name: \"مقالات وتدريبات وامتحانات (قيد التطوير)\", path: `/${user?.primaryRole?.includes('admin') ? 'admin' : user?.primaryRole?.includes('supervisor') \\n? 'supervisor' : user?.primaryRole || 'student'}/coming-soon`, icon: BookOpen }];";

const replacement = `  const basePath = user?.primaryRole?.includes('admin') ? 'admin' : user?.primaryRole?.includes('supervisor') ? 'supervisor' : user?.primaryRole || 'student';
  const navLinks = [
    ...getNavLinks(),
    { name: "مقالات وتدريبات وامتحانات (قيد التطوير)", path: \`/\${basePath}/coming-soon-articles\`, icon: BookOpen },
    { name: "التوزيع السنوي والأسبوعي (قيد التطوير)", path: \`/\${basePath}/coming-soon-distribution\`, icon: Calendar }
  ];`;

// Just use regex to find `const navLinks = [...getNavLinks()...];`
code = code.replace(/const navLinks = \[\.\.\.getNavLinks\(\).*?\];/s, replacement);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
