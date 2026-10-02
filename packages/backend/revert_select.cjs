const fs = require('fs');
const path = '../frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the optgroup monstrosity back to a simple clean select!
const groupedRegex = /\{Object\.entries\([\s\S]*?\}\s*<\/select>/;

if (code.match(groupedRegex)) {
  code = code.replace(
    groupedRegex,
    `{adminData?.courses?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>`
  );
  fs.writeFileSync(path, code);
  console.log("Successfully reverted to simple select!");
} else {
  console.log("Could not find the grouped regex.");
}
