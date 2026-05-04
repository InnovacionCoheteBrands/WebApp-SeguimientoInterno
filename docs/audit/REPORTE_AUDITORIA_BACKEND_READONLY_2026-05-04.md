# Reporte de auditoría backend (solo lectura)

| Campo | Valor |
| --- | --- |
| **Proyecto** | DesignSystemMissionControl |
| **Alcance** | Backend Express, Drizzle ORM, JWT, WebSockets, controladores, `storage`, migraciones, scripts y tests (revisión estática) |
| **Fecha del informe** | 4 de mayo de 2026 |
| **Modo** | Solo lectura: sin cambios de código, datos, migraciones ni variables de entorno; sin arranque de servidor, ejecución de tests, scripts ni migraciones |

---

## 1. Resumen ejecutivo

Se realizó una auditoría **estática** del backend principal del monorepo, identificando **DesignSystemMissionControl** como el único backend Express + Drizzle relevante para el alcance. El análisis se apoyó en lectura de rutas montadas, controladores, capa de persistencia, esquema compartido, migraciones, scripts y pruebas automatizadas documentadas en el repositorio.

Los riesgos más relevantes se concentran en **seguridad de superficies expuestas** (agente, WebSocket, OAuth, configuración de API keys), **atomicidad de operaciones financieras** (transacciones recurrentes, cuotas, reversión de pagos) y **coherencia operativa de migraciones** (journal Drizzle frente a SQL adicional y módulos históricos como Ads).

Se recomienda priorizar validación en entorno controlado (tests de integración, revisión de flujos OAuth y WebSocket con autenticación) y un plan de endurecimiento incremental sin bloquear el despliegue de correcciones puntuales ya identificadas.

---

## 2. Alcance y exclusiones

### 2.1 Incluido

- Aplicación backend en `DesignSystemMissionControl/server/` (rutas, bootstrap, middleware, WebSocket, utilidades).
- Esquema y tipos compartidos (`shared/schema.ts` y relacionados).
- Migraciones (`migrations/`, `migrations/meta/_journal.json`).
- Scripts en `DesignSystemMissionControl/scripts/`.
- Tests backend en `DesignSystemMissionControl/server/tests/`.

### 2.2 Fuera de alcance (justificado)

- **video-mission-control**: proyecto orientado a Remotion; no constituye el backend Express/Drizzle auditado aquí.
- Comportamiento en **tiempo de ejecución** de base de datos real, sistema de archivos de uploads y redes externas (IA, OAuth, Postgres remoto): no verificables bajo la política read-only de esta revisión.

---

## 3. Inventario orientativo

| Concepto | Cantidad / nota |
| --- | --- |
| Controladores (orden de magnitud documentada en revisión) | ~23 |
| Tablas modeladas en Drizzle (orden de magnitud) | ~27 |
| Scripts en carpeta `scripts/` | ~56 |
| Archivos de test backend | 7 |

*Las cifras reflejan el inventario tomado en la revisión estática; conviene recalcularlas con búsqueda en el repo si se usa este informe como baseline formal.*

---

## 4. Prefijos y superficie HTTP/WebSocket

Inventario derivado de `server/routes.ts` y montaje de routers (resumen):

| Prefijo / ruta | Naturaleza |
| --- | --- |
| `GET /api/health` | Salud / conectividad |
| `/uploads` | Estáticos de archivos subidos |
| `/api/auth` | Autenticación, refresh, Google OAuth, perfil |
| `/api/*` | Mayoría de dominios de negocio (campañas, clientes, finanzas, agente, etc.) |
| `/api/leads` | Leads |
| `/api/poes` | POEs |
| `/api/users` | Usuarios (incl. operaciones restringidas) |
| `WS /ws` | Telemetría y eventos en tiempo real |

---

## 5. Matriz resumida de routers montados

Columnas: **Superficie** · **Prefijo** · **Auth** (sí / parcial / no) · **Endpoints (resumen)** · **Modelos / persistencia (resumen)** · **Riesgo RT** (tiempo real / exposición) · **Nivel de riesgo** · **Profundidad de revisión**

