const fs = require('fs');
const path = 'packages/frontend/src/components/shared/ProfileModal.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('nationality')) {
    // 1. Add to state
    code = code.replace(
        /phone: user\?\.phone \|\| ''/,
        `phone: user?.phone || '',
    nationality: user?.nationality || ''`
    );

    // 2. Add to API call
    code = code.replace(
        /phone: formData\.phone,/,
        `phone: formData.phone,
        nationality: formData.nationality,`
    );

    // 3. Add to UI
    const targetUI = `<input \n              name="phone" type="tel" value={formData.phone} onChange={handleChange} dir="ltr" placeholder="+970 59..."\n              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none text-left"\n            />\n          </div>`;

    const newUI = `<input 
              name="phone" type="tel" value={formData.phone} onChange={handleChange} dir="ltr" placeholder="+970 59..."
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none text-left"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              <span className="text-baaqoon-500 dark:text-baaqoon-400">🌍</span> الجنسية
            </label>
            <select 
              name="nationality" 
              value={formData.nationality} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none"
            >
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

    // A more robust replacement approach for the UI
    const phoneRegex = /<input\s+name=\"phone\" type=\"tel\" value=\{formData\.phone\} onChange=\{handleChange\} dir=\"ltr\" placeholder=\"\+970 59\.\.\.\"\s+className=\"w-full px-4 py-2\.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent outline-none text-left\"\s*\/>\s*<\/div>/;

    if (code.match(phoneRegex)) {
        code = code.replace(phoneRegex, newUI);
        fs.writeFileSync(path, code);
        console.log('ProfileModal updated with nationality');
    } else {
        console.log('Regex failed');
    }
} else {
    console.log('Already added');
}
