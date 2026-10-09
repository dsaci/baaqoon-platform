const fs = require('fs');

// ============================================================
// FIX 1: AdminDashboard.tsx - Add ActivityLogsView render
// ============================================================
let adminPath = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf8');
let adminFixed = 0;

// 1a. Add missing activity tab render
if (!adminCode.includes("activeTab === 'activity'")) {
    adminCode = adminCode.replace(
        /{activeTab === 'requests' && \(\s*<CohortRequestsAdminView \/>\s*\)}/,
        `{activeTab === 'requests' && (
            <CohortRequestsAdminView />
          )}

          {/* Tab: Activity Logs */}
          {activeTab === 'activity' && (
            <ActivityLogsView />
          )}`
    );
    adminFixed++;
    console.log('[FIX 1a] AdminDashboard: Added ActivityLogsView render');
}

fs.writeFileSync(adminPath, adminCode);
console.log(`[AdminDashboard] ${adminFixed} fix(es) applied`);

// ============================================================
// FIX 2: SupervisorDashboard.tsx - Add Activity tab button
// ============================================================
let supPath = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let supCode = fs.readFileSync(supPath, 'utf8');
let supFixed = 0;

// Check if the activity tab button exists in the tab bar
if (!supCode.includes("setActiveTab('activity')")) {
    // Find the last tab button before </div> closing the tab bar
    const tabBarPattern = /(<button\s+onClick=\{.*?setActiveTab\('students'\)[\s\S]*?<\/button>)\s*<\/div>/;
    const match = supCode.match(tabBarPattern);
    if (match) {
        supCode = supCode.replace(
            tabBarPattern,
            `$1
          <button 
            onClick={() => setActiveTab('activity')}
            className={\`pb-3 font-bold transition-all border-b-2 \${activeTab === 'activity' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}\`}
          >
            سجل النشاط
          </button>
        </div>`
        );
        supFixed++;
        console.log('[FIX 2a] SupervisorDashboard: Added Activity tab button');
    } else {
        console.log('[FIX 2a] SKIPPED: Could not find tab bar pattern');
    }
}

// Check if the activity tab content render exists
if (!supCode.includes("activeTab === 'activity'")) {
    supCode = supCode.replace(
        /{activeTab === 'students' && <SupervisorHrView role="student" \/>}/,
        `{activeTab === 'students' && <SupervisorHrView role="student" />}
        {activeTab === 'activity' && <ActivityLogsView />}`
    );
    supFixed++;
    console.log('[FIX 2b] SupervisorDashboard: Added ActivityLogsView render');
}

fs.writeFileSync(supPath, supCode);
console.log(`[SupervisorDashboard] ${supFixed} fix(es) applied`);

// ============================================================
// FIX 3: StudentDashboard.tsx - Render studentCohorts section
// ============================================================
let studentPath = 'packages/frontend/src/features/student/pages/StudentDashboard.tsx';
let studentCode = fs.readFileSync(studentPath, 'utf8');
let studentFixed = 0;

// Check if studentCohorts is queried but not rendered
if (studentCode.includes('studentCohorts') && !studentCode.includes('studentCohorts.map')) {
    // Find main content start
    const mainContentMarker = '{/* ────────────────────── Main Content Grid ────────────────────── */}';
    if (studentCode.includes(mainContentMarker)) {
        const cohortsUI = `
      {/* مساري الأكاديمي - أفواجي */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          مساري الأكاديمي (أفواجي)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentCohorts.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 font-bold">
              لم يتم تفويجك في أي فوج بعد. ستظهر هنا المواد التي تم تسجيلك بها فور اعتمادك.
            </div>
          ) : (
            studentCohorts.map((cohort: any) => (
              <div key={cohort.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{cohort.name}</h3>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md shrink-0">
                    {cohort.code}
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4 text-emerald-500" /> نشط</span>
                  <span>{cohort.course?.title || 'مساق معتمد'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
`;
        studentCode = studentCode.replace(mainContentMarker, cohortsUI + '\n      ' + mainContentMarker);
        studentFixed++;
        console.log('[FIX 3] StudentDashboard: Rendered studentCohorts section');
    } else {
        console.log('[FIX 3] SKIPPED: Main content marker not found');
    }
}

fs.writeFileSync(studentPath, studentCode);
console.log(`[StudentDashboard] ${studentFixed} fix(es) applied`);

// ============================================================
// FIX 4: VirtualClassroom.tsx - Add attendance trigger button
// ============================================================
let vcPath = 'packages/frontend/src/features/scheduling/pages/VirtualClassroom.tsx';
let vcCode = fs.readFileSync(vcPath, 'utf8');
let vcFixed = 0;

if (vcCode.includes('isAttendanceModalOpen') && !vcCode.includes('setIsAttendanceModalOpen(true)')) {
    // Find the control bar area and inject a button
    const endSessionButton = /(<button\s+onClick=\{handleEndSession\}[\s\S]*?<\/button>)/;
    const match2 = vcCode.match(endSessionButton);
    if (match2) {
        vcCode = vcCode.replace(
            endSessionButton,
            `<button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                >
                  رصد الغياب
                </button>
                $1`
        );
        vcFixed++;
        console.log('[FIX 4] VirtualClassroom: Injected attendance button');
    } else {
        console.log('[FIX 4] SKIPPED: Could not find end session button');
    }
}

fs.writeFileSync(vcPath, vcCode);
console.log(`[VirtualClassroom] ${vcFixed} fix(es) applied`);

// ============================================================
// FIX 5: sessions.controller.ts - Add missing @Patch decorator
// ============================================================
let sessionsPath = 'packages/backend/src/modules/scheduling/presentation/http/sessions.controller.ts';
let sessionsCode = fs.readFileSync(sessionsPath, 'utf8');
let sessionsFixed = 0;

if (sessionsCode.includes('saveSessionAttendance') && !sessionsCode.includes("@Patch(':id/attendance')")) {
    sessionsCode = sessionsCode.replace(
        /async saveSessionAttendance/,
        `@Patch(':id/attendance')
  async saveSessionAttendance`
    );
    // Check if Patch is imported
    if (!sessionsCode.match(/import.*Patch.*from '@nestjs\/common'/)) {
        sessionsCode = sessionsCode.replace(
            /import \{([\s\S]*?)\} from '@nestjs\/common'/,
            (match, imports) => {
                if (!imports.includes('Patch')) {
                    return `import {${imports}, Patch} from '@nestjs/common'`;
                }
                return match;
            }
        );
    }
    sessionsFixed++;
    console.log('[FIX 5] sessions.controller: Added @Patch decorator');
}

fs.writeFileSync(sessionsPath, sessionsCode);
console.log(`[sessions.controller] ${sessionsFixed} fix(es) applied`);

// ============================================================
// FIX 6: users.controller.ts - Add nationality to createUser
// ============================================================
let usersPath = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let usersCode = fs.readFileSync(usersPath, 'utf8');
let usersFixed = 0;

if (usersCode.includes('supervisedSubjectId: body.supervisedSubjectId') && !usersCode.includes('nationality: body.nationality')) {
    usersCode = usersCode.replace(
        /supervisedSubjectId: body\.supervisedSubjectId \|\| null,/,
        `supervisedSubjectId: body.supervisedSubjectId || null,
        nationality: body.nationality || null,`
    );
    usersFixed++;
    console.log('[FIX 6a] users.controller: Added nationality to createUser');
}

fs.writeFileSync(usersPath, usersCode);
console.log(`[users.controller] ${usersFixed} fix(es) applied`);

// ============================================================
// FIX 7: HrManagementAdminView.tsx - Add nationality to create user modal
// ============================================================
let hrPath = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let hrCode = fs.readFileSync(hrPath, 'utf8');
let hrFixed = 0;

if (!hrCode.includes('nationality')) {
    // Add to state
    hrCode = hrCode.replace(
        /supervisedSubjectId: '' \}\);/g,
        `supervisedSubjectId: '', nationality: '' });`
    );
    
    // Add UI field after supervisedSubjectId dropdown
    const supervisorSelectEnd = `</div>
              )}`;
    const lastOccurrenceIndex = hrCode.lastIndexOf(supervisorSelectEnd);
    if (lastOccurrenceIndex > -1) {
        const insertPos = lastOccurrenceIndex + supervisorSelectEnd.length;
        const nationalityUI = `

              {/* حقل الجنسية لجميع المستخدمين */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الجنسية</label>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.nationality} onChange={e => setNewUser({...newUser, nationality: e.target.value})}>
                  <option value="">-- غير محدد --</option>
                  <option value="فلسطيني">فلسطيني</option>
                  <option value="أردني">أردني</option>
                  <option value="مصري">مصري</option>
                  <option value="سعودي">سعودي</option>
                  <option value="إماراتي">إماراتي</option>
                  <option value="كويتي">كويتي</option>
                  <option value="عماني">عماني</option>
                  <option value="قطري">قطري</option>
                  <option value="بحريني">بحريني</option>
                  <option value="يمني">يمني</option>
                  <option value="عراقي">عراقي</option>
                  <option value="سوري">سوري</option>
                  <option value="لبناني">لبناني</option>
                  <option value="سوداني">سوداني</option>
                  <option value="ليبي">ليبي</option>
                  <option value="تونسي">تونسي</option>
                  <option value="جزائري">جزائري</option>
                  <option value="مغربي">مغربي</option>
                  <option value="موريتاني">موريتاني</option>
                  <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
                </select>
              </div>`;
        hrCode = hrCode.slice(0, insertPos) + nationalityUI + hrCode.slice(insertPos);
        hrFixed++;
        console.log('[FIX 7] HrManagementAdminView: Added nationality to create user modal');
    }
}

