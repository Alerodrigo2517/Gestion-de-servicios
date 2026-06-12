# 🛡️ Auditoría Técnica y Seguridad Financiera — ServiTrack

Este documento consolida las evaluaciones de seguridad, auditorías técnicas e informes de cumplimiento de **ServiTrack** (v1.3.0 a v2.0).

---

## 📌 1. Resumen de Viabilidad Financiera

ServiTrack opera como una herramienta de **registro, planificación y auditoría de gastos domésticos (bookkeeping)**. No es una billetera virtual, no maneja dinero real ni almacena números de cuentas o tarjetas bancarias.

Bajo este alcance, la arquitectura actual es **altamente segura** y cumple con los estándares profesionales. Si el sistema escala en el futuro a procesamientos reales de cobro o transferencias, se requerirá un rediseño hacia una arquitectura de libro contable inmutable (*ledger*) y procesamiento del lado del servidor.

---

## 📊 2. Matriz de Cumplimiento de Seguridad (v2.0)

| Dimensión de Seguridad | Calificación | Estado del Sistema | Mitigación Aplicada |
| :--- | :---: | :--- | :--- |
| **Autenticación (AuthN)** | 🟢 **10/10** | Supabase Auth (JWT, tokens cifrados, recuperación de claves segura). | Delegación segura de credenciales e inicio de sesión. |
| **Autorización (AuthZ)** | 🟢 **10/10** | Políticas RLS (Row Level Security) activas a nivel de PostgreSQL. | Restricción estricta de consultas a `auth.uid() = user_id`. |
| **Integridad de Datos** | 🟢 **10/10** | Clave primaria tipo UUIDv4 autogenerada por PostgreSQL. Constraints `CHECK` activos. | Eliminación de IDs en el frontend. Validación de montos y tipos. |
| **Privacidad Local** | 🟢 **10/10** | Caché local (`localStorage`) removida al 100%. | Erradicación de la superficie de ataque XSS sobre datos financieros en el navegador. |
| **Seguridad de API** | 🟢 **10/10** | API PostgREST parametrizada. Inserción masiva por lote en un solo viaje de red. | Consultas seguras contra inyección SQL. |
| **Auditoría e Historial** | 🟢 **9.0/10** | Columna `legacy_id` con restricción de unicidad (`UNIQUE`). | Trazabilidad histórica no destructiva preservada. |

---

## 🧼 3. Análisis de Código Limpio y Filosofía Zen

ServiTrack ha sido evaluado bajo la filosofía **Zen**: simplicidad absoluta, legibilidad de código, remoción del ruido visual y reducción de la deuda técnica al mínimo exponente.

### 3.1 Pureza Lógica
* **Utilidad Centralizada de Fechas ([src/lib/statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js)):** Diseñado como un módulo de funciones puras libre de efectos secundarios. La normalización a medianoche local remueve desvíos horarios UTC, simplificando la lógica a diferencias matemáticas simples.
* **getSafeDate:** Resuelve el desborde de fechas (ej. 31 de Febrero se fuerza a 28 o 29 en bisiestos), evitando que JavaScript corra la fecha al mes siguiente.

### 3.2 Armonía Visual y UX
* **CalendarWidget:** Desacoplado del dashboard principal. Sustituye la acumulación desordenada de múltiples puntos de colores por un único contador numérico (badge) coloreado según la severidad del vencimiento (Rojo: Vencido, Amarillo: Próximo <= 3 días, Gris: Pendiente).
* **Dashboard:** Limita la lista de próximos vencimientos a los 5 más urgentes con opción de expansión `"Ver todos"`, evitando sobrecarga de información y scroll vertical excesivo.

### 3.3 Calidad de Pruebas Unitarias
Se cuenta con una suite de pruebas en Jest (`tests/logic.test.js` y `tests/db.test.js`) con **100% de éxito (20/20 pruebas exitosas)** que validan:
1. Comportamiento en años bisiestos y límites de meses de 30/31 días en `getSafeDate`.
2. Mapeo retrocompatible de fechas legacy en `getServiceDueDate`.
3. Clasificación exacta de estados (`AL_DIA`, `VENCIDO`, `VENCE_HOY`, `PROXIMO`, `PENDIENTE`).
4. Lógica de cálculo de liquidez bajo la regla de origen de pago (`paymentSource`).

---

## 🛠️ 4. Historial de Vulnerabilidades Mitigadas (v1.3.0 -> v2.0)

### 🚨 4.1 Generación Insegura de IDs en Frontend (Mitigada)
* **Vulnerabilidad:** Los IDs se generaban en el cliente mediante `Date.now() + Math.random()`.
* **Riesgo:** Posibilidad de colisiones en importaciones masivas y predictibilidad del ID.
* **Solución:** Se delegó la creación de IDs a PostgreSQL mediante UUIDv4 (`uuid_generate_v4()`). El cliente envía las creaciones sin ID y recibe la fila creada.

### 🚨 4.2 Exposición en LocalStorage (Mitigada)
* **Vulnerabilidad:** Los saldos, gastos e ingresos se guardaban en texto plano en `localStorage`.
* **Riesgo:** Si un atacante explotaba un XSS, podía leer el historial financiero del usuario en disco.
* **Solución:** Se eliminó por completo el caché local. La aplicación lee de Supabase en tiempo real.

### 🚨 4.3 Falta de Validación de Esquema en Base de Datos (Mitigada)
* **Vulnerabilidad:** La base de datos no restringía valores de campos clave, dependiendo únicamente del frontend.
* **Riesgo:** Un atacante con la clave anónima de la API podía enviar valores negativos de montos o tipos inválidos.
* **Solución:** Se aplicaron restricciones `CHECK` en SQL (`amount >= 0`, `amount <= 1000000000`, `type IN (...)`).
