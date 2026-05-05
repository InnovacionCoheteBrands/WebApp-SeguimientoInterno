-- Backup previo a retiro de módulo Ads
-- Ejecutar manualmente ANTES de 0007_remove_ads_module.sql

-- Opcional: definir ruta de salida según tu servidor/entorno
-- Ejemplo local: \copy (SELECT * FROM ad_platforms) TO './backup_ad_platforms.csv' CSV HEADER
-- Si usas psql remoto, usar \copy desde cliente.

-- Validaciones rápidas previas
SELECT COUNT(*) AS ad_platforms_count FROM ad_platforms;
SELECT COUNT(*) AS ad_creatives_count FROM ad_creatives;
SELECT COUNT(*) AS ad_metrics_count FROM ad_metrics;
SELECT COUNT(*) AS platform_connections_count FROM platform_connections;
SELECT COUNT(*) AS account_mappings_count FROM account_mappings;
SELECT COUNT(*) AS client_kpi_config_count FROM client_kpi_config;
SELECT COUNT(*) AS ad_metric_transactions_count FROM transactions WHERE source = 'ad_metric';
SELECT COUNT(*) AS ads_projects_count FROM projects WHERE service_type = 'Ads';

-- Respaldos lógicos (tablas completas Ads)
CREATE TABLE IF NOT EXISTS backup_ad_platforms AS SELECT * FROM ad_platforms;
CREATE TABLE IF NOT EXISTS backup_ad_creatives AS SELECT * FROM ad_creatives;
CREATE TABLE IF NOT EXISTS backup_ad_metrics AS SELECT * FROM ad_metrics;
CREATE TABLE IF NOT EXISTS backup_platform_connections AS SELECT * FROM platform_connections;
CREATE TABLE IF NOT EXISTS backup_account_mappings AS SELECT * FROM account_mappings;
CREATE TABLE IF NOT EXISTS backup_client_kpi_config AS SELECT * FROM client_kpi_config;

-- Respaldos de datos transversales afectados
CREATE TABLE IF NOT EXISTS backup_transactions_ad_metric AS
SELECT * FROM transactions WHERE source = 'ad_metric';

CREATE TABLE IF NOT EXISTS backup_projects_ads AS
SELECT * FROM projects WHERE service_type = 'Ads';
