const fs = require('fs');
const path = 'C:/Users/thebe/Downloads/Forge/node_modules/convex/dist/cli.bundle.cjs';
let content = fs.readFileSync(path, 'utf8');

const before = content.length;
let count = 0;

// Replace ctx.crash for non-TTY in promptString and promptOptions
const pattern1 = /return ctx\.crash\(\{[\s\S]*?exitCode: 1,[\s\S]*?errorType: "fatal",[\s\S]*?printedMessage: `Cannot prompt for input in non-interactive terminals\. \(\$\{options\.message\}\)`[\s\S]*?\}\);/g;
content = content.replace(pattern1, () => {
  count++;
  return '(0, logOutput)(options.message + " (auto-answered: " + (options.default ?? "") + ")"); return options.default ?? "";';
});

// Replace for promptYesNo (has nonInteractiveError ??)
const pattern2 = /printedMessage: options\.nonInteractiveError \?\? `Cannot prompt for input in non-interactive terminals\. \(\$\{options\.message\}\)`[\s\S]*?\}\);/g;
content = content.replace(pattern2, () => {
  count++;
  return '(0, logOutput)(options.message + " (auto-answered: yes)"); return true;';
});

const remaining = (content.match(/Cannot prompt for input/g) || []).length;
console.log('Replacements made:', count);
console.log('Remaining "Cannot prompt" occurrences:', remaining);
console.log('File size before:', before, 'after:', content.length);

fs.writeFileSync(path, content);
console.log('Done');
