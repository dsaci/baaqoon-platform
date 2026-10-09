const fs = require('fs');
const path = 'packages/frontend/src/features/auth/pages/RegisterPage.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('nationality:')) {
    code = code.replace(
        /phone: '',/,
        `phone: '',\n      nationality: '',`
    );
}

const target = `<div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('common.password')}</label>`;

const newUI = `<div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">الجنسية</label>
              <select 
                name="nationality" 
                value={formData.nationality} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all"
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
            </div>\n`;

// Replace using regex
const regex = /(<div className="space-y-1\.5">\s*<label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">\{t\('common\.password'\)\}<\/label>)/;
if (code.match(regex)) {
    code = code.replace(regex, newUI + "$1");
    fs.writeFileSync(path, code);
    console.log('RegisterPage updated with nationality');
} else {
    console.log('Regex failed');
}
