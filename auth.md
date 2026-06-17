# Auth QA Credentials

Shared QA account for manual testing.

Email: `auth.qa.shared@body-bridge.test`
Password: `BodyBridgeQA123!`

Notes:
- This credential was created in both the local Convex deployment and the cloud deployment.
- The local and cloud databases are separate, even though they use the same login.
- Use this account only for QA/dev testing.

Environments:
- Local Convex: `http://127.0.0.1:3210`
- Cloud Convex: `https://groovy-pig-414.convex.cloud`

Verified on 2026-06-16:
- Local signup
- Local onboarding
- Local logout
- Local login with the shared auth pattern
- Cloud password signup/login via direct Convex auth action
