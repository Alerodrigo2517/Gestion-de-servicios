# Historial de Evolución de Versiones - ServiTrack

Este documento detalla la evolución técnica y de características de **ServiTrack** (Sistema de Gestión de Servicios) a partir de su historial de commits y cambios estructurales.

---

## 📌 Versión Actual del Sistema: **v1.3.0**

Basándonos en la nomenclatura de **Versionado Semántico (SemVer)** y la evolución del proyecto, la versión actual de ServiTrack es la **v1.3.0**.

*   **Autor Principal:** **Rodrigo Alejandro Aguirre Tevez**
*   **Mayor (`1`):** Refleja la estabilidad del sistema migrado a un framework de producción moderna (Next.js, React, Supabase) listo para producción, superando la etapa inicial de prototipo.
*   **Menor (`3`):** Incorporación de la columna `dueDate` (`DATE` en PostgreSQL), el componente independiente `<CalendarWidget />`, la centralización en `statusHelper.js`, el Banner Global de alertas, y lógica robusta de límites de fecha y años bisiestos.
*   **Parche (`0`):** Refleja el inicio del ciclo de la versión menor 1.3 con limpieza previa de fallbacks de credenciales expuestas y linter warnings eliminados.

---

## ⏱️ Línea de Tiempo de Evolución

El desarrollo del sistema ha transitado por tres fases principales: **Prototipo Vanilla**, **Migración e Integración de Servicios en la Nube**, y **Maduración de Funciones y Rediseño Premium**.

| Versión | Tipo de Cambio | Commit de Origen | Fecha | Descripción Principal |
| :--- | :--- | :--- | :--- | :--- |
| **v0.1.0** | Inicial | `d77d7af` | 22 de Mayo, 2026 | Primer prototipo funcional en Vanilla JS y LocalStorage. |
| **v0.1.1** | Parche | `3671915` | 9 de Junio, 2026 | Ajustes de configuración del editor y correcciones menores en la UI. |
| **v0.5.0** | Menor | `cca3de4` | 9/10 de Junio, 2026 | Integración de bases de datos, sistema de login y estructura del framework. |
| **v1.0.0** | **MAYOR** | `5a55f5f` | 10 de Junio, 2026 | Migración completa a Next.js, React y Supabase con documentación técnica. |
| **v1.1.0** | Menor | `6301a40` | 10 de Junio, 2026 | Implementación de cambio/recuperación de contraseña y mejoras de formulario. |
| **v1.2.0** | Menor | `fc1834c` | 10 de Junio, 2026 | Rediseño visual UI/UX Glassmorphic premium y optimizaciones móviles. |
| **v1.2.1** | Parche | `32f3f02` | 10 de Junio, 2026 | Corrección de bug de maquetación en el dropdown de herramientas. |
| **v1.3.0** | Menor | `f7ca11d` | 11 de Junio, 2026 | Mejoras del Arquitecto, fecha DATE PostgreSQL, CalendarWidget, Banner Global, bisiestos y créditos Rodrigo Aguirre Tevez. |

---

## 🔍 Detalle Histórico de Versiones

### 🪵 v0.1.0 y v0.1.1: Fase de Prototipo Vanilla (Local)
*   **Estado:** Primera implementación del sistema.
*   **Pila Tecnológica:** HTML5, CSS3 clásico, JavaScript Vanilla, almacenamiento local (`localStorage`), exportaciones a Excel con `excel.js` en frontend y renderizado de gráficos nativos en `charts.js`.
*   **Hitos de Archivos:**
    *   Creación de archivos base: `index.html`, `style.css`, `app.js`, `ui.js`, `storage.js`, `charts.js` y `excel.js`.
    *   Definición de pruebas unitarias iniciales (`tests/db.test.js` y `tests/logic.test.js`).

---

### 🌐 v0.5.0: Fase de Integración y Framework
*   **Estado:** Fase de transición hacia servicios escalables.
*   **Pila Tecnológica:** Primeros pasos para integrar bases de datos relacionales y autenticación en la nube, organizando la estructura de dependencias (`node_modules`).
*   **Hitos de Archivos:**
    *   Configuración de seguridad y entornos.
    *   Estructura preliminar para autenticación de usuarios y conexión remota.

---

### 🚀 v1.0.0: Migración Completa (ServiTrack Next.js)
*   **Estado:** Primera versión estable oficial de producción.
*   **Pila Tecnológica:** Next.js 14, React 18, Supabase (Autenticación y base de datos PostgreSQL), Tailwind CSS 3 y PostCSS.
*   **Cambios Clave:**
    *   **Eliminación** del código en JS Vanilla (`app.js`, `ui.js`, `style.css`, `storage.js`).
    *   **Migración** del archivo de utilidades Excel a [src/lib/excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js).
    *   **Estructuración** moderna del proyecto:
        *   [src/app/page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) (Página principal de la aplicación).
        *   Componentes de interfaz como [AuthComponent.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/AuthComponent.js), `Dashboard.js`, `ServiceForm.js`, `ChartsModal.js`, `SimulationModal.js`.
        *   Estilos globales basados en Tailwind CSS en [src/app/globals.css](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/globals.css).

---

