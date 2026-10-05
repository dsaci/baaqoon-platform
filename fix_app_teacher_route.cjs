const fs = require('fs');
const path = 'packages/frontend/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const teacherSectionRegex = /<Route path="dashboard" element=\{<TeacherDashboard \/>\} \/>\s*<Route path="coming-soon-articles" element=\{<ComingSoonPage \/>\} \/>\s*<Route path="distribution" element=\{<DistributionAdminPage \/>\} \/>/;

if (code.match(teacherSectionRegex)) {
    code = code.replace(teacherSectionRegex, 
        '<Route path="dashboard" element={<TeacherDashboard />} />\n          <Route path="coming-soon-articles" element={<ComingSoonPage />} />\n          <Route path="coming-soon-distribution" element={<ComingSoonPage />} />'
    );
    fs.writeFileSync(path, code);
    console.log('Fixed teacher route');
} else {
    console.log('Regex did not match teacher routes');
}
