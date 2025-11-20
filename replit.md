# Mission Control Dashboard

## Overview

A mission control dashboard application built with a modern full-stack architecture. The application provides a space exploration-themed interface for tracking and managing missions with real-time metrics and telemetry data. It features a dark mode industrial design inspired by SpaceX mission control panels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React with TypeScript**: Component-based UI using functional components and hooks
- **Vite**: Fast build tool and development server with hot module replacement (HMR)
- **Wouter**: Lightweight client-side routing library, chosen for minimal bundle size over React Router

**UI Component System**
- **shadcn/ui with Radix UI**: Comprehensive component library using Radix UI primitives
- **Tailwind CSS v4**: Utility-first CSS framework with custom design tokens
- **Design System**: "Mission Control" theme with dark mode industrial aesthetic
  - Custom CSS variables for theming
  - Space exploration visual language
  - High contrast interface optimized for readability

**State Management & Data Fetching**
- **TanStack Query (React Query)**: Server state management with automatic caching, background refetching, and optimistic updates
- **Custom Query Client**: Configured with infinite stale time and disabled automatic refetching to reduce network overhead
- **API Layer**: Type-safe API functions using shared TypeScript schemas
- **WebSocket Integration**: Real-time updates use `refetchQueries` (not `invalidateQueries`) to guarantee immediate UI updates after mission changes

### Backend Architecture

**Server Framework**
- **Express.js**: Minimal and flexible Node.js web application framework
- **TypeScript with ES Modules**: Type safety and modern JavaScript features throughout the backend

**API Design**
- **RESTful API**: Standard HTTP methods (GET, POST, PATCH, DELETE) for resource manipulation
- **Route Structure**: Organized in `/api` namespace with resource-based endpoints
  - `/api/missions` - Mission CRUD operations
  - `/api/metrics` - System metrics
  - `/api/telemetry` - Telemetry data

**Development Features**
- **Custom Vite Integration**: Middleware mode for seamless development experience
- **Request Logging**: Custom middleware tracking request duration and responses
- **Error Handling**: Centralized error responses with appropriate HTTP status codes

### Data Storage & Schema

**Database**
- **PostgreSQL**: Production-grade relational database
- **Neon Serverless**: Serverless PostgreSQL platform for scalable database hosting
- **WebSocket Connection**: Uses `ws` library for connection pooling

**ORM & Migrations**
- **Drizzle ORM**: Lightweight TypeScript ORM with excellent type inference
  - Schema-first approach with automatic TypeScript type generation
  - Chosen for type safety and minimal runtime overhead
- **Drizzle Kit**: Database migration tool with push-based workflow
- **Schema Location**: Shared schema at `shared/schema.ts` for type sharing between client and server

**Database Schema**
- **Users Table**: Authentication and user management with UUID primary keys
- **Missions Table**: Core mission tracking with status, progress, priority fields (no description field)
- **System Metrics Table**: Time-series metrics data with flexible value storage
- **Telemetry Data Table**: Mission telemetry readings and sensor data

**Data Retention Policy**
- **Telemetry**: Backend maintains last 50 records with automated cleanup using SQL CTEs
- **Metrics**: Backend maintains last 50 records with automated cleanup using SQL CTEs
- **Cleanup Strategy**: Uses `WITH keep AS (SELECT id ... ORDER BY timestamp DESC, id DESC LIMIT N)` for deterministic row retention
- **Frontend Display**: Telemetry chart displays last 24 data points with `.slice(-24)`

**Validation**
- **Zod**: Runtime type validation for API inputs
- **Drizzle-Zod Integration**: Automatic schema generation from database schemas for consistent validation

### External Dependencies

**UI Component Libraries**
- Radix UI component primitives (accordion, dialog, dropdown, popover, select, etc.)
- Lucide React for iconography
- embla-carousel-react for carousels
- cmdk for command palette functionality
- date-fns for date manipulation
- class-variance-authority and clsx for conditional styling

**Development Tools**
- Replit-specific plugins: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner
- tsx for TypeScript execution in development
- esbuild for production bundling

**Form Management**
- React Hook Form for performant form handling
- @hookform/resolvers for Zod schema integration

**Session Management**
- connect-pg-simple for PostgreSQL-backed session storage (configured but authentication not yet implemented)

**Fonts**
- Google Fonts: Architects Daughter, DM Sans, Fira Code, Geist Mono (loaded via CDN)

## Key Features Implemented

### 1. Mission CRUD Operations
- Create, Read, Update, Delete missions with full validation
- Update mission progress via **dual input method**: numeric input (for precision/accessibility) + visual slider
- Mark missions as complete
- Real-time synchronization across all clients via WebSocket

### 2. Real-Time Telemetry System
- WebSocket broadcasts telemetry data every 5 seconds
- Line chart visualization with smooth animations
- Frontend displays last 24 data points
- Backend maintains 50 records with automated cleanup

### 3. Dynamic System Metrics
- Calculated from real mission data (not mock data)
- Fleet Status: Operational vs total missions
- Active Personnel: Dynamic count based on active missions
- System Load: Percentage based on mission capacity
- Threat Level: Derived from mission priorities
- Updates broadcast every 10 seconds via WebSocket

### 4. Global Search & Filters
- Command+K (Cmd+K or Ctrl+K) opens global search dialog
- Real-time mission search by name
- Filter missions by status (Pending/Active/Completed)
- Filter missions by priority (Low/Medium/High/Critical)

### 5. Multi-Page Navigation
- Dashboard (main control panel)
- Fleet Tracking
- Data Center
- Personnel
- Analytics
- Implemented with Wouter for lightweight client-side routing

### 6. Data Export
- Export all missions to CSV format
- Export all missions to JSON format
- Client-side generation with proper formatting

## Accessibility Improvements

**Progress Update Dialog**:
- Dual input method: Numeric input field + visual slider
- Numeric input (`data-testid="input-progress"`) allows typing exact values (0-100)
- Visual slider provides intuitive graphical adjustment
- Both inputs stay synchronized automatically
- Improves accessibility for keyboard-only users and automated testing

## Technical Decisions

**WebSocket vs Polling**: 
- Chose WebSocket for real-time updates to reduce server load and improve responsiveness
- Events: `telemetry` (5s), `metrics_update` (10s), `mission_update` (on changes)

**Query Invalidation Strategy**:
- Mission updates use `queryClient.refetchQueries()` instead of `invalidateQueries()`
- Guarantees immediate UI updates when WebSocket events arrive
- Prevents stale data display after operations

**Data Cleanup Implementation**:
- Uses SQL CTEs with deterministic ordering: `ORDER BY timestamp DESC, id DESC`
- Prevents arbitrary row deletion when timestamps tie
- Ensures newest records are always retained

**Slider Accessibility**:
- Added numeric input alongside slider for better testability with Playwright
- Slider requires complex drag events; numeric input accepts simple type events
- Both methods update the same state, providing flexibility for users and tests