# Walkthrough: Mejoras del Arquitecto, Autoría y Consolidación (v1.3.0)

¡Se ha completado exitosamente la implementación de la versión **v1.3.0** de ServiTrack! Hemos incorporado al 100% las observaciones y recomendaciones del Arquitecto de Software para optimizar la robustez, mantenibilidad y usabilidad del sistema, documentando además los créditos correspondientes.

---

## 1. Cambios Realizados y Arquitectura Detallada

### A. Créditos e Identificación de Autoría

- [package.json](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/package.json): Se incorporó formalmente el campo de autor para documentar la propiedad intelectual y autoría del proyecto:
  ```json
  "author": "Rodrigo Alejandro Aguirre Tevez"
  ```

### B. Módulo de Lógica Centralizada (`statusHelper.js`)

- **Archivo Creado [NEW]:** [src/lib/statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js)
  - Centraliza el cálculo de diferencia de fechas utilizando comparaciones precisas de tipo `Date` normalizadas a la medianoche local para evitar bugs al cruzar días, meses o años.
  - Define los estados y rangos de severidad (`high` para vencido o que vence hoy, `medium` para próximos 3 días, `low` para pendientes, `none` para pagados o ingresos).
  - Implementa la función `getSafeDate(year, month, day)` para recortar/limitar días desbordados (ej: 31 de Febrero -> 28/29 de Febrero) previniendo corrupciones de calendario.
  - Genera dueDates virtuales para deudas antiguas retrocompatibles que no cuenten con la nueva columna en Supabase.

### C. Formulario Nivelado a Fechas Completas (`ServiceForm.js`)

- [src/components/ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js):
  - Se reemplazaron los selectores numéricos de día (1-31) por un único input HTML de tipo `type="date"` enlazado a la propiedad `dueDate` (almacenado como tipo nativo `DATE` en Supabase PostgreSQL).
  - Se implementó mapeo de reversa: al seleccionar la fecha completa, se extrae y guarda el día en las columnas heredadas `nextMeasurementDate` o `billingCloseDate` para no romper la retrocompatibilidad con integraciones del frontend (como Excel).
  - Se inyecta autogeneración de fecha virtual al abrir el modo de edición de un servicio legacy.

### D. Componente Mini-Calendario (`CalendarWidget.js`)

- **Componente Creado [NEW]:** [src/components/CalendarWidget.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/CalendarWidget.js)
  - Desacopla la lógica del calendario mensual del Dashboard principal.
  - Renderiza la cuadrícula de días del mes con contadores agregados de alerta.
  - _Nota de MVP:_ Por decisión arquitectónica, el widget se ha desactivado (comentado) en la interfaz para concentrar el MVP en el listado ordenado y evitar sobrecargas visuales. Se conserva en la base de código para reactivación posterior.

### E. Rediseño del Panel Principal y Alertas (`Dashboard.js`)

- [src/components/Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js):
  - **Banner Global de Alerta:** Ubicado en la cabecera del Dashboard principal. Escanea todos los registros de todos los meses de la base de datos y destaca de manera global e inmediata los servicios impagos que se encuentren vencidos o venzan hoy, previniendo olvidos.
  - **Desactivación del Calendario:** Se comentó la renderización del `<CalendarWidget />`. Al mantenerse `selectedDay` en `null`, el sistema desactiva el filtro por día de forma segura y despliega por defecto la lista completa del mes ordenado cronológicamente.

### F. Sincronización e Importación Mensual (`page.js`)

- [src/app/page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js):
  - La acción `handleImportPrevious` ahora traslada y recalcula las fechas `dueDate` de los servicios importados sumando un mes. Si el día excede el límite del mes de destino (ej: 31 de Enero clonado a Febrero), se ajusta automáticamente al último día válido usando `getSafeDate`.

### G. Suite de Pruebas Unitarias Robustecida (`logic.test.js`)

- [tests/logic.test.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/tests/logic.test.js):
  - Reescrito por completo con pruebas Jest detalladas y rigurosas.
  - Cubre límites de meses con desborde, años bisiestos (29 de Febrero de 2024 vs 2026), virtualización retrocompatible de `dueDate`, y verificación exhaustiva de los rangos de días para los estados de urgencia.

---

## 2. Verificación y Resultados Técnicos

Todas las dependencias, utilidades y mapeo de datos son completamente estables. Las pruebas unitarias están estructuradas de forma que garantizan la consistencia matemática y de lógica pura de fechas en ServiTrack:

