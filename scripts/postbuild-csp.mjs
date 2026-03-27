import fs from 'node:fs';
import path from 'node:path';

const distIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error(`[postbuild-csp] Missing ${distIndexPath}. Run the Vite build first.`);
  process.exit(1);
}

let html = fs.readFileSync(distIndexPath, 'utf8');

if (html.includes('http-equiv="Content-Security-Policy"')) {
  console.log('[postbuild-csp] CSP meta already present; skipping.');
  process.exit(0);
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Convex + other hosted APIs typically live on https/wss origins.
  "connect-src 'self' https: wss:",
  // Allow external mp4/webm and blob URLs.
  "media-src 'self' blob: https:",
  // Allow embedded players for non-file sources.
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  'upgrade-insecure-requests',
].join('; ');

const meta = `  <meta http-equiv="Content-Security-Policy" content="${csp}">\n`;

// Insert after charset meta if present, else after <head>
const charsetRe = /<meta\s+charset=[^>]+>\s*\n/i;
if (charsetRe.test(html)) {
  html = html.replace(charsetRe, (m) => `${m}${meta}`);
} else {
  html = html.replace(/<head>\s*\n/i, (m) => `${m}${meta}`);
}

fs.writeFileSync(distIndexPath, html, 'utf8');
console.log('[postbuild-csp] Injected CSP meta into dist/index.html');
