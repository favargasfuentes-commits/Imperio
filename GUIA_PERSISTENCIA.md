# 📌 Guía de Persistencia de Datos

Esta guía explica cómo funcionan los préstamos, deudas y metas a lo largo del tiempo en la aplicación.

## 🔄 Cómo Funcionan los Datos que Persisten

### ✅ Elementos que se Mantienen Entre Meses

Los siguientes elementos se **copian automáticamente** al mes siguiente:

#### 1. **Préstamos a Terceros** (Dinero que prestaste)
- ✅ Se mantienen mes a mes hasta que los archives o elimines
- ✅ El progreso de pagos se mantiene
- ✅ Los pagos marcados como completados persisten

**Ejemplo:**
- Enero: Prestas ₡100,000 a Juan en 4 pagos
- Febrero: El préstamo sigue apareciendo con el mismo progreso
- Marzo: Sigues viendo el préstamo hasta que lo archives

#### 2. **Deudas** (Dinero que debes)
- ✅ Se mantienen mes a mes hasta que las archives o elimines
- ✅ El progreso de pagos se mantiene
- ✅ Los pagos marcados como completados persisten

**Ejemplo:**
- Enero: Debes ₡50,000 al banco en 5 cuotas
- Febrero: La deuda sigue apareciendo con el mismo progreso
- Marzo: Sigues viendo la deuda hasta que la archives

#### 3. **Metas de Ahorro**
- ✅ Se mantienen mes a mes hasta que las archives o elimines
- ✅ El progreso hacia la meta se conserva
- ✅ Puedes seguir agregando al `currentAmount` cada mes

**Ejemplo:**
- Enero: Meta "Viaje a Europa" - ₡500,000 / ₡2,000,000
- Febrero: Sigue apareciendo la meta con el progreso anterior
- Marzo: Continúa hasta que la completes y archives

#### 4. **Ahorros Regulares**
- ✅ Se mantienen mes a mes hasta que los archives o elimines
- ✅ Los montos por quincena se conservan
- ✅ Útil para ahorros mensuales fijos

**Ejemplo:**
- Enero: Ahorro "Fondo Emergencia" - ₡25,000 Q1 + ₡25,000 Q2
- Febrero: Sigue apareciendo el ahorro
- Marzo: Continúa hasta que lo archives

#### 4. **Gastos Recurrentes**
- ✅ Solo si están marcados como "Recurrente" (botón verde)
- ✅ Se copian al mes siguiente con un ID nuevo

**Ejemplo:**
- Enero: "Alquiler" marcado como recurrente
- Febrero: Aparece automáticamente un nuevo gasto "Alquiler"

---

## 🗂️ Archivar vs Eliminar

### 📦 **Archivar** (Recomendado)

**¿Qué hace?**
- Oculta el elemento de la vista actual
- NO lo elimina de la base de datos
- NO se copia al mes siguiente
- Útil para mantener historial

**¿Cuándo usar?**
- ✅ Cuando completas un préstamo (ya te pagaron todo)
- ✅ Cuando terminas de pagar una deuda
- ✅ Cuando alcanzas una meta de ahorro
- ✅ Cuando ya no quieres un ahorro mensual
- ✅ Quieres mantener el registro pero no verlo

**Ejemplo:**
```
Marzo: Préstamo a María - 4/4 pagos ✅
       [Botón: 📦 Archivar]
       
Resultado:
- Ya no aparece en Marzo ni meses futuros
- El registro sigue en la base de datos
- Puedes verlo en el historial (futuro)
```

### 🗑️ **Eliminar** (Permanente)

**¿Qué hace?**
- Elimina el elemento **PERMANENTEMENTE**
- NO se puede recuperar
- Se borra de la base de datos

**¿Cuándo usar?**
- ⚠️ Cuando creaste algo por error
- ⚠️ Cuando ya no quieres ningún registro del elemento
- ⚠️ **Ten cuidado** - no se puede deshacer

**Confirmación:**
Al hacer clic en 🗑️ Eliminar, aparece un mensaje:
```
¿Eliminar este [préstamo/deuda/meta] permanentemente?
Esta acción no se puede deshacer.
```

---

## 📅 Flujo Mensual Completo

