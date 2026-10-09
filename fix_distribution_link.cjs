const fs = require('fs');
const path = 'packages/frontend/src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldGlobalLinks = `    const navLinks = [
    ...getNavLinks(),
    { name: "مقالات وتدريبات وامتحانات (قيد التطوير)", path: \`/\${basePath}/coming-soon-articles\`, icon: BookOpen },
    { name: "الإسناد الأكاديمي", path: \`/\${basePath}/distribution\`, icon: Calendar },
  ];`;

const newGlobalLinks = `    const navLinks = [
    ...getNavLinks(),
    { name: "مقالات وتدريبات وامتحانات (قيد التطوير)", path: \`/\${basePath}/coming-soon-articles\`, icon: BookOpen },
  ];`;
code = code.replace(oldGlobalLinks, newGlobalLinks);


const oldSuperAdmin = `    if (user?.primaryRole === "super_admin") {
      return [
        {
          name: "فضاء المؤسسة (المدير)",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
        {
          name: "لوحة التحكم",
          path: "/supervisor/dashboard",
          icon: Activity,
        },
      ];
    }`;

const newSuperAdmin = `    if (user?.primaryRole === "super_admin") {
      return [
        {
          name: "فضاء المؤسسة (المدير)",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "الإسناد الأكاديمي", path: "/admin/distribution", icon: Calendar },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
        {
          name: "لوحة التحكم",
          path: "/supervisor/dashboard",
          icon: Activity,
        },
      ];
    }`;
code = code.replace(oldSuperAdmin, newSuperAdmin);


const oldAdmin = `    if (user?.primaryRole === "admin") {
      return [
        {
          name: "فضاء المؤسسة",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
      ];
    }`;

const newAdmin = `    if (user?.primaryRole === "admin") {
      return [
        {
          name: "فضاء المؤسسة",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        { name: "الإسناد الأكاديمي", path: "/admin/distribution", icon: Calendar },
        { name: "قاعدة البيانات", path: "/admin/database", icon: Users },
      ];
    }`;
code = code.replace(oldAdmin, newAdmin);

fs.writeFileSync(path, code);
