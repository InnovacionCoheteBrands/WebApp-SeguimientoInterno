# Mission Control / Cohete Brands

Plataforma interna de operaciones para la agencia Cohete Brands. El sistema centraliza la gestion de clientes, proyectos, finanzas, leads, equipo, activos digitales, proveedores, servicios, POEs y automatizaciones con IA, todo en una interfaz tipo *Mission Control*.

Este documento esta pensado para que cualquier persona o agente, interno o externo, entienda rapidamente:

- que resuelve el proyecto,
- como esta organizado,
- como se levanta en local,
- que variables necesita,
- como desplegarlo,
- y donde vive la logica critica.

## Vision general

Mission Control es una aplicacion full-stack con foco en operacion empresarial para marketing y gestion de cuenta. Combina:

- dashboard operativo,
- CRM y leads,
- gestion de clientes y contactos,
- proyectos y entregables,
- finanzas y calendario de pagos,
- control de activos digitales,
- proveedores y catalogo de servicios,
- equipo y asignaciones,
- autenticacion segura,
- auditoria,
- y un asistente IA con herramientas.

El producto usa una experiencia visual oscura, premium y tecnologica, con componentes accesibles y animaciones suaves.

## Cambios recientes

- **Remediacion seguridad (auditoria production readiness, mayo 2026):**
  - **Migraciones (hallazgo 3.1):** `migrations/meta/_journal.json` alineado con los SQL versionados; `npm run predeploy:audit` ejecuta [`scripts/check-migration-journal.ts`](scripts/check-migration-journal.ts) antes de `audit-check`. La validacion contra la base de datos real (read-only) sigue siendo prerequisito antes de produccion; ver addendum en [`docs/audit/REPORTE_AUDITORIA_PRODUCTION_READINESS_2026-05-06.md`](docs/audit/REPORTE_AUDITORIA_PRODUCTION_READINESS_2026-05-06.md).
  - **OAuth (hallazgo 2.1):** refresh token en cookie `HttpOnly` (no en URL ni `localStorage`); endpoints `/api/auth/session`, `/api/auth/refresh`, `/api/auth/logout`; `cookie-parser` en bootstrap; el body legacy queda deshabilitado por defecto.
  - **Provisionamiento interno:** `/api/auth/register` exige sesion admin y Google OAuth solo autentica o vincula cuentas existentes.
  - **API keys (hallazgo 2.3):** generacion con CSPRNG, almacenamiento como hash `sha256:...:last4`, respuestas enmascaradas en settings; script [`scripts/invalidate-legacy-api-keys.ts`](scripts/invalidate-legacy-api-keys.ts) (dry-run por defecto; `--execute` solo tras backup y aviso a usuarios).
- **Modulo Ads retirado:** se eliminaron pantallas, rutas API `/api/ads/*`, controlador y tablas asociadas. En bases existentes, aplicar la migracion SQL [`migrations/0007_remove_ads_module.sql`](migrations/0007_remove_ads_module.sql) (limpieza de datos, normalizacion de proyectos `service_type` y `DROP` de tablas Ads). Un respaldo declarativo opcional esta en `scripts/backup-ads-module.sql`.
- **Finanzas y calendario de pagos:** el cliente usa `fetchPaymentCalendar` ([`client/src/lib/api.ts`](client/src/lib/api.ts)) contra `/api/finance/payment-calendar`; la logica de agregacion y permisos sigue en [`server/storage.ts`](server/storage.ts) y controladores en [`server/controllers/financial.ts`](server/controllers/financial.ts).
- **Contrato de datos:** el esquema Drizzle compartido vive en [`shared/schema.ts`](shared/schema.ts); la capa de persistencia concentrada en [`server/storage.ts`](server/storage.ts) (mantener controladores delgados).

## Stack tecnico

### Frontend

- React 19
- Vite
- TypeScript
- Wouter para routing
- TanStack Query para data fetching y cache
- React Hook Form + Zod para formularios y validacion
- Tailwind CSS 4
- Radix UI / shadcn/ui
- Framer Motion para microinteracciones

### Backend

