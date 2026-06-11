# Historial de Conversaciones y Decisiones de Diseño - ServiTrack

Este documento registra cronológicamente las conversaciones, auditorías, respuestas del arquitecto y decisiones de diseño tomadas durante el desarrollo del proyecto **ServiTrack** (v1.2.1-patched).

---

## Sesión 1: Auditoría Técnica y Delimitación del MVP
**Fecha:** 11 de Junio, 2026

### 💬 Conversación 1: Solicitud de Auditoría
*   **Usuario:** Revisar el proyecto y realizar una auditoría completa especificando la versión del sistema, guardando el resultado en un archivo `.md`.
*   **Acción del Desarrollador:**
    *   Se identificó la versión actual del proyecto como **v1.2.1**.
    *   Se ejecutó el linter (`npm run lint`), encontrando **9 advertencias** de `no-console`.
    *   Se ejecutaron las pruebas unitarias (`npm test`), con **100% de éxito** (5/5 pruebas pasadas).
    *   Se redactó el reporte detallado en [documentacion/baja_importancia/audit_report.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/baja_importancia/audit_report.md).
    *   *Hallazgo crítico de seguridad:* Existencia de credenciales de Supabase hardcodeadas en duro como fallbacks en [src/lib/supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js).

---

### 💬 Conversación 2: Resolución de Mejoras a Corto Plazo
*   **Usuario:** Aplicar las mejoras surgidas de la auditoría, exceptuando las de largo plazo.
*   **Acción del Desarrollador:**
    *   Se creó el archivo gitignorado [.env.local](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/.env.local) para almacenar las claves de Supabase.
    *   Se actualizó [supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js) para forzar la lectura estricta de las variables de entorno sin fallbacks expuestos.
    *   Se creó una utilidad de logueo personalizada [logger.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/logger.js) para encapsular las llamadas de consola y evitar warnings en producción.
    *   Se actualizaron [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) y [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) para usar la utilidad `logger`.
    *   Se verificó que el linter quedó **100% libre de advertencias** (`✔ No ESLint warnings or errors`) y los tests siguen pasando sin errores.

---

### 💬 Conversación 3: Ajuste del Reporte de Auditoría
*   **Usuario:** No borrar la información original del reporte de auditoría (como la lista de warnings y el fragmento expuesto), sino conservarlos y comentar las soluciones al lado.
*   **Acción del Desarrollador:**
    *   Se reescribió [audit_report.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/baja_importancia/audit_report.md) restaurando los hallazgos iniciales de consola expuesta y claves hardcodeadas.
    *   Se incorporó en cada sección un bloque de **"Nota de Corrección (v1.2.1-patched)"** detallando la solución aplicada para cada hallazgo y documentando el estado actual resuelto.

---

### 💬 Conversación 4: Consulta al Arquitecto
*   **Usuario:** Redactar una propuesta de mensaje para consultar al arquitecto si la versión actual califica como el MVP de cierre y si se puede continuar con la visión a futuro.
*   **Acción del Desarrollador:**
    *   Se redactó un correo/mensaje formal y técnico detallando los logros del MVP actual (Auth, RLS, responsive, tests, Excel, simulador Greedy), las correcciones de corto plazo y tres preguntas clave para el arquitecto.

---

### 💬 Conversación 5: Respuesta del Arquitecto y Opinión
*   **Usuario:** Compartió la respuesta del arquitecto, la cual sugiere delimitar el alcance estrictamente a los **servicios básicos del hogar** (Luz, Agua, Gas, Internet) y posponer el control de gastos generales del hogar para versiones futuras para evitar sobrediseño.
*   **Opinión del Desarrollador:**
    *   Se consideró que el enfoque del arquitecto es excelente y reduce la deuda técnica, puesto que nos evita crear bases de datos secundarias para transacciones rápidas.
    *   Se destacó que estamos al 90% del MVP definitivo propuesto por el arquitecto, restando afinar los "Próximos Vencimientos" de manera cronológica en el Dashboard y unificar la "Fecha de vencimiento" en el formulario.

---

### 💬 Conversación 6: Viabilidad Técnica Inmediata
*   **Usuario:** Consultar si es viable realizarlo ahora o si se requiere otra consulta al arquitecto.
*   **Opinión del Desarrollador:**
    *   Es 100% viable de inmediato. La especificación del arquitecto es clara.
    *   **Estrategia técnica propuesta:** Para no alterar la base de datos de Supabase con migraciones de columnas, se reutilizarán las columnas existentes `"nextMeasurementDate"` (Día de Medición) y `"billingCloseDate"` (Día de Cierre de Facturación) en el formulario, mapeándolas visualmente en la UI como "Día de Vencimiento" según sea el tipo de servicio.
    *   Se ordenarán cronológicamente en el Dashboard todos los servicios del mes con `isPaid = false` en una sección llamada "Próximos Vencimientos".

