# Reporte de auditoría backend (solo lectura)

| Campo | Valor |
| --- | --- |
| **Repositorio auditado** | `DesignSystemMissionControl` (raíz del repo Git; carpeta padre `WebApp - Control` no es repositorio) |
| **Producto / backend** | Mission Control / Cohete Brands (`package.json`: nombre npm `rest-express`) |
| **Alcance** | Backend Express, Drizzle ORM, JWT, WebSockets, controladores, `storage`, migraciones, scripts y tests (revisión estática) |
| **Fecha del informe** | 4 de mayo de 2026 |
| **Validación contra código** | 4 de mayo de 2026 (solo lectura; sin ejecutar servidor, tests, scripts ni migraciones) |
| **Modo** | Solo lectura: sin cambios de código, datos, migraciones ni variables de entorno |

---

## 0. Validación posterior al borrador inicial

Se contrastó el borrador de este informe con el **código real** del repositorio. Resultado:

| Tema | Corrección aplicada |
| --- | --- |
| Nombre del proyecto | Se distingue **repo** (`DesignSystemMissionControl`) de **producto** (Mission Control / Cohete Brands). |
| Inventario | Cifras exactas (no aproximadas). |
| `financial` e `installments` | **Confirmado:** `router.use(requireAdmin)` en ambos controladores; no basta con `requireAuth` global. |
| Ads | **Confirmado:** no hay controlador Ads montado ni tablas `ad_*` en `shared/schema.ts`; existe migración `0007_remove_ads_module.sql`. |
| C4 migraciones | **Degradado** de “drift desplegado confirmado” a **sospecha razonable**: el repo muestra **inconsistencia** entre `migrations/meta/_journal.json` y varios `.sql` adicionales; el estado de la BD en cada entorno **no** se verificó en runtime. |
| A7 archivos | **Ampliado:** además de avatar/assets/documentos, aplica a **adjuntos de proyecto** (`deleteProjectAttachment` sin borrado físico de fichero). |

---

## 1. Resumen ejecutivo

Se realizó una auditoría **estática** del backend en la **raíz del repositorio** `DesignSystemMissionControl` (producto **Mission Control / Cohete Brands**). El análisis se basó en `server/routes.ts`, controladores, `server/storage.ts`, `shared/schema.ts`, `migrations/`, `scripts/` y `server/tests/`.

Los riesgos más relevantes siguen siendo **seguridad de superficies** (agente `execute`, WebSocket `/ws`, OAuth, API keys en claro), **atomicidad en finanzas** (recurrentes, cuotas, `unpay`) y **operación** (scripts intrusivos). La **coherencia de migraciones en el repo** es un riesgo de proceso (**C4** como sospecha); su impacto en bases ya desplegadas requiere verificación operativa fuera de este modo read-only.

---

## 2. Alcance y exclusiones

### 2.1 Incluido

- Backend: `server/` (rutas, bootstrap, middleware, WebSocket, utilidades).
- Esquema: `shared/schema.ts` y relacionados.
- Migraciones: `migrations/` y `migrations/meta/`.
- Scripts: `scripts/`.
- Tests backend: `server/tests/`.

### 2.2 Fuera de alcance (justificado)

- **video-mission-control** (Remotion): no es el backend Express/Drizzle auditado aquí.
- **Runtime:** BD real, disco de `uploads/`, OAuth en producción, tráfico APM: no verificables en solo lectura sin ejecutar nada.

---

## 3. Inventario exacto (validado en repo)

| Concepto | Cantidad | Ubicación / nota |
| --- | ---: | --- |
| Controladores (archivos) | 23 | `server/controllers/*.ts` |
| Routers montados en `registerRoutes` | 23 | `server/routes.ts` |
| Endpoints HTTP en controladores (handlers `router.get/post/...`) | 143 | Conteo por `router.(get\|post\|put\|patch\|delete)` en `server/controllers/` |
| Rutas extra montadas en `routes.ts` | 2 | `GET /api/health`, `GET /uploads/*` (con `requireAuth`) |
| WebSocket | 1 | `path: "/ws"` en `server/websocket.ts` |
| Scripts | 56 | `scripts/` |
| Archivos SQL de migración | 10 | `migrations/*.sql` excl. meta |
| Meta migraciones (snapshots + journal) | 3 | `migrations/meta/` |
| Tests backend | 7 | `server/tests/*.test.ts` |
| Tablas Drizzle (`pgTable`) | 27 | `shared/schema.ts` |

