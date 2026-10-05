const fs = require('fs');
const path = 'packages/backend/src/modules/assessments/presentation/http/rapid-generation.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /title: body\.title,\s*description: body\.subject \?[\s\S]*?: body\.description,/;
const replacement = `title: body.title,
          description: body.subject ? "الموضوع: " + body.subject + "\\n\\n" + (body.description || "") : body.description,`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('Fixed syntax error in rapid-generation controller');
} else {
    console.log('Could not find syntax error block');
}
