const fs = require('fs');
const path = 'packages/backend/src/modules/assessments/application/rapid-generation.service.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(!lesson\.questionTemplates\.length\) \{[\s\S]*?const selectedQuestions = shuffled\.slice\(0, 5\);/;

const newDummyCode = `let selectedQuestions = [];
    if (!lesson.questionTemplates || !lesson.questionTemplates.length) {
      // Create 5 dummy questions on the fly
      for(let i=1; i<=5; i++) {
         selectedQuestions.push({
            text: 'سؤال افتراضي رقم ' + i + ' حول ' + lesson.title,
            type: 'multiple_choice',
            options: ['خيار أ', 'خيار ب', 'خيار ج', 'خيار د'],
            correctAnswer: 'خيار أ',
            points: 2
         });
      }
    } else {
      const shuffled = lesson.questionTemplates.sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, 5);
    }`;

if (code.match(regex)) {
    code = code.replace(regex, newDummyCode);
    fs.writeFileSync(path, code);
    console.log('Backend generation fixed via regex');
} else {
    console.log('Regex did not match');
}
