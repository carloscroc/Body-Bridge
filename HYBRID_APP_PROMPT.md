# Capacitor Hybrid App Development Workflow Prompt for OpenCode

## Project Context
This is a **Capacitor hybrid app** (React/Vite web app wrapped for mobile deployment), NOT a native Android app.

**Current Architecture:**
- Android: Thin Capacitor wrapper (5 lines of Java code)
- Web Layer: React/Vite/Convex (main application code)
- No native Android modules/UseCases/Repositories

## Phase 1: React/TypeScript Architecture Analysis
1. **Load React/TypeScript coding standards skill**
   - Use `/skill coding-standards` for React/TypeScript patterns
   - Analyze current React component structure

2. **Review web architecture patterns**
   - Check component organization (pages, components, hooks, services)
   - Verify Convex integration patterns
   - Identify state management approach (Context, hooks, or external library)

3. **Identify production bugs in web layer**
   - Search for common React/TypeScript issues:
     - Memory leaks in useEffect hooks
     - Incorrect dependency arrays
     - TypeScript type errors
     - Convex query/response handling bugs

## Phase 2: User Validation Implementation (React Layer)
1. **Implement user validation in React**
   - Create validation hooks/functions:
     ```typescript
     // hooks/useUserValidation.ts
     export const useUserValidation = () => {
       const validateCredentials = (email: string, password: string) => {
         // validation logic
       }
       return { validateCredentials, errors }
     }
     ```
   - Add validation to login/registration forms
   - Show real-time feedback to users

2. **Integrate with Convex backend**
   - Ensure Convex mutations handle validation errors
   - Create proper error types for user-related failures
   - Add logging for validation failures

## Phase 3: Testing Setup for Hybrid App
1. **Load Capacitor-specific skills**
   - `/skill capacitor-testing` for device testing
   - `/skill capacitor-best-practices` for hybrid app patterns
   - `/skill playwright-cli` for web layer testing

2. **Set up web layer tests**
   - Component tests (React Testing Library)
   - Integration tests with Convex mocks
   - E2E tests for critical user flows

3. **Set up device layer tests**
   - Use Capacitor testing for native bridge functionality
   - Test plugin integrations (camera, geolocation, notifications, etc.)
   - Verify platform-specific behaviors (Android vs iOS)

## Phase 4: Internal Testing Preparation
1. **Configure Capacitor build**
   - Set up development build:
     ```
     npm run build
     npx cap sync
     npx cap open android
     ```
   - Test locally on Android devices/emulators

2. **Set up internal testing track**
   - Generate release build:
     ```
     npm run build
     npx cap sync
     cd android && ./gradlew assembleRelease
     ```
   - Create internal testing APK/AAB
   - Upload to Play Console Internal Test track

3. **Automate testing with gstack**
   - Use gstack's browser/device control to:
     - Install internal test build on devices
     - Navigate through user validation flows
     - Test Capacitor plugin integrations
     - Verify React state management works correctly

## Phase 5: Pre-Production Validation
1. **Run comprehensive test suite**
   - Execute web layer tests (Jest/Vitest)
   - Run E2E tests (Playwright)
   - Test Capacitor native functionality
   - Verify Convex integrations

2. **Validate production readiness**
   - Check React bundle size optimization
   - Verify no console errors in production build
   - Test on multiple Android devices/OS versions
   - Verify Capacitor plugins work correctly in release build

3. **Check Capacitor configuration**
   - Review `capacitor.config.ts`
   - Verify plugin versions are compatible
   - Check Android permissions in `AndroidManifest.xml`
   - Ensure Convex environment variables are set correctly

## Phase 6: Deployment Preparation
1. **Generate production build**
   - Build production web app:
     ```
     npm run build
     ```
   - Sync with Capacitor:
     ```
     npx cap sync
     ```
   - Build Android release:
     ```
     cd android
     ./gradlew bundleRelease
     ```

2. **Prepare release assets**
   - Generate app icons/splash screens
   - Configure app metadata (name, description, permissions)
   - Set version numbers in `package.json` and `build.gradle`

3. **Final validation checklist**
   - [ ] All web layer unit tests pass (>80% coverage)
   - [ ] E2E tests for critical user flows pass
   - [ ] Capacitor plugins tested on real devices
   - [ ] Convex backend verified in production environment
   - [ ] No console errors in release build
   - [ ] Performance benchmarks met (bundle size, load times)

## Capacitor-Specific Considerations

**For production bug fixes:**
- Most bugs will be in React/TypeScript web layer, not Android
- Focus on useEffect dependencies, state management, and Convex queries
- Check Capacitor plugin compatibility and versioning

**For user validation:**
- Implement validation in React forms/hooks
- Show real-time feedback
- Handle Convex validation errors properly

**For testing:**
- Web tests for React/Convex logic
- Device tests for Capacitor native bridge
- E2E tests for complete user flows

**For deployment:**
- Use Capacitor build pipeline, not native Android build
- Test AAB on real devices before production
- Verify Capacitor plugins work in release builds

## Execution Instructions for OpenCode
When executing this prompt:
1. Load React/TypeScript and Capacitor skills first
2. Focus on web layer (React/Vite) for most work
3. Only touch Android layer for Capacitor configuration or native plugins
4. Use gstack for device testing and validation
5. Verify changes work on both web and device layers

## Expected Outputs
- Improved React/TypeScript architecture for production fixes
- Working user validation in web layer
- Comprehensive test suite (web + Capacitor)
- Production-ready AAB generated via Capacitor workflow
- Documentation of Capacitor-specific deployment steps
