Notifications Data Model Migration Plan

Overview
- Introduce a new notifications table to support user-facing notifications.
- Backfill is not required; new notifications will be created by backend event hooks.

Schema changes (Convex schema.ts)
- Add table: notifications
  - userId: id("profiles")
  - type: string | enum of 'message'|'comment'|'follow'|'like'|'system'
  - title: string
  - message: string
  - payload: any (optional)
  - link: string (optional)
  - isRead: boolean
  - readAt: number (optional)
  - createdAt: number
  - updatedAt: number (optional)
  - Indexes:
    - by_userId_createdAt: (userId, createdAt)
    - by_userId_isRead_createdAt: (userId, isRead, createdAt)

Migration plan
- Step 1: Deploy code changes to add notifications table in schema.ts.
- Step 2: Run migrations on the Convex backend; table will be created automatically.
- Step 3: Validate that existing users have no unexpected notifications; new events will generate notifications.
- Step 4: Add unit/integration tests for creating and querying notifications.

Notes
- This is a non-destructive schema change in initial MVP; no data loss for existing tables.
- Ensure access control so that users only see their own notifications.
- For performance, consider pagination and filters on the frontend.
