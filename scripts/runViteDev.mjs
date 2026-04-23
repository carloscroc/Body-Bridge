import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runKillPort() {
  return new Promise((resolve) => {
    const child = spawn(command, ['kill-port', '7770'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });

    child.on('error', () => resolve());
    child.on('exit', () => resolve());
  });
}

await runKillPort();

const viteArgs = process.argv.slice(2);
const vite = spawn(command, ['vite', ...viteArgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

vite.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

vite.on('error', (error) => {
  console.error('[dev:client] Failed to start Vite.');
  console.error(error.message);
  process.exit(1);
});
