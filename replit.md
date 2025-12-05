# Cohete Brands - Marketing Operations Platform

## Overview
A full-stack marketing operations platform for Cohete Brands agency, enabling comprehensive campaign management, client account tracking, team coordination, and resource administration. Built with a modern dark mode UI, the platform offers real-time analytics, campaign performance monitoring, client relationship management, team assignment tracking, and marketing deliverable oversight. The application includes an AI assistant for natural language queries about campaigns and operations, providing an intuitive interface for agency workflow management. The business vision is to streamline marketing operations, optimize campaign performance, and enhance client service delivery through data-driven insights and efficient resource allocation.

## User Preferences
Preferred communication style: Simple, everyday language (Spanish).

## Recent Changes
- **November 21, 2025 - Complete Transformation: Mission Control → Marketing Operations Platform**:
  - **Theme Change**: Transformed entire application from space exploration/mission control theme to marketing agency operations platform
  - **Database Schema**: Renamed and restructured all tables:
    - missions → campaigns (added clientName, channel, budget, spend fields; removed spatial fields)
    - fleet_positions → client_accounts (replaced sector/coordinates/velocity with companyName, industry, monthlyBudget, healthScore, nextMilestone)
    - personnel → team (updated clearance→department, shiftStart→workHoursStart with marketing roles)
    - data_health → resources (replaced storage/replication metrics with resourceName, type, format, fileSize, campaignId)
  - **Backend Updates**: Renamed all storage methods and API endpoints (/api/campaigns, /api/client-accounts, /api/team, /api/resources), updated analytics endpoint to calculate channelBreakdown
  - **Frontend Pages**: Complete transformation of all pages to Spanish with marketing context:
    - dashboard.tsx: Campaign management with clientName, channel, budget/spend tracking
    - fleet-tracking.tsx → clients page: Client account management with industry, budget, health score
    - personnel.tsx → team page: Team management with marketing roles and campaign assignments
    - data-center.tsx → resources page: Marketing deliverables (Creative, Copy, Asset, Design, Video) with type-specific icons
    - analytics.tsx → KPIs page: Added "Campañas por Canal" chart, translated all metrics to Spanish
  - **Navigation**: Updated all navigation (app-layout.tsx, mobile-bottom-nav.tsx, App.tsx) with Spanish labels and marketing-appropriate icons, routes changed to /clientes, /equipo, /recursos, /kpis
  - **Seed Data**: Updated server/seed.ts to generate realistic marketing campaigns (CB-META-001, CB-GOOGLE-002, etc.), client accounts, team members with Spanish names, and marketing resources
  - **WebSocket Events**: Changed mission_update → campaign_update, updated system metrics to reflect client/team/utilization data
- **November 21, 2025 - Fixed Tailwind CSS Purging Issue in Production**:
  - Fixed critical issue where sidebar was invisible in deployed/published application
  - Root cause: Tailwind CSS v4 wasn't scanning `client/src/components/**` during production build, causing utility classes (`hidden`, `md:flex`, `md:ml-64`) to be purged from final CSS bundle
  - Solution: Added explicit `@source` directives in `client/src/index.css`: `@source "./**/*.{ts,tsx,js,jsx}"`, `@source "./components/**/*.{ts,tsx}"`, `@source "./pages/**/*.{ts,tsx}"`
  - This ensures all Tailwind classes from AppLayout component are preserved in production builds
  - Verified: Sidebar now visible in both development and production deployments with proper spacing and responsive behavior
