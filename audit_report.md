# Reporte de Auditoría Funcional del Sistema (ServiTrack)

Hemos realizado una auditoría exhaustiva de la funcionalidad de la aplicación ServiTrack (extremo a extremo) tanto de forma automatizada como interactiva, utilizando tus credenciales reales (`alea90024@gmail.com` / `Rodri122444`). A continuación se detallan los resultados:

---

## 1. Resumen Ejecutivo de la Auditoría

| Módulo / Funcionalidad             |   Estado    | Detalles de la Verificación                                                                                              |
| :--------------------------------- | :---------: | :----------------------------------------------------------------------------------------------------------------------- |
| **Autenticación (Auth)**           | **EXITOSO** | Inicio de sesión, persistencia de sesión en Supabase Auth y funcionalidad de cierre de sesión.                           |
| **Seguridad de Datos (RLS)**       | **EXITOSO** | Aislamiento de datos por usuario (`auth.uid() = user_id`) verificado a nivel de base de datos.                           |
| **Creación de Ingresos (CRUD)**    | **EXITOSO** | Alta exitosa de ingresos (ej. "Sueldo Principal" por $250.000,00) con actualización en tiempo real del panel financiero. |
| **Creación de Servicios (CRUD)**   | **EXITOSO** | Alta exitosa de servicios con campos dinámicos (consumo físico, día de medición) y recordatorios automáticos.            |
| **Gestión de Estados (Pago)**      | **EXITOSO** | Transición de estado a "Pagado" con fecha del sistema, reduciendo la liquidez y aumentando los gastos totales/pagados.   |
| **Simulación de Bajas**            | **EXITOSO** | Visualización correcta de balances simulados, ahorros proyectados y sugerencias automáticas de cobertura.                |
| **Modales de Gráficos (Chart.js)** | **EXITOSO** | Carga y renderizado correcto de la Proyección Anual y el Historial de Consumo Físico.                                    |
| **Pruebas Unitarias**              | **EXITOSO** | Ejecución exitosa de la suite de pruebas unitarias (`jest`) con 100% de aprobación.                                      |

---

## 2. Detalle de Pruebas Funcionales

### A. Autenticación y Carga Inicial de Datos

- **Procedimiento:** Navegación a `http://localhost:5500/Gestion-de-servicios/index.html`, ingreso de credenciales de usuario y envío del formulario.
- **Resultado:** Inicio de sesión instantáneo y sincronización exitosa de los datos del usuario registrados en la base de datos de Supabase.

### B. Gestión Financiera (Ingresos y Servicios)

1. **Registro de Ingreso:** Se añadió un registro de ingreso de **$250.000,00**.
   - _Comportamiento del Dashboard:_ Los campos **Liquidez** e **Ingresos Netos** se actualizaron a **$250.000,00**.
2. **Registro de Servicio con Campos Dinámicos:** Se registró **"Luz Edesur"** con un estimado de **$5.000,00**, consumo físico de **150 kWh** y día de medición **15**.
   - _Comportamiento Dinámico:_ El panel de recordatorios generó inmediatamente el aviso: _"El día 15 pasarán a medir: Luz Edesur"_.
3. **Marcar como Pagado:** Se presionó el botón de pago en la tarjeta del servicio.
   - _Comportamiento del Dashboard:_ La **Liquidez** bajó a **$245.000,00**, los **Gastos Totales** y el **Total Pagado** se incrementaron en **$5.000,00**. Se registró la fecha de pago correctamente: `Pagado el: [Fecha Actual]`.

### C. Visualización de Gráficos (Reportes Visuales)

Los gráficos interactivos integrados con **Chart.js** se despliegan de forma fluida a través de sus respectivos modales:

- **Gráfico de Proyección Anual:**
  Muestra la proyección anual estimada de los gastos registrados:

  ![Gráfico de Proyección Anual](C:/Users/AALEJ/.gemini/antigravity-ide/brain/681f1172-df1c-45f2-8b69-a86caa7f57bc/proyeccion_anual_chart_1781052791211.png)

- **Gráfico de Historial de Consumo Físico:**
  Grafica el consumo físico en base a los datos de servicios (ej. kWh o m³):

  ![Gráfico de Consumo Físico](C:/Users/AALEJ/.gemini/antigravity-ide/brain/681f1172-df1c-45f2-8b69-a86caa7f57bc/consumo_fisico_chart_1781052868902.png)

---

## 3. Pruebas Unitarias de Regresión (`jest`)

Ejecutamos la suite de pruebas locales automatizadas para garantizar que la lógica de cálculo financiero no sufra regresiones:

```bash
> jest

PASS tests/db.test.js
PASS tests/logic.test.js

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        4.024 s
Ran all test suites.
```

## 4. Conclusión de la Auditoría

El sistema ServiTrack se encuentra en un **estado óptimo y completamente operativo**. Los problemas de navegación de pestañas reportados anteriormente fueron corregidos en su totalidad y el sistema de sincronización con Supabase funciona de forma segura y consistente.
