const fs = require('fs');
const path = 'packages/frontend/src/features/assessments/components/CreateAssessmentModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /const \[manualTitle, setManualTitle\] = useState\(''\);/,
    `const [manualTitle, setManualTitle] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualDetails, setManualDetails] = useState('');`
);

code = code.replace(
    /title: manualTitle,/,
    `title: manualTitle,
          subject: manualSubject,
          description: manualDetails,`
);

const oldManualUI = `          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                  عنوان الواجب / الاختبار (إدخال يدوي)
                </label>
                <input 
                  type="text" 
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="مثال: واجب منزلي في القواعد..."
                  className="w-full px-4 py-3 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white"
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm leading-relaxed">
                <strong>ملاحظة:</strong> في وضع الإدخال اليدوي، سيتم إنشاء ملف واجب فارغ يمكنك لاحقاً إضافة الأسئلة إليه بشكل مباشر، دون الارتباط بهيكل المنهج.
              </div>
            </div>
          )}`;

const newManualUI = `          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                    عنوان الواجب / الاختبار
                  </label>
                  <input 
                    type="text" 
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="مثال: واجب منزلي..."
                    className="w-full px-4 py-3 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                    الموضوع (اختياري)
                  </label>
                  <input 
                    type="text" 
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="مثال: الرياضيات، اللغة العربية..."
                    className="w-full px-4 py-3 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300 mb-2">
                  تفاصيل الواجب (مساحة للكتابة)
                </label>
                <textarea 
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  placeholder="اكتب تفاصيل الواجب هنا..."
                  rows={4}
                  className="w-full px-4 py-3 border border-baaqoon-200 rounded-lg focus:ring-2 focus:ring-baaqoon-accent/50 outline-none dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white resize-none"
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm leading-relaxed">
                <strong>ملاحظة:</strong> سيتم إنشاء الواجب فارغاً بناءً على التفاصيل المدخلة، ويمكنك لاحقاً تقييمه بشكل يدوي.
              </div>
            </div>
          )}`;

if (code.includes('في وضع الإدخال اليدوي')) {
    code = code.replace(oldManualUI, newManualUI);
    fs.writeFileSync(path, code);
    console.log('Manual UI updated');
} else {
    console.log('Could not find Manual UI block');
}
