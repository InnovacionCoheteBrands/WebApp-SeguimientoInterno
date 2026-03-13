# Cohete Brands - GuÃ­a de Deployment en VPS

Esta guÃ­a proporciona instrucciones completas para desplegar la plataforma Cohete Brands Marketing Operations en un VPS (Virtual Private Server) estÃ¡ndar.

## Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [PreparaciÃ³n del VPS](#preparaciÃ³n-del-vps)
3. [InstalaciÃ³n de Dependencias](#instalaciÃ³n-de-dependencias)
4. [ConfiguraciÃ³n de la Base de Datos](#configuraciÃ³n-de-la-base-de-datos)
5. [ConfiguraciÃ³n de la AplicaciÃ³n](#configuraciÃ³n-de-la-aplicaciÃ³n)
6. [Build y Deployment](#build-y-deployment)
7. [GestiÃ³n de Procesos con PM2](#gestiÃ³n-de-procesos-con-pm2)
8. [ConfiguraciÃ³n de Nginx](#configuraciÃ³n-de-nginx)
9. [SSL/HTTPS con Let's Encrypt](#sslhttps-con-lets-encrypt)
10. [Deployment con Docker (Opcional)](#deployment-con-docker-opcional)
11. [Monitoreo y Logs](#monitoreo-y-logs)
12. [Mantenimiento](#mantenimiento)
13. [Troubleshooting](#troubleshooting)

---

## Requisitos del Sistema

### Hardware MÃ­nimo
- **CPU**: 2 cores
- **RAM**: 2 GB (4 GB recomendado)
- **Almacenamiento**: 20 GB SSD
- **Ancho de banda**: 100 Mbps

### Software
- **Sistema Operativo**: Ubuntu 22.04 LTS o Debian 11+ (recomendado)
- **Node.js**: v20.x LTS
- **PostgreSQL**: v16+ (puede usar Supabase hosted)
- **Nginx**: v1.24+
- **PM2**: Latest version
- **Git**: v2.x

---

## PreparaciÃ³n del VPS

### 1. Conectarse al VPS

```bash
ssh root@tu-servidor-ip
```

### 2. Actualizar el Sistema

```bash
apt update && apt upgrade -y
```

### 3. Crear Usuario No-Root (Seguridad)

```bash
adduser cohete
usermod -aG sudo cohete
```

### 4. Configurar Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 5. Cambiar a Usuario No-Root

```bash
su - cohete
```

---

## InstalaciÃ³n de Dependencias

### 1. Instalar Node.js v20

```bash
# Usar NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalaciÃ³n
node --version  # Debe mostrar v20.x.x
npm --version
```

### 2. Instalar PM2 Globalmente

```bash
sudo npm install -g pm2
pm2 --version
```

### 3. Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl status nginx
```

### 4. Instalar Git

```bash
sudo apt install -y git
git --version
```

---

## ConfiguraciÃ³n de la Base de Datos

### OpciÃ³n A: Usar Supabase (Recomendado)

La aplicaciÃ³n ya estÃ¡ configurada para usar Supabase. Solo necesitas:

1. Mantener tu DATABASE_URL de Supabase en el archivo `.env`
2. No requiere instalaciÃ³n local de PostgreSQL

### OpciÃ³n B: PostgreSQL Local

Si prefieres instalar PostgreSQL localmente:

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql
CREATE DATABASE cohete_brands;
CREATE USER cohete WITH ENCRYPTED PASSWORD 'tu-password-segura';
GRANT ALL PRIVILEGES ON DATABASE cohete_brands TO cohete;
\q
```

---

## ConfiguraciÃ³n de la AplicaciÃ³n

### 1. Clonar el Repositorio

```bash
cd ~
git clone https://github.com/tu-usuario/tu-repositorio.git cohete-brands
cd cohete-brands
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias necesarias para el build
npm ci
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el template
cp .env.example .env

# Editar con tus valores
nano .env
```

**Ejemplo de `.env` para producciÃ³n**:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:tu-password@db.rdhpjmjfdrpyirnuxdrm.supabase.co:5432/postgres"

# Server Configuration
PORT=5000
HOST=0.0.0.0
BASE_URL="https://tu-dominio.com"
NODE_ENV=production
LOG_LEVEL=info

# Session Secret (generar con: openssl rand -base64 32)
SESSION_SECRET="tu-clave-secreta-generada-aleatoriamente"

# JWT (obligatorio para autenticacion)
JWT_SECRET="tu-jwt-secret-de-minimo-32-caracteres"

# Cifrado de API keys (obligatorio en produccion)
ENCRYPTION_KEY="tu-clave-hex-de-64-caracteres"

# AI Integration (Opcional)
AI_INTEGRATIONS_OPENAI_API_KEY="sk-..."
AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Push del Schema de Base de Datos

```bash
npm run db:push
```

### 5. Build de la AplicaciÃ³n

```bash
# Build de produccion
npm run build

# Opcional: remover devDependencies despues del build
npm prune --omit=dev
```

---

## Build y Deployment

### Verificar Build Local

```bash
# Build
npm run build

# Test en modo producciÃ³n
npm run start

# La aplicaciÃ³n deberÃ­a estar corriendo en http://localhost:5000
# Presiona Ctrl+C para detener
```

---

## GestiÃ³n de Procesos con PM2

PM2 mantiene tu aplicaciÃ³n corriendo, reinicia automÃ¡ticamente en caso de crashes, y gestiona logs.

### 1. Crear Directorio de Logs

```bash
mkdir -p ~/cohete-brands/logs
```

### 2. Iniciar con PM2

```bash
cd ~/cohete-brands
npm run pm2:start
```

### 3. Comandos Ãštiles de PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs cohete-brands

# Reiniciar aplicaciÃ³n
pm2 restart cohete-brands

# Detener aplicaciÃ³n
pm2 stop cohete-brands

# Ver mÃ©tricas
pm2 monit

# Guardar configuraciÃ³n para auto-inicio
pm2 save

# Configurar auto-inicio al reiniciar el servidor
pm2 startup
# Ejecutar el comando que PM2 te muestra
```

### 4. Verificar que la AplicaciÃ³n EstÃ¡ Corriendo

```bash
curl http://localhost:5000
# DeberÃ­a devolver el HTML de tu aplicaciÃ³n
```

---

## ConfiguraciÃ³n de Nginx

Nginx actÃºa como reverse proxy, maneja SSL, y mejora el rendimiento.

### 1. Crear ConfiguraciÃ³n de Nginx

```bash
sudo nano /etc/nginx/sites-available/cohete-brands
```

**Copiar la configuraciÃ³n de `nginx.conf.example`** (archivo incluido en el proyecto).

### 2. Actualizar Valores

Reemplaza `your-domain.com` con tu dominio real:

```nginx
server_name tu-dominio.com www.tu-dominio.com;
```

### 3. Habilitar el Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/cohete-brands /etc/nginx/sites-enabled/

# Remover el sitio default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuraciÃ³n
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Verificar Acceso HTTP

Visita `http://tu-dominio.com` en tu navegador. DeberÃ­as ver la aplicaciÃ³n.

---

## SSL/HTTPS con Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtener Certificado SSL

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones:
- Proporciona tu email
- Acepta los tÃ©rminos
- Elige si deseas compartir tu email con EFF
- Certbot automÃ¡ticamente configurarÃ¡ Nginx para HTTPS

### 3. Verificar Auto-RenovaciÃ³n

```bash
sudo certbot renew --dry-run
```

Los certificados se renuevan automÃ¡ticamente antes de expirar.

### 4. Verificar HTTPS

Visita `https://tu-dominio.com` - deberÃ­as ver el candado verde de seguridad.

---

## Deployment con Docker (Opcional)

Si prefieres usar Docker para deployment:

### 1. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install -y docker-compose

# Logout y login nuevamente para aplicar cambios de grupo
```

### 2. Build de la Imagen

```bash
cd ~/cohete-brands
docker build -t cohete-brands:latest .
```

### 3. Run con Docker Compose

```bash
# Editar docker-compose.yml con tus variables de entorno
nano docker-compose.yml

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### 4. Configurar Nginx para Docker

Si usas Docker, actualiza el `proxy_pass` en Nginx:

```nginx
proxy_pass http://localhost:5000;  # Puerto mapeado en docker-compose.yml
```

---

## Monitoreo y Logs

### Logs de la AplicaciÃ³n (PM2)

```bash
# Ver logs en tiempo real
pm2 logs cohete-brands

# Ver solo errores
pm2 logs cohete-brands --err

# Limpiar logs antiguos
pm2 flush
```

### Logs de Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/cohete-brands-access.log

# Error logs
sudo tail -f /var/log/nginx/cohete-brands-error.log
```

### Monitoreo de Recursos

```bash
# Monitoreo con PM2
pm2 monit

# Uso de CPU y Memoria
htop

# Espacio en disco
df -h
```

---

## Mantenimiento

### Actualizar la AplicaciÃ³n

```bash
cd ~/cohete-brands

# Detener aplicaciÃ³n
pm2 stop cohete-brands

# Pull Ãºltimos cambios
git pull origin main

# Reinstalar dependencias si hay cambios en package.json
npm ci

# Rebuild
npm run build

# Opcional: podar dependencias de desarrollo si haces build en el VPS
npm prune --omit=dev

# Push cambios de schema si es necesario
npm run db:push

# Reiniciar aplicaciÃ³n
pm2 restart cohete-brands
```

### Backup de Base de Datos

Para Supabase, usar el dashboard de Supabase.

Para PostgreSQL local:

```bash
# Backup
pg_dump -U cohete cohete_brands > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U cohete cohete_brands < backup_20241124.sql
```

### RotaciÃ³n de Logs

PM2 incluye rotaciÃ³n de logs por defecto. Para Nginx:

```bash
sudo nano /etc/logrotate.d/nginx
# Ya deberÃ­a estar configurado automÃ¡ticamente
```

---

## Troubleshooting

### La aplicaciÃ³n no inicia

```bash
# Verificar logs
pm2 logs cohete-brands --err

# Verificar variables de entorno
cat .env

# Verificar puerto en uso
sudo lsof -i :5000

# Verificar conexiÃ³n a base de datos
npm run db:push
```

### Error 502 Bad Gateway en Nginx

```bash
# Verificar que la aplicaciÃ³n estÃ© corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/cohete-brands-error.log

# Verificar configuraciÃ³n de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### ConexiÃ³n a Base de Datos Falla

```bash
# Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL

# Test de conexiÃ³n
psql "$DATABASE_URL"

# Verificar firewall de Supabase (permitir IP del VPS)
```

### AplicaciÃ³n Lenta o Crashea

```bash
# Verificar memoria disponible
free -h

# Verificar uso de CPU
top

# Aumentar lÃ­mite de memoria de PM2 (en ecosystem.config.cjs)
max_memory_restart: '1G'  # Cambiar de 500M a 1G

# Reiniciar
pm2 restart cohete-brands
```

### SSL no funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Verificar configuraciÃ³n de Nginx
sudo nginx -t

# Verificar que los puertos 80 y 443 estÃ©n abiertos
sudo ufw status
```

---

## Recursos Adicionales

- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Supabase Documentation**: https://supabase.com/docs
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

## Soporte

Para problemas especÃ­ficos de la aplicaciÃ³n, consulta:
- Logs de la aplicaciÃ³n: `pm2 logs cohete-brands`
- Logs de Nginx: `/var/log/nginx/cohete-brands-error.log`
- Variables de entorno: `.env`

**Â¡Tu aplicaciÃ³n ahora estÃ¡ lista para producciÃ³n en VPS!** ðŸš€
