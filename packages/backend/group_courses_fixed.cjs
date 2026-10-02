const fs = require('fs');
const path = '../frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// If the regex failed, we'll try a simpler replace
if (code.includes('adminData?.courses?.map')) {
  console.log("Replacing mapping...");
  code = code.replace(
    /\{adminData\?\.courses\?\.map\(\(c: any\) => \([\s\S]*?<\/option>\n\s*\)\)\}/,
    `{Object.entries(
                      (adminData?.courses || []).reduce((acc: any, c: any) => {
                        const subj = c.subject?.nameAr || 'مواد أخرى';
                        if (!acc[subj]) acc[subj] = [];
                        acc[subj].push(c);
                        return acc;
                      }, {})
                    ).map(([subjectName, courses]: any) => (
                      <optgroup key={subjectName} label={subjectName}>
                        {courses.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </optgroup>
                    ))}`
  );
  fs.writeFileSync(path, code);
  console.log("Success!");
} else {
  console.log("Not found!");
}