### Mes 1 (Enero 2026):
```
Préstamos:
- Juan: ₡100,000 - 2/4 pagos ✅

Deudas:
- Banco: ₡50,000 - 1/5 cuotas ✅

Metas:
- Viaje: ₡500,000 / ₡2,000,000

Gastos Recurrentes:
- Alquiler: ₡300,000 [🔄 Recurrente]
```

### Cambio a Mes 2 (Febrero 2026):
La aplicación automáticamente:
1. ✅ Copia préstamo de Juan (sigue pendiente)
2. ✅ Copia deuda del Banco (sigue pendiente)
3. ✅ Copia meta de Viaje (sigue en progreso)
4. ✅ Copia gasto recurrente "Alquiler" con nuevo ID

### Mes 2 (Febrero 2026):
```
Préstamos:
- Juan: ₡100,000 - 2/4 pagos ✅ (mismo progreso)

Deudas:
- Banco: ₡50,000 - 1/5 cuotas ✅ (mismo progreso)

Metas:
- Viaje: ₡500,000 / ₡2,000,000 (mismo progreso)

Gastos:
- Alquiler: ₡300,000 [🔄 Recurrente] (nuevo ID)
```

### Acciones en Febrero:
```
1. Marco pago 3 de Juan ✅
2. Marco cuota 2 del Banco ✅
3. Agrego ₡100,000 a la meta de Viaje
4. Completo pago 4 de Juan → Archivar 📦
```

### Cambio a Mes 3 (Marzo 2026):
```
Préstamos:
- (Juan NO aparece - fue archivado) ❌

Deudas:
- Banco: ₡50,000 - 2/5 cuotas ✅ (continúa)

Metas:
- Viaje: ₡600,000 / ₡2,000,000 (continúa)

Gastos:
- Alquiler: ₡300,000 [🔄 Recurrente] (copiado de nuevo)
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Préstamo Completado
```
Situación: Le prestaste ₡80,000 a Ana en 4 pagos.
          Ya recibiste los 4 pagos.

✅ Hacer:
1. Marca el último pago como completado ✅
2. Haz clic en [📦 Archivar]
3. El préstamo desaparece de este mes y futuros
4. El registro se conserva en la base de datos
```

### Caso 2: Deuda Pagada
```
Situación: Debías ₡60,000 en 6 cuotas.
          Ya pagaste las 6 cuotas.

✅ Hacer:
1. Marca la última cuota como pagada ✅
2. Haz clic en [📦 Archivar]
3. La deuda desaparece de este mes y futuros
4. El registro se conserva en la base de datos
```

### Caso 3: Meta Alcanzada
```
Situación: Meta "Vacaciones" - ₡1,000,000 / ₡1,000,000 ✅

✅ Hacer:
1. Verás "¡Meta Completada! 🎉"
2. Haz clic en [📦 Archivar Meta]
3. La meta desaparece de este mes y futuros
4. El registro se conserva en la base de datos
```

### Caso 4: Error al Crear
```
Situación: Creaste un préstamo por error.

⚠️ Hacer:
1. Haz clic en [🗑️ Eliminar]
2. Confirma la eliminación
3. Se borra permanentemente
4. NO se puede recuperar
```

### Caso 5: Cancelar Deuda/Meta
```
Situación: Decidiste no seguir con una meta o 
          negociaste cancelar una deuda.

✅ Opción A - Archivar (recomendado):
- Haz clic en [📦 Archivar]
- Mantiene el historial de cuánto pagaste

⚠️ Opción B - Eliminar:
- Haz clic en [🗑️ Eliminar]
- Elimina todo registro
```

### Caso 6: Ahorro Mensual Completado
```
Situación: Tenías un ahorro mensual de ₡50,000 
          pero ya no quieres seguir ahorrando esa cantidad.

