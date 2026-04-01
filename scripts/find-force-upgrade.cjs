const c = require('fs').readFileSync('C:/Users/thebe/Downloads/Forge/node_modules/convex/dist/cli.bundle.cjs', 'utf8');
const searches = ['local-force', 'localForceUpgrade', 'force-upgrade', 'forceUpgrade'];
for (const s of searches) {
  let p = 0;
  while ((p = c.indexOf(s, p)) > -1) {
    // Only show if it looks like a CLI option definition
    const ctx = c.substring(Math.max(0, p-30), Math.min(c.length, p+80));
    if (ctx.includes('--') || ctx.includes('describe') || ctx.includes('default') || ctx.includes('boolean')) {
      console.log(`[${s}] at ${p}:`, ctx);
      console.log('');
    }
    p++;
  }
}
