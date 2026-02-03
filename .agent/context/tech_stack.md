# 💻 Tech Stack & Architecture

Este documento detalla la infraestructura técnica de **Mission Control**.

## 🎨 Frontend (Client)
- **Framework:** React 19 (última versión estable).
- **Bundler:** Vite.
- **Styling:** 
  - Tailwind CSS 4 (Uso de variables CSS nativas y `@tailwindcss/vite`).
  - `lucide-react` para iconografía.
  - `framer-motion` para micro-interacciones y animaciones premium.
- **Componentes:** shadcn/ui (basado en Radix UI).
- **State & Data Fetching:** 
  - `@tanstack/react-query` para peticiones asíncronas.
  - `wouter` para el enrutamiento ligero.
  - `react-hook-form` + `zod` para validación de formularios.

## ⚙️ Backend (Server)
- **Runtime:** Node.js con `tsx` para ejecución directa de TypeScript.
- **Framework:** Express.js.
- **Base de Datos:** PostgreSQL (vía Neon/Supabase).
- **ORM:** Drizzle ORM.
- **Autenticación:** Passport.js con estrategia local y almacenamiento en sesión (`express-session`).
- **Comunicación en Tiempo Real:** WebSocket (`ws`) para notificaciones o actualizaciones de métricas.

## 🗄️ Base de Datos & Modelos
- **Esquema:** Localizado en `shared/schema.ts`.
- **Drizzle Config:** `drizzle.config.ts`.
- **Migraciones:** Gestión mediante `drizzle-kit push` para rapidez en desarrollo.

## 🏗️ Estructura de Carpetas
- `/client`: Aplicación React.
  - `/src/components`: Componentes reutilizables de UI.
  - `/src/hooks`: Lógica de React personalizada.
  - `/src/lib`: Utilidades (API, query client).
  - `/src/pages`: Vistas principales.
- `/server`: Servidor Express y lógica de negocio.
  - `storage.ts`: Capa de abstracción de datos (Patrón Repository).
- `/shared`: Código compartido (Zod schemas, tipos de TypeScript).

---
> [!IMPORTANT]
> Se prefiere el uso de `storage.ts` para agrupar todas las interacciones con la base de datos, manteniendo `routes.ts` lo más limpio posible.