---

### 💬 Conversación 7: Creación del Historial
*   **Usuario:** Registrar esta conversación en un archivo `.md` de historial de conversaciones y mantenerlo actualizado.
*   **Acción del Desarrollador:**
    *   Se creó este documento [historial_conversaciones.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/historial_conversaciones.md) para registrar de manera persistente las decisiones del equipo.

---

### 💬 Conversación 8: Implementación de Mejoras del Arquitecto (Cierre de MVP)
*   **Usuario:** Solicita realizar las mejoras definidas por el arquitecto.
*   **Acción del Desarrollador:**
    *   **En Formulario:** Se habilitaron los campos de vencimiento para todos los servicios/gastos atrasados. Si es un servicio genérico, se muestra el campo "Día de Vencimiento" (guardado en la columna `nextMeasurementDate` en Supabase).
    *   **En Tarjeta de Servicio:** Se añadió a la metadata textual del servicio la leyenda `| Vence el día X` de forma contextual.
    *   **En Dashboard:** Se rediseñó el panel de recordatorios. Ahora extrae todos los servicios mensuales con `isPaid = false`, los ordena cronológicamente por su día de vencimiento y pinta una lista compacta y visual llamada **"Próximos Vencimientos del Mes"**.
    *   **Validaciones:** El linter (`npm run lint`) y los tests unitarios (`npm test`) se ejecutaron con éxito y quedaron libres de advertencias o fallos.

---

### 💬 Conversación 9: Versionamiento del Proyecto a v1.3.0
*   **Usuario:** Pregunta si el sistema sigue siendo la versión 1.2.1 o si cambiaría tras los cambios.
*   **Acción del Desarrollador:**
    *   **Determinación:** De acuerdo con las reglas de *Versionado Semántico (SemVer)*, al incorporar nuevas funcionalidades compatibles con las anteriores (campo de vencimiento generalizado, metadata en tarjetas y lista cronológica de próximos vencimientos), corresponde incrementar el número de versión **Menor** (segundo dígito).
    *   **Actualización:** Se incrementó la versión a **v1.3.0** en [package.json](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/package.json) y se actualizaron los reportes y bitácoras asociadas.

---

### 💬 Conversación 10: Registro Histórico de Versiones y Fechas
*   **Usuario:** Solicita registrar de forma persistente cada versión que se elabore con sus respectivos detalles y fechas de implementación.
*   **Acción del Desarrollador:**
    *   Se actualizó el documento técnico de control [historial_versiones.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/media_importancia/historial_versiones.md) indicando el paso a la **v1.3.0** con fecha **11 de Junio, 2026**.
    *   Se detallaron los 5 pilares de cambios de esta versión en el archivo (Seguridad de credenciales, Linter clean con logger, Día de Vencimiento unificado, Widget cronológico en Dashboard, y metadata en tarjetas).
    *   Se actualizaron las recomendaciones de Git Tags del archivo para utilizar la versión `v1.3.0`.

---

### 💬 Conversación 11: Error de Pre-renderizado en Vercel
*   **Usuario:** Reporta que Vercel falló durante la compilación (`next build`) debido a la falta de variables de entorno de Supabase al pre-renderizar la ruta raíz `/`.
*   **Acción del Desarrollador:**
    *   **Diagnóstico:** Al no estar definidas las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en los ajustes de Vercel al compilar, el validador estricto de `supabase.js` lanzó un error fatal que detuvo el build.
    *   **Solución en Código:** Se modificó [supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js) de forma defensiva para mostrar una advertencia (`console.warn`) en lugar de lanzar una excepción fatal durante el pre-renderizado de compilación, utilizando fallbacks de prueba temporales.
    *   **Acciones del Usuario:** Se indicaron los pasos para configurar las variables de entorno de Supabase directamente desde el panel de control de Vercel (Settings -> Environment Variables) para habilitar el funcionamiento real de la base de datos en producción.
    *   **Subido a Git:** Se agregaron los cambios, se realizó commit en español (`fix: prevenir error de prerrenderizado en compilacion sin variables de entorno`) y se empujó a la rama principal en GitHub para disparar el redeploy automático en Vercel.




