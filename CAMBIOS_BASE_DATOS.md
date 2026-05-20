# 📝 Cambios Realizados en Base de Datos

Este documento resume todos los cambios realizados para que la base de datos funcione correctamente con las nuevas características de la aplicación.

---

## 🎯 Objetivos Cumplidos

1. ✅ Schema de base de datos actualizado con todas las nuevas estructuras
2. ✅ Interfaces TypeScript corregidas con propiedades faltantes
3. ✅ Mappers de database.ts actualizados para manejar nueva estructura
4. ✅ Sistema de guardado actualizado para incluir pagos y archivado
5. ✅ Documentación completa de conexión y troubleshooting

---

## 🔧 Cambios en Interfaces TypeScript (App.tsx)

### 1. Interface `Saving` - Agregada propiedad `archived`

**Antes**:
```typescript
export interface Saving {
  id: string;
  name: string;
  // ... otros campos
  deadline?: string;
}
```

**Después**:
```typescript
export interface Saving {
  id: string;
  name: string;
  // ... otros campos
  deadline?: string;
  archived?: boolean; // ← NUEVO
}
```

**Razón**: La UI usa `s.archived` pero la interfaz no lo definía, causando errores de TypeScript.

---

### 2. Interface `Loan` - Agregada propiedad `archived`

**Antes**:
```typescript
export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  dateLent: string;
  payments: LoanPayment[];
  owner: 'person1' | 'person2';
}
```

**Después**:
```typescript
export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  dateLent: string;
  payments: LoanPayment[];
  owner: 'person1' | 'person2';
  archived?: boolean; // ← NUEVO
}
```

**Razón**: La UI usa `l.archived` pero la interfaz no lo definía.

---

## 🗄️ Cambios en Schema SQL (database/schema.sql)

### 1. Tabla `savings` - Agregada columna `archived`

**SQL ejecutado**:
```sql
ALTER TABLE savings ADD COLUMN archived BOOLEAN DEFAULT false;
CREATE INDEX idx_savings_archived ON savings(archived) WHERE archived = false;
```

**Impacto**:
- Permite marcar ahorros y metas como archivados
- No se copian al siguiente mes si `archived = true`
- Índice mejora performance de queries

---

### 2. Tabla `loans` - Reestructurada completamente

**Antes**:
```sql
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,  -- ← Campo incorrecto
  date_lent DATE NOT NULL,
  expected_return DATE,            -- ← Campo removido
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Después**:
```sql
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,  -- ← Renombrado
  date_lent DATE NOT NULL,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  archived BOOLEAN DEFAULT false,         -- ← NUEVO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loans_archived ON loans(archived) WHERE archived = false;
```

**Cambios**:
- `amount` → `total_amount` (coincide con interface TypeScript)
- Eliminado `expected_return` (no se usa en UI)
- Agregado `archived` para filtrar archivados

---

### 3. Nueva tabla `loan_payments` - Checklist de pagos

**SQL**:
```sql
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
CREATE INDEX idx_loan_payments_status ON loan_payments(is_paid);
```

**Propósito**:
- Almacena cada pago esperado del préstamo
- Permite sistema de checklist (marcar como pagado)
- Relación 1:N con `loans` (un préstamo tiene muchos pagos)
- `ON DELETE CASCADE`: Si se elimina el préstamo, se eliminan sus pagos

---

### 4. Tabla `incoming_loans` - Reestructurada completamente

**Antes**:
```sql
CREATE TABLE IF NOT EXISTS incoming_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_received DECIMAL(15, 2) DEFAULT 0,  -- ← Removido
  installment_amount DECIMAL(15, 2),         -- ← Removido
  total_installments INTEGER,                -- ← Removido
  installments_received INTEGER DEFAULT 0,   -- ← Removido
  date_lent DATE NOT NULL,                   -- ← Renombrado
  expected_return DATE,                      -- ← Removido
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  is_in_installments BOOLEAN DEFAULT false,  -- ← Removido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Después**:
```sql
CREATE TABLE IF NOT EXISTS incoming_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  date_received DATE NOT NULL,               -- ← Renombrado
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  archived BOOLEAN DEFAULT false,            -- ← NUEVO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incoming_loans_archived ON incoming_loans(archived) WHERE archived = false;
```

