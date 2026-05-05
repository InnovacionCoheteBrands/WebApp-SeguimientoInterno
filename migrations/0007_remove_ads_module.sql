-- Mission Control: retiro del modulo Ads en bases existentes.
-- Ejecutar en una ventana de mantenimiento; hacer backup antes.
-- Pasos: limpiar transacciones ligadas a metricas de pauta, normalizar proyectos tipo Ads, DROP de tablas Ads.
-- Idempotencia parcial: DROP IF EXISTS; los DELETE/UPDATE pueden repetirse con efecto nulo si ya se aplicaron.

BEGIN;

-- 1) Limpiar movimientos financieros históricos creados por Ads
DELETE FROM transactions WHERE source = 'ad_metric';

-- 2) Normalizar proyectos con servicio Ads a General
UPDATE projects
SET service_type = 'General',
    service_specific_fields = NULL,
    updated_at = NOW()
WHERE service_type = 'Ads';

-- 3) Eliminar tablas del módulo Ads
DROP TABLE IF EXISTS account_mappings;
DROP TABLE IF EXISTS platform_connections;
DROP TABLE IF EXISTS ad_metrics;
DROP TABLE IF EXISTS ad_creatives;
DROP TABLE IF EXISTS client_kpi_config;
DROP TABLE IF EXISTS ad_platforms;

COMMIT;