| Superficie | Prefijo | Auth | Endpoints (resumen) | Persistencia | RT | Riesgo | Revisión |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | `/api/health` | No | Healthcheck | Logger / DB check | No | Medio | Parcial (sin ejecutar) |
| uploads-static | `/uploads` | Sí (contexto app) | GET estáticos | `express.static` | No | Alto | Parcial |
| auth | `/api/auth` | Parcial | login, register, refresh, Google, me | users, refresh_tokens, audit_logs | No | Crítico | Parcial |
| campaigns | `/api` | Sí | CRUD campañas | campaigns | campaign_update | Alto | Completa |
| clients | `/api` | Sí | CRUD clientes | client_accounts | No | Alto | Completa |
| contacts | `/api` | Sí | contactos | contacts | No | Media | Completa |
| billing | `/api` | Sí | perfiles de facturación | billing_profiles | No | Alto | Completa |
| digital assets | `/api` | Sí | activos + uploads | digital_assets | No | Alto | Completa |
| client documents | `/api` | Sí | documentos | client_documents | No | Alto | Completa |
| team | `/api` | Sí | equipo y asignaciones | team, team_assignments | No | Media | Completa |
| project team | `/api` | Sí | asignación a proyectos, rendimiento | project_team_assignments, transactions | No | Alto | Completa |
| resources | `/api` | Sí | recursos | resources | No | Media | Completa |
| financial | `/api` | Sí + admin | transacciones, recurrentes, calendario, obligaciones | transactions, recurring, installments | No | Crítico | Completa |
| misc | `/api` | Sí | métricas, telemetría, analytics | system_metrics, telemetry, campaigns | No | Alto | Completa |
| projects | `/api` | Sí | proyectos, entregables, adjuntos, rentabilidad | tablas `project_*` | No | Crítico | Completa |
| agent | `/api` | Sí | chat, execute, reject, summary, health | agent, tools, audit_logs | No | Crítico | Parcial |
| agency | `/api` | Sí | roles de agencia | agency_role_catalog | No | Media | Completa |
| settings | `/api` | Sí | ajustes, API key en perfil | users.settings, api_key | No | Crítico | Completa |
| installments | `/api` | Sí + admin | generación y CRUD cuotas | installments, transactions | No | Crítico | Completa |
| services | `/api` | Sí | catálogo de servicios | service_catalog | No | Media | Completa |
| suppliers | `/api` | Sí | proveedores | suppliers | No | Media | Completa |
| leads | `/api/leads` | Sí | leads, métricas, conversión | leads, clients, projects | No | Alto | Completa |
| poes | `/api/poes` | Sí | CRUD POEs | poes | No | Media | Completa |
| users | `/api/users` | Sí + admin | avatars, listado, patch, delete | users | No | Crítico | Completa |
| audit | `/api` | Sí + admin | logs de auditoría | audit_logs | No | Alto | Completa |
| websocket | `/ws` | **No** | telemetría, métricas, campañas | escrituras a DB | Sí | Crítico | Parcial |

---

## 6. Cobertura por área

| Área | Estado en esta revisión | Notas |
| --- | --- | --- |
| Backend principal | Completa (estática) | Monolito Express + Drizzle + JWT + WebSocket |
| video-mission-control | Fuera de alcance | Remotion; no backend auditado |
| Arranque, runtime, health | Parcial | Sin ejecutar servidor |
| Rutas y prefijos | Completa | Desde `routes.ts` |
| Auth, refresh, Google OAuth | Parcial | Código revisado; sin flujo OAuth real |
| Campañas, analytics, Ads | Completa (código + migraciones) | Incluye historia `0007_remove_ads_module` y analytics internos |
| Clientes 360 | Completa | Contactos, facturación, documentos, activos |
| Equipo y asignaciones | Completa | Puente hacia finanzas donde aplica |
| Proyectos y servicios | Completa | Entregables, adjuntos, rentabilidad |
| Finanzas e installments | Completa | Transacciones, recurrentes, cuotas |
| Auditoría y logging | Completa | Controlador y helpers |
| WebSockets | Parcial | Sin conexión real |
| Migraciones y scripts | Completa (lectura) | Sin ejecutar |
| Tests backend | Completa (lectura) | Sin ejecutar suite |
| Integraciones externas | Parcial | Sin llamadas reales |
| DB real y disco de uploads | No verificable | Política read-only |

---

## 7. Hallazgos priorizados

### 7.1 Críticos

| ID | Categoría | Hallazgo | Impacto |
| --- | --- | --- | --- |
| C1 | Seguridad | `POST /api/agent/execute` sin comprobación server-side robusta de **aprobación** alineada con el flujo de negocio | Usuario autenticado podría disparar escrituras del agente sin gobernanza real |
| C2 | Atomicidad / datos | Operaciones de **recurrentes y obligaciones** con pasos separados (p. ej. creación de movimiento y actualización de plantilla) | Riesgo de estado parcial entre plantilla y movimiento |
| C3 | Atomicidad / datos | `generateInstallmentsForProject` sin transacción envolvente clara | Calendario de cuotas inconsistente o parcial ante fallos |
| C4 | Migraciones | Journal Drizzle limitado frente a **SQL adicional** y migraciones puntuales (p. ej. eliminación módulo Ads) | Drift y despliegues no reproducibles de forma uniforme |

### 7.2 Altos

