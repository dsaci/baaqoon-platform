const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('EditCohortModal')) {
    // Add import
    code = code.replace("import { useAuthStore } from '../../../store/useAuthStore';", "import { useAuthStore } from '../../../store/useAuthStore';\nimport EditCohortModal from '../components/EditCohortModal';");
    
    // Add component at the bottom before the last two closing divs
    const bottomTag = '</div>\n    </div>\n  );\n}';
    const newBottomTag = '</div>\n      <EditCohortModal isOpen={!!editingCohort} onClose={() => setEditingCohort(null)} cohort={editingCohort} adminData={adminData} />\n    </div>\n  );\n}';
    
    if (code.includes(bottomTag)) {
        code = code.replace(bottomTag, newBottomTag);
        fs.writeFileSync(path, code);
        console.log('Added EditCohortModal successfully');
    } else {
        console.log('Could not find bottom tag to inject modal');
        // Let's try alternative bottom tags
        const altBottomTag1 = '</div>\r\n    </div>\r\n  );\r\n}';
        const newAltBottomTag1 = '</div>\r\n      <EditCohortModal isOpen={!!editingCohort} onClose={() => setEditingCohort(null)} cohort={editingCohort} adminData={adminData} />\r\n    </div>\r\n  );\r\n}';
        if (code.includes(altBottomTag1)) {
            code = code.replace(altBottomTag1, newAltBottomTag1);
            fs.writeFileSync(path, code);
            console.log('Added EditCohortModal successfully (CRLF)');
        }
    }
} else {
    console.log('EditCohortModal already exists');
}
