const fs = require('fs');
const path = 'j:/Projects/FYP/FYP/app/data/course/get-all-courses.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/Finance &amp; Accounting/g, 'Finance & Accounting');
content = content.replace(/IT &amp; Software/g, 'IT & Software');
content = content.replace(/Health &amp; Fitness/g, 'Health & Fitness');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