### 3.1 Tests backend (lista)

1. `server/tests/health.test.ts`
2. `server/tests/auth.test.ts`
3. `server/tests/agent.test.ts`
4. `server/tests/ai-summary.test.ts`
5. `server/tests/audit.test.ts`
6. `server/tests/financial-access.test.ts`
7. `server/tests/financial-calendar.test.ts`

### 3.2 Tablas del schema (lista)

`users`, `refresh_tokens`, `audit_logs`, `campaigns`, `system_metrics`, `telemetry_data`, `client_accounts`, `contacts`, `billing_profiles`, `digital_assets`, `client_documents`, `team`, `team_assignments`, `resources`, `agency_role_catalog`, `transactions`, `recurring_transactions`, `projects`, `installments`, `project_attachments`, `project_deliverables`, `suppliers`, `service_catalog`, `project_services`, `leads`, `poes`, `project_team_assignments`.

### 3.3 Archivos SQL en `migrations/`

`0000_volatile_major_mapleleaf.sql`, `0001_add_projects_tables.sql`, `0001_demonic_lake.sql`, `0002_add_financial_enhancements.sql`, `0003_sync_team_schema.sql`, `0004_add_team_assignments_project_id.sql`, `0005_add_projects_level.sql`, `0006_sync_projects_kanban_columns.sql`, `0007_remove_ads_module.sql`, `cohete_replica_tables.sql`.

**Nota validada:** `migrations/meta/_journal.json` solo referencia dos tags Drizzle (`0000_*`, `0001_demonic_lake`), mientras coexisten más `.sql` en la misma carpeta. Eso es evidencia de **inconsistencia en el repo**; no implica por sí sola el estado de una BD concreta (**C4**).

---

## 4. Prefijos y superficie HTTP/WebSocket

| Prefijo / ruta | Naturaleza |
| --- | --- |
| `GET /api/health` | Salud (sin `requireAuth` en `routes.ts`) |
| `GET /uploads/*` | Estáticos bajo `requireAuth` |
| `/api/auth` | Login, registro, refresh, Google OAuth, `me` |
| `/api` | Routers mayoritarios bajo `requireAuth` |
| `/api/leads` | CRM Kanban |
| `/api/poes` | POEs |
| `/api/users` | Usuarios + avatar |
| `WS /ws` | WebSocket (sin auth en código actual) |

---

## 5. Matriz de routers y auth (corregida)

Leyenda **Auth global:** `requireAuth` aplicado en `server/routes.ts` salvo excepciones indicadas. **Admin:** comprobación explícita `req.user?.role === "admin"` (o `router.use(requireAdmin)`) dentro del módulo.

| Superficie | Prefijo montaje | Auth global | Admin explícito | Nº handlers | RT / notas |
| --- | --- | --- | --- | ---: | --- |
| health | — | No | No | 1 | — |
| uploads-static | `/uploads` | Sí | No | 1 | — |
| auth | `/api/auth` | Parcial (público login/register/refresh/google; `me` con auth) | No | 6 | — |
| campaigns | `/api` | Sí | No | 5 | `campaign_update` vía WS |
| clients | `/api` | Sí | No | 5 | — |
| contacts | `/api` | Sí | No | 5 | — |
| billing-profiles | `/api` | Sí | No | 5 | — |
| digital-assets | `/api` | Sí | No | 6 | incl. `express.static` bajo `/api/uploads` |
| client-documents | `/api` | Sí | No | 4 | — |
| team | `/api` | Sí | No | 7 | — |
| project-team | `/api` | Sí | No | 5 | — |
| resources | `/api` | Sí | No | 4 | — |
| financial | `/api` | Sí | **Sí** (`router.use(requireAdmin)`) | 18 | — |
| misc | `/api` | Sí | No | 3 | — |
| projects | `/api` | Sí | No | 22 | incl. servicios y rentabilidad |
| agent | `/api` | Sí | No | 6 | — |
| agency | `/api` | Sí | No | 4 | — |
| settings | `/api` | Sí | No | 3 | expone `apiKey` del usuario |
| installments | `/api` | Sí | **Sí** (`router.use(requireAdmin)`) | 6 | — |
| services | `/api` | Sí | No | 5 | — |
| suppliers | `/api` | Sí | No | 5 | — |
| leads | `/api/leads` | Sí | No | 8 | — |
| poes | `/api/poes` | Sí | No | 6 | — |
| users | `/api/users` | Sí | **Parcial:** list/patch/delete admin; `POST /me/avatar` solo auth | 4 | — |
| audit | `/api` | Sí | **Sí** (`GET /audit-logs`) | 1 | — |
| websocket | `/ws` | **No** | No | — | persistencia sintética en `telemetry_data` / `system_metrics` |

**Total handlers en routers:** 143 (coincide con conteo en `server/controllers/`).

---

## 6. Cobertura por área (actualizada)

| Área | Estado | Notas |
| --- | --- | --- |
| Backend principal | Completa (estática) | Raíz repo `DesignSystemMissionControl` |
| video-mission-control | Fuera de alcance | Remotion |
| Rutas y prefijos | Completa | `server/routes.ts` |
| Matriz auth / admin | Completa | Incluye corrección financial/installments/users/audit |
| Auth, OAuth | Parcial | Código revisado; sin flujo real |
| Ads (backend) | Completa | Sin módulo montado; migración `0007_*` |
| Ads (documentación) | Hallazgo menor | `README.md` aún menciona superficies Ads |
| Campañas, analytics | Completa | `misc`, `campaigns`; telemetría también vía WS |
| Clientes 360 | Completa | — |
| Finanzas e installments | Completa | Admin en router + tests `financial-*` |
| Agente IA | Completa (código) | `agent.ts`, `agent-tool-registry.ts` |
| WebSockets | Parcial | Sin conexión real |
| Migraciones y scripts | Completa (lectura) | Inconsistencia journal vs SQL (**C4** sospecha) |
| Tests | Completa (lectura) | 7 archivos; suite no ejecutada |
| DB real y disco | No verificable | Política read-only |

---

## 7. Hallazgos priorizados (con estado de validación)

### 7.1 Críticos y altos — clasificación

| ID | Severidad | Hallazgo | Impacto | Validación |
| --- | --- | --- | --- | --- |
| C1 | Crítico | `POST /api/agent/execute` no enlaza con una **aprobación** persistida o token de acción; ejecuta la tool tras JWT + validación de args | Escrituras vía agente sin gobernanza fuerte | **Confirmado** |
| C2 | Crítico | `executeRecurringTransaction` / `markObligationAsPaid`: `createTransaction` y luego `updateRecurringTransaction` sin transacción única envolvente | Estado parcial plantilla vs movimiento | **Confirmado** |
| C3 | Crítico | `generateInstallmentsForProject`: borrados e inserciones múltiples sin `db.transaction` global | Cuotas/transacciones inconsistentes ante fallo intermedio | **Confirmado** |
| C4 | Alto (proceso) | `migrations/meta/_journal.json` solo 2 entradas vs varios `.sql` en carpeta (incl. `0007_remove_ads_module.sql`) | Riesgo de desalineación entre herramientas Drizzle y SQL manual | **Sospecha razonable** (repo inconsistente; BD no medida) |
| A1 | Alto | `users.apiKey` en claro; `regenerateApiKey` persiste texto plano; `encrypt`/`decrypt` en `server/utils/crypto.ts` no usados en ese flujo | Fuga si comprometen DB/backups | **Confirmado** |
| A2 | Alto | Google OAuth callback redirige con `token` y `refreshToken` en query | Fuga vía logs, historial, referrer | **Confirmado** |
| A3 | Alto | `WS /ws` sin auth; simuladores escriben telemetría/métricas sintéticas | Superficie abierta; datos no representativos en tablas | **Confirmado** |
| A4 | Alto | `POST /api/auth/register` público; write tools del agente con `allowedRoles: []` → cualquier rol autenticado pasa `authorizeAgentAction` | Superficie amplia post-registro | **Confirmado** |
| A5 | Alto | `unpay`: `deleteTransactionByRecurringTemplateId` + `updateRecurringTransaction` en pasos separados; borrado acotado al mes calendario actual | Reversión parcial o incorrecta | **Confirmado** |
| A6 | Alto | `addProjectService`: gasto usa `customPrice \|\| defaultPrice` (precio venta); `removeProjectService` borra gasto por `description` exacta | Ledger frágil | **Confirmado** |
| A7 | Alto | Borrados en DB sin borrar ficheros en disco: avatar, activos (JSON `files`), documentos, **adjuntos de proyecto** | Huérfanos en `uploads/` | **Confirmado** |
| A8 | Alto | Scripts como `reset_admin.ts` (password fija), `brute-db.ts` (fuerza bruta local), `verify_kanban_backend.ts` (fuerza `DATABASE_URL`) | Riesgo operativo / seguridad en entornos mal usados | **Confirmado** |

### 7.2 Medios y bajos (consolidado)

- **Documentación vs código (Ads):** el README aún describe capacidades tipo Ads; el backend actual no monta `ads` router.
- Deuda analítica: canales “Google Ads” en agregados de campañas no implican módulo Ads backend vivo.

---

## 8. Campañas, analytics y Ads (validado)

| Aspecto | Estado en código actual |
| --- | --- |
| Router backend Ads | **No** montado en `server/routes.ts`; no existe `server/controllers/ads.ts` en el árbol auditado |
| Tablas Ads en `shared/schema.ts` | **No** presentes |
| Evidencia de retiro | **Sí:** `migrations/0007_remove_ads_module.sql` y `scripts/backup-ads-module.sql` |
| Migración aplicada en todas las BDs | **No verificable** read-only |

---

## 9. Scripts, migraciones y tests

| Tema | Conclusión |
| --- | --- |
| **Scripts** | 56 archivos; varios de diagnóstico o intrusivos. Uso solo con runbook y entorno acotado. |
| **Migraciones** | Inconsistencia documentada entre journal y SQL sueltos (**C4**). Recomendable política única y CI que detecte divergencia. |
| **Tests** | 7 archivos; incluyen `financial-access.test.ts` que refuerza **403** para no-admin en finanzas/cuotas. Esta auditoría **no ejecutó** la suite. |

---

## 10. Riesgos transversales

| Dimensión | Riesgo |
| --- | --- |
| **Seguridad** | OAuth en query, WS abierto, secretos en claro, agente `execute` sin prueba de aprobación |
| **Finanzas** | Atomicidad débil en recurrentes, regeneración de cuotas, `unpay`, líneas proyecto-servicio |
| **Operación** | Scripts peligrosos; migraciones con fuentes múltiples en repo |
| **Datos / almacenamiento** | Huérfanos de fichero tras borrados en DB |

---

## 11. Limitaciones

- No sustituye pentest ni auditoría contable.
- No incluye evidencia de tráfico ni estado de BD desplegada.
- **C4** describe riesgo de proceso basado en **artefactos del repo**, no drift medido en producción.

---

## 12. Fases siguientes (sin detalle de remediación técnica)

1. Corto plazo: priorizar evidencia en entorno de staging para **C1, A2, A3, A1** (diseño acordado con el equipo).
2. Medio plazo: transacciones de BD en flujos financieros críticos y pruebas de regresión ejecutadas en CI.
3. Continuo: alinear **migraciones** (journal vs SQL) y endurecer uso de **scripts**.

---

## 13. Referencias en el repositorio

| Ruta | Uso |
| --- | --- |
| `server/routes.ts` | Montaje y auth global |
| `server/controllers/financial.ts` | `requireAdmin` en finanzas |
| `server/controllers/installments.ts` | `requireAdmin` en cuotas |
| `server/controllers/agent.ts` | Agente y `execute` |
| `server/agent-tool-registry.ts` | Políticas de tools y `authorizeAgentAction` |
| `server/websocket.ts` | `/ws` y simuladores |
| `server/storage.ts` | Persistencia y lógica financiera |
| `shared/schema.ts` | Tablas y tipos |
| `migrations/` y `migrations/meta/_journal.json` | Evolución de esquema |
| `server/tests/financial-access.test.ts` | Control de acceso finanzas/cuotas |

---

*Informe actualizado tras validación estática contra el código del 4 de mayo de 2026. Para seguimiento, enlazar tickets por ID (C1, A1, …).*
