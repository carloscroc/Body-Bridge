import { spawn } from 'child_process';

const args = process.argv.slice(2);
const child = spawn('npx', ['convex', ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: 'C:\\Users\\thebe\\Downloads\\Forge',
  env: {
    ...process.env,
    CONVEX_SELF_HOSTED_URL: 'http://localhost:8443',
    CONVEX_SITE_URL: 'http://localhost:8443',
    CONVEX_DEPLOYMENT: '',
    CONVEX_URL: '',
  },
});

child.on('exit', (code) => process.exit(code ?? 1));
