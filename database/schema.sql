-- ============================================
-- ESTRUCTURA DE BASE DE DATOS
-- Sistema de Gestión Financiera para Parejas
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
-- Usuarios del sistema
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: couples
-- Parejas registradas en el sistema
-- ============================================
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person1_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  person2_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person1_user_id, person2_user_id)
);

-- ============================================
-- TABLA: monthly_data
-- Datos financieros mensuales de cada pareja
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),

  -- Datos de Persona 1
  person1_name VARCHAR(255) NOT NULL,
  person1_gross_salary DECIMAL(15, 2) DEFAULT 0,
  person1_dollar_rate DECIMAL(10, 2) DEFAULT 0,

  -- Datos de Persona 2
  person2_name VARCHAR(255) NOT NULL,
  person2_gross_salary DECIMAL(15, 2) DEFAULT 0,
  person2_dollar_rate DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un solo registro por pareja por mes
  UNIQUE(couple_id, year, month)
);

-- Índices para monthly_data
CREATE INDEX idx_monthly_data_couple_year_month ON monthly_data(couple_id, year, month);
CREATE INDEX idx_monthly_data_year_month ON monthly_data(year, month);

-- ============================================
-- TABLA: deductions
-- Deducciones de salario (CCSS, impuestos, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) DEFAULT 0,
  percentage DECIMAL(5, 2) DEFAULT 0,
  is_percentage BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deductions_monthly ON deductions(monthly_data_id, owner);

-- ============================================
-- TABLA: other_deductions
-- Otras deducciones por quincena
-- ============================================
CREATE TABLE IF NOT EXISTS other_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),
  name VARCHAR(255) NOT NULL,
  amount_q1 DECIMAL(15, 2) DEFAULT 0,
  amount_q2 DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_other_deductions_monthly ON other_deductions(monthly_data_id, owner);

-- ============================================
-- TABLA: expenses
-- Gastos mensuales
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  quincena VARCHAR(10) NOT NULL CHECK (quincena IN ('1', '2', 'both')),
  shared BOOLEAN DEFAULT false,
  split_type VARCHAR(20) CHECK (split_type IN ('percentage', 'amount')),
  split_percentage_p1 DECIMAL(5, 2),
  split_amount_p1 DECIMAL(15, 2),
  owner VARCHAR(10) CHECK (owner IN ('person1', 'person2')),
  is_recurring BOOLEAN DEFAULT false,
  category_preset VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expenses_monthly ON expenses(monthly_data_id);
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring) WHERE is_recurring = true;

-- ============================================
-- TABLA: savings
-- Ahorros y metas financieras
-- ============================================
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount_q1 DECIMAL(15, 2) DEFAULT 0,
  amount_q2 DECIMAL(15, 2) DEFAULT 0,
  shared BOOLEAN DEFAULT false,
  split_type VARCHAR(20) CHECK (split_type IN ('percentage', 'amount')),
  split_percentage_p1 DECIMAL(5, 2),
  split_amount_p1_q1 DECIMAL(15, 2),
  split_amount_p1_q2 DECIMAL(15, 2),
  owner VARCHAR(10) CHECK (owner IN ('person1', 'person2')),

  -- Campos para metas
  is_goal BOOLEAN DEFAULT false,
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2),
  deadline DATE,

  -- Archivado (no se copia al siguiente mes)
  archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_savings_monthly ON savings(monthly_data_id);
CREATE INDEX idx_savings_goals ON savings(is_goal) WHERE is_goal = true;
CREATE INDEX idx_savings_archived ON savings(archived) WHERE archived = false;

-- ============================================
-- TABLA: loans
-- Préstamos que hemos dado (dinero que prestamos)
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  date_lent DATE NOT NULL,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),

  -- Archivado (no se copia al siguiente mes)
  archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loans_monthly ON loans(monthly_data_id, owner);
CREATE INDEX idx_loans_archived ON loans(archived) WHERE archived = false;

-- ============================================
-- TABLA: loan_payments
-- Pagos individuales de cada préstamo (checklist)
-- ============================================
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

-- ============================================
-- TABLA: incoming_loans
-- Deudas (dinero que debemos a otros)
-- ============================================
CREATE TABLE IF NOT EXISTS incoming_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- A quién le debemos
  total_amount DECIMAL(15, 2) NOT NULL,
  date_received DATE NOT NULL,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),

  -- Archivado (no se copia al siguiente mes)
  archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incoming_loans_monthly ON incoming_loans(monthly_data_id, owner);