✅ Hacer:
1. Haz clic en [📦 Archivar]
2. El ahorro desaparece de este mes y futuros
3. El historial se conserva
4. Si cambias de opinión, puedes restaurarlo
```

---

## 🔍 Elementos Archivados

### ¿Dónde están?
Los elementos archivados están ocultos pero **no eliminados**.

### ✅ Ver Elementos Archivados:
1. En cada sección (Préstamos, Deudas, Ahorros/Metas)
2. Si hay elementos archivados, aparece un checkbox
3. **☑ Mostrar Archivados (X)** - donde X es el número
4. Al activarlo, ves SOLO los elementos archivados

### ♻️ Restaurar Elementos:
1. Activa "Mostrar Archivados"
2. Verás todos los elementos archivados
3. El botón cambia a **[♻️ Restaurar]**
4. Click para restaurar
5. Vuelve a la lista principal y se copiará al siguiente mes

---

## 💾 Almacenamiento

### localStorage (Por Defecto):
- ✅ Los elementos archivados se marcan con `archived: true`
- ✅ Se filtran automáticamente en la vista
- ✅ NO se copian al siguiente mes

### Base de Datos (Supabase/PostgreSQL):
- ✅ Los elementos archivados se guardan con `archived = true`
- ✅ Se pueden recuperar con queries
- ✅ Permiten análisis histórico

**Query de ejemplo para ver archivados:**
```sql
-- Ver todos los préstamos archivados
SELECT * FROM loans 
WHERE archived = true 
ORDER BY date_lent DESC;

-- Ver todas las metas completadas
SELECT * FROM savings 
WHERE is_goal = true 
  AND archived = true 
ORDER BY deadline DESC;
```

---

## ✨ Ventajas de Este Sistema

### 1. **Flexibilidad**
- Puedes archivar elementos completados
- Puedes eliminar errores
- Mantienes historial completo

### 2. **Sin Pérdida de Información**
- Archivar NO elimina datos
- Siempre puedes consultar el historial
- Útil para declaraciones de impuestos

### 3. **Limpieza Visual**
- Solo ves elementos activos
- Interfaz no se satura
- Fácil de gestionar

### 4. **Seguimiento a Largo Plazo**
- Préstamos que duran meses/años
- Deudas hipotecarias
- Metas de ahorro a largo plazo

---

## 🆘 Preguntas Frecuentes

**P: ¿Los préstamos archivados aparecerán en meses futuros?**
R: No. Una vez archivados, NO se copian a meses futuros.

**P: ¿Puedo recuperar un elemento archivado?**
R: Actualmente no desde la interfaz, pero el dato sigue en la base de datos. La función de "Ver Archivados" vendrá en una futura actualización.

**P: ¿Qué pasa si elimino por error?**
R: Si usaste "Eliminar" (🗑️), se borra permanentemente y NO se puede recuperar. Por eso siempre pregunta confirmación.

**P: ¿Los gastos recurrentes se archivan?**
R: No. Los gastos recurrentes se copian al mes siguiente automáticamente. Para dejar de copiarlos, desmarca el botón "Recurrente" (🔄).

**P: ¿Las metas de ahorro desaparecen solas al completarse?**
R: No. Debes archivarlas manualmente haciendo clic en [📦 Archivar Meta] cuando alcances el objetivo.

**P: ¿Puedo tener el mismo préstamo en múltiples meses?**
R: Sí. Los préstamos persisten automáticamente mes a mes hasta que los archives. Así puedes dar seguimiento a largo plazo.

---

## 🎓 Mejores Prácticas

### ✅ Recomendaciones:

1. **Usa Archivar en lugar de Eliminar**
   - Mantiene historial
   - Más seguro
   - Útil para análisis futuro

2. **Archiva cuando completes**
   - Préstamo 100% pagado → Archivar
   - Deuda 100% saldada → Archivar
   - Meta alcanzada → Archivar

3. **Revisa mensualmente**
   - Marca pagos recibidos/realizados
   - Archiva lo completado
   - Mantén la interfaz limpia

4. **Usa el checklist completo**
   - Agrega todos los pagos esperados
   - Marca según vayas recibiendo/pagando
   - Progreso visual te ayuda a planificar

### ❌ Evita:

1. **Eliminar elementos activos**
   - Pierdes el historial
   - No puedes recuperar

2. **Dejar elementos completados sin archivar**
   - Saturan la interfaz
   - Se copian innecesariamente

3. **Archivar antes de completar**
   - Pierdes el seguimiento
   - Dificulta cobros/pagos

---

**¡Listo!** Ahora sabes cómo funcionan los elementos que persisten en el tiempo y cómo gestionarlos correctamente. 🎉
