# 🚀 Guía de Configuración de Supabase

## Paso 1: Crear cuenta y proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project" y crea una cuenta (gratis)
3. Crea un nuevo proyecto:
   - **Name**: Cohete Brands Marketing
   - **Database Password**: Guarda esta contraseña (la necesitarás)
   - **Region**: Elige el más cercano (por ejemplo: East US)
4. Espera 1-2 minutos mientras Supabase crea tu base de datos

## Paso 2: Obtener la Connection String

1. En el dashboard de Supabase, ve a **Project Settings** (⚙️ en la barra lateral)
2. Selecciona **Database** en el menú lateral
3. Busca la sección **Connection string**
4. Selecciona el modo **Session** (no Transaction)
5. Copia el string completo que se ve así:
   ```
   postgresql://postgres.[proyecto-id]:[tu-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **IMPORTANTE**: Reemplaza `[tu-password]` con la contraseña que creaste en el Paso 1

## Paso 3: Configurar el .env

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza la línea `DATABASE_URL` con tu connection string de Supabase
3. Ejemplo:
   ```
   DATABASE_URL="postgresql://postgres.abcdefgh:MiPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

## Paso 4: Crear las tablas en Supabase

Ejecuta este comando para crear todas las tablas automáticamente:

```powershell
npm run db:push
```

Este comando creará las tablas:
- `campaigns` (campañas de marketing)
- `client_accounts` (cuentas de clientes)
- `team` (equipo de la agencia)
- `resources` (recursos y entregables)
- `system_metrics`
- `telemetry_data`
- `users`

## Paso 5: Iniciar el servidor

```powershell
npm run dev
```

El servidor debería iniciar en **http://localhost:5000**

## ✅ Verificación

Si todo funcionó correctamente:
1. El servidor inicia sin errores
2. Puedes abrir http://localhost:5000 en tu navegador
3. Ves el dashboard de Cohete Brands
4. En Supabase > Table Editor, verás todas las tablas creadas

## 🆘 Problemas Comunes

**Error: "password authentication failed"**
- Verifica que reemplazaste `[tu-password]` con tu contraseña real
- Asegúrate de no tener espacios extras en el .env

**Error: "database does not exist"**
- Verifica que estés usando el connection string de **Session mode**, no Transaction mode

**Error: "could not connect to server"**
- Verifica tu conexión a internet
- Asegúrate de haber copiado el connection string completo
