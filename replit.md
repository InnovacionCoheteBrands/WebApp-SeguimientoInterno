# Mission Control Dashboard

## Overview
A full-stack mission control dashboard for tracking and managing space exploration missions. It features a dark mode, industrial-themed UI inspired by SpaceX, offering real-time telemetry, mission management, fleet tracking, personnel management, and system health monitoring. The application includes an AI assistant for natural language queries and mission control actions, aiming to provide a comprehensive and intuitive interface for mission operations. The business vision is to provide a robust, scalable, and user-friendly platform for space mission command and control, reducing operational complexity and enhancing decision-making.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript, Vite (build tool), Wouter (routing).
- **UI/UX**: `shadcn/ui` with Radix UI, Tailwind CSS v4, "Mission Control" dark mode theme with space exploration aesthetics and high contrast.
- **State Management**: TanStack Query for server state (data fetching, caching, synchronization).
- **Real-time**: WebSocket integration for immediate UI updates.
- **Performance**: Component memoization, lazy loading for AgentChat, optimized `useState` hydration, and disabled `refetchOnWindowFocus` for React Query.
- **Accessibility**: Dual input (numeric + slider) for mission progress, 44x44px minimum touch targets, responsive layouts, and accessible dialogs.
- **Navigation**: Consistent global navigation with a shared `AppLayout` component, including desktop sidebar, mobile bottom navigation, and top header. Mobile-first design with bottom tab navigation, Floating Action Button (FAB), and metrics carousel.
- **Design Patterns**: Card-based display with inline actions for CRUD operations, progressive disclosure for mobile cards (tap-to-expand), and consistent dialog forms with validation.

### Backend
- **Framework**: Express.js with TypeScript and ES Modules.
- **API Design**: RESTful API with resource-based endpoints.
- **Development**: Custom Vite integration, request logging, centralized error handling.

### Data Storage & Schema
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe interactions, Drizzle Kit for migrations.
- **Schema**: Shared `shared/schema.ts` for client/server type consistency, including Users, Missions, System Metrics, Telemetry, Fleet Positions, Personnel, Personnel Assignments, and Data Health.
- **Data Retention**: Automated cleanup for Telemetry and Metrics, retaining the last 50 records.
- **Validation**: Zod for runtime API input validation.

### Key Features
- **Mission Management**: Full CRUD, real-time sync via WebSockets, progress updates.
- **Fleet Administration**: Full CRUD for fleet positions, displays "Position data unavailable" when applicable.
- **Personnel Administration**: Full CRUD for personnel, supports mission assignments.
- **Data Center Administration**: Full CRUD for system health components with status indicators (Operational, Warning, Critical, Offline).
- **Real-time Telemetry**: WebSocket broadcasts, line chart visualization of last 24 data points.
- **Dynamic System Metrics**: Real-time fleet status, active personnel, system load, threat level, broadcast every 10 seconds.
- **Global Search & Filters**: Cmd+K search for missions, filtering by status and priority.
- **Multi-Page Navigation**: Dashboard, Fleet, Personnel, Data Center, Analytics, Profile, and Settings pages with full CRUD capabilities.
- **User Profile**: Dedicated page for personal information and security settings.
- **System Configuration**: Preferences, notifications, visualization options, and API integrations.
- **Data Export**: Client-side CSV and JSON export for missions.
- **AI Agent Integration**: GPT-5 powered assistant for natural language queries and actions with mandatory approval system and OpenAI function calling.
- **Seed Script**: Populates database with realistic test data.

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