- **November 21, 2025 - Implemented Global Navigation Layout**:
  - Created `AppLayout` component (`client/src/components/app-layout.tsx`) to centralize navigation chrome
  - AppLayout includes: desktop sidebar (w-64, fixed), mobile bottom navigation, top header with search, command palette (Cmd/Ctrl+K)
  - Modified `App.tsx` to wrap all routes with AppLayout for consistent navigation across entire application
  - Simplified `dashboard.tsx` and other pages to only contain page-specific content, removing duplicate navigation elements
  - All pages now display sidebar, header, and navigation regardless of route (/, /fleet-tracking, /analytics, /personnel, /data-center, /profile, /settings)

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript, Vite (build tool), Wouter (routing).
- **UI/UX**: `shadcn/ui` with Radix UI, Tailwind CSS v4, modern dark mode industrial theme with high contrast.
- **State Management**: TanStack Query for server state (data fetching, caching, synchronization).
- **Real-time**: WebSocket integration for immediate UI updates.
- **Performance**: Component memoization, lazy loading for AgentChat, optimized `useState` hydration, and disabled `refetchOnWindowFocus` for React Query.
- **Accessibility**: Dual input (numeric + slider) for campaign progress, 44x44px minimum touch targets, responsive layouts, and accessible dialogs.
- **Navigation**: Consistent global navigation with a shared `AppLayout` component, including desktop sidebar, mobile bottom navigation, and top header. Mobile-first design with bottom tab navigation, Floating Action Button (FAB), and metrics carousel.
- **Design Patterns**: Card-based display with inline actions for CRUD operations, progressive disclosure for mobile cards (tap-to-expand), and consistent dialog forms with validation.

### Backend
- **Framework**: Express.js with TypeScript and ES Modules.
- **API Design**: RESTful API with resource-based endpoints.
- **Development**: Custom Vite integration, request logging, centralized error handling.

### Data Storage & Schema
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe interactions, Drizzle Kit for migrations.
- **Schema**: Shared `shared/schema.ts` for client/server type consistency, including Users, Campaigns, System Metrics, Telemetry, Client Accounts, Team, Team Assignments, and Resources.
  - **Campaigns**: campaignCode, name, clientName, channel, status, priority, progress, budget, spend, targetAudience
  - **Client Accounts**: companyName, industry, monthlyBudget, currentSpend, healthScore, nextMilestone, lastActivity, status, campaignId
  - **Team**: name, role, department, status, workHoursStart, workHoursEnd
  - **Resources**: name, type (Creative/Copy/Asset/Design/Video/Document), format, fileSize, status, campaignId, lastModified
- **Data Retention**: Automated cleanup for Telemetry and Metrics, retaining the last 50 records.
- **Validation**: Zod for runtime API input validation.

### Key Features
- **Campaign Management**: Full CRUD operations for marketing campaigns with real-time sync via WebSockets, progress tracking, budget/spend monitoring, and multi-channel support (Meta, Google Ads, LinkedIn, Email, TikTok).
- **Client Account Management**: Full CRUD for client accounts linked to campaigns, tracking company info, industry, monthly budgets, health scores, milestones, and activity history.
- **Team Administration**: Full CRUD for team members with marketing roles (Creative Director, Copywriter, Designer, Social Media Manager, etc.), department levels, work hours, and campaign assignment tracking.
- **Resource Management**: Full CRUD for marketing deliverables and assets (Creative, Copy, Asset, Design, Video, Document) with file metadata, status tracking (Disponible, En Uso, En Revisión, Aprobado), and campaign associations.
- **Real-time Analytics**: WebSocket broadcasts for instant KPI updates, telemetry visualization with last 24 data points.
- **Dynamic System Metrics**: Real-time metrics for client health, team utilization, resource allocation, and campaign performance, broadcast every 10 seconds.
- **Global Search & Filters**: Cmd+K command palette for searching campaigns, filtering by status (Planning, Active, In Progress, Paused, Completed) and priority.
- **Multi-Page Navigation**: Spanish-language interface with Dashboard, Clientes, Equipo, Recursos, KPIs, Profile, and Settings pages, all with full CRUD capabilities.
- **Marketing KPIs Dashboard**: Comprehensive analytics with campaign status distribution, priority breakdown, channel performance (Campañas por Canal), and performance trends.
- **Data Export**: Client-side CSV and JSON export for campaigns and analytics.
- **AI Agent Integration**: GPT-5 powered assistant for natural language queries about campaigns and operations with mandatory approval system and OpenAI function calling.
- **Seed Script**: Populates database with realistic marketing agency test data (campaigns, clients, team, resources).

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
- connect-pg-simple (PostgreSQL-backed session storage - configured for future authentication)