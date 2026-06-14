# Backend/DB Supabase Migration Runbook

Estado: estructura limpia aplicada en Supabase y artefactos de healthcheck limpiados con aprobacion explicita. No aplicar seeds, datos legacy ni nuevas limpiezas de datos sin aprobacion explicita.

## Alcance

- Backend y base de datos PostgreSQL/Supabase.
- Variables requeridas: `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `BASE_URL`.
- Fuera de alcance: OAuth Google, proveedor IA, UI/frontend visual y deploy.
- No imprimir secretos. Reportar solo host, puerto, base y conteos/metadatos.

## Fuente de verdad local

- Esquema de aplicacion: `shared/schema.ts`.
- Configuracion Drizzle: `drizzle.config.ts`.
- SQL versionado: `migrations/000*.sql` y journal `migrations/meta/_journal.json`.
- SQL manual/no versionado: revisar por separado antes de usar.
- Capa DB runtime: `db/index.ts`.
- DB objetivo actual: Supabase project ref `ekucmummujomjepejatl`, usando Postgres pooler `aws-1-us-east-1.pooler.supabase.com:6543`.

## Comandos seguros de preparacion

Estos comandos no deben escribir en la base de datos:

```powershell
npm.cmd run env:validate:backend
npm.cmd run db:audit:read-only
npm.cmd run db:cleanup:healthcheck-artifacts
npm.cmd run check
npm.cmd test -- --reporter=dot
npm.cmd run build
npm.cmd run predeploy:audit
npm.cmd run tokens:revoke-legacy:refresh
```

Notas:

- `db:audit:read-only` abre una transaccion `read only` y consulta catalogos/metadatos.
- `db:cleanup:healthcheck-artifacts` es dry-run por defecto; solo cuenta filas en `system_metrics` y `telemetry_data`.
- `tokens:revoke-legacy:refresh` es dry-run por defecto; solo cuenta tokens legacy y cierra su conexion dedicada al terminar.
- `predeploy:audit` puede requerir acceso a npm registry y puede fallar por red aun sin cambios de codigo.
- Los simuladores WebSocket que escriben `telemetry_data` y `system_metrics` estan deshabilitados por defecto; solo arrancan con `WEBSOCKET_SIMULATORS_ENABLED=true`.

## Comandos que requieren aprobacion explicita

Estos comandos escriben estructura, datos o estado operativo:

```powershell
npm.cmd run db:push
npm.cmd run db:migrate:financial
npm.cmd run db:migrate:legacy
npm.cmd run db:cleanup:healthcheck-artifacts -- --execute --expected-system-metrics=<count> --expected-telemetry-data=<count>
npm.cmd run tokens:revoke-legacy:refresh -- --execute
npm.cmd run dev
npm.cmd run start
```

`dev`/`start` quedan en esta lista porque hacen health/runtime real contra `DATABASE_URL`; solo deben ejecutarse despues de validar que la DB objetivo es la correcta y que `WEBSOCKET_SIMULATORS_ENABLED` no habilita escrituras no deseadas.
`verify` es read-only en el uso actual, pero requiere DB objetivo configurada porque consulta datos reales.

## Secuencia recomendada

1. Validar variables sin exponer secretos:
   `npm.cmd run env:validate:backend`
2. Confirmar endpoint Postgres alcanzable:
   preferir Session Pooler si el entorno no tiene IPv6 estable.
3. Inventariar DB objetivo:
   `npm.cmd run db:audit:read-only`
4. Si la DB no esta vacia, detenerse y comparar antes de aplicar estructura.
5. Revisar migraciones destructivas manuales antes de aplicar:
   `migrations/0007_remove_ads_module.sql` contiene `DELETE`, `UPDATE` y `DROP TABLE`.
6. Decidir modo de migracion:
   estructura limpia, estructura + seed minimo, o estructura + datos.
7. Aplicar estructura solo con backup/snapshot y aprobacion. La estructura limpia actual ya fue aplicada mediante migraciones Supabase registradas.
8. Ejecutar validaciones backend/API contra entorno aislado.
9. No arrancar `dev`/`start` con simuladores habilitados salvo que se quiera generar telemetry/metrics.

## Criterios de aceptacion

- Variables backend validas y sin secretos en logs.
- DB objetivo inventariada con evidencia read-only.
- Diferencias schema/DB revisadas: tablas faltantes, extras, RLS, grants, constraints e indices.
- No hay escritura oculta durante arranque del backend.
- `check`, tests y build pasan.
- `predeploy:audit` no bloquea por vulnerabilidades high/critical.
- `verify` y healthcheck se ejecutan solo contra DB objetivo aprobada.

## Bloqueos conocidos

- La URL directa `db.ekucmummujomjepejatl.supabase.co:5432` puede depender de IPv6; en este entorno se usa pooler Postgres.
- Supabase advisors reportan RLS habilitado sin politicas en las tablas publicas. Esto bloquea acceso via Data API sin politicas, pero el backend usa Postgres directo.
- Supabase advisors reportan foreign keys sin indices de cobertura; requiere fase explicita de indices.
- Healthcheck HTTP validado en modo acotado con simuladores deshabilitados: `/api/health` respondio 200, `database=up` y `websocket.status=up`.
- Los artefactos de prueba generados por el arranque previo de simuladores fueron limpiados con aprobacion explicita: `system_metrics=18`, `telemetry_data=37`, total `55`; conteo posterior `0`.
- Cualquier limpieza futura debe ejecutarse solo con conteos esperados explicitos para evitar borrar filas nuevas si la DB cambio entre el dry-run y el execute.
