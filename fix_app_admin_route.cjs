const fs = require('fs');
const path = 'packages/frontend/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const adminSectionRegex = /<Route path="dashboard" element=\{<AdminDashboard \/>\} \/>\s*<Route path="coming-soon-articles" element=\{<ComingSoonPage \/>\} \/>\s*<Route path="coming-soon-distribution" element=\{<ComingSoonPage \/>\} \/>/;

if (code.match(adminSectionRegex)) {
    code = code.replace(adminSectionRegex, 
        '<Route path="dashboard" element={<AdminDashboard />} />\n          <Route path="coming-soon-articles" element={<ComingSoonPage />} />\n          <Route path="distribution" element={<DistributionAdminPage />} />'
    );
    fs.writeFileSync(path, code);
    console.log('Fixed admin route');
} else {
    console.log('Regex did not match admin routes');
}
