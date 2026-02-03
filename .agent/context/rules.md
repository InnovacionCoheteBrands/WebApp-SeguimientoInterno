# 📏 Development Rules & Conventions

Para mantener la calidad y el estilo "Mission Control", sigue estas reglas estrictamente.

## 🛠️ Estándares de Código
- **TypeScript:** Siempre usa tipos explícitos. Evita `any` a toda costa.
- **Componentes:** Prefiere componentes funcionales con Hooks.
- **Validación:** Toda entrada de datos debe estar validada con `zod`.
- **Async/Await:** Usa bloques `try/catch` para manejar errores en peticiones asíncronas.
- **Nomenclatura:**
  - Archivos de componentes: `kebab-case.tsx` (ej: `user-profile.tsx`).
  - Funciones/Variables: `camelCase`.
  - Clases/Interfaces/Tipos: `PascalCase`.

## 🎨 Diseño y UI (Mission Control Style)
- **Aesthetics:** El diseño debe sentirse premium y tecnológico. Usa gradientes sutiles y bordes definidos.
- **Colores:** Usa los tokens definidos en el tema de Tailwind (ver `index.css` si existe o variables CSS).
- **Interactividad:** Cada botón o elemento clickeable debe tener un efecto hover y una micro-animación ligera (`framer-motion`).
- **Accesibilidad:** Mantener el uso de componentes Radix (`@radix-ui/*`) para asegurar que los diálogos, selects y menús sean accesibles de forma nativa.

## 📂 Gestión de Archivos
- **No duplicar:** Antes de crear un componente, revisa si ya existe uno similar en `client/src/components`.
- **Organización de `shared/schema.ts`:** Los esquemas de Zod se derivan de las tablas de Drizzle usando `createInsertSchema` y `createSelectSchema`.

## 🔐 Seguridad
- **Sanitización:** Nunca confíes en el input del usuario.
- **Sesiones:** Los datos sensibles del usuario no deben exponerse en el frontend innecesariamente.

---
> [!WARNING]
> No elimines librerías sin consultar antes su impacto en el `ecosystem.config.cjs` o archivos de configuración de PM2.
