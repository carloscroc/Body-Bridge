# Forge

A fitness and workout application built with React, TypeScript, and Convex.

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
   Required for local app + database startup:
   - `VITE_CONVEX_URL`
   - `CONVEX_DEPLOYMENT`

   Optional for AI endpoints only:
   - `GEMINI_API_KEY`

3. Run the development server:
   ```bash
   npm run dev
   ```
   This starts Convex, the backend API proxy on port 3000, and the frontend on port 7770.

## Project Structure

- `/components` - React components
- `/convex` - Backend functions using Convex
- `/services` - Service layer
- `/utils` - Utility functions
- `/server` - Express backend server

## Development

- Full stack: `npm run dev` (Convex + Express + Vite)
- App only: `npm run dev:app` (Express + Vite)
- Frontend: `npm run dev:client` (Vite dev server on port 7770)
- Backend: `npm run dev:server` (Express server on port 3000)
- Convex: `npm run dev:convex` (Convex development server)

## CI/CD Environment Variables

`VITE_CONVEX_URL` must be configured as a GitHub Actions Repository Variable, not a Secret, because it is a public URL.

Set it in GitHub at `Settings -> Secrets and variables -> Actions -> Variables -> New repository variable`.

- Name: `VITE_CONVEX_URL`
- Value: `https://groovy-pig-414.convex.cloud`
