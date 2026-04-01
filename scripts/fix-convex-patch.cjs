const fs = require('fs');
const filePath = 'C:/Users/thebe/Downloads/Forge/node_modules/convex/dist/cli.bundle.cjs';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the broken promptYesNo replacement - remove orphaned "errorType: \"fatal\","
const broken = content.indexOf('errorType: "fatal",\n      (0, logOutput)(options.message + " (auto-answered: yes)")');
if (broken > -1) {
  content = content.substring(0, broken) + '(0, logOutput)(options.message + " (auto-answered: yes)")' + content.substring(broken + 'errorType: "fatal",\n      '.length);
  console.log('Fixed broken promptYesNo');
}

fs.writeFileSync(filePath, content);
console.log('Done');
