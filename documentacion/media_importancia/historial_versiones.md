# Historial de Evolución de Versiones - ServiTrack

Este documento detalla la evolución técnica y de características de **ServiTrack** (Sistema de Gestión de Servicios) a partir de su historial de commits y cambios estructurales.

---

## 📌 Versión Actual del Sistema: **v1.3.0**

Basándonos en la nomenclatura de **Versionado Semántico (SemVer)** y la evolución del proyecto, la versión actual de ServiTrack es la **v1.3.0**. 

*   **Mayor (`1`):** Refleja la estabilidad del sistema migrado a un framework de producción moderna (Next.js, React, Supabase) listo para producción, superando la etapa inicial de prototipo.
*   **Menor (`3`):** Incorporación del campo unificado de vencimiento de facturas en todo el sistema y la sección visual cronológica de "Próximos Vencimientos del Mes" en el Dashboard.
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
| **v1.3.0** | Menor | `f7ca11d` | 11 de Junio, 2026 | Limpieza de credenciales, integración de logger custom y soporte de vencimientos unificados en MVP. |

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

### 📅 v1.3.0: Seguridad, Limpieza y Alineación del MVP
*   **Estado / Fecha de Implementación:** 11 de Junio, 2026.
*   **Cambios Clave:**
    *   **Seguridad de Credenciales:** Remoción de claves de Supabase fijas como fallbacks en [supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js). Se migró la configuración a variables de entorno en el archivo [.env.local](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/.env.local), que está listado en `.gitignore`.
    *   **Limpieza de Consolas (ESLint):** Se creó la utilidad [logger.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/logger.js) para evitar la salida de consolas no deseadas en entornos productivos y eliminar 9 avisos de linter de `no-console`.
    *   **Día de Vencimiento Generalizado:** Se implementó el campo de fecha de vencimiento en [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js) para cualquier servicio cargado por el usuario, reutilizando las columnas de base de datos sin alterar el esquema físico.
    *   **Widget "Próximos Vencimientos":** Rediseño en [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) para listar ordenados de manera cronológica (del día 1 al 31) todos los servicios impagos del periodo seleccionado.
    *   **Metadata en Tarjetas:** Se modificó [ServiceCard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceCard.js) para renderizar dinámicamente la leyenda `| Vence el día X`.

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
