# 🔌 Guía de Conexión a Base de Datos

Esta guía te explicará paso a paso cómo conectar la aplicación a una base de datos PostgreSQL usando Supabase.

---

## 📊 Resumen del Sistema de Persistencia

La aplicación funciona en **tres niveles de almacenamiento**:

### 1️⃣ **localStorage** (Por Defecto - Sin Configuración)
- ✅ Funciona automáticamente sin configurar nada
- ✅ Los datos se guardan en el navegador
- ⚠️ Los datos se pierden si borras el cache del navegador
- ⚠️ No se comparten entre dispositivos
- **Uso**: Ideal para pruebas y uso personal

### 2️⃣ **Supabase** (Recomendado - Requiere Configuración)
- ✅ Base de datos PostgreSQL en la nube
- ✅ Datos persistentes y seguros
- ✅ Sincronización entre dispositivos
- ✅ Gratis hasta cierto límite de uso
- **Uso**: Ideal para producción y uso compartido

### 3️⃣ **PostgreSQL Directo** (Avanzado - Requiere Backend)
- ✅ Control total de la base de datos
- ⚠️ Requiere servidor backend propio
- ⚠️ Más complejo de configurar
- **Uso**: Solo para desarrolladores avanzados

---

## 🚀 Opción Recomendada: Conectar con Supabase

### Paso 1: Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"**
3. Regístrate con tu email o cuenta de GitHub
4. Confirma tu correo electrónico

### Paso 2: Crear un Proyecto

1. En el dashboard de Supabase, haz clic en **"New project"**
2. Llena los datos:
   - **Name**: `financial-app` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala bien)
   - **Region**: Selecciona la región más cercana (ej: `South America (São Paulo)`)
   - **Pricing Plan**: Selecciona **Free** para empezar
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos mientras se crea el proyecto

### Paso 3: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a la sección **SQL Editor** (icono de base de datos en el menú lateral)
2. Haz clic en **"New query"**
3. Abre el archivo `/workspaces/default/code/database/schema.sql` en tu computadora
4. Copia **TODO** el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **"Run"** (botón verde en la esquina inferior derecha)
7. Verás el mensaje: **"Success. No rows returned"** ✅

### Paso 4: Obtener las Credenciales

1. Ve a **Settings** (⚙️ en el menú lateral izquierdo)
2. Haz clic en **API** en el submenú
3. Busca la sección **"Project API keys"**
4. Copia estos dos valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (ejemplo: `eyJhbGci...` - es una clave larga)

### Paso 5: Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo llamado **`.env`** (si no existe)
2. Agrega estas dos líneas, reemplazando con tus credenciales:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...tu-clave-completa-aquí
```

**⚠️ IMPORTANTE**: Nunca compartas este archivo `.env` en repositorios públicos.

### Paso 6: Instalar Dependencias

Si aún no has instalado las dependencias de Supabase, ejecuta:

```bash
pnpm install @supabase/supabase-js
```

### Paso 7: Reiniciar la Aplicación

1. Detén el servidor de desarrollo si está corriendo (Ctrl + C)
2. Vuelve a iniciarlo:

```bash
pnpm run dev
```

3. Revisa la consola del navegador (F12 → Console)
4. Deberías ver el mensaje: **✅ Connected to Supabase**

---

## 🔍 Verificar que Funciona Correctamente

### Opción 1: Desde la Interfaz de la App

1. Abre la aplicación en el navegador
2. Crea un gasto, ahorro, préstamo o deuda
3. Cambia de mes (usa los botones de navegación)
4. Vuelve al mes anterior
5. **✅ Si ves tus datos**, la conexión funciona

### Opción 2: Desde Supabase (Verificar en la Base de Datos)

1. En Supabase, ve a **Table Editor** (icono de tabla en el menú lateral)
2. Haz clic en la tabla **monthly_data**
3. Deberías ver las filas con los datos que creaste
4. Verifica también las tablas:
   - `expenses` - Gastos
   - `savings` - Ahorros y metas
   - `loans` - Préstamos a terceros
   - `loan_payments` - Pagos de préstamos
   - `incoming_loans` - Deudas
   - `debt_payments` - Pagos de deudas
   - `credits` - Tarjetas de crédito

### Opción 3: Queries SQL Útiles

Puedes ejecutar estos queries en **SQL Editor** para ver tus datos:

```sql
-- Ver todos los datos mensuales
SELECT * FROM monthly_data 
ORDER BY year DESC, month DESC;

-- Ver todos los préstamos con sus pagos
SELECT 
  l.name AS loan_name,
  l.total_amount,
  l.date_lent,
  l.archived,
  COUNT(lp.id) AS total_payments,
  SUM(CASE WHEN lp.is_paid THEN 1 ELSE 0 END) AS paid_payments
FROM loans l
LEFT JOIN loan_payments lp ON lp.loan_id = l.id
GROUP BY l.id
ORDER BY l.date_lent DESC;

-- Ver todas las deudas con sus pagos
SELECT 
  il.name AS debt_to,
  il.total_amount,
  il.date_received,
  il.archived,
  COUNT(dp.id) AS total_payments,
  SUM(CASE WHEN dp.is_paid THEN 1 ELSE 0 END) AS paid_payments
FROM incoming_loans il
LEFT JOIN debt_payments dp ON dp.incoming_loan_id = il.id
GROUP BY il.id
ORDER BY il.date_received DESC;

-- Ver todos los ahorros y metas (activos)
SELECT * FROM savings 
WHERE archived = false 
ORDER BY created_at DESC;

-- Ver todos los ahorros y metas (archivados)
SELECT * FROM savings 
WHERE archived = true 
ORDER BY created_at DESC;
```

---

## 📋 Estructura de Tablas y su Relación con la Interfaz

### Tabla: `monthly_data`
**Almacena**: Datos básicos de cada mes (salarios, nombres, tipo de cambio)

**Campos principales**:
- `year` / `month`: Año y mes
- `person1_name` / `person2_name`: Nombres
- `person1_gross_salary` / `person2_gross_salary`: Salarios brutos
- `person1_dollar_rate` / `person2_dollar_rate`: Tipo de cambio

**Relación UI**: Formulario de ingresos en la sección "Ingresos"

---

### Tabla: `deductions`
**Almacena**: Deducciones de planilla (CCSS, impuestos, etc.)

**Campos principales**:
- `owner`: 'person1' o 'person2'
- `name`: Nombre de la deducción
- `amount`: Monto fijo
- `percentage`: Porcentaje (si es porcentual)
- `is_percentage`: true/false

**Relación UI**: Sección "Deducciones de Planilla"

---

### Tabla: `other_deductions`
**Almacena**: Otras deducciones por quincena

**Campos principales**:
- `owner`: 'person1' o 'person2'
- `name`: Nombre
- `amount_q1`: Monto quincena 1
- `amount_q2`: Monto quincena 2

**Relación UI**: Sección "Otras Deducciones por Quincena"

---

### Tabla: `expenses`
**Almacena**: Gastos compartidos e individuales

**Campos principales**:
- `name`: Nombre del gasto
- `amount`: Monto
- `quincena`: '1', '2', o 'both'
- `shared`: true si es compartido
- `split_type`: 'percentage' o 'amount' (si es compartido)
- `owner`: 'person1' o 'person2' (si es individual)
- `is_recurring`: true si se copia al siguiente mes
- `category_preset`: Categoría (Uber, Gasolina, etc.)

**Relación UI**: Sección "Gastos Compartidos"

---

### Tabla: `savings`
**Almacena**: Ahorros regulares y metas financieras

**Campos principales**:
- `name`: Nombre
- `amount_q1` / `amount_q2`: Montos por quincena
- `shared`: true si es compartido
- `owner`: 'person1' o 'person2' (si es individual)
- `is_goal`: true si es una meta (con objetivo)
- `target_amount`: Monto objetivo (solo metas)
- `current_amount`: Monto acumulado (solo metas)
- `deadline`: Fecha límite (solo metas)
- `archived`: true si está archivado (no se copia al siguiente mes)

**Relación UI**: Sección "Ahorros y Metas"

---

### Tabla: `loans`
**Almacena**: Préstamos a terceros (dinero que prestaste)

**Campos principales**:
- `name`: A quién le prestaste
- `total_amount`: Monto total prestado
- `date_lent`: Fecha del préstamo
- `owner`: 'person1' o 'person2'
- `archived`: true si está archivado

**Relación con**: `loan_payments` (relación uno a muchos)

**Relación UI**: Sección "Préstamos a Terceros"

---

### Tabla: `loan_payments`
**Almacena**: Checklist de pagos de cada préstamo

**Campos principales**:
- `loan_id`: ID del préstamo (FK)
- `amount`: Monto del pago
- `due_date`: Fecha esperada
- `is_paid`: true si ya fue pagado
- `paid_date`: Fecha en que se pagó

**Relación UI**: Checklist dentro de cada préstamo

---

### Tabla: `incoming_loans`
**Almacena**: Deudas (dinero que debes a otros)

**Campos principales**:
- `name`: A quién le debes
- `total_amount`: Monto total de la deuda
- `date_received`: Fecha en que recibiste el préstamo
- `owner`: 'person1' o 'person2'
- `archived`: true si está archivado

**Relación con**: `debt_payments` (relación uno a muchos)

**Relación UI**: Sección "Deudas"

---

### Tabla: `debt_payments`
**Almacena**: Checklist de pagos de cada deuda

**Campos principales**:
- `incoming_loan_id`: ID de la deuda (FK)
- `amount`: Monto del pago
- `due_date`: Fecha esperada
- `is_paid`: true si ya fue pagado
- `paid_date`: Fecha en que se pagó

**Relación UI**: Checklist dentro de cada deuda

---

### Tabla: `credits`
**Almacena**: Tarjetas de crédito y planes de tasa cero

**Campos principales**:
- `name`: Nombre de la tarjeta
- `credit_limit`: Límite de crédito
- `current_balance`: Saldo actual
- `payment_date`: Día de pago (1-31)
- `minimum_payment`: Pago mínimo
- `owner`: 'person1' o 'person2'
- `has_zero_interest`: true si tiene plan de tasa cero
- `total_installments`: Total de cuotas
- `installments_paid`: Cuotas pagadas
- `installment_amount`: Monto de cada cuota

**Relación UI**: Sección "Tarjetas de Crédito"

---

## 🔄 Flujo de Datos: UI → Base de Datos

### Al Guardar Datos:

```
1. Usuario edita/crea elemento en la UI
   ↓
2. React actualiza el estado local (useState)
   ↓
3. useEffect detecta cambio y llama a saveMonthlyData()
   ↓
4. dataService.ts → database.ts
   ↓
5. database.ts verifica si hay conexión a Supabase
   ↓
6. Si hay Supabase:
   - Guarda en monthly_data
   - Guarda en tablas relacionadas (expenses, savings, etc.)
   - Para préstamos/deudas: guarda en loans/incoming_loans Y loan_payments/debt_payments
   ↓
7. Si NO hay Supabase:
   - Guarda en localStorage
```

### Al Cargar Datos:

```
1. Componente App.tsx se monta
   ↓
2. useEffect llama a getCurrentMonthData()
   ↓
3. Verifica si existe el mes actual en la base de datos
   ↓
4. Si NO existe:
   - Busca mes anterior
   - Copia elementos NO archivados (loans, incoming_loans, savings)
   - Copia gastos recurrentes
   ↓
5. Retorna los datos al estado de React
   ↓
6. UI se actualiza con los datos
```

---

## 🔐 Seguridad y Mejores Prácticas

### ✅ Hacer:

1. **Proteger el archivo `.env`**
   - Añádelo a `.gitignore`
   - Nunca lo subas a GitHub o repositorios públicos

2. **Usar Row Level Security (RLS) en Supabase**
   - Ve a **Authentication** → **Policies**
   - Habilita RLS en las tablas
   - Crea políticas para que cada usuario solo vea sus datos

3. **Backup Regular**
   - Usa el botón "Exportar JSON" en la app
   - Descarga el backup al menos una vez por semana
   - Guárdalo en un lugar seguro

4. **Revisar uso de Supabase**
   - Ve a **Settings** → **Usage**
   - Verifica que no te estés pasando del plan Free

### ❌ No Hacer:

1. **NO compartas tu `VITE_SUPABASE_ANON_KEY`** públicamente
2. **NO uses la misma contraseña** de la base de datos para otros servicios
3. **NO elimines datos** directamente en Supabase sin hacer backup
4. **NO modifiques el schema** sin actualizar el archivo `schema.sql`

---

## 🐛 Solución de Problemas

### Problema 1: No aparece "✅ Connected to Supabase" en la consola

**Causa**: Variables de entorno no cargadas

**Solución**:
1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Verifica que las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo

---

### Problema 2: Error "Failed to connect to Supabase"

**Causa**: Credenciales incorrectas

**Solución**:
1. Verifica que copiaste bien la URL (sin espacios extras)
2. Verifica que copiaste la clave `anon public` completa
3. Verifica que no haya comillas extras en el `.env`

---

### Problema 3: Los datos no se guardan en Supabase

**Causa**: Schema no ejecutado o faltan tablas

**Solución**:
1. Ve a **Table Editor** en Supabase
2. Verifica que existan TODAS estas tablas:
   - monthly_data
   - deductions
   - other_deductions
   - expenses
   - savings
   - loans
   - loan_payments
   - incoming_loans
   - debt_payments
   - credits
3. Si falta alguna, ejecuta el schema.sql completo de nuevo

---

### Problema 4: Error al guardar préstamos/deudas con pagos

**Causa**: Tablas `loan_payments` o `debt_payments` no existen

**Solución**:
1. Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Crear tabla de pagos de préstamos
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);

-- Crear tabla de pagos de deudas
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incoming_loan_id UUID REFERENCES incoming_loans(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debt_payments_incoming_loan ON debt_payments(incoming_loan_id);
```

---

### Problema 5: Items archivados reaparecen el siguiente mes

**Causa**: Columna `archived` no existe en la tabla

**Solución**:
1. Ejecuta este SQL:

```sql
-- Agregar columna archived a todas las tablas
ALTER TABLE savings ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE incoming_loans ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_savings_archived ON savings(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_loans_archived ON loans(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_incoming_loans_archived ON incoming_loans(archived) WHERE archived = false;
```

---

## 📞 Soporte

Si tienes problemas que no se solucionan con esta guía:

1. Revisa los logs de la consola del navegador (F12 → Console)
2. Revisa los logs en Supabase (Logs → All logs)
3. Verifica que el schema.sql esté completamente ejecutado
4. Considera volver a crear el proyecto de Supabase desde cero

---

## ✅ Checklist Final

Antes de considerar que la conexión está completa, verifica:

- [ ] Proyecto creado en Supabase
- [ ] Schema.sql ejecutado sin errores
- [ ] Archivo `.env` creado con credenciales correctas
- [ ] Dependencia `@supabase/supabase-js` instalada
- [ ] Mensaje "✅ Connected to Supabase" aparece en consola
- [ ] Datos se guardan en las tablas (verificado en Table Editor)
- [ ] Préstamos guardan sus pagos en `loan_payments`
- [ ] Deudas guardan sus pagos en `debt_payments`
- [ ] Items archivados NO aparecen al cambiar de mes
- [ ] Items activos SÍ aparecen al cambiar de mes
- [ ] Gastos recurrentes se copian correctamente

---

**¡Listo!** Ahora tu aplicación está conectada a una base de datos real y tus datos están seguros en la nube. 🎉
