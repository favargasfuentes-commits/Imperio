# Configuración de Base de Datos

Este proyecto está preparado para conectarse a una base de datos PostgreSQL o Supabase. Actualmente usa localStorage como fallback, pero puedes migrar fácilmente a una base de datos real.

## Opción 1: Supabase (Recomendado)

### 1. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto se inicialice

### 2. Ejecutar el esquema de base de datos

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia todo el contenido del archivo `schema.sql`
3. Pégalo en el editor y ejecuta

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

Puedes encontrar estas credenciales en:
**Settings → API → Project URL y anon public key**

### 4. Instalar dependencias

```bash
pnpm install @supabase/supabase-js
```

### 5. Reiniciar el servidor de desarrollo

```bash
pnpm run dev
```

¡Listo! La aplicación ahora guardará los datos en Supabase automáticamente.

---

## Opción 2: PostgreSQL Local

### 1. Instalar PostgreSQL

- **Mac**: `brew install postgresql`
- **Windows**: Descarga desde [postgresql.org](https://www.postgresql.org/download/)
- **Linux**: `sudo apt-get install postgresql`

### 2. Crear la base de datos

```bash
createdb financial_db
```

### 3. Ejecutar el esquema

```bash
psql -d financial_db -f database/schema.sql
```

### 4. Configurar backend (Node.js + Express)

Necesitarás crear un backend para conectarte a PostgreSQL desde el navegador:

```bash
# En una carpeta separada para el backend
mkdir backend && cd backend
npm init -y
npm install express pg cors dotenv
```

Crear `server.js`:

```javascript
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'financial_db',
  user: 'postgres',
  password: process.env.DB_PASSWORD
});

// Endpoints API aquí
// GET /api/monthly/:coupleId/:year/:month
// POST /api/monthly
// etc.

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### 5. Actualizar servicio de base de datos

Modificar `src/services/database.ts` para usar el backend en lugar de Supabase.

---

## Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema
- **couples**: Parejas registradas
- **monthly_data**: Datos financieros mensuales
- **deductions**: Deducciones de salario
- **other_deductions**: Otras deducciones por quincena
- **expenses**: Gastos mensuales (con soporte para gastos recurrentes)
- **savings**: Ahorros y metas financieras
- **loans**: Préstamos que hemos dado
- **incoming_loans**: Préstamos hacia nosotros (dinero que nos deben)
- **credits**: Tarjetas de crédito (con soporte para planes de tasa cero)

### Características Implementadas

✅ **Gastos Recurrentes**: Los gastos marcados como recurrentes se copian automáticamente al siguiente mes

✅ **Planes de Tasa Cero**: Las tarjetas de crédito pueden tener planes de pago en cuotas sin intereses

✅ **Préstamos Hacia Nosotros**: Seguimiento de dinero que nos deben, con pagos en cuotas

✅ **Categorías Predefinidas**: Gastos con opciones como Uber, Gasolina, Salidita, Ropa, Felicidad

### Funciones SQL Útiles

```sql
-- Obtener todos los datos de un mes específico
SELECT * FROM get_monthly_data_complete(
  'uuid-de-pareja',
  2024,
  4  -- Mayo (0-indexed)
);

-- Copiar gastos recurrentes automáticamente
SELECT copy_recurring_expenses(
  'uuid-mes-anterior',
  'uuid-mes-nuevo'
);
```

---

## Migración desde localStorage

Si ya tienes datos en localStorage y quieres migrarlos a la base de datos:

1. Abre la consola del navegador (F12)
2. Ejecuta:

```javascript
// Copiar todos los datos
const keys = Object.keys(localStorage).filter(k => k.startsWith('financial-data-'));
const allData = keys.map(k => JSON.parse(localStorage.getItem(k)));
console.log(JSON.stringify(allData, null, 2));
```

3. Guarda el JSON resultante
4. Importa los datos usando la funcionalidad de importación de la aplicación

---

## Seguridad

⚠️ **Importante**:

- Nunca subas el archivo `.env` a git
- Usa **Row Level Security (RLS)** en Supabase para proteger los datos
- Implementa autenticación antes de usar en producción
- Las credenciales en `schema.sql` son solo ejemplos

---

## Soporte

Si tienes problemas:

1. Verifica que las variables de entorno estén correctas
2. Revisa la consola del navegador para errores
3. Verifica que el esquema se haya ejecutado correctamente
4. Asegúrate de que Supabase esté activo (no pausado por inactividad)

---

## Próximos Pasos

1. ✅ Implementar autenticación de usuarios
2. ✅ Configurar Row Level Security en Supabase
3. ✅ Agregar funcionalidad de múltiples parejas
4. ✅ Implementar sync en tiempo real
5. ✅ Agregar backup automático
