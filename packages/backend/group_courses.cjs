const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the flat mapping with a grouped one
const selectRegex = /<select[\s\S]*?onChange=\{e => setSelectedCourseId\(e\.target\.value\)\}[\s\S]*?>[\s\S]*?<option value="">-- [^<]* --<\/option>\n\s*\{adminData\?\.courses\?\.map\(\(c: any\) => \([\s\S]*?<\/option>\n\s*\)\)\}\n\s*<\/select>/m;

const groupedSelect = `<select 
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-bold transition-all"
                    required
                  >
                    <option value="">-- اختر المقرر الدراسي --</option>
                    {Object.entries(
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
                    ))}
                  </select>`;

code = code.replace(selectRegex, groupedSelect);

// If the regex failed, we'll try a simpler replace
if (code.includes('adminData?.courses?.map')) {
  console.log("Regex failed, trying fallback...");
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
}

fs.writeFileSync(path, code);
