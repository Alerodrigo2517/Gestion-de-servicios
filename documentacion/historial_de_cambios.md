# 📈 Historial de Cambios y Cumplimiento — ServiTrack

Este documento contiene la evolución de versiones de **ServiTrack**, el análisis de cumplimiento de requerimientos y la bitácora de cambios detallada.

---

## 📊 1. Análisis de Cumplimiento de Requerimientos vs. Estado Actual

Comparativa detallada de cobertura de requerimientos funcionales en ServiTrack:

| Módulo / Requerimiento      |   Estado    | Detalle en v2.0                                                                                               | Próximos pasos para escalabilidad                                                |
| :-------------------------- | :---------: | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| **Acceso y Autenticación**  | **CUMPLE**  | Supabase Auth. Login, registro y recuperación de clave implementados.                                         | Habilitar MFA.                                                                   |
| **Gestión de Servicios**    | **CUMPLE**  | Alta de servicios con empresa, monto, número de cliente, estado (pagado/pendiente), día de medición y cierre. | Adjuntar archivo/URL del comprobante a Supabase Storage.                         |
| **Gestión de Ingresos**     | **PARCIAL** | Permite registrar ingresos por monto y origen de forma mensual, con edición e historial básico.               | Agregar categorías específicas (Sueldo, Ventas, Alquileres).                     |
| **Gestión de Egresos**      |  **FALTA**  | Solo permite registrar egresos conceptualizados como "servicios" o "préstamos".                               | Crear formulario de Gastos Diarios con categorías fijas.                         |
| **Dashboard Financiero**    | **PARCIAL** | Muestra balance del mes, ingresos, egresos, liquidez disponible, servicios pagados y pendientes.              | Mostrar distribución de gastos por categorías en gráficos Chart.js.              |
| **Recordatorios / Alertas** |  **FALTA**  | No cuenta con lógica de alertas activas por fechas de vencimiento en servidor.                                | Implementar notificaciones por correo mediante Edge Functions y pg_cron.         |
| **Módulo de Presupuestos**  |  **FALTA**  | No existe la posibilidad de fijar límites por categorías.                                                     | Agregar tabla de límites en Supabase.                                            |
| **Objetivos de Ahorro**     |  **FALTA**  | Solo tiene simulador de ahorro Greedy temporal.                                                               | Crear panel para fijar metas estables (Auto, Fondo, etc.) con barra de progreso. |
| **Reportes y Gráficos**     | **PARCIAL** | Gráfico de barra apilada anual, consumo físico estacional y exportación estilizada a Excel.                   | Exportación directa a PDF y comparativas cruzadas.                               |

---

## 🏷️ 2. Historial de Versiones de la Aplicación

### Versión 2.0.0 (12 de Junio, 2026) — Refactorización de Seguridad y Consistencia

- **Caché Eliminado:** Remoción total de `localStorage` para balances financieros, mitigando ataques de secuestro de datos por XSS.
- **UUIDs Nativos:** Transición de IDs de texto generados en cliente a UUIDv4 gestionados por PostgreSQL de forma atómica.
- **Trazabilidad:** Renombrado de columna `id` heredada a `legacy_id` con restricción `UNIQUE` para preservar la integridad histórica.
- **Inserción por Lotes:** Optimización de funciones de importación de mes anterior, carga de Excel y generación de demo para realizar batch inserts en un solo viaje de red.
- **CHECK Constraints:** Añadidas restricciones a nivel de base de datos para impedir montos negativos, importes mayores a 1.000 millones y tipos inválidos.
- **Índice Compuesto:** Creado índice sobre `(user_id, "paymentMonth")` para acelerar consultas.

### Versión 1.3.0 (11 de Junio, 2026) — Optimización de Fechas y Origen de Fondos

- **Fechas Nativas:** Reemplazo de campos numéricos legacy por un input `type="date"` nativo enlazado a la propiedad `dueDate` (tipo `DATE` en base de datos). Mapeo de reversa para no romper compatibilidad en Excel.
- **Lógica Centralizada:** Creación de `statusHelper.js` con funciones puras para resolver diferencia de fechas (normalizadas a medianoche) y recortar límites de meses en `getSafeDate`.
- **Origen de Pago (`paymentSource`):** Implementación de la opción de pago por terceros (`THIRD_PARTY` o `SELF`) en `ServiceForm.js` y renderizado de badges secundarios en `ServiceCard.js`. Exclusión de gastos de terceros en el cálculo de liquidez del Dashboard.
- **CalendarWidget:** Componente desacoplado con contadores agregados por color de severidad máxima.

### Versión 1.2.0 (10 de Mayo, 2026) — Integración en la Nube

- **Supabase Client:** Migración de almacenamiento local persistente a Supabase Auth y Supabase Database.
- **Logger Centralizado:** Implementación de `logger.js` para suprimir logs en consola en producción.
- **Suite de Pruebas:** Adición de Jest en el proyecto para validar cálculos.

### Versión 1.1.0 (20 de Abril, 2026) — Visualización y Reportes

- **Chart.js:** Modales interactivos para gráficos de barras apiladas de proyección anual e histogramas de consumo físico estacional.
- **excelHelper.js:** Motor de generación de reportes financieros de alta calidad con estilos, bordes zebra, fórmulas de balance anual y exportación de gráficos.

### Versión 1.0.0 (1 de Marzo, 2026) — Producto Mínimo Viable (SPA)

- Core SPA en JavaScript Vanilla con registro de servicios, montos, meses y simulación Greedy de ahorro.
- Estilos Glassmorphic base.