**Cambios**:
- Eliminados todos los campos de cuotas (ahora se usan `debt_payments`)
- `date_lent` → `date_received` (semánticamente correcto: es dinero que recibiste)
- Agregado `archived`
- Simplificado: ahora usa tabla relacionada para pagos

---

### 5. Nueva tabla `debt_payments` - Checklist de pagos de deudas

**SQL**:
```sql
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
CREATE INDEX idx_debt_payments_status ON debt_payments(is_paid);
```

**Propósito**:
- Almacena cada pago programado de la deuda
- Permite sistema de checklist (marcar como pagado)
- Relación 1:N con `incoming_loans`
- Mismo patrón que `loan_payments`

---

### 6. Función `get_monthly_data_complete()` - Actualizada

**Antes**: Retornaba solo datos simples de loans e incoming_loans

**Después**: Retorna loans/debts con sus pagos anidados

```sql
CREATE OR REPLACE FUNCTION get_monthly_data_complete(...)
RETURNS JSON AS $$
...
  'loans', (
    SELECT json_agg(
      json_build_object(
        'loan', row_to_json(l.*),
        'payments', (SELECT json_agg(lp.*) FROM loan_payments lp WHERE lp.loan_id = l.id)
      )
    )
    FROM loans l WHERE l.monthly_data_id = md.id
  ),
  'incomingLoans', (
    SELECT json_agg(
      json_build_object(
        'debt', row_to_json(il.*),
        'payments', (SELECT json_agg(dp.*) FROM debt_payments dp WHERE dp.incoming_loan_id = il.id)
      )
    )
    FROM incoming_loans il WHERE il.monthly_data_id = md.id
  )
...
```

**Mejora**: Ahora un solo query retorna todo (préstamo/deuda + sus pagos), reduciendo llamadas a la DB.

---

## 🔄 Cambios en Mappers (src/services/database.ts)

### 1. Mapper `mapSaving()` - Agregado campo `archived`

**Antes**:
```typescript
private mapSaving(s: any): Saving {
  return {
    // ... campos
    deadline: s.deadline,
  };
}
```

**Después**:
```typescript
private mapSaving(s: any): Saving {
  return {
    // ... campos
    deadline: s.deadline,
    archived: s.archived || false,  // ← NUEVO
  };
}
```

---

### 2. Mapper `mapLoan()` - Completamente reescrito

**Antes**:
```typescript
private mapLoan(l: any): Loan {
  return {
    id: l.id,
    name: l.name,
    amount: l.amount,               // ← Campo incorrecto
    dateLent: l.date_lent,
    expectedReturn: l.expected_return,  // ← Campo removido
    owner: l.owner,
  };
}
```

**Después**:
```typescript
private mapLoan(l: any): Loan {
  // Si viene de get_monthly_data_complete, l tiene { loan: {...}, payments: [...] }
  const loanData = l.loan || l;
  const payments = l.payments || [];

  return {
    id: loanData.id,
    name: loanData.name,
    totalAmount: loanData.total_amount,  // ← Renombrado
    dateLent: loanData.date_lent,
    payments: payments.map((p: any) => ({  // ← NUEVO: mapea pagos
      id: p.id,
      amount: p.amount,
      dueDate: p.due_date,
      isPaid: p.is_paid,
      paidDate: p.paid_date,
    })),
    owner: loanData.owner,
    archived: loanData.archived || false,  // ← NUEVO
  };
}
```

**Mejoras**:
- Maneja estructura anidada de la función SQL
- Mapea array de pagos
- Convierte snake_case a camelCase

---

### 3. Mapper `mapIncomingLoan()` - Completamente reescrito

