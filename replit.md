# BHS TSA Chapter Website

## Overview

This is a website for the BHS (Bridgewater High School) Technology Student Association chapter. It serves as an informational hub for members, displaying officer information, competitive events, meeting schedules, membership details, and a join/interest form. The site has a clean, Notion-inspired aesthetic with subtle animations and a polished design using serif/sans-serif font pairings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with CSS variables for theming, using shadcn/ui component library (new-york style)
- **Animations**: Framer Motion for page transitions and scroll animations
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Build Tool**: Vite with React plugin
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, run with tsx
- **API Pattern**: REST API with routes defined in `shared/routes.ts` as a shared contract between client and server
- **Endpoints**:
  - `GET /api/officers` — returns list of officers
  - `GET /api/events` — returns list of events
- **Database seeding**: The server seeds officers and events data on startup if tables are empty

### Database
- **Data storage**: JSON files in `data/` (no database required at runtime)
- **Storage layer**: JSON storage with Zod validation
- **Schema** (in `shared/schema.ts`):
  - `officers` table: id (serial), name (text), role (text), imageUrl (text, nullable)
  - `events` table: id (serial), title (text), category (text), date (text), description (text), resources (text array)
- **Static data**: `npm run build` copies the current JSON data into the client build

### Shared Layer
- `shared/schema.ts` — Database table definitions and Zod insert schemas, shared between client and server
- `shared/routes.ts` — API route definitions with paths and response schemas, used by both frontend hooks and backend route registration

### Build & Development
- **Dev**: `npm run dev` runs the server with Vite middleware for HMR
- **Build**: `npm run build` uses a custom script that builds the Vite frontend to `dist/public` and bundles the server with esbuild to `dist/index.cjs`
- **Production**: `npm start` serves the built assets via Express static file serving with SPA fallback

### Pages
- Home — Hero section with resource cards linking to other pages
- Members — Membership info, benefits, registration status
- Events — Lists competitive events from the database
- Meetings — Static meeting schedule information
- Officers — Displays officer cards fetched from the database
- Join — Interest/contact form (client-side only, no backend submission)
- Not Found — 404 page

## External Dependencies

- **PostgreSQL**: Not required for the current JSON-based site
- **Google Fonts**: Inter and Playfair Display loaded via CDN in index.html and CSS
- **Unsplash**: Used for placeholder images (officer backgrounds, page headers)
- **Replit Plugins**: Optional Vite plugins for dev environment (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`)
- **connect-pg-simple**: Listed as dependency for PostgreSQL session storage (not currently wired up but available)