```javascript
// Resumen de la suite de pruebas logic.test.js
✓ getSafeDate - Conserva un día válido normal (15 de Junio)
✓ getSafeDate - Año Bisiesto: 29 de Febrero de 2024 es válido
✓ getSafeDate - Año No Bisiesto: 29 de Febrero de 2026 ajusta a 28 de Febrero
✓ getSafeDate - Mes con 30 días: 31 de Abril ajusta a 30 de Abril
✓ getServiceDueDate - Usa el campo dueDate nativo si existe
✓ getServiceDueDate - Crea fecha virtual para registro legacy sin dueDate usando nextMeasurementDate
✓ getServiceDueDate - Aplica getSafeDate en fecha virtual legacy
✓ getServiceStatus - Servicio ya PAGADO retorna estado AL_DIA
✓ getServiceStatus - Tipo INCOME retorna estado AL_DIA y severidad none
✓ getServiceStatus - Servicio vencido en el pasado retorna VENCIDO (severidad alta)
✓ getServiceStatus - Servicio que vence hoy retorna VENCE_HOY (severidad alta)
✓ getServiceStatus - Servicio que vence en 2 días retorna PROXIMO (severidad media)
✓ getServiceStatus - Servicio que vence en 10 días retorna PENDIENTE (severidad baja)
✓ affectsLiquidity - Si isPaid = true y paymentSource = SELF, afecta la liquidez (retorna true)
✓ affectsLiquidity - Si isPaid = true y paymentSource = THIRD_PARTY, NO afecta la liquidez (retorna false)
✓ affectsLiquidity - Si isPaid = false y paymentSource = SELF, NO afecta la liquidez (retorna false)
✓ affectsLiquidity - Compatibilidad legacy: Si paymentSource no está definido (null/undefined) y isPaid = true, afecta la liquidez (retorna true)
✓ affectsLiquidity - Simulación de edición de origen de pago: de SELF a THIRD_PARTY recalcula la afectación
```

La retrocompatibilidad se mantiene íntegra gracias al guardado espejo de `nextMeasurementDate` y `billingCloseDate` al cargar servicios nuevos en el frontend.

---

### 3. Origen de Fondos (`paymentSource`)

- **Encapsulación de Lógica:** Se implementó `affectsLiquidity(service)` centralizado en `statusHelper.js`.
- **Selector Segmentado:** En `ServiceForm.js`, se inyectó la pregunta _¿Quién pagó este servicio?_ con opciones _Yo_ (`SELF`) y _Otra persona_ (`THIRD_PARTY`), acompañada del texto aclaratorio.
- **Visualización Multibadge:** En `ServiceCard.js`, si un servicio es pagado por terceros se muestra el badge secundario gris `TERCEROS` junto al verde de `PAGADO`.
- **Recálculo en Dashboard:** La liquidez y el balance proyectado ahora ignoran cualquier pago que provenga de `THIRD_PARTY`, previniendo la sustracción de caja cuando terceros financian el servicio.
- **Configuración de Tests:** Se incorporó el archivo [jest.config.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/jest.config.js) para habilitar de manera limpia el soporte de ESModules utilizando Next.js SWC en tests locales.

---

## 4. Refactorización de Seguridad v2.0

En la versión **v2.0**, se implementaron mejoras de seguridad de la información y robustez contable aprobadas por el Arquitecto de Software Senior:

### A. Eliminación de Almacenamiento Local (XSS Mitigation)

- Se retiró por completo la caché de `localStorage` para balances financieros. La aplicación ahora obtiene y almacena datos en memoria volátil de React directamente desde Supabase en tiempo real, erradicando la superficie de ataque XSS local sobre datos históricos persistidos en disco del navegador.

### B. Transición a UUIDv4 Gestionados por PostgreSQL

- Se eliminó la generación en frontend de IDs mediante `Date.now() + Math.random()`.
- La columna `id` de la tabla `services` en Supabase se migró de tipo `text` a `uuid`, asignando por defecto `uuid_generate_v4()`.
- Se renombró la columna de identificadores antigua a `legacy_id` (de tipo `text`), aplicando una restricción de unicidad (`UNIQUE`) para conservar la trazabilidad histórica de forma no destructiva.
- El frontend envía nuevos registros a Supabase sin especificar `id`, recibiendo de vuelta el objeto con su UUID generado por PostgreSQL.

### C. Inserciones por Lotes Optimistas

- Se optimizaron los flujos de importación (mes anterior, importación masiva de Excel, datos demo) para insertar todos los elementos en un lote único (`.insert(items).select()`) en lugar de solicitudes individuales en un ciclo, reduciendo la latencia de red.

### D. Restricciones Fuertes (CHECK Constraints) y Compilación

- Se añadieron restricciones `CHECK` a nivel de base de datos para impedir cargas de montos negativos (`amount >= 0`), importes domésticos absurdos (`amount <= 1000000000`) y tipos de registros no contemplados (`type IN ('service', 'loan', 'overdue', 'income')`).
- Se crearon índices compuestos sobre `(user_id, "paymentMonth")` para acelerar las consultas principales del Dashboard y un índice sobre `"dueDate"`.
- El proyecto compila de manera limpia (`npm run build`) y pasa con éxito la suite de pruebas unitarias (`npm run test`).
