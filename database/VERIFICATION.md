# ✅ Verificación de Base de Datos

Este documento te ayuda a verificar que la estructura de la base de datos esté correctamente configurada.

## 🔍 Verificación Rápida

### Paso 1: Verificar Tablas Creadas

Ejecuta este query en Supabase SQL Editor o tu cliente PostgreSQL:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Deberías ver estas tablas:**
- `couples`
- `credits`
- `deductions`
- `expenses`
- `incoming_loans` ⭐
- `loans`
- `monthly_data`
- `other_deductions`
- `savings`
- `users`

### Paso 2: Verificar Columnas de Tablas Importantes

#### Tabla: expenses
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
```

**Columnas esperadas:**
- `id` (uuid)
- `monthly_data_id` (uuid)
- `name` (varchar)
- `amount` (numeric)
- `quincena` (varchar) - '1', '2', o 'both'
- `shared` (boolean)
- `split_type` (varchar)
- `split_percentage_p1` (numeric)
- `split_amount_p1` (numeric)
- `owner` (varchar)
- `is_recurring` (boolean) ⭐ NUEVO
- `category_preset` (varchar) ⭐ NUEVO
- `created_at` (timestamp)

#### Tabla: credits
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'credits'
ORDER BY ordinal_position;
```

**Columnas esperadas:**
- `id` (uuid)
- `monthly_data_id` (uuid)
- `name` (varchar)
- `credit_limit` (numeric)
- `current_balance` (numeric)
- `payment_date` (integer)
- `minimum_payment` (numeric)
- `owner` (varchar)
- `has_zero_interest` (boolean) ⭐ NUEVO
- `total_installments` (integer) ⭐ NUEVO
- `installments_paid` (integer) ⭐ NUEVO
- `installment_amount` (numeric) ⭐ NUEVO
- `created_at` (timestamp)

#### Tabla: incoming_loans ⭐ TABLA NUEVA
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'incoming_loans'
ORDER BY ordinal_position;
```

**Columnas esperadas:**
- `id` (uuid)
- `monthly_data_id` (uuid)
- `name` (varchar) - Quién te debe
- `total_amount` (numeric)
- `amount_received` (numeric)
- `installment_amount` (numeric)
- `total_installments` (integer)
- `installments_received` (integer)
- `date_lent` (date)
- `expected_return` (date)
- `owner` (varchar)
- `is_in_installments` (boolean)
- `created_at` (timestamp)

### Paso 3: Verificar Índices

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Índices importantes:**
- `idx_expenses_monthly` - Optimiza búsquedas de gastos por mes
- `idx_expenses_recurring` - Optimiza búsqueda de gastos recurrentes
- `idx_credits_zero_interest` - Optimiza búsqueda de tarjetas con tasa cero
- `idx_incoming_loans_monthly` - Optimiza búsqueda de préstamos hacia ti
- `idx_monthly_data_couple_year_month` - Optimiza búsqueda de datos mensuales

### Paso 4: Verificar Funciones SQL

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Funciones esperadas:**
- `get_monthly_data_complete` - Obtiene todos los datos de un mes
- `copy_recurring_expenses` - Copia gastos recurrentes al siguiente mes
- `update_updated_at_column` - Trigger para actualizar timestamps

### Paso 5: Verificar Triggers

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**Triggers esperados:**
- `update_users_updated_at`
- `update_couples_updated_at`
- `update_monthly_data_updated_at`

## 🧪 Pruebas Funcionales

### Prueba 1: Insertar Datos de Ejemplo

```sql
-- 1. Crear un usuario de prueba
INSERT INTO users (email, password_hash, full_name)
VALUES ('test@example.com', 'hash_test', 'Usuario Test')
RETURNING id;
-- Guarda el ID que retorna

-- 2. Crear una pareja (usa el ID del paso anterior)
INSERT INTO couples (person1_user_id, person2_user_id)
VALUES (
  'tu-user-id-aqui',
  'tu-user-id-aqui'  -- Mismo usuario para prueba
)
RETURNING id;
-- Guarda el ID de la pareja

-- 3. Crear datos mensuales
INSERT INTO monthly_data (
  couple_id, year, month,
  person1_name, person1_gross_salary,
  person2_name, person2_gross_salary
)
VALUES (
  'tu-couple-id-aqui',
  2024, 4,  -- Mayo 2024
  'Persona 1', 1000000,
  'Persona 2', 800000
)
RETURNING id;
-- Guarda el ID de monthly_data

-- 4. Insertar un gasto recurrente
INSERT INTO expenses (
  monthly_data_id, name, amount, quincena,
  shared, is_recurring, category_preset
)
VALUES (
  'tu-monthly-data-id',
  'Gasolina',
  50000,
  'both',
  false,
  true,  -- Es recurrente
  'Gasolina'
);

-- 5. Insertar una tarjeta con tasa cero
INSERT INTO credits (
  monthly_data_id, name, credit_limit, current_balance,
  payment_date, minimum_payment, owner,
  has_zero_interest, total_installments,
  installments_paid, installment_amount
)
VALUES (
  'tu-monthly-data-id',
  'BAC Visa',
  500000,
  120000,
  15,
  30000,
  'person1',
  true,  -- Tiene tasa cero
  12,    -- 12 cuotas
  3,     -- 3 pagadas
  10000  -- ₡10,000 por cuota
);

-- 6. Insertar un préstamo hacia ti
INSERT INTO incoming_loans (
  monthly_data_id, name, total_amount, amount_received,
  date_lent, owner, is_in_installments,
  total_installments, installments_received, installment_amount
)
VALUES (
  'tu-monthly-data-id',
  'Juan Pérez',
  200000,  -- Total prestado
  100000,  -- Ya recibido
  '2024-01-15',
  'person1',
  true,    -- Pago en cuotas
  10,      -- 10 cuotas
  5,       -- 5 recibidas
  20000    -- ₡20,000 por cuota
);
```

### Prueba 2: Verificar la Función de Datos Completos

```sql
SELECT get_monthly_data_complete(
  'tu-couple-id',
  2024,
  4  -- Mayo
);
```

**Deberías recibir un JSON con:**
- monthlyData
- deductions
- otherDeductions
- expenses
- savings
- loans
- incomingLoans ⭐
- credits

### Prueba 3: Copiar Gastos Recurrentes

```sql
-- Primero crea un mes nuevo
INSERT INTO monthly_data (
  couple_id, year, month,
  person1_name, person1_gross_salary,
  person2_name, person2_gross_salary
)
VALUES (
  'tu-couple-id',
  2024, 5,  -- Junio 2024
  'Persona 1', 1000000,
  'Persona 2', 800000
)
RETURNING id;

-- Luego copia los gastos recurrentes
SELECT copy_recurring_expenses(
  'monthly-data-id-mayo',
  'monthly-data-id-junio'
);
-- Debería retornar el número de gastos copiados
```

### Prueba 4: Verificar Constraints

```sql
-- Esto DEBE fallar (no se puede tener un mes duplicado)
INSERT INTO monthly_data (
  couple_id, year, month,
  person1_name, person1_gross_salary,
  person2_name, person2_gross_salary
)
VALUES (
  'tu-couple-id',
  2024, 4,  -- Mismo mes que ya existe
  'Test', 0,
  'Test', 0
);
-- Error esperado: "duplicate key value violates unique constraint"
```

## 🔧 Solución de Problemas

### Error: "table does not exist"
**Causa:** El schema no se ejecutó correctamente
**Solución:** 
1. Ve a SQL Editor en Supabase
2. Copia TODO el contenido de `schema.sql`
3. Ejecuta todo de una vez

### Error: "column does not exist"
**Causa:** Schema antiguo sin las nuevas columnas
**Solución:**
```sql
-- Para expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category_preset VARCHAR(50);

-- Para credits
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS has_zero_interest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS installments_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS installment_amount NUMERIC(15, 2);
```

### Error: "function does not exist"
**Causa:** Las funciones no se crearon
**Solución:** 
Ejecuta la sección de funciones del `schema.sql`

### La tabla incoming_loans no existe
**Causa:** Es una tabla nueva
**Solución:**
```sql
CREATE TABLE IF NOT EXISTS incoming_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_received DECIMAL(15, 2) DEFAULT 0,
  installment_amount DECIMAL(15, 2),
  total_installments INTEGER,
  installments_received INTEGER DEFAULT 0,
  date_lent DATE NOT NULL,
  expected_return DATE,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  is_in_installments BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incoming_loans_monthly 
ON incoming_loans(monthly_data_id, owner);
```

## 📊 Verificación desde la App

### En el Navegador (Console):

```javascript
// 1. Verificar localStorage
console.log('Datos en localStorage:');
Object.keys(localStorage)
  .filter(k => k.startsWith('financial-data'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))));

// 2. Verificar estructura de un mes
const data = JSON.parse(localStorage.getItem('financial-data-2024-4'));
console.log('Estructura:', data);
console.log('Tiene incomingLoans?', 'incomingLoans' in data);
console.log('Expenses tienen is_recurring?', 
  data.expenses.some(e => 'isRecurring' in e));
```

### Verificar Supabase desde la App:

1. Abre DevTools (F12)
2. Ve a Network
3. Filtra por "supabase"
4. Realiza una acción (guardar mes)
5. Verifica que la request se envíe correctamente
6. Revisa la response

## ✅ Checklist Final

Marca cuando completes cada verificación:

- [ ] ✅ Todas las tablas creadas
- [ ] ✅ Columna `is_recurring` en expenses
- [ ] ✅ Columna `category_preset` en expenses
- [ ] ✅ Columnas de tasa cero en credits
- [ ] ✅ Tabla `incoming_loans` existe
- [ ] ✅ Todos los índices creados
- [ ] ✅ Función `get_monthly_data_complete` funciona
- [ ] ✅ Función `copy_recurring_expenses` funciona
- [ ] ✅ Triggers de updated_at funcionan
- [ ] ✅ Constraints únicos funcionan
- [ ] ✅ Puedo insertar datos de prueba
- [ ] ✅ Puedo leer datos desde la app
- [ ] ✅ Puedo guardar datos desde la app
- [ ] ✅ Los gastos recurrentes se copian automáticamente
- [ ] ✅ Las tarjetas con tasa cero muestran progreso
- [ ] ✅ Los préstamos hacia mí funcionan correctamente

## 🎯 Próximo Paso

Si todas las verificaciones pasaron: **¡Tu base de datos está lista! 🎉**

Si algo falló: Revisa la sección de "Solución de Problemas" arriba.

Para conectar la app con Supabase, lee: `database/README.md`
