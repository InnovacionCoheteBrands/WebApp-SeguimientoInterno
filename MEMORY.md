# 🧠 Project Memory: WebApp - Control (Mission Control)

Este archivo es la fuente de verdad del estado actual del proyecto. Cualquier agente de IA o humano debe comenzar aquí para entender el contexto.

## 📌 Visión General
**Mission Control** es una plataforma integral de gestión empresarial diseñada para el control de talento, finanzas, leads y proyectos. Se enfoca en una experiencia de usuario premium con un diseño "Mission Control" (estética espacial/tecnológica).

- **Stack Principal:** React 19, TypeScript, Vite, Tailwind CSS 4, Express, Drizzle ORM, Supabase/Neon (PostgreSQL).
- **Diseños:** Basado en componentes Radix UI y animaciones con Framer Motion.

## 🚦 Estado Actual (Última actualización: 2026-06-05)
- **Fase:** Listo para despliegue / Candidato para Smoke Test Interno.
- **Últimos hitos:** 
  - Estabilización del entorno de dependencias locales (`framer-motion` reinstalado vía `npm ci`).
  - Validación del pipeline completo: Verificación de tipos (`check`), Build de Producción (`build`) y Auditoría Previa (`predeploy:audit`) operativas en verde (Ver [.agent/estabilizacion_entorno_2026-06-05.md](file:///C:/Users/Departamento%20AI/OneDrive/Documents/C%C3%B3digos/WebApp%20-%20Control/DesignSystemMissionControl/.agent/estabilizacion_entorno_2026-06-05.md)).
- **Pendiente inmediato:** Lanzamiento de smoke test en el entorno de pruebas interno y verificación de flujos clave en staging.

## 📂 Estructura de Conocimiento
Para más detalles técnicos, consulta los siguientes archivos en `.agent/context/`:
- [`tech_stack.md`](file:///c:/Users/Departamento AI/OneDrive/Documents/Códigos/WebApp - Control/DesignSystemMissionControl/.agent/context/tech_stack.md): Detalles profundos de librerías y arquitectura.
- [`rules.md`](file:///c:/Users/Departamento AI/OneDrive/Documents/Códigos/WebApp - Control/DesignSystemMissionControl/.agent/context/rules.md): Reglas de código, estilos y componentes de UI.
- [`business_logic.md`](file:///c:/Users/Departamento AI/OneDrive/Documents/Códigos/WebApp - Control/DesignSystemMissionControl/.agent/context/business_logic.md): Explicación de los flujos de negocio y base de datos.

## 🛠️ Comandos Comunes
- `npm run dev`: Inicia el servidor de backend (puerto por defecto).
- `npm run dev:client`: Inicia el frontend en el puerto 5000.
- `npm run db:push`: Sincroniza el esquema de Drizzle con la base de datos.
- `npm run check`: Ejecuta el verificador de tipos (TypeScript).

---
> [!TIP]
> Si eres una IA, mantén este archivo actualizado después de cada cambio significativo en la arquitectura o hitos del proyecto.