### 🔑 v1.1.0: Funcionalidades de Seguridad y UI Formulario
*   **Estado:** Incremento de características de usuario.
*   **Cambios Clave:**
    *   Implementación de la lógica de recuperación de contraseña y cambio de clave con la creación de los componentes [ResetPasswordView.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ResetPasswordView.js) y `ChangePasswordModal.js`.
    *   Mejoras estéticas y funcionales en los campos de formulario de servicios (`ServiceForm.js`), mejorando el flujo de entrada de datos.

---

### 🎨 v1.2.0 y v1.2.1: Experiencia Premium y Parches Visuales
*   **Estado:** Estado de arte actual.
*   **Cambios Clave:**
    *   **Rediseño Visual Premium:** Renovación de [src/app/globals.css](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/globals.css) para incorporar un diseño moderno con efectos de Glassmorphism (paneles translúcidos, desenfoques de fondo, degradados vibrantes y bordes sutiles).
    *   **Optimización Móvil:** Adaptación y reestructuración de componentes para una experiencia fluida y responsive en smartphones y tablets.
    *   **Parche v1.2.1:** Corrección de bug de maquetación en el menú desplegable del Dashboard eliminando propiedades de scroll horizontal que provocaban recortes indeseados en la lista de herramientas.

---

### 📅 v1.3.0: Mejoras del Arquitecto, Autoría y Consolidación del Sistema
*   **Estado / Fecha de Implementación:** 11 de Junio, 2026.
*   **Autor Principal:** **Rodrigo Alejandro Aguirre Tevez**
*   **Cambios Clave:**
    *   **Seguridad y Linter:** Remoción de claves de Supabase fijas en [supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js) migrándolas a [.env.local](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/.env.local) y creación de [logger.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/logger.js) para ESLint.
    *   **PostgreSQL DATE y dueDate:** Uso del tipo nativo `DATE` en Supabase para `dueDate` como fuente única de verdad, manteniendo de forma segura retrocompatibilidad con las columnas legacy (`nextMeasurementDate`/`billingCloseDate`).
    *   **statusHelper Centralizado:** Se implementó [statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js) para calcular de forma unificada la urgencia, alertas y diferencia de días normalizados a medianoche local.
    *   **Calendario Widget (roadmap):** Se creó [CalendarWidget.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/CalendarWidget.js) para desacoplar el calendario y mostrar contadores numéricos agregados por día. Se decidió desactivarlo (comentarlo) en la UI principal del Dashboard de la versión **v1.3.0** final para acotar el alcance al MVP según determinaciones del Arquitecto, manteniéndose disponible en el repositorio para futuras fases.
    *   **Panel de Vencimientos Acotado:** Se limitó a los 5 vencimientos más urgentes en el Dashboard con un botón dinámico para "Ver todos", manteniendo la visualización limpia.
    *   **Visibilidad de la Autoría en UI:** Se inyectó el footer visible `"ServiTrack v1.3.0 | Creado por Rodrigo Alejandro Aguirre Tevez"` tanto en el Dashboard como en el formulario de Login de [AuthComponent.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/AuthComponent.js).
    *   **Banner Global de Alerta:** Integración de aviso persistente en el encabezado del Dashboard que detecta y lista todos los servicios impagos y vencidos/venciendo hoy a lo largo de todo el historial.
    *   **Importaciones y Casos Límite:** Cálculo robusto en la clonación de periodos mensuales (ej. 31/01 a 28/02) y años bisiestos usando utilidades de clip de fecha.
    *   **Origen de Fondos (paymentSource):** Incorporación de la columna `paymentSource` en base de datos. Se agregó un control segmentado en [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js) con la etiqueta *"¿Quién pagó este servicio?"* y ayuda contextual. Si está marcado como financiado por terceros (`THIRD_PARTY`), el servicio no resta de la liquidez ni de la proyección del usuario.
    *   **Badges de Terceros:** Integración de un badge secundario gris `TERCEROS` junto al de `PAGADO` en [ServiceCard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceCard.js) para reflejar visualmente el origen.
    *   **Lógica Centralizada (affectsLiquidity):** Encapsulación de la regla contable en la función `affectsLiquidity(service)` dentro de [statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js).
    *   **Configuración de Tests (jest.config.js):** Creación del archivo [jest.config.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/jest.config.js) para habilitar de manera limpia el soporte de ESModules utilizando Next.js SWC.
    *   **Pruebas Robustas:** Ampliación en [logic.test.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/tests/logic.test.js) probando años bisiestos, desbordes de fin de mes, virtualización de deudas antiguas, estados de urgencia, comportamiento de registros legacy e impactos de edición de origen de fondos.


---

## 🛠️ Buenas Prácticas Recomendadas para Futuras Versiones

Para mantener un control adecuado del desarrollo de ServiTrack, se aconseja seguir las siguientes pautas en commits futuros:

1.  **Etiquetado Git (Git Tags):** Al compilar versiones estables, registrar etiquetas con:
    ```bash
    git tag -a v1.3.0 -m "Versión estable con variables de entorno de Supabase seguras, logger para ESLint y vencimientos de servicios unificados"
    git push origin v1.3.0
    ```
2.  **Actualización de `package.json`:** Incrementar la clave `"version"` según corresponda (actualizada a `"1.3.0"` en el archivo `package.json` para reflejar el estado actual).
3.  **Registro de Cambios (Changelog):** Mantener este archivo actualizado con cada fusión a la rama principal (`main`/`master`).
