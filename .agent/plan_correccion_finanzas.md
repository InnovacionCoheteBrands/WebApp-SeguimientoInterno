# Plan de Corrección - Módulo Finanzas
**Fecha:** 2025-12-01  
**Objetivo:** Arreglar errores críticos sin causar nuevos problemas

---

## 🎯 Estrategia General

**Principio:** Cambios incrementales, validables y reversibles

### Fases de Ejecución:
1. **Backend Critical Fixes** (Sin cambios de BD)
2. **Schema Updates** (Cambios de estructura compatibles)
3. **Frontend Modernization** (Usar campos nuevos)
4. **Data Migration** (Scripts de conversión)
5. **Cleanup Final** (Eliminar deprecated)

---

## 📋 FASE 1: Backend Critical Fixes (PRIORIDAD MÁXIMA)

### Objetivo: Arreglar función rota sin tocar la BD

### 1.1 ✅ Arreglar `executeRecurringTransaction`
**Archivo:** `server/storage.ts` (líneas 918-943)

**Problema:**
```typescript
// ❌ CÓDIGO ROTO
status: recurring.status,  // NO EXISTE
relatedClient: recurring.relatedClient || undefined,  // NO EXISTE
```

**Solución:**
```typescript
// ✅ CÓDIGO CORRECTO (copiar lógica de markObligationAsPaid)
async executeRecurringTransaction(id: number): Promise<Transaction> {
  const recurring = await this.getRecurringTransactionById(id);
  if (!recurring) throw new Error("Recurring transaction not found");

  const transaction = await this.createTransaction({
    type: recurring.type,
    category: recurring.category,
    amount: recurring.amount,
    date: new Date(),
    isPaid: true,  // ✅ Nuevo campo
    paidDate: new Date(),  // ✅ Nuevo campo
    clientId: recurring.clientId || undefined,  // ✅ Usa clientId si existe
    isRecurringInstance: true,  // ✅ Marca como recurrente
    recurringTemplateId: id,  // ✅ Link a template
    source: 'recurring_template',  // ✅ Origen
    sourceId: id,  // ✅ ID de origen
    status: 'Pagado',  // ⚠️ Backward compatibility
    description: recurring.description || undefined,
    relatedClient: null,  // ⚠️ Explícitamente null
  });

  const nextDate = this.calculateNextExecutionDate(
    recurring.frequency,
    recurring.dayOfMonth,
    recurring.dayOfWeek
  );

  await this.updateRecurringTransaction(id, {
    lastExecutionDate: new Date(),
    nextExecutionDate: nextDate,
  });

  return transaction;
}
```

**Validación:**
- ✅ No rompe tipos TypeScript
- ✅ Compatible con schema actual
- ✅ No requiere cambios de BD

---

## 📋 FASE 2: Schema Updates (Compatibilidad)

### Objetivo: Hacer campos legacy opcionales

### 2.1 ✅ Actualizar Schema
**Archivo:** `shared/schema.ts` (línea 345)

**Cambio:**
```typescript
// ❌ ANTES
status: text("status").notNull().default("Pendiente"),

// ✅ DESPUÉS
status: text("status").default("Pendiente"),  // Ahora nullable
```

**Validación:**
- ✅ No rompe datos existentes (ya tienen valor)
- ✅ Permite nuevas transacciones sin status
- ✅ Compatibilidad backward con código legacy

### 2.2 ✅ Actualizar Zod Schemas
**Archivo:** `shared/schema.ts` (líneas 353-359)

**Agregar validación condicional:**
```typescript
export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      // Si isPaid es true, paidDate debe existir
      if (data.isPaid && !data.paidDate) return false;
      return true;
    },
    { message: "paidDate is required when isPaid is true" }
  );
```

---

## 📋 FASE 3: Frontend Modernization

### Objetivo: Usar campos nuevos en la UI

### 3.1 ✅ Actualizar Estado de Formulario
**Archivo:** `client/src/pages/finanzas.tsx` (líneas 93-101)

**Cambio:**
```typescript
// ❌ ANTES
const [newTransaction, setNewTransaction] = useState<InsertTransaction>({
  type: "Ingreso",
  category: "",
  amount: "0",
  date: new Date(),
  status: "Pagado",  // ❌ Deprecado
  description: "",
  relatedClient: "",  // ❌ Deprecado
});

// ✅ DESPUÉS
const [newTransaction, setNewTransaction] = useState<InsertTransaction>({
  type: "Ingreso",
  category: "",
  amount: "0",
  date: new Date(),
  isPaid: true,  // ✅ Nuevo campo
  paidDate: new Date(),  // ✅ Nuevo campo
  description: "",
  clientId: undefined,  // ✅ Nuevo campo (FK a cliente)
  status: "Pagado",  // ⚠️ Temporal backward compat
});
```

### 3.2 ✅ Actualizar Formulario de Creación
**Archivo:** `client/src/pages/finanzas.tsx` (líneas 682-790)

**Cambios:**
1. **Reemplazar Select de "Estado" con Checkbox:**
```tsx
// ❌ ELIMINAR (líneas 756-770)
<div className="space-y-2">
  <Label className="text-xs font-mono uppercase">Estado</Label>
  <Select value={newTransaction.status} ...>
    <SelectItem value="Pagado">Pagado</SelectItem>
    <SelectItem value="Pendiente">Pendiente</SelectItem>
  </Select>
</div>

// ✅ AGREGAR
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="isPaid"
      checked={newTransaction.isPaid || false}
      onCheckedChange={(checked) =>
        setNewTransaction({
          ...newTransaction,
          isPaid: !!checked,
          paidDate: checked ? new Date() : undefined,
          status: checked ? "Pagado" : "Pendiente",  // Sync legacy
        })
      }
    />
    <Label htmlFor="isPaid" className="text-sm font-medium">
      Marcar como Pagado/Cobrado
    </Label>
  </div>
</div>
```

2. **Agregar Campo Fecha de Pago (Condicional):**
```tsx
{newTransaction.isPaid && (
  <div className="space-y-2">
    <Label className="text-xs font-mono uppercase">Fecha de Pago</Label>
    <Input
      type="date"
      value={newTransaction.paidDate
        ? format(new Date(newTransaction.paidDate), "yyyy-MM-dd")
        : ""
      }
      onChange={(e) => {
        const dateValue = e.target.value;
        if (dateValue) {
          const newDate = new Date(dateValue + 'T12:00:00');
          if (!isNaN(newDate.getTime())) {
            setNewTransaction({ ...newTransaction, paidDate: newDate });
          }
        }
      }}
      className="rounded-sm border-border bg-background h-11"
    />
  </div>
)}
```

3. **FUTURO: Selector de Cliente (Fase 4)**
```tsx
// TODO: Implementar selector de cliente con clientId
// Por ahora, mantener campo de texto para no romper
```

### 3.3 ✅ Actualizar Handler de Creación
**Archivo:** `client/src/pages/finanzas.tsx` (líneas 219-248)

**Cambio:**
```typescript
const handleCreateTransaction = useCallback(() => {
  if (!newTransaction.category || !newTransaction.amount) {
    toast({ title: "Error", description: "Categoría y monto requeridos", variant: "destructive" });
    return;
  }

  const amountNum = parseFloat(newTransaction.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    toast({ title: "Error", description: "Monto inválido", variant: "destructive" });
    return;
  }

  // ✅ Validar isPaid + paidDate
  if (newTransaction.isPaid && !newTransaction.paidDate) {
    toast({ title: "Error", description: "Fecha de pago requerida", variant: "destructive" });
    return;
  }

  const transactionData: InsertTransaction = {
    ...newTransaction,
    description: newTransaction.description?.trim() || null,
    // ⚠️ Mantener relatedClient por ahora (backward compat)
    relatedClient: newTransaction.relatedClient?.trim() || null,
    // ✅ Sincronizar status con isPaid (temporal)
    status: newTransaction.isPaid ? "Pagado" : "Pendiente",
  };

  createMutation.mutate(transactionData);
}, [newTransaction, createMutation, toast]);
```

### 3.4 ✅ Actualizar Tabla de Transacciones
**Archivo:** `client/src/pages/finanzas.tsx` (líneas 593-667)

**Cambios:**
1. Agregar columna "Fecha de Pago"
2. Mostrar badge si `isRecurringInstance === true`
3. Actualizar lógica de colores basado en `isPaid`

---

## 📋 FASE 4: Data Migration

### Objetivo: Migrar datos legacy a campos nuevos

### 4.1 ✅ Script de Migración SQL
**Nuevo archivo:** `server/migrate-legacy-data.ts`

```typescript
import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function migrateLegacyData() {
  console.log('🔄 Migrando datos legacy...');

  // 1. Sincronizar status → isPaid (por si acaso)
  await db.execute(sql`
    UPDATE transactions 
    SET 
      is_paid = true,
      paid_date = COALESCE(paid_date, date)
    WHERE status = 'Pagado' AND is_paid = false
  `);

  await db.execute(sql`
    UPDATE transactions 
    SET is_paid = false
    WHERE status = 'Pendiente' AND is_paid = true
  `);

  // 2. Intentar vincular relatedClient → clientId
  const result = await db.execute(sql`
    UPDATE transactions t
    SET client_id = c.id
    FROM client_accounts c
    WHERE 
      t.related_client IS NOT NULL 
      AND t.client_id IS NULL
      AND LOWER(TRIM(t.related_client)) = LOWER(TRIM(c.company_name))
  `);

  console.log(`✅ ${result.rowCount || 0} registros vinculados a clientes`);

  // 3. Reportar registros sin match
  const unmatchedResult = await db.execute(sql`
    SELECT DISTINCT related_client 
    FROM transactions 
    WHERE 
      related_client IS NOT NULL 
      AND client_id IS NULL
      AND TRIM(related_client) != ''
  `);

  if (unmatchedResult.rows.length > 0) {
    console.warn('⚠️  Clientes sin match:');
    unmatchedResult.rows.forEach((row: any) => {
      console.warn(`   - ${row.related_client}`);
    });
  }

  console.log('✅ Migración completada');
}

migrateLegacyData().then(() => process.exit(0));
```

### 4.2 ✅ Ejecutar Migración
```bash
tsx server/migrate-legacy-data.ts
```

---

## 📋 FASE 5: Cleanup Final (ÚLTIMO PASO)

### Objetivo: Eliminar campos deprecados

### 5.1 ⚠️ Solo después de validar Fases 1-4

**Eliminar de Schema:**
```typescript
// Eliminar estas líneas de shared/schema.ts
status: text("status").default("Pendiente"),
relatedClient: text("related_client"),
```

**Crear migración SQL:**
```sql
ALTER TABLE transactions DROP COLUMN IF EXISTS status;
ALTER TABLE transactions DROP COLUMN IF EXISTS related_client;
```

**Limpiar Frontend:**
- Eliminar todos los usos de `status` y `relatedClient`
- Eliminar sincronización temporal

---

## ✅ Orden de Ejecución

### Día 1: Backend (Sin riesgo)
1. ✅ Arreglar `executeRecurringTransaction`
2. ✅ Hacer `status` opcional en schema
3. ✅ Actualizar validación Zod
4. ✅ **VALIDAR:** Compilar sin errores TypeScript
5. ✅ **VALIDAR:** Probar endpoint de transacciones

### Día 2: Frontend (Incremental)
6. ✅ Actualizar estado del formulario
7. ✅ Cambiar Select "Estado" → Checkbox "isPaid"
8. ✅ Agregar campo "paidDate" condicional
9. ✅ Actualizar handler de creación
10. ✅ **VALIDAR:** Crear transacción manual funciona
11. ✅ **VALIDAR:** Obligaciones del mes funcionan

### Día 3: Migración (Con backup)
12. ✅ **BACKUP DE BD**
13. ✅ Ejecutar script de migración de datos
14. ✅ Validar vinculación de clientes
15. ✅ **VALIDAR:** Datos históricos correctos

### Día 4: Cleanup (Solo si todo OK)
16. ✅ Eliminar campos deprecados del schema
17. ✅ Ejecutar migración SQL final
18. ✅ Limpiar código frontend
19. ✅ **VALIDAR:** Todo funciona sin campos legacy

---

## 🛡️ Validaciones en Cada Paso

### Pre-deployment:
- ✅ Compilación TypeScript sin errores
- ✅ Ningún test roto
- ✅ Lint pass

### Post-deployment:
- ✅ Crear transacción manual
- ✅ Editar transacción existente
- ✅ Ejecutar obligación del mes
- ✅ Ver resumen financiero
- ✅ Filtros funcionan

---

## 🔄 Rollback Plan

Si algo falla en Fase 3 o 4:
1. Revertir commits con `git revert`
2. La BD sigue funcionando (campos legacy presentes)
3. Frontend legacy sigue funcionando

**Punto de No Retorno:** Fase 5 (eliminar columnas)
- Solo ejecutar si Fases 1-4 validadas 100%

---

## 📊 Progreso

- [ ] Fase 1: Backend Fixes
- [ ] Fase 2: Schema Updates
- [ ] Fase 3: Frontend Modernization
- [ ] Fase 4: Data Migration
- [ ] Fase 5: Cleanup Final

---

**Documento generado:** 2025-12-01
