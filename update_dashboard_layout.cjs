const fs = require('fs');
const path = 'packages/frontend/src/components/layout/DashboardLayout.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\{\s*name:\s*"التوزيع والإسناد الأكاديمي[^\"]*",\s*path:\s*`\/\$\{basePath\}\/coming-soon-distribution`,\s*icon:\s*Calendar\s*\}/;
const replacement = '{ name: "التفويج والإسناد", path: `/${basePath}/dashboard?tab=cohorts`, icon: Calendar }';

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('done');
} else {
    console.log('not found');
}