- Node.js
- Express.js en modo ESM
- Drizzle ORM
- PostgreSQL, normalmente via Supabase o Neon
- WebSocket para actualizaciones en tiempo real
- Passport para autenticacion y Google OAuth
- JWT + refresh tokens para la capa de seguridad
- rate limiting y logging estructurado

### Infraestructura y herramientas

- Docker y Docker Compose
- PM2 para procesos en produccion
- Nginx como reverse proxy
- Vitest para pruebas
- scripts de migracion y auditoria previos a despliegue

## Que incluye el sistema

### Operacion comercial

- clientes
- contactos
- cuentas de facturacion
- documentos de cliente
- activos digitales
- leads / CRM
- asignacion de vendedores y responsables

### Operacion de proyectos

- proyectos
- entregables
- adjuntos
- asignacion de equipo por proyecto
- catalogo de servicios
- relacion proyecto-servicio
- control de avance y salud del proyecto

### Finanzas

- transacciones de ingreso y gasto
- transacciones recurrentes
- cuotas / installments
- calendario financiero
- indicadores y resumen operativo
- vinculo entre proyectos, pagos y transacciones

### Equipo y organizacion

- usuarios
- roles
- equipo
- asignaciones
- catalogo de roles de agencia

### Marketing y medios

- campaÃ±as
- recursos creativos

El modulo legacy de pauta publicitaria (Ads) fue retirado; la informacion de auditorias al respecto puede consultarse en [`docs/audit/`](docs/audit/).

### Estandares y gobernanza

- POEs / SOPs
- auditoria de acciones
- configuracion por usuario
- logs de actividad
- asistente IA con acciones aprobadas

## Arquitectura

La arquitectura esta separada en tres capas principales:

### `client/`

Aplicacion React con rutas, layout, componentes reutilizables, formularios y vistas por modulo.

### `server/`

Servidor Express con controladores por dominio, middleware de autenticacion, logica de negocio, integracion de IA, websockets, auditoria y acceso a base de datos.

### `shared/`

Esquemas y tipos compartidos entre frontend y backend. El contrato principal del dominio vive en `shared/schema.ts`.

## Estructura del proyecto (mapa rapido)

Las carpetas mas importantes son:

- `client/src/pages`: pantallas principales del producto
- `client/src/components`: componentes reutilizables y layout
- `client/src/hooks`: hooks de autenticacion, idioma, websocket, etc.
- `client/src/lib`: cliente HTTP y utilidades (incluye [`api.ts`](client/src/lib/api.ts))
- `server/controllers`: rutas y handlers por modulo
- `server/middleware`: autenticacion, errores, upload, proteccion
- `server/utils`: IA, logger, crypto, auditoria y helpers
- [`shared/schema.ts`](shared/schema.ts): tablas, tipos y schemas Zod
- `migrations/`: SQL y migraciones (incluye retiro del modulo Ads)
- `scripts/`: utilidades de mantenimiento, seed, QA y auditoria
- `docs/`: auditorias, reportes y documentacion operativa
- `uploads/`: archivos subidos protegidos por autenticacion

Detalle de stack y convencion *routes delgados / persistencia en storage* en [`.agent/context/tech_stack.md`](.agent/context/tech_stack.md).

## Mapa funcional de pantallas

Rutas principales del frontend:

- `/` dashboard
- `/auth` login
- `/clientes` y `/clientes/:id`
- `/proyectos`, `/proyectos/:id` y `/control-proyectos`
- `/recursos`
- `/equipo`
- `/kpis`
- `/crm`
- `/digital-assets`
- `/finanzas`
- `/poes`
- `/calendario-pagos`
- `/usuarios`
- `/proveedores`
- `/servicios`
- `/actividad`
- `/settings`
- `/profile`

Tambien existen pantallas especificas para integraciones y administracion como `payment-calendar`, `leads-control`, `data-center` y otras vistas de soporte.

## API y backend

Las rutas estan organizadas por controlador en `server/controllers/`. El archivo `server/routes.ts` registra los modulos principales bajo `/api` y protege la mayoria con autenticacion.

Puntos relevantes:

- `GET /api/health`: verifica estado general y conexion a base de datos
- `/api/auth/*`: login, registro, refresh y flujo de autenticacion
- `/api/*`: recursos del dominio como campaÃ±as, clientes, proyectos, equipo, finanzas, leads, POEs, proveedores, servicios, activos digitales, documentos y auditoria
- `/api/agent/*`: asistente IA con herramientas y flujo de aprobacion
- `/api/settings`: devuelve `apiKey` como resumen enmascarado (`present`, `masked`, `last4`), nunca el secreto completo
- `POST /api/settings/api-key`: regenera y devuelve la API key completa solo una vez como `newApiKey`; luego solo se expone el resumen enmascarado

Tambien hay soporte para:

- archivos en `uploads/` servidos con proteccion de acceso
- WebSocket para eventos y actualizaciones en vivo
- integracion con Google OAuth

## Modelo de datos

El esquema principal esta en `shared/schema.ts`. Las entidades mas importantes son:

- `users` y `refresh_tokens`
- `audit_logs`
- `campaigns`
- `client_accounts`
- `contacts`
- `billing_profiles`
- `digital_assets`
- `client_documents`
- `team`
- `team_assignments`
- `agency_role_catalog`
- `projects`
- `project_deliverables`
- `project_attachments`
- `project_team_assignments`
- `project_services`
- `installments`
- `transactions`
- `recurring_transactions`
- `resources`
- `leads`
- `poes`
- `suppliers`
- `service_catalog`
- `system_metrics`
- `telemetry_data`

La persistencia vive en `server/storage.ts`, que actua como capa de repositorio para mantener los controladores limpios y centralizar el acceso a datos.

## Seguridad

El proyecto ya incorpora varias capas de proteccion:

- validacion con Zod en schemas de entrada
- sanitizacion de strings para reducir riesgo de XSS
- autenticacion por JWT con refresh tokens
- contrasenas con hash bcrypt
- rate limiting global para rutas API
- logs de auditoria por accion relevante
- proteccion de archivos subidos
- variables sensibles fuera del codigo fuente

Reglas importantes:

- no exponer secrets en frontend
- no confiar en inputs de usuario sin validar
- revisar permisos antes de operaciones criticas
- usar `storage.ts` para persistencia, no consultas dispersas en controladores

## Requisitos previos

- Node.js 20 o superior
- npm
- PostgreSQL accesible o una instancia en Supabase/Neon
- variables de entorno configuradas

## Instalacion

```bash
npm install
```

## Configuracion local

1. Copia `.env.example` a `.env`.
2. Completa `DATABASE_URL` con tu cadena de PostgreSQL.
3. Define `SESSION_SECRET`, `JWT_SECRET` y `ENCRYPTION_KEY`.
4. Define `BASE_URL` (en produccion debe iniciar con `https://`).
5. Si vas a usar login con Google, configura `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
6. Si usas IA, define `AI_ENABLED`, `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL`, `AI_MODEL_AGENT`, `AI_MODEL_SUMMARY` y `AI_API_KEY`.
7. MantÃ©n `AUTH_REFRESH_COOKIE_ENABLED=true` y `AUTH_LEGACY_REFRESH_BODY_ENABLED=false`. Activa el modo legacy solo como excepcion temporal y controlada.
8. Si necesitas probar flujos sin login en local, puedes habilitar `SKIP_AUTH=true` solo en desarrollo.
9. Si heredas configuraciones antiguas, el sistema tambien reconoce alias legacy como `AI_INTEGRATIONS_OPENAI_API_KEY` y `AI_INTEGRATIONS_OPENAI_BASE_URL`.

Ejemplo minimo:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
PORT=5000
HOST=0.0.0.0
BASE_URL="http://localhost:5000"
NODE_ENV=development
LOG_LEVEL=info
SESSION_SECRET=""
JWT_SECRET=""
ENCRYPTION_KEY=""
AUTH_REFRESH_COOKIE_ENABLED=true
AUTH_LEGACY_REFRESH_BODY_ENABLED=false
AI_ENABLED=false
AI_MODEL="grok-4-1-fast-reasoning"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SKIP_AUTH=false
```

## Comandos utiles

### Desarrollo

```bash
npm run dev
```

Inicia el backend y, en desarrollo, monta Vite para servir el frontend.

### Frontend solamente

