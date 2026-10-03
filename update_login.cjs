const fs = require('fs');
const path = 'packages/frontend/src/features/auth/pages/LoginPage.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('ForgotPasswordModal')) {
  code = code.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport ForgotPasswordModal from '../components/ForgotPasswordModal';");
  
  code = code.replace("const [isLoading, setIsLoading] = useState(false);", "const [isLoading, setIsLoading] = useState(false);\n  const [isForgotOpen, setIsForgotOpen] = useState(false);");
  
  const forgotBtn = `
            <div className="text-right mt-2 mb-4">
              <button type="button" onClick={() => setIsForgotOpen(true)} className="text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors">
                نسيت كلمة المرور؟
              </button>
            </div>
  `;
  code = code.replace("</form>", forgotBtn + "\n          </form>\n          {isForgotOpen && <ForgotPasswordModal onClose={() => setIsForgotOpen(false)} />}");

  fs.writeFileSync(path, code);
  console.log('done');
}
