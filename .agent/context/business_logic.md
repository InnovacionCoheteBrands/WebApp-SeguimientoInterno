# 💼 Business Logic & Domain

Este documento explica el "QUÉ" hace la aplicación y cómo se estructuran sus procesos.

## 👥 Módulos Principales

### 1. Gestión de Talento (Talent Management)
- **Propósito:** Registro y administración de colaboradores.
- **Flujo:** Formulario de alta -> Validación de schema -> Almacenamiento -> Listado en dashboard.
- **Entidades clave:** `User`, `Role`, `TalentProfile`.

### 2. Control Financiero (Financial Control)
- **Propósito:** Seguimiento de ingresos, egresos y facturación.
- **Lógica:** Implementación de transacciones para asegurar la integridad de los datos financieros.
- **Entidades clave:** `Transaction`, `Invoice`, `Budget`.

### 3. CRM & Leads
- **Propósito:** Captación y seguimiento de clientes potenciales.
- **Flujo:** Pre-calificador -> Asignación a comercial -> Conversión a proyecto.

### 4. Gestión de Proyectos
- **Propósito:** Control de hitos, tiempos y recursos.

## 🏗️ Patrones de Implementación

### Patrón Repository (`storage.ts`)
Toda la lógica de persistencia está centralizada en `storage.ts`. Esto permite:
- Cambiar la implementación de la base de datos fácilmente (ej: de In-memory a Neon Postgres).
- Mantener los controladores (`routes.ts`) enfocados solo en el flujo HTTP.

### Inyección de Contexto en IA
Los archivos de contexto en `.agent/` sirven para que cualquier agente de IA pueda:
1. Leer el esquema en `shared/schema.ts`.
2. Consultar `business_logic.md` para entender por qué una tabla tiene x o y columna.
3. Generar código coherente con el negocio.

---
> [!NOTE]
> Gran parte de la lógica de negocio depende de los roles definidos en la base de datos. Verifica siempre los permisos antes de implementar acciones críticas.
