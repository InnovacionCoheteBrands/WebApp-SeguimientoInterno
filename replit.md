# Mission Control Dashboard

## Overview
A full-stack mission control dashboard designed for tracking and managing space exploration missions. It features a dark mode, industrial-themed UI inspired by SpaceX, offering real-time telemetry, mission management, fleet tracking, personnel management, and system health monitoring. The application includes an AI assistant for natural language queries and mission control actions, aiming to provide a comprehensive and intuitive interface for mission operations.

## Recent Changes
- **November 21, 2025 - Optimized Chart Space Usage**:
  - Reduced padding in Trajectory Analysis card: CardHeader (p-3/sm:p-4 pb-2), CardContent (p-3/sm:p-4 pt-0)
  - Increased chart height from h-[250px] sm:h-[300px] to h-[320px] sm:h-[380px] for better vertical space utilization
  - Maintains responsive design and readability while eliminating wasted whitespace
  - Architect-reviewed and verified: no visual regressions, hierarchy preserved
- **November 21, 2025 - Fixed Sidebar Positioning**:
  - Changed dashboard sidebar from `sticky` to `fixed` positioning to keep it stationary during page scroll
  - Added left margin (`md:ml-64`) to main content area to prevent overlap with fixed sidebar
  - Sidebar now remains at fixed position (x:0, y:0) when scrolling through page content
  - E2E tested and verified: sidebar stays visible with all navigation items accessible during scroll
- **November 21, 2025 - Mobile Redesign Phase 2 COMPLETED**:
  - **Progressive Disclosure**: CompactMissionCard and CompactFleetCard now tap-to-expand
    * Collapsed: Essential info only (code, status, name, key metrics)
    * Expanded: Reveals horizontal progress bar, timestamps, edit/delete buttons
    * Smooth transitions with chevron indicators
    * All expand/collapse buttons: h-11 (44px) touch targets
  - **Visual Enhancements**: 
    * Warning/danger glow effects on MetricsCarousel cards
    * Gradient accents (card/70→card/50→primary/5) on expanded mission/fleet cards
    * shadow-lg for depth perception
  - **Fleet Mobile Redesign**: CompactFleetCard mirrors dashboard pattern
    * 2-column mobile grid (hidden on desktop)
    * Progressive disclosure matching CompactMissionCard
    * MobileFAB for "New Position" action
    * Handles "no position" state with "Add Position" button
    * All touch targets ≥44px verified
- **November 21, 2025 - Mobile Redesign Phase 1 COMPLETED**:
  - **Native-App-Like Mobile Experience**: Replaced linear responsive design with dynamic mobile interface
    * **Bottom Tab Navigation** (MobileBottomNav): Fixed bottom bar with 4 tabs (Dashboard, Fleet, Personnel, Systems) replacing hamburger menu
    * **Floating Action Button** (MobileFAB): 56x56px FAB for primary actions with orange glow effect
    * **Metrics Carousel** (MetricsCarousel): Horizontal swipeable carousel with embla-carousel displaying 4 metric cards
    * **2-Column Grids** (CompactMissionCard, CompactFleetCard): Compact cards with circular progress arcs, status/priority badges, hidden on desktop
  - **Touch Target Compliance**: All interactive elements verified at ≥44px minimum across mobile and desktop
    * Bottom nav buttons: min-w-16 h-12
    * FAB: size-14 (56x56px)
    * All card menu/action buttons: h-11 (44px)
    * Expand/collapse buttons: h-11 (44px)
    * Icons upgraded to size-5 for better visibility
  - **Mobile-First Design Pattern**: Desktop list view preserved, mobile uses optimized 2-column grid with progressive enhancement
- **November 21, 2025 - Mobile Optimizations COMPLETED**:
  - **Touch Targets (44x44px minimum)**: All interactive elements comply with mobile accessibility standards
    * All buttons: h-11 w-11 (icon buttons), h-11 (regular buttons), min-w-11 (NEW MISSION button)
    * All form inputs: h-11 for consistent touch targets
    * All SelectTriggers: h-11 for dropdown accessibility
    * All dialog action buttons: h-11 for footer buttons
    * Icon sizes upgraded: size-4 → size-5 for better mobile visibility
  - **Responsive Layout**: Single column on mobile (grid-cols-1), responsive grids with sm: and lg: breakpoints
  - **Responsive Spacing**: Mobile-friendly padding (p-3 sm:p-6) optimizes screen real estate
  - **Mobile Navigation**: 
    * Mobile menu button for sidebar access
    * Mobile search button for Cmd+K functionality
    * Settings button accessible in both desktop and mobile sidebars
  - **Responsive Typography**: Font sizes scale (text-base sm:text-lg, text-xl sm:text-2xl) for better legibility
  - **Mobile-Friendly Dialogs**: max-h-[90vh] with overflow-y-auto prevents content cutoff
  - **Tested & Verified**: E2E tests passed at 375x667 viewport (iPhone SE), all CRUD flows functional
  - **Pages Optimized**: Dashboard and Fleet Tracking fully mobile-optimized