```bash
npm run dev:client
```

Levanta solo Vite en el puerto 5000.

### Verificacion de tipos

```bash
npm run check
```

### Tests

```bash
npm run test
```

### Build de produccion

```bash
npm run build
```

### Arranque de produccion

```bash
npm run start
```

### Base de datos

```bash
npm run db:push
```

En entornos que ya tienen datos, revisa tambien SQL en `migrations/` (por ejemplo el retiro del modulo Ads) antes de asumir que `db:push` alinea todo el historial.

### Migraciones historicas

```bash
npm run db:migrate:financial
npm run db:migrate:legacy
```

### Auditoria previa a despliegue

```bash
npm run predeploy:audit
```

### Flujo de despliegue

```bash
npm run deploy:build
npm run deploy:start
```

### Scripts solo desarrollo

- `scripts/test-db.ts`: prueba rapida de conexion usando `DATABASE_URL` del entorno (no imprimas la URL en logs compartidos).
- `scripts/qa_payment_calendar.ts`: llamadas HTTP locales para validar permisos y el calendario de pagos contra un servidor en marcha.
- `scripts/brute-db.ts`, `scripts/test-local-dbs.ts` y similares no se versionan (solo local); si existen en tu copia, mantenlos fuera del indice o aÃ±ade nombres a `.gitignore`.

### PM2

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

## Puesta en marcha paso a paso

```bash
npm install
npm run db:push
npm run dev
```

Despues abre `http://localhost:5000`.

## Despliegue

El proyecto soporta despliegue tradicional en VPS y tambien Docker.

### VPS

- construir con `npm run build`
- iniciar con `npm run start` o PM2
- usar Nginx como reverse proxy
- asegurar `HOST=0.0.0.0`
- configurar `BASE_URL` con el dominio real
- revisar `DEPLOYMENT.md` para el flujo completo

### Docker

- existe `Dockerfile`
- existe `docker-compose.yml`
- hay ejemplos de configuracion en la raiz del proyecto

## Integracion con IA

El modulo de IA esta preparado para operar como asistente de operaciones marketing:

- responde consultas del negocio,
- puede proponer acciones,
- requiere aprobacion para writes sensibles,
- registra metadatos y auditoria,
- expone metricas operativas.

Si `AI_ENABLED=false`, el sistema debe seguir funcionando sin la capa generativa.

## Documentacion relacionada

Archivos que vale la pena revisar junto con este `README`:

- [`AGENTS.md`](AGENTS.md) â€” reglas para agentes y colaboradores
- [`MEMORY.md`](MEMORY.md)
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)
- [`DEPLOYMENT.md`](DEPLOYMENT.md)
- [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) â€” migracion de datos legacy de finanzas
- [`.agent/context/tech_stack.md`](.agent/context/tech_stack.md)
- [`.agent/context/business_logic.md`](.agent/context/business_logic.md)
- [`.agent/context/rules.md`](.agent/context/rules.md)
- [`docs/audit/`](docs/audit/) â€” reportes de auditoria

## Guia rapida para agentes

Si eres un agente automatico o un colaborador nuevo:

1. Lee este `README`.
2. Revisa `AGENTS.md` para las reglas del proyecto.
3. Consulta `shared/schema.ts` antes de tocar logica de datos.
4. Usa `storage.ts` para persistencia y evita duplicar acceso a DB en controladores.
5. Valida cada entrada con Zod.
6. Mantente alineado con el estilo visual "Mission Control".
7. No elimines variables, tablas o rutas sin revisar el impacto en despliegue y migraciones.

## Troubleshooting

- Si la app no arranca, revisa `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET` y `ENCRYPTION_KEY`.
- Si falla login con Google, confirma `BASE_URL` y credenciales OAuth.
- Si no conecta a la base de datos, valida la cadena de Supabase/Neon y ejecuta `npm run db:push`.
- Si el frontend no carga en produccion, revisa el build y el proxy de Nginx.
- Si el asistente IA no responde, revisa `AI_ENABLED` y `AI_API_KEY`.

---

Si necesitas una version mas corta para onboarding o una version orientada a despliegue, puedo generar una segunda edicion del `README` enfocada en ese perfil.

