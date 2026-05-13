# Android Development Workflow Prompt for OpenCode

## Objective
Follow this structured workflow to fix production bugs, validate users, perform Android internal testing, and prepare for deployment using android-clean-architecture patterns and gstack capabilities.

## Phase 1: Code Analysis & Architecture Setup
1. **Load android-clean-architecture skill**
   - Use `/skill android-clean-architecture` to load the skill
   - Analyze current project structure against recommended layout:
     ```
     project/
     ├── app/
     ├── core/
     ├── domain/
     ├── data/
     ├── presentation/
     └── design-system/
     ```

2. **Identify violations of dependency rules**
   - Check if `domain` depends on `data` or `presentation` (should not)
   - Verify `presentation` depends only on `domain`, `design-system`, `core`
   - Confirm `data` depends only on `domain` and `core`

3. **Refactor to Clean Architecture if needed**
   - Move business logic to domain layer (UseCases)
   - Create repository interfaces in domain
   - Implement repositories in data layer
   - Ensure no Android framework imports in domain

## Phase 2: User Validation Implementation
1. **Create User Validation UseCase**
   - In `domain/usecases/`:
     ```kotlin
     class ValidateUserUseCase(
         private val userRepository: UserRepository
     ) {
         suspend operator fun invoke(userId: String): Result<User> {
             return userRepository.getUserById(userId)
         }
     }
     ```
   - Define `UserRepository` interface in domain
   - Implement in data layer with local/remote sources

2. **Add error handling**
   - Use `Result<T>` or sealed class for error propagation
   - Map errors to UI state in ViewModel

## Phase 3: Testing Setup with gstack
1. **Load relevant gstack skills**
   - `/skill developing-mobile-apps` for incremental development
   - `/skill running-smoke-tests` for core flow verification
   - `/skill testing-localization` if multi-language support needed

2. **Set up automated user validation tests**
   - Create test cases for:
     - Valid user credentials
     - Invalid user credentials
     - Network failure scenarios
     - Edge cases (empty fields, special characters)
   - Use gstack's browser automation to simulate user flows

3. **Implement smoke test suite**
   - Verify critical paths: login → validation → main app access
   - Capture screenshots at each step
   - Detect crashes or errors during test execution

## Phase 4: Internal Testing Preparation
1. **Configure internal test track**
   - Generate signed AAB/app bundle:
     ```
     ./gradlew bundleRelease
     ```
   - Upload to Play Console Internal Test track
   - Configure tester email lists

2. **Automate internal test validation with gstack**
   - Use gstack's device control to:
     - Install app from internal test track
     - Navigate through user validation flow
     - Verify successful login/progression
     - Check error handling paths

## Phase 5: Pre-Production Validation
1. **Run comprehensive test suite**
   - Execute all unit tests (domain layer)
   - Run instrumentation tests (data/presentation layers)
   - Perform smoke tests via gstack on multiple device configurations

2. **Validate production readiness**
   - Check ProGuard/R8 rules don't break domain models
   - Verify release build passes all tests
   - Confirm no debug-only code in release builds

## Phase 6: Deployment Preparation
1. **Generate production bundle**
   - Ensure versionCode/versionName updated
   - Verify signing configuration
   - Generate final AAB:
     ```
     ./gradlew bundleRelease
     ```

2. **Create release notes**
   - Document fixed bugs
   - Note user validation improvements
   - List tested device/OS combinations

3. **Final validation checklist**
   - [ ] All domain logic unit tested (>80% coverage)
   - [ ] Smoke tests pass on internal test track
   - [ ] User validation flow verified
   - [ ] No crashes in critical paths
   - [ ] Localization tested (if applicable)
   - [ ] Performance benchmarks met

## Execution Instructions for OpenCode
When executing this prompt:
1. Start with Phase 1 and complete each phase sequentially
2. Use the `/skill` tool to load required skills before each phase
3. For code changes, use read → analyze → edit workflow
4. For testing, leverage gstack's browser/device control capabilities
5. Verify each phase completes successfully before proceeding
6. If issues arise, document and fix before moving forward

## Expected Outputs
- Refactored codebase following Clean Architecture principles
- Working user validation implementation
- Automated test suite verifying core flows
- Internal test track build ready for distribution
- Production-ready release bundle with documentation