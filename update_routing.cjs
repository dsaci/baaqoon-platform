const fs = require('fs');

// 1. Update App.tsx
const appPath = 'packages/frontend/src/App.tsx';
let appCode = fs.readFileSync(appPath, 'utf8');
if (!appCode.includes('import DistributionAdminPage')) {
    appCode = appCode.replace(
        'import AdminDatabasePage from "./features/admin/pages/AdminDatabasePage";',
        'import AdminDatabasePage from "./features/admin/pages/AdminDatabasePage";\nimport DistributionAdminPage from "./features/admin/pages/DistributionAdminPage";'
    );
    appCode = appCode.replace(
        '<Route path="coming-soon-distribution" element={<ComingSoonPage />} />',
        '<Route path="distribution" element={<DistributionAdminPage />} />'
    );
    fs.writeFileSync(appPath, appCode);
    console.log('App.tsx updated');
}

// 2. Update DashboardLayout.tsx
const layoutPath = 'packages/frontend/src/components/layout/DashboardLayout.tsx';
let layoutCode = fs.readFileSync(layoutPath, 'utf8');

// I might have replaced coming-soon-distribution earlier with `dashboard?tab=cohorts` or just `dashboard`.
// Let's just find the calendar icon and replace that specific object in the array for the admin.
const regex = /\{\s*name:\s*["'][^"']*["'],\s*path:\s*`\/\$\{basePath\}\/(coming-soon-distribution|dashboard(\?tab=cohorts)?)`,\s*icon:\s*Calendar\s*\}/;

const match = layoutCode.match(regex);
if (match) {
    layoutCode = layoutCode.replace(regex, '{ name: "الإسناد الأكاديمي", path: `/${basePath}/distribution`, icon: Calendar }');
    fs.writeFileSync(layoutPath, layoutCode);
    console.log('DashboardLayout.tsx updated');
} else {
    // try literal match if regex fails
    const literal = '{ name: "التفويج والإسناد", path: `/${basePath}/dashboard`, icon: Calendar }';
    if (layoutCode.includes(literal)) {
        layoutCode = layoutCode.replace(literal, '{ name: "الإسناد الأكاديمي", path: `/${basePath}/distribution`, icon: Calendar }');
        fs.writeFileSync(layoutPath, layoutCode);
        console.log('DashboardLayout.tsx updated (literal)');
    }
}
