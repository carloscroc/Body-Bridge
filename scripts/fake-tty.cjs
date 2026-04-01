Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });

// Auto-answer all readline prompts by writing to stdin
const origCreateInterface = require('readline').createInterface;
require('readline').createInterface = function(options) {
  const rl = origCreateInterface.apply(this, arguments);
  const origQuestion = rl.question.bind(rl);
  let autoAnswered = false;
  
  rl.question = function(prompt, callback) {
    if (!autoAnswered && (prompt.includes('Upgrade now') || prompt.includes('Configure'))) {
      autoAnswered = true;
      process.stdout.write(prompt + ' y\n');
      callback('y');
      return;
    }
    return origQuestion(prompt, callback);
  };
  
  return rl;
};
