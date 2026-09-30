const fs = require('fs');
let code = fs.readFileSync('src/features/auth/pages/RegisterPage.tsx', 'utf8');

const regex = /const response = await api\.post\('\/auth\/register', payload\);[\s\S]*?\} catch \(err/s;
const newCode = `const response = await api.post('/auth/register', payload);
      alert('تم التسجيل بنجاح! حسابك الآن قيد المراجعة، يرجى انتظار تفعيل الإدارة.');
      navigate('/login');
    } catch (err`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/features/auth/pages/RegisterPage.tsx', code);
