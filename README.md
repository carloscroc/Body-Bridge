# Calendar Tab Standalone

A standalone React/TypeScript application originally extracted from a Git worktree.

## Prerequisites

- Node.js 22+
- npm or yarn

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.local.example` to `.env.local` and update the values:
   ```bash
   cp .env.local.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   This starts both the backend API proxy on port 3000 and the frontend on port 7770.

## Project Structure

- `/components` - React components
- `/convex` - Backend functions using Convex
- `/services` - Service layer
- `/utils` - Utility functions
- `/server` - Express backend server

## Development

- Frontend: `npm run dev:client` (Vite dev server on port 7770)
- Backend: `npm run dev:server` (Express server on port 3000)
- Convex: `npm run dev:convex` (Convex development server)
