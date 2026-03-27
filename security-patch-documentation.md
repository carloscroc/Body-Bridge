# Security Patch Documentation
Date: 2026-02-15

## Critical Vulnerability: Exposed API Credentials (CVSS 9.1)

### Issue
The `GEMINI_API_KEY` was exposed in the client-side bundle via `vite.config.ts`.
This allowed any user to extract the key and abuse the API quota.

### Remediation
1.  **Backend Proxy Implementation**: Created a Node.js/Express server (`server/server.js`) to handle API requests.
2.  **Configuration Update**: Removed `define: { 'process.env.API_KEY': ... }` from `vite.config.ts`.
3.  **Service Refactor**: Updated `services/geminiService.ts` to call the local proxy (`/api/*`) instead of the Google GenAI SDK directly.
4.  **Proxy Configuration**: Configured Vite to proxy `/api` requests to the local backend during development.

## Medium Vulnerability: Insecure Storage (CVSS 5.5)

### Issue
Sensitive user data (PII, health metrics) was stored in `localStorage` in plaintext JSON.

### Remediation
1.  **Encryption Utility**: Created `utils/secureStorage.ts` using AES encryption (`crypto-js`).
2.  **Service Update**: Updated `profileStorage.ts`, `planStorage.ts`, `workoutStorage.ts`, `communityStorage.ts`, `communityEngagement.ts` to use `secureStorage`.
    *Note: The encryption key is currently hardcoded in the client bundle. This provides obfuscation against casual inspection (XSS/Physical access) but is not a replacement for backend-secured storage.*

## Medium Vulnerability: Supply Chain Risk (CVSS 5.4)

### Issue
Core dependencies (`react`, `@google/genai`) were loaded via `esm.sh` CDN in `index.html`, bypassing lockfile protections.

### Remediation
1.  **CDN Removal**: Removed the `<script type="importmap">` from `index.html`.
2.  **Dependency Management**: Ensured all dependencies are loaded from local `node_modules` (bundled by Vite).

## Instructions for Developers

1.  **Run Development Environment**:
    Use `npm run dev` to start both the backend proxy (port 3000) and the frontend (port 7770).
    Do NOT use `vite` directly unless you have a separate backend running.

2.  **Environment Variables**:
    Ensure `.env.local` contains `GEMINI_API_KEY`. The backend reads this file.

3.  **Production Deployment**:
    Deploy the `server/` directory as a Node.js service (or adapt to Vercel/Netlify Functions).
    Deploy the frontend static build (`dist/`).
    Ensure the frontend can reach the backend API (configure CORS/proxy accordingly in production).
