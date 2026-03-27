# Regression Test Requirements
Date: 2026-02-15

## 1. API Functionality (Backend Proxy)

- [ ] **Meal Analysis**: Upload an image in the "Meal Scan" feature. Verify it returns calorie/macro analysis.
- [ ] **Fitness Search**: Use the search bar. Verify it returns results from Google Search.
- [ ] **Exercise Guide**: Request a guide for an exercise (e.g., "Squat"). Verify it returns the structured guide.
- [ ] **Error Handling**: Disconnect network or provide invalid input. Verify app shows user-friendly error (not crash).

## 2. Data Persistence (Secure Storage)

- [ ] **Profile Persistence**: Edit user profile (e.g., change weight). Reload page. Verify changes persist.
- [ ] **Plan Persistence**: Add a workout to the calendar. Reload. Verify it remains.
- [ ] **Backward Compatibility**: (If applicable) If explicit migration was needed, verify old plaintext data is migrated (current implementation handles plaintext fallback gracefully).
- [ ] **Data Privacy**: Open DevTools > Application > Local Storage. Verify keys like `forge_user_profile` contain encrypted strings (gibberish), not JSON.

## 3. Supply Chain (CDN Removal)

- [ ] **Offline Loading**: Disconnect internet (if possible, or block esm.sh). Load app. It should still render (since dependencies are bundled).
    *Note: Google Fonts and Tailwind CDN in `index.html` still require internet.*
- [ ] **Performance**: Verify app loads without console errors related to "module not found".

## 4. Development Environment

- [ ] **Concurrent Run**: `npm run dev` should start both servers.
- [ ] **Port Proxying**: Requests to `/api/analyze-meal` from frontend should reach backend at `localhost:3000`.
