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
- **Missions Table**: Core mission tracking with status, progress, priority fields
- **System Metrics Table**: Time-series metrics data with flexible value storage
- **Telemetry Data Table**: Mission telemetry readings and sensor data

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