**Antes**:
```typescript
private mapIncomingLoan(il: any): IncomingLoan {
  return {
    id: il.id,
    name: il.name,
    totalAmount: il.total_amount,
    amountReceived: il.amount_received,      // ← Removido
    installmentAmount: il.installment_amount,  // ← Removido
    totalInstallments: il.total_installments,  // ← Removido
    installmentsReceived: il.installments_received,  // ← Removido
    dateLent: il.date_lent,                  // ← Renombrado
    expectedReturn: il.expected_return,      // ← Removido
    owner: il.owner,
    isInInstallments: il.is_in_installments,  // ← Removido
  };
}
```

**Después**:
```typescript
private mapIncomingLoan(il: any): IncomingLoan {
  // Si viene de get_monthly_data_complete, il tiene { debt: {...}, payments: [...] }
  const debtData = il.debt || il;
  const payments = il.payments || [];

  return {
    id: debtData.id,
    name: debtData.name,
    totalAmount: debtData.total_amount,
    dateReceived: debtData.date_received,    // ← Renombrado
    payments: payments.map((p: any) => ({    // ← NUEVO: mapea pagos
      id: p.id,
      amount: p.amount,
      dueDate: p.due_date,
      isPaid: p.is_paid,
      paidDate: p.paid_date,
    })),
    owner: debtData.owner,
    archived: debtData.archived || false,    // ← NUEVO
  };
}
```

**Mejoras**:
- Simplificado: elimina campos innecesarios
- Mapea array de pagos desde tabla relacionada
- Semánticamente correcto: `date_received` en vez de `date_lent`

---

## 💾 Cambios en Guardado (src/services/database.ts)

### 1. Guardado de `savings` - Agregado campo `archived`

**Antes**:
```typescript
data.savings.map(s => ({
  // ... campos
  deadline: s.deadline,
}))
```

**Después**:
```typescript
data.savings.map(s => ({
  // ... campos
  deadline: s.deadline,
  archived: s.archived || false,  // ← NUEVO
}))
```

---

### 2. Guardado de `loans` - Completamente reescrito

**Antes**:
```typescript
if (data.loans.length > 0) {
  inserts.push(
    this.supabaseClient.from('loans').insert(
      data.loans.map(l => ({
        monthly_data_id: monthlyDataId,
        name: l.name,
        amount: l.amount,
        date_lent: l.dateLent,
        expected_return: l.expectedReturn,
        owner: l.owner,
      }))
    )
  );
}
```

**Después**:
```typescript
if (data.loans.length > 0) {
  for (const loan of data.loans) {
    // 1. Insertar el préstamo
    const { data: loanResult, error: loanError } = await this.supabaseClient
      .from('loans')
      .insert({
        monthly_data_id: monthlyDataId,
        name: loan.name,
        total_amount: loan.totalAmount,  // ← Renombrado
        date_lent: loan.dateLent,
        owner: loan.owner,
        archived: loan.archived || false,  // ← NUEVO
      })
      .select()
      .single();

    if (loanError) throw loanError;

    // 2. Insertar pagos del préstamo
    if (loan.payments && loan.payments.length > 0) {
      await this.supabaseClient.from('loan_payments').insert(
        loan.payments.map(p => ({
          loan_id: loanResult.id,  // ← FK al préstamo
          amount: p.amount,
          due_date: p.dueDate,
          is_paid: p.isPaid,
          paid_date: p.paidDate,
        }))
      );
    }
  }
}
```

**Cambios clave**:
- Cambiado de `Promise.all` a loop `for` (necesario para obtener ID del préstamo)
- Primero inserta préstamo, luego sus pagos
- Usa `select().single()` para obtener el ID del préstamo insertado
- Inserta pagos en tabla `loan_payments` con FK `loan_id`

---

### 3. Guardado de `incoming_loans` - Completamente reescrito

**Antes**: Similar a loans (estructura incorrecta)