- **November 20, 2025 - Performance Optimizations**: 
  - Optimized localStorage hydration in Profile and Settings pages using lazy initialization in useState to eliminate extra renders
  - Disabled refetchOnWindowFocus in React Query global config - WebSocket updates provide real-time sync
  - Made AgentChat lazy-loaded to reduce initial bundle size
  - Replaced refetchQueries with setQueryData in dashboard mutations for instant cache updates without network requests
  - Changed mission_update WebSocket handler to use invalidateQueries instead of refetchQueries for smarter cache management
- **November 20, 2025**: Separated Profile and Settings into two distinct pages:
  - **Profile Page** (`/profile`): Personal information (name, email, role, clearance, avatar initials) and security settings. Accessible via user avatar/name area in sidebar.
  - **Settings Page** (`/settings`): System configuration including preferences (theme, language, timezone), notifications, visualization options, and API integrations. Accessible via gear icon in sidebar.
  - Data persists separately in localStorage: `mission-control-profile` for personal data, `mission-control-settings` for system configuration.

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
- **Mission Management**: Full CRUD operations for missions, real-time synchronization via WebSockets, progress updates with dual input.
- **Fleet Administration**: Complete CRUD for fleet positions with create/edit/delete capabilities. Mission cards always displayed; shows "Position data unavailable" when no fleet position exists for a mission.
- **Personnel Administration**: Full CRUD for personnel records including create/edit/delete. Supports mission assignments. Personnel cards removed from DOM when deleted.
- **Data Center Administration**: Complete CRUD for system health components with create/edit/delete. Component cards removed from DOM when deleted. Status indicators: Operational (green), Warning/Degraded (yellow), Critical (red), Offline (gray).
- **Real-time Telemetry**: WebSocket broadcasts every 5 seconds, line chart visualization, frontend displays last 24 data points.
- **Dynamic System Metrics**: Real-time fleet status, active personnel, system load, and threat level calculated from mission data, broadcast every 10 seconds.
- **Global Search & Filters**: Cmd+K search for missions, filtering by status and priority.
- **Multi-Page Navigation**: Dashboard, Fleet Administration, Personnel Administration, Data Center Administration, Analytics, Profile, and Settings pages, all with full CRUD capabilities using real API data.
- **User Profile** (`/profile`): Dedicated page for personal information management including name, email, role, clearance level, and avatar initials. Security section prepared for password management when authentication is implemented. Data persists in localStorage under `mission-control-profile` key. Accessible via user avatar/name in sidebar.
- **System Configuration** (`/settings`): Application preferences page including System Preferences (theme, language, timezone), Notifications (mission/telemetry/system alerts, email toggles), Visualization (refresh rate, measurement units, chart animations), and API/Integrations (API key management with regeneration, webhook configuration). All settings persist in localStorage under `mission-control-settings` key. Accessible via gear icon in sidebar. Features real-time validation and toast notifications for save operations.
- **Data Export**: Client-side CSV and JSON export for missions.
- **AI Agent Integration**: GPT-5 powered assistant (via Replit AI Integrations) for natural language queries and actions (create, update, delete missions). Features mandatory approval system for all mutation actions, smart context via OpenAI function calling, and comprehensive validation.
- **Seed Script**: `server/seed.ts` populates the database with realistic test data for all tables.

### Technical Decisions
- **WebSockets over Polling**: For real-time updates and reduced server load.
- **Query Invalidation**: `queryClient.refetchQueries()` used for all mutations to ensure immediate UI consistency and prevent cache staleness.
- **Cache-Control Headers**: GET /api/fleet includes no-store, no-cache headers to prevent browser caching of fleet position data.
- **Data Cleanup**: SQL CTEs with deterministic ordering for record retention.
- **Analytics Caching**: 60-second cache for analytics computations to optimize performance.
- **Real-Time Fleet Updates**: Fleet positions updated and broadcast every 10 seconds via WebSockets.
- **Data Health Monitoring**: Tracks component health, storage, replication lag, and backup timestamps.

### CRUD Administration Pattern
All admin pages (Fleet, Personnel, Data Center) follow a consistent design pattern:
- **Header Actions**: "New [Entity]" button in page header for creating new records
- **Card-Based Display**: Each record displayed in a card with relevant information
- **Inline Actions**: Edit and Delete buttons on each card
- **Dialog Forms**: Modal dialogs for create/edit operations with Zod validation
- **Delete Confirmations**: AlertDialog component for delete operations requiring user confirmation
- **Toast Notifications**: Success/error toasts for all mutations
- **React Query Integration**: All operations use TanStack Query mutations with automatic refetch on success
- **Fleet-Specific Behavior**: Mission cards always remain in DOM; content toggles between position data and "Position data unavailable" state
- **Personnel/Data Center Behavior**: Cards are completely removed from DOM when deleted

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