| ID | Categoría | Hallazgo | Impacto |
| --- | --- | --- | --- |
| A1 | Seguridad | `apiKey` u otros secretos en **claro** en persistencia; utilidades `encrypt`/`decrypt` sin uso efectivo donde correspondería | Exposición ampliada ante fuga de DB o backup |
| A2 | Seguridad | Callback OAuth con **token** y **refreshToken** en query string | Fuga vía logs, historial del navegador o referrers |
| A3 | Seguridad | `WS /ws` **sin autenticación** alineada con el resto de API; posible persistencia de métricas **sintéticas** | Superficie abierta y datos contaminados |
| A4 | Seguridad | Registro **público** o amplio + herramientas de agente con `allowedRoles` vacío o permisivo | Superficie grande para cuentas autenticadas de bajo privilegio |
| A5 | Atomicidad | `unpay` u operaciones similares: borrado + actualización en pasos separados; filtros por mes actual | Reversión parcial o incorrecta |
| A6 | Finanzas | `addProjectService` usando precio de venta como gasto; eliminación por **description** u heurísticas frágiles | Ledger contable o analítico inconsistente |
| A7 | Archivos | Borrados en DB **sin** limpieza garantizada en disco (avatars, documentos, assets) | Archivos huérfanos y coste/riesgo de almacenamiento |
| A8 | Operación | Scripts sensibles (`reset_admin`, `brute-db`, `verify_kanban`, etc.) con `DATABASE_URL` u operaciones destructivas | Riesgo operativo accidental en entornos mal configurados |

### 7.3 Medios y bajos (consolidado)

- Inconsistencias o deuda entre **estados de campaña/analytics** y modelos de proyecto según evolución histórica del producto.
- Áreas donde la auditoría de **roles** es correcta en código superficial pero depende de convenciones en `storage` (requiere pruebas de integración).

*Los niveles “medio/bajo” no sustituyen un barrido OWASP ni pentest; esta revisión es principalmente de código.*

---

## 8. Campañas, analytics y Ads

- Existe historia de **remoción de módulo Ads** en migraciones SQL; conviene alinear documentación de producto con el esquema actual.
- **Analytics internos** y campañas deben revisarse frente a KPIs actuales del negocio para evitar métricas legacy en dashboards.

---

## 9. Scripts, migraciones y tests

| Tema | Conclusión |
| --- | --- |
| **Scripts** | Inventario amplio; varios con potencial destructivo o de diagnóstico intrusivo. Deben ejecutarse solo con runbooks y entornos acotados. |
| **Migraciones** | Riesgo de divergencia entre journal Drizzle y archivos `.sql` sueltos; se recomienda política única de migración y CI que falle ante drift. |
| **Tests** | Presencia de suite backend; en esta revisión **no se ejecutó**. Se recomienda CI con cobertura mínima en rutas financieras, auth y agente. |

---

## 10. Riesgos transversales

| Dimensión | Riesgo |
| --- | --- |
| **Seguridad** | OAuth en query, WS abierto, secretos en claro, agente sin gobernanza fuerte |
| **Finanzas** | Atomicidad débil en flujos recurrentes, cuotas y reversión |
| **Operaciones** | Scripts peligrosos, migraciones no lineales |
| **Cumplimiento / datos** | Huérfanos de archivo y posible falta de trazabilidad end-to-end en algunos flujos |

---

## 11. Limitaciones de este informe

- No sustituye **pentest**, revisión legal ni auditoría contable.
- No incluye evidencia de tráfico real, logs de producción ni métricas de APM.
- Los hallazgos están basados en **código y estructura de repo** en la fecha del informe; ramas no fusionadas pueden diferir.

---

## 12. Fases siguientes recomendadas

1. **Corto plazo**: cerrar C1–A3 con diseño acordado (OAuth sin tokens en URL, auth en WebSocket o túnel autenticado, cifrado o vault para secretos de integración).
2. **Medio plazo**: envolver operaciones financieras críticas en **transacciones de base de datos** y tests de regresión.
3. **Continuo**: unificar estrategia de **migraciones**, endurecer scripts (guards, confirmación, entorno), ampliar tests de integración en `/api/agent` y `/ws`.

---

## 13. Referencias en el repositorio

| Ruta | Uso sugerido |
| --- | --- |
| `server/routes.ts` | Mapa de montaje de routers |
| `server/storage.ts` | Persistencia y reglas de negocio centralizadas |
| `server/websocket.ts` | Comportamiento en tiempo real |
| `shared/schema.ts` | Modelo de datos |
| `migrations/` | Evolución del esquema |
| `server/tests/` | Pruebas existentes |

---

*Informe generado como documentación de auditoría estática. Para remediación y seguimiento, enlazar issues o tickets internos por hallazgo (C1, A1, …).*
