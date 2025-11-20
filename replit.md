# Mission Control Dashboard

## Overview
A full-stack mission control dashboard designed for tracking and managing space exploration missions. It features a dark mode, industrial-themed UI inspired by SpaceX, offering real-time telemetry, mission management, fleet tracking, personnel management, and system health monitoring. The application includes an AI assistant for natural language queries and mission control actions, aiming to provide a comprehensive and intuitive interface for mission operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript, Vite (build tool), Wouter (routing).
- **UI/UX**: `shadcn/ui` with Radix UI, Tailwind CSS v4, "Mission Control" dark mode theme with space exploration aesthetics, high contrast for readability.
- **State Management**: TanStack Query for server state, optimizing data fetching with 30s `staleTime`, 5min `gcTime`, and `refetchOnWindowFocus`.
- **Real-time**: WebSocket integration for immediate UI updates via `refetchQueries` on mission changes.
- **Performance**: Component memoization (React.memo, useMemo, useCallback) to reduce re-renders.
- **Accessibility**: Dual input (numeric + slider) for mission progress updates.

### Backend
- **Framework**: Express.js with TypeScript and ES Modules.
- **API Design**: RESTful API with resource-based endpoints (e.g., `/api/missions`, `/api/telemetry`).
- **Development**: Custom Vite integration, request logging, centralized error handling.

### Data Storage & Schema
- **Database**: PostgreSQL via Neon Serverless, connected using `ws` library for pooling.
- **ORM**: Drizzle ORM for type-safe interactions, Drizzle Kit for migrations.
- **Schema**: Shared `shared/schema.ts` for client/server type consistency. Includes tables for Users, Missions, System Metrics, Telemetry, Fleet Positions, Personnel, Personnel Assignments, and Data Health.
- **Data Retention**: Automated cleanup using SQL CTEs for Telemetry and Metrics, retaining the last 50 records.
- **Validation**: Zod for runtime API input validation, integrated with Drizzle for schema consistency.

### Key Features
- **Mission Management**: CRUD operations for missions, real-time synchronization via WebSockets, progress updates with dual input.
- **Real-time Telemetry**: WebSocket broadcasts every 5 seconds, line chart visualization, frontend displays last 24 data points.
- **Dynamic System Metrics**: Real-time fleet status, active personnel, system load, and threat level calculated from mission data, broadcast every 10 seconds.
- **Global Search & Filters**: Cmd+K search for missions, filtering by status and priority.
- **Multi-Page Navigation**: Dashboard, Fleet Tracking, Personnel, Data Center, and Analytics pages, all using real API data.
- **Data Export**: Client-side CSV and JSON export for missions.
- **AI Agent Integration**: GPT-5 powered assistant (via Replit AI Integrations) for natural language queries and actions (create, update, delete missions). Features mandatory approval system for all mutation actions, smart context via OpenAI function calling, and comprehensive validation.
- **Seed Script**: `server/seed.ts` populates the database with realistic test data for all tables.

### Technical Decisions
- **WebSockets over Polling**: For real-time updates and reduced server load.
- **Query Invalidation**: `queryClient.refetchQueries()` used for mission updates to ensure immediate UI consistency.
- **Data Cleanup**: SQL CTEs with deterministic ordering for record retention.
- **Analytics Caching**: 60-second cache for analytics computations to optimize performance.
- **Real-Time Fleet Updates**: Fleet positions updated and broadcast every 10 seconds via WebSockets.
- **Data Health Monitoring**: Tracks component health, storage, replication lag, and backup timestamps.

## External Dependencies

### UI/Styling
- Radix UI (component primitives)
- Lucide React (icons)
- embla-carousel-react (carousels)
- cmdk (command palette)
- date-fns (date manipulation)
- class-variance-authority, clsx (conditional styling)
- Google Fonts (Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Development Tools
- Replit-specific plugins (vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner)
- tsx (TypeScript execution)
- esbuild (production bundling)

### Form Management
- React Hook Form
- @hookform/resolvers (Zod integration)

### Session Management
- connect-pg-simple (PostgreSQL-backed session storage - configured but authentication not yet implemented)