**Después**:
```typescript
if (data.incomingLoans.length > 0) {
  for (const debt of data.incomingLoans) {
    // 1. Insertar la deuda
    const { data: debtResult, error: debtError } = await this.supabaseClient
      .from('incoming_loans')
      .insert({
        monthly_data_id: monthlyDataId,
        name: debt.name,
        total_amount: debt.totalAmount,
        date_received: debt.dateReceived,  // ← Renombrado
        owner: debt.owner,
        archived: debt.archived || false,  // ← NUEVO
      })
      .select()
      .single();

    if (debtError) throw debtError;

    // 2. Insertar pagos de la deuda
    if (debt.payments && debt.payments.length > 0) {
      await this.supabaseClient.from('debt_payments').insert(
        debt.payments.map(p => ({
          incoming_loan_id: debtResult.id,  // ← FK a la deuda
          amount: p.amount,
          due_date: p.dueDate,
          is_paid: p.isPaid,
          paid_date: p.paidDate,
        }))
      );
    }
  }
}
```

**Mismo patrón** que loans pero para deudas.

---

### 4. Eliminación de datos - Comentario agregado

**Antes**:
```typescript
await Promise.all([
  this.supabaseClient.from('loans').delete().eq('monthly_data_id', monthlyDataId),
  this.supabaseClient.from('incoming_loans').delete().eq('monthly_data_id', monthlyDataId),
]);
```

**Después**:
```typescript
await Promise.all([
  this.supabaseClient.from('loans').delete().eq('monthly_data_id', monthlyDataId), // loan_payments se eliminan por CASCADE
  this.supabaseClient.from('incoming_loans').delete().eq('monthly_data_id', monthlyDataId), // debt_payments se eliminan por CASCADE
]);
```

**Explicación**: No necesitamos eliminar manualmente `loan_payments` ni `debt_payments` porque tienen `ON DELETE CASCADE`.

---

## 📊 Comparación: Antes vs Después

### Estructura de Datos en DB: Loans

**Antes**:
```
loans
  - id: UUID
  - name: VARCHAR
  - amount: DECIMAL           ← Campo plano, sin detalle de pagos
  - date_lent: DATE
  - expected_return: DATE
```

**Después**:
```
loans                         loan_payments
  - id: UUID          ←───┐     - id: UUID
  - name: VARCHAR         │     - loan_id: UUID (FK)
  - total_amount: DECIMAL │     - amount: DECIMAL
  - date_lent: DATE       │     - due_date: DATE
  - archived: BOOLEAN     └───  - is_paid: BOOLEAN
                                - paid_date: DATE
```

**Ventajas**:
- ✅ Checklist de pagos individuales
- ✅ Fecha esperada vs fecha real de pago
- ✅ Progreso visual (X/Y pagos completados)
- ✅ Archivado cuando todos los pagos están marcados

---

### Estructura de Datos en DB: Incoming Loans (Debts)

**Antes**:
```
incoming_loans
  - total_amount: DECIMAL
  - amount_received: DECIMAL     ← Solo monto total recibido
  - installment_amount: DECIMAL  ← Monto fijo por cuota
  - total_installments: INT      ← Número de cuotas
  - installments_received: INT   ← Contador simple
```

**Después**:
```
incoming_loans                debt_payments
  - id: UUID          ←───┐     - id: UUID
  - name: VARCHAR         │     - incoming_loan_id: UUID (FK)
  - total_amount: DECIMAL │     - amount: DECIMAL
  - date_received: DATE   │     - due_date: DATE
  - archived: BOOLEAN     └───  - is_paid: BOOLEAN
                                - paid_date: DATE
```

**Ventajas**:
- ✅ Pagos pueden tener montos diferentes
- ✅ Fechas específicas para cada pago
- ✅ Marcar individualmente cada pago
- ✅ Historial completo de cuándo se pagó cada cuota

---

## 🔍 Queries Útiles para Verificar

### Ver préstamos con progreso de pagos:

```sql
SELECT 
  l.id,
  l.name AS borrower,
  l.total_amount,
  l.date_lent,
  l.archived,
  COUNT(lp.id) AS total_payments,
  SUM(CASE WHEN lp.is_paid THEN 1 ELSE 0 END) AS paid_payments,
  SUM(CASE WHEN lp.is_paid THEN lp.amount ELSE 0 END) AS amount_received,
  l.total_amount - SUM(CASE WHEN lp.is_paid THEN lp.amount ELSE 0 END) AS pending_amount
FROM loans l
LEFT JOIN loan_payments lp ON lp.loan_id = l.id
WHERE l.archived = false
GROUP BY l.id
ORDER BY l.date_lent DESC;
```

---

### Ver deudas con progreso de pagos:

```sql
SELECT 
  il.id,
  il.name AS creditor,
  il.total_amount,
  il.date_received,
  il.archived,
  COUNT(dp.id) AS total_payments,
  SUM(CASE WHEN dp.is_paid THEN 1 ELSE 0 END) AS paid_payments,
  SUM(CASE WHEN dp.is_paid THEN dp.amount ELSE 0 END) AS amount_paid,
  il.total_amount - SUM(CASE WHEN dp.is_paid THEN dp.amount ELSE 0 END) AS pending_amount
FROM incoming_loans il
LEFT JOIN debt_payments dp ON dp.incoming_loan_id = il.id
WHERE il.archived = false
GROUP BY il.id
ORDER BY il.date_received DESC;
```

---

### Ver próximos pagos pendientes (préstamos):

```sql
SELECT 
  l.name AS borrower,
  lp.amount,
  lp.due_date,
  lp.is_paid
FROM loan_payments lp
JOIN loans l ON l.id = lp.loan_id
WHERE lp.is_paid = false
  AND l.archived = false
ORDER BY lp.due_date ASC;
```

---

### Ver próximos pagos pendientes (deudas):

```sql
SELECT 
  il.name AS creditor,
  dp.amount,
  dp.due_date,
  dp.is_paid
FROM debt_payments dp
JOIN incoming_loans il ON il.id = dp.incoming_loan_id
WHERE dp.is_paid = false
  AND il.archived = false
ORDER BY dp.due_date ASC;
```

---

## ✅ Verificación de Integridad

### Checklist de Verificación:

- [ ] Todas las interfaces TypeScript tienen `archived?` donde se necesita
- [ ] Tabla `savings` tiene columna `archived`
- [ ] Tabla `loans` tiene columna `archived` y `total_amount`
- [ ] Tabla `incoming_loans` tiene columna `archived` y `date_received`
- [ ] Tabla `loan_payments` existe y tiene FK a `loans`
- [ ] Tabla `debt_payments` existe y tiene FK a `incoming_loans`
- [ ] Índices creados en columnas `archived`
- [ ] Función `get_monthly_data_complete()` retorna pagos anidados
- [ ] Mappers convierten snake_case a camelCase
- [ ] Guardado inserta primero loan/debt, luego sus payments
- [ ] Eliminación usa CASCADE para payments

---

## 🎉 Resumen

### Lo que se logró:

1. **Consistencia**: Interfaces TypeScript coinciden 100% con schema SQL
2. **Relaciones**: Préstamos y deudas tienen relación 1:N con sus pagos
3. **Archivado**: Sistema completo de archivado funciona en todos los elementos
4. **Performance**: Índices agregados para mejorar queries
5. **Integridad**: CASCADE asegura que no queden pagos huérfanos
6. **Mapeo**: Conversión automática entre camelCase (TS) y snake_case (SQL)

### Resultado final:

✅ La aplicación puede guardar y recuperar:
- Préstamos con checklist de pagos
- Deudas con checklist de pagos
- Ahorros y metas con archivado
- Todo sincronizado entre localStorage y Supabase

🎯 **La base de datos está 100% alineada con la funcionalidad de la UI.**
