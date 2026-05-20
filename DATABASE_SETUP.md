# Guía de Conexión a Base de Datos

Esta aplicación está preparada para conectarse a una base de datos. Actualmente usa **localStorage** como almacenamiento temporal, pero puede migrar fácilmente a cualquier base de datos.

## 🏠 Aplicación para Pareja

Esta aplicación está diseñada para **una sola pareja**, no necesita autenticación multiusuario compleja. La estructura está simplificada para guardar solo sus datos financieros compartidos.

## Estructura de Archivos

```
src/app/
├── types/
│   └── financialTypes.ts    # Definiciones de tipos/modelos
├── services/
│   └── dataService.ts       # Capa de abstracción de datos (AQUÍ VA LA CONEXIÓN)
└── hooks/
    └── useFinancialData.ts  # Hooks para manejar estado y datos
```

## Opciones de Base de Datos

### Opción 1: Supabase (Recomendado - Gratis y fácil)

1. **Crear cuenta en Supabase**: https://supabase.com
2. **Crear un nuevo proyecto**
3. **Ejecutar el SQL** que está en `src/app/services/dataService.ts` (comentarios al final)
4. **Instalar el cliente**:
   ```bash
   pnpm add @supabase/supabase-js
   ```

5. **Crear archivo de configuración** `src/app/config/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
   const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

6. **Crear archivo `.env`**:
   ```
   REACT_APP_SUPABASE_URL=tu-url-de-supabase
   REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

7. **Descomentar el código de Supabase** en `dataService.ts` y comentar el código de localStorage

### Opción 2: Firebase

1. **Crear proyecto en Firebase**: https://firebase.google.com
2. **Instalar Firebase**:
   ```bash
   pnpm add firebase
   ```

3. **Configurar Firebase** en `src/app/config/firebase.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     // ... otras configuraciones
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   ```

4. **Adaptar las funciones** en `dataService.ts` para usar Firestore

### Opción 3: API Backend Personalizada

Si tienes tu propio backend (Node.js, Python, etc.):

1. **Crear endpoints REST**:
   - `GET /api/monthly-data/:year/:month` - Obtener mes específico
   - `POST /api/monthly-data` - Guardar/actualizar mes
   - `GET /api/monthly-data` - Obtener historial completo
   - `DELETE /api/monthly-data/:year/:month` - Eliminar mes

2. **Descomentar el código de Fetch API** en `dataService.ts`

## Estructura de Datos en Base de Datos

### Tabla Principal: `monthly_data`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL/UUID | ID único |
| year | INTEGER | Año (2024, 2025, etc.) |
| month | INTEGER | Mes (0-11) |
| person1 | JSONB/JSON | Datos de la persona 1 |
| person2 | JSONB/JSON | Datos de la persona 2 |
| expenses | JSONB/JSON | Array de gastos |
| savings | JSONB/JSON | Array de ahorros y metas |
| loans | JSONB/JSON | Array de préstamos |
| credits | JSONB/JSON | Array de tarjetas de crédito |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

**Constraint único**: `(year, month)` - Un registro por mes

> ⚠️ **Nota**: No incluye `user_id` porque es solo para ustedes dos. Si en el futuro quieren compartir con más personas, pueden agregar autenticación después.

## Pasos para Migrar

1. **Elegir tu base de datos** (Supabase recomendado para empezar)
2. **Crear las tablas** usando el SQL provisto
3. **Configurar credenciales** en archivo `.env`
4. **Modificar `dataService.ts`**:
   - Descomentar el código de tu base de datos elegida
   - Comentar/eliminar el código de localStorage
5. **Probar la conexión**
6. **(Opcional) Migrar datos existentes** de localStorage a la BD

## Características Incluidas

✅ **Estructura simple** - Solo para ustedes dos, sin complicaciones  
✅ **Índices optimizados** - Consultas rápidas  
✅ **Validación de tipos** - TypeScript completo  
✅ **Manejo de errores** - Try/catch en todas las operaciones  
✅ **Capa de abstracción** - Cambiar BD sin tocar componentes  

## Protección Opcional (No Obligatorio)

Si quieren proteger su base de datos, pueden:

### Opción 1: Contraseña simple en variables de entorno
```typescript
// Antes de cada operación, verificar contraseña
const PASSWORD = process.env.REACT_APP_APP_PASSWORD;
if (userInputPassword !== PASSWORD) {
  throw new Error('Contraseña incorrecta');
}
```

### Opción 2: Usar Supabase Auth (opcional)
Si quieren login/logout simple:
```typescript
import { supabase } from './config/supabase';

// Login con email único para la pareja
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'pareja@email.com',
  password: 'su-contraseña-compartida'
});
```

> 💡 **No es obligatorio** - Si solo ustedes acceden a la aplicación (en su casa/dispositivos), pueden dejarlo sin autenticación.

## Soporte

Si necesitas ayuda con la migración:
1. Revisa los comentarios en `dataService.ts`
2. Consulta la documentación de tu base de datos elegida
3. Los ejemplos de código están listos para copiar/pegar

## Nota Importante

⚠️ **No subas tus credenciales de base de datos al repositorio**  
⚠️ Usa variables de entorno (`.env`) y agrégalo a `.gitignore`  
⚠️ En producción, usa variables de entorno del servidor/hosting