CREATE INDEX idx_incoming_loans_archived ON incoming_loans(archived) WHERE archived = false;

-- ============================================
-- TABLA: debt_payments
-- Pagos individuales de cada deuda (checklist)
-- ============================================
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

-- ============================================
-- TABLA: credits
-- Tarjetas de crédito
-- ============================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_data_id UUID REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  credit_limit DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  payment_date INTEGER NOT NULL CHECK (payment_date >= 1 AND payment_date <= 31),
  minimum_payment DECIMAL(15, 2) DEFAULT 0,
  owner VARCHAR(10) NOT NULL CHECK (owner IN ('person1', 'person2')),

  -- Campos para planes de tasa cero
  has_zero_interest BOOLEAN DEFAULT false,
  total_installments INTEGER,
  installments_paid INTEGER DEFAULT 0,
  installment_amount DECIMAL(15, 2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credits_monthly ON credits(monthly_data_id, owner);
CREATE INDEX idx_credits_zero_interest ON credits(has_zero_interest) WHERE has_zero_interest = true;

-- ============================================
-- TRIGGERS
-- Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON couples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_data_updated_at BEFORE UPDATE ON monthly_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen mensual completo
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  md.id,
  md.couple_id,
  md.year,
  md.month,
  md.person1_name,
  md.person1_gross_salary,
  md.person2_name,
  md.person2_gross_salary,
  COALESCE(SUM(CASE WHEN e.owner = 'person1' OR e.shared THEN e.amount ELSE 0 END), 0) as person1_expenses,
  COALESCE(SUM(CASE WHEN e.owner = 'person2' OR e.shared THEN e.amount ELSE 0 END), 0) as person2_expenses,
  COALESCE(SUM(CASE WHEN s.owner = 'person1' OR s.shared THEN s.amount_q1 + s.amount_q2 ELSE 0 END), 0) as person1_savings,
  COALESCE(SUM(CASE WHEN s.owner = 'person2' OR s.shared THEN s.amount_q1 + s.amount_q2 ELSE 0 END), 0) as person2_savings
FROM monthly_data md
LEFT JOIN expenses e ON e.monthly_data_id = md.id
LEFT JOIN savings s ON s.monthly_data_id = md.id
GROUP BY md.id;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función: Obtener datos completos de un mes (con pagos de préstamos y deudas)
CREATE OR REPLACE FUNCTION get_monthly_data_complete(
  p_couple_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'monthlyData', row_to_json(md.*),
    'deductions', (SELECT json_agg(d.*) FROM deductions d WHERE d.monthly_data_id = md.id),
    'otherDeductions', (SELECT json_agg(od.*) FROM other_deductions od WHERE od.monthly_data_id = md.id),
    'expenses', (SELECT json_agg(e.*) FROM expenses e WHERE e.monthly_data_id = md.id),
    'savings', (SELECT json_agg(s.*) FROM savings s WHERE s.monthly_data_id = md.id),
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
    ),
    'credits', (SELECT json_agg(c.*) FROM credits c WHERE c.monthly_data_id = md.id)
  )
  INTO result
  FROM monthly_data md
  WHERE md.couple_id = p_couple_id
    AND md.year = p_year
    AND md.month = p_month;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función: Copiar gastos recurrentes al siguiente mes
CREATE OR REPLACE FUNCTION copy_recurring_expenses(
  p_from_monthly_data_id UUID,
  p_to_monthly_data_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  rows_copied INTEGER;
BEGIN
  INSERT INTO expenses (
    monthly_data_id, name, amount, quincena, shared, split_type,
    split_percentage_p1, split_amount_p1, owner, is_recurring, category_preset
  )
  SELECT
    p_to_monthly_data_id, name, amount, quincena, shared, split_type,
    split_percentage_p1, split_amount_p1, owner, is_recurring, category_preset
  FROM expenses
  WHERE monthly_data_id = p_from_monthly_data_id
    AND is_recurring = true;

  GET DIAGNOSTICS rows_copied = ROW_COUNT;
  RETURN rows_copied;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Crear usuario de ejemplo
-- INSERT INTO users (email, password_hash, full_name)
-- VALUES ('demo@example.com', 'hash_placeholder', 'Usuario Demo');

-- ============================================
-- PERMISOS (ajustar según necesidad)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;
