const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard coming-soon
code = code.replace(/<Route path="coming-soon" element={<ComingSoonPage \/>} \/>/g, 
  '<Route path="coming-soon-articles" element={<ComingSoonPage />} />\n          <Route path="coming-soon-distribution" element={<ComingSoonPage />} />');

// Remove redundant distribution route
code = code.replace(/<Route path="distribution" element={<ComingSoonPage \/>} \/>/g, '');

fs.writeFileSync('src/App.tsx', code);