fs.writeFileSync(hrPath, hrCode);
console.log(`[HrManagementAdminView] ${hrFixed} fix(es) applied`);

// ============================================================
// FIX 8: auth.service.ts - Add phone & nationality to login response
// ============================================================
let authPath = 'packages/backend/src/modules/auth/application/auth.service.ts';
let authCode = fs.readFileSync(authPath, 'utf8');
let authFixed = 0;

if (!authCode.match(/status: user\.status,\s*nationality/)) {
    authCode = authCode.replace(
        /status: user\.status,/,
        `status: user.status,
        phone: user.phone,
        nationality: user.nationality,`
    );
    authFixed++;
    console.log('[FIX 8] auth.service: Added phone & nationality to login response');
}

fs.writeFileSync(authPath, authCode);
console.log(`[auth.service] ${authFixed} fix(es) applied`);

// ============================================================
// FIX 9: LoginPage.tsx - Remove dead handleDemoLogin function
// ============================================================
let loginPath = 'packages/frontend/src/features/auth/pages/LoginPage.tsx';
let loginCode = fs.readFileSync(loginPath, 'utf8');
let loginFixed = 0;

const demoLoginRegex = /const handleDemoLogin[\s\S]*?};[\s]*$/m;
// Try a more targeted approach
if (loginCode.includes('handleDemoLogin')) {
    loginCode = loginCode.replace(
        /const handleDemoLogin = async \([\s\S]*?\n  };/,
        ''
    );
    loginFixed++;
    console.log('[FIX 9] LoginPage: Removed dead handleDemoLogin function');
}

fs.writeFileSync(loginPath, loginCode);
console.log(`[LoginPage] ${loginFixed} fix(es) applied`);

console.log('\n==============================');
console.log('All fixes applied successfully!');
console.log('==============================');
