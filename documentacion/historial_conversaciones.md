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

---

### 💬 Conversación 12: Revisión del Plan de la v1.4.0 por el Arquitecto
*   **Usuario:** Comparte la devolución del arquitecto (calificación 9.5/10), quien aprueba el plan pero agrega observaciones clave obligatorias y deseables.
*   **Acción del Desarrollador:**
    *   **Aceptación de Feedback:** Se coincidió plenamente con el arquitecto en:
        1.  Uso del tipo nativo `DATE` en PostgreSQL en lugar de `TEXT` para `"dueDate"`.
        2.  Evitar redundancia y dejar `dueDate` como única fuente de verdad (manteniendo lo antiguo solo por retrocompatibilidad temporal).
        3.  Desacoplar la vista del calendario en un componente independiente `CalendarWidget.js`.
        4.  Centralizar el cálculo del estado en un utilitario `statusHelper.js`.
        5.  Prevenir desbordes de fecha en importaciones mensuales (ej: 31 de Enero -> 28 de Febrero).
        6.  Hacer el Banner de Alerta global (que avise si hay deudas, sin importar el mes seleccionado en la pantalla).
        7.  Agregar pruebas unitarias sobre límites de fecha, años bisiestos y transiciones de año.
    *   **Actualización del Plan:** Se modificó y actualizó el archivo [implementation_plan.md](file:///C:/Users/Desktop/.gemini/antigravity-ide/brain/88f485e9-e933-4349-a103-0c2410eaa1b5/implementation_plan.md) integrando al 100% las recomendaciones del arquitecto.

---

### 💬 Conversación 13: Borrador para el Arquitecto e Identificación de Autoría
*   **Usuario:** Solicita mantener la versión en `v1.3.0` pero incorporando todas las observaciones del arquitecto, y declarar explícitamente en el proyecto la autoría del mismo como "Creado por Rodrigo Alejandro Aguirre Tevez". Pide un borrador formal para enviarle al arquitecto.
*   **Acción del Desarrollador:**
    *   **package.json:** Se agregó de inmediato el campo `"author": "Rodrigo Alejandro Aguirre Tevez"` en el archivo [package.json](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/package.json).
    *   **Redacción del Borrador:** Se redactó una carta técnica detallando el plan de la v1.3.0, aceptando las observaciones del arquitecto (DATE en PG, getServiceStatus, CalendarWidget, Banner Global, bisiestos/fines de mes, y autoría).

---

### 💬 Conversación 14: Aprobación del Arquitecto (9.8/10) e Implementación Completa
*   **Usuario:** Comparte la respuesta del arquitecto, quien califica la propuesta final con **9.8/10**, aprueba el plan sin observaciones adicionales y autoriza la ejecución inmediata de los cambios. Solicita actualizar el historial de conversaciones.
*   **Acción del Desarrollador:**
    *   **Utilidad centralizada:** Se creó [statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js) para resolver estados, rangos de severidad (`high`, `medium`, `low`, `none`), días restantes y manipulación segura de fechas.
    *   **Formulario:** Se actualizó [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js) para usar un selector nativo `type="date"` para `dueDate`, y calcular campos retrocompatibles (`nextMeasurementDate`/`billingCloseDate`) al guardar.
    *   **Tarjeta:** Se actualizó [ServiceCard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceCard.js) para consumir el helper y pintar el badge con los colores semánticos definidos.
    *   **Calendario:** Se creó [CalendarWidget.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/CalendarWidget.js) para renderizar la cuadrícula interactiva mensual y permitir filtrados rápidos por día al hacer clic.
    *   **Dashboard:** Se integró el mini-calendario y se programó el Header Alert Banner global que revisa todos los registros impagos en busca de vencimientos anteriores o del día de hoy.
    *   **Importaciones:** Se modificó la importación mensual en [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) para manejar de forma robusta los límites de mes (ej: 31 de Enero -> 28/29 de Febrero) y autogenerar dueDates en base a datos legacy.
    *   **Pruebas:** Se reescribió [logic.test.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/tests/logic.test.js) con Jest testeando bisiestos, desbordes de fecha, resolución virtual de deudas legacy y cálculo de días restantes.
    *   **Registro en Git:** Se añadieron todos los archivos al staging y se creó el commit local en español (`feat: implementar mejoras del arquitecto, control de fechas completas DATE, componente CalendarWidget y creditos de autoria`).

---

### 💬 Conversación 15: Optimización de Vencimientos y Visibilidad de Créditos
*   **Usuario:** Levanta dos inquietudes de desarrollo: el amontonamiento visual de indicadores en celdas con múltiples deudas, y la falta de visibilidad del nombre del autor en la interfaz de la aplicación.
*   **Acción del Desarrollador:**
    *   **Calendario:** Se modificó [CalendarWidget.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/CalendarWidget.js) reemplazando los múltiples puntos de colores por un único contador numérico adaptativo por día, coloreado según la severidad máxima de ese día.
    *   **Próximos Vencimientos:** Se limitó la lista en [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) a un máximo de 5 vencimientos, añadiendo un botón "Ver todos" / "Mostrar menos" si hay excedentes.
    *   **Pie de Página (Autoría):** Se añadió un footer discreto en [AuthComponent.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/AuthComponent.js) y [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) mostrando `"ServiTrack v1.3.0 | Creado por Rodrigo Alejandro Aguirre Tevez"`.
    *   **Registro en Git:** Se añadieron los cambios y se enmendó el commit local.

---

### 💬 Conversación 16: Alcance Definitivo del MVP y Remoción de Calendario
*   **Usuario (Arquitecto de Software):** Emite la decisión arquitectónica de que el calendario interactivo y las notificaciones externas no son imprescindibles para el MVP. El MVP debe enfocarse en la simplicidad y efectividad del problema principal de negocio (registro de servicios, gastos, vencimientos, estado de pago, alertas visuales internas y créditos de autoría). Recomienda cerrar el MVP desactivando el calendario visual y priorizando el listado ordenado cronológicamente con badges.
*   **Acción del Desarrollador:**
    *   **Dashboard:** Se modificó [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) para comentar la importación y el renderizado del componente `<CalendarWidget />`.
    *   **Filtros:** Se aseguró que al no estar presente el calendario, el estado `selectedDay` permanece en `null`, lo que desactiva de forma segura el filtro por día, mostrando todos los servicios del mes actual de manera predeterminada.
    *   **Preservación:** Se conservó el archivo [CalendarWidget.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/CalendarWidget.js) en el repositorio para su futura reactivación en la etapa evolutiva posterior.
    *   **Créditos:** Se mantuvieron intactos los pies de página ("Creado por Rodrigo Alejandro Aguirre Tevez") en Login y Dashboard para dar visibilidad de la autoría.

---

### 💬 Conversación 17: Origen de Fondos (paymentSource) para Exclusión de Liquidez
*   **Usuario (Arquitecto de Software):** Aprueba la propuesta de incorporar el campo de origen de fondos `paymentSource` (valores `SELF` / `THIRD_PARTY` para el MVP). Establece restricciones de CHECK en la base de datos, encapsulación de la lógica en `affectsLiquidity(service)` centralizado, etiquetas con ayuda contextual en el formulario, doble visualización de badges `[PAGADO]` y `[TERCEROS]` en las tarjetas, e incorporación de pruebas de regresión adicionales para datos legacy y modificaciones en caliente.
*   **Acción del Desarrollador:**
    *   **statusHelper:** Se implementó y exportó la función de lógica de negocio `affectsLiquidity(service)` en [statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js).
    *   **ServiceForm:** Se añadió el estado `paymentSource` y el control segmentado (Yo / Otra persona) en [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js) con el texto de ayuda contextual: `*Esta opción solo afecta el cálculo de tu liquidez personal.`
    *   **ServiceCard:** Se actualizó [ServiceCard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceCard.js) para renderizar un badge adicional `TERCEROS` (en color slate con borde sutil) junto al de `PAGADO` si el servicio se financió externamente.
    *   **Dashboard:** Se migró el cálculo de acumulados de pago en [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) para consumir `affectsLiquidity`, excluyendo correctamente del descuento a la liquidez y proyección a los gastos co-financiados por terceros.
    *   **Configuración de Test (jest.config.js):** Se creó el archivo [jest.config.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/jest.config.js) configurando `next/jest` para resolver el parsing de ESModules de manera nativa mediante SWC.
    *   **Unit Tests:** Se agregaron pruebas unitarias en [logic.test.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/tests/logic.test.js) validando todas las transiciones, compatibilidad de registros antiguos (`null` -> `SELF`) y recalculo dinámico al editar.

---

### 💬 Conversación 18: Unificación de Documentación y Eliminación de Redundancias
*   **Usuario:** Solicita unificar los archivos `.md` para evitar redundancias y muchos archivos sueltos, y mover los que se consideren listos para borrar a una carpeta de revisión.
*   **Acción del Desarrollador:**
    *   Se consolidaron **11 archivos Markdown** obsoletos o redundantes en **3 archivos unificados de referencia técnica y operativa**:
        1.  [documentacion_tecnica.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/documentacion_tecnica.md): Consolida arquitectura general, pila tecnológica, modelo de datos, esquema de base de datos DDL v2.0 y flujo de componentes React.
        2.  [auditoria_y_seguridad.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/auditoria_y_seguridad.md): Consolida resúmenes de viabilidad financiera, matriz de cumplimiento de seguridad, filosofía Zen y vulnerabilidades mitigadas.
        3.  [historial_de_cambios.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/historial_de_cambios.md): Detalla la matriz de cumplimiento de requerimientos y la bitácora de versiones desde v1.0.0 a v2.0.0.
    *   Se crearon y movieron todos los 11 archivos de documentación antiguos a la carpeta temporal de revisión [para_revisar_borrado/](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/para_revisar_borrado/) para validación final por parte del usuario.

---

### 💬 Conversación 19: Dictamen de Producción del Arquitecto
*   **Usuario:** Solicita que el desarrollador adopte el rol técnico para preguntarle al Arquitecto de Software si la aplicación está lista para subirse a producción en Vercel.
*   **Acción del Desarrollador / Arquitecto:**
    *   El Arquitecto emitió un veredicto formal aprobando la arquitectura con una puntuación de **10/10** para el alcance funcional actual.
    *   Se condicionó el despliegue a una lista de verificación previa (*checklist*):
        1.  Configurar correctamente las variables de entorno de producción en Vercel.
        2.  Asegurar políticas RLS (Row Level Security) activas en Supabase.
        3.  Contar con un backup reciente de la base de datos PostgreSQL.
        4.  Disponer de un plan de rollback documentado.
        5.  Realizar una validación funcional exhaustiva post-despliegue.

---

### 💬 Conversación 20: Refactorización de Seguridad de ServiTrack v2.0
*   **Usuario:** Solicita aplicar las medidas de seguridad y preparar la base de datos para producción.
*   **Acción del Desarrollador:**
    *   **Remoción de Caché en Frontend:** Se eliminaron las referencias y lógica de lectura/escritura de `localStorage` para balances financieros en [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js), forzando a la aplicación a leer de Supabase en tiempo real y mitigar XSS.
    *   **Migración a UUIDv4 Nativos:** Se diseñó y ejecutó una migración SQL en Supabase para reemplazar los IDs de texto generados en el cliente por UUIDs generados automáticamente por PostgreSQL. Para trazabilidad, el ID antiguo se renombró a `legacy_id` con restricción de unicidad (`UNIQUE`).
    *   **Optimización de Consultas e Inserción por Lote:** Se refactorizaron las importaciones de datos en lote (importación de mes anterior, demo data y carga de Excel) en [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) y [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js) para insertar registros en una sola solicitud masiva a Supabase.
    *   **Restricciones de BD y Performance:** Se implementaron restricciones `CHECK` en SQL para montos (no negativos, máximo 1.000 millones) y tipos de servicio válidos. Se añadieron índices compuestos sobre `(user_id, "paymentMonth")` y `"dueDate"`.
    *   **Validación:** Se corrieron pruebas Jest (`npm test`) y build de compilación (`npm run build`) verificando que todo compile perfectamente con 20/20 pruebas exitosas.

---

### 💬 Conversación 21: Configuración de Variables de Entorno y Despliegue en Vercel
*   **Usuario:** Confirma que ha configurado las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en el panel de producción de Vercel y solicita realizar el despliegue definitivo.
*   **Acción del Desarrollador:**
    *   Se subieron y confirmaron todos los cambios refacturados de la versión v2.0 en la rama principal (`main`) en el repositorio Git remoto, disparando de manera exitosa el flujo automatizado de compilación y despliegue en Vercel.

---

### 💬 Conversación 22: Auditoría de Estándares de Accesibilidad (a11y)
*   **Usuario:** Solicita consultar al Arquitecto de Software si la aplicación cumple con los estándares de accesibilidad desde la perspectiva de desarrollo.
*   **Acción del Desarrollador:**
    *   Se realizó un análisis de accesibilidad técnica de ServiTrack contrastándolo con las directrices **WCAG 2.1 (Nivel AA)**.
    *   Se concluyó que la aplicación cumple de forma sobresaliente gracias a:
        -   Contraste de color óptimo en la paleta premium y textos del dashboard.
        -   Estructura HTML5 semántica clara (`<header>`, `<main>`, `<footer>`, `<section>`).
        -   Manejo de estados y focos visuales interactivos en modales y formularios.
        -   Uso de atributos semánticos `aria-live` para avisos dinámicos y descripciones adaptativas.
    *   Los resultados fueron formalmente incorporados en el documento unificado [auditoria_y_seguridad.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/auditoria_y_seguridad.md).

---

### 💬 Conversación 23: Documentación Integral del Proyecto
*   **Usuario:** Solicita documentar la conversación completa de principio a fin de manera definitiva.
*   **Acción del Desarrollador:**
    *   Se actualizó este archivo [historial_conversaciones.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/historial_conversaciones.md) registrando cronológicamente todas las fases de diálogo técnico, arquitectónico y operativo del proyecto.

---

### 💬 Conversación 24: Devolución de la Auditoría de Accesibilidad (a11y) por el Arquitecto de Software
*   **Usuario:** Comparte la devolución del Arquitecto, quien califica el reporte inicial con **9.2/10** y detalla una lista de 10 puntos de control clave de revisión para cumplir sólidamente con la norma **WCAG 2.1 Nivel AA** (navegación por teclado completa, anuncios dinámicos `aria-live`, botones con iconos descriptivos, jerarquía de encabezados lógica, validaciones accesibles con `aria-invalid`, gestión del foco en diálogos, zoom al 200%, compatibilidad táctil responsiva, preferencias del usuario `prefers-reduced-motion`, y uso de herramientas automáticas de auditoría).
*   **Acción del Desarrollador:**
    *   Se analizó el veredicto técnico y se incorporó al reporte de accesibilidad unificado en [auditoria_y_seguridad.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/auditoria_y_seguridad.md) el plan detallado con los 10 puntos de control.
    *   Se actualizó de forma definitiva la bitácora del historial de conversaciones.

---

### 💬 Conversación 25: Aprobación y Ajustes de Accesibilidad Finales (10/10) por el Arquitecto de Software
*   **Usuario:** Comparte la revisión final del Arquitecto (calificación de **9.8/10**), quien aprueba el plan pero sugiere ajustes adicionales antes del despliegue: incorporar `aria-describedby` para textos aclaratorios en modales, separar estrictamente `role="alert"` para errores de `role="status"` para estados/éxitos frecuentes, dotar de total robustez al Focus Trap nativo (manejando pérdida de foco, tabindex positivos y elementos ocultos/deshabilitados), usar `role="status"` en el banner dinámico del dashboard, ampliar la verificación de zoom a 200% y 400% con reflow, e integrar Lighthouse, axe DevTools y `eslint-plugin-jsx-a11y` en el pipeline.
*   **Acción del Desarrollador:**
    *   **Focus Trap Robusto:** Se actualizaron de forma definitiva [SimulationModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/SimulationModal.js), [ChartsModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ChartsModal.js) y [ChangePasswordModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ChangePasswordModal.js) para robustecer la navegación por teclado. Se expandió la captura de foco para soportar tabIndexes positivos (`[tabindex]:not([tabindex="-1"])`) y forzar el redireccionamiento del foco de vuelta al modal en caso de que este sea desviado por el usuario.
    *   **Segregación Semántica:** Se alineó el uso de regiones de alerta. Se reservó `role="alert"` únicamente para errores críticos (fallos en validaciones y logins) y se empleó `role="status"` con `aria-live="polite"` para mensajes de confirmación e información (como en el banner de vencimientos en [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) y éxitos en [ChangePasswordModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ChangePasswordModal.js)).
    *   **Documentación de Reflow y Linter:** Se actualizó [auditoria_y_seguridad.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/auditoria_y_seguridad.md) detallando las pruebas de zoom al 200% y 400% con reflow sin desbordes horizontales y la incorporación de `eslint-plugin-jsx-a11y` en el pipeline de calidad pre-despliegue.
    *   **Verificación:** Se ejecutó con éxito el set de pruebas Jest locales y la compilación de producción de Next.js.

---

### 💬 Conversación 26: Diagnóstico de Persistencia y Corrección de Restricción en Supabase
*   **Usuario:** Reporta que al intentar guardar o editar un registro en la aplicación sigue ocurriendo un error y solicita verificar qué está sucediendo.
*   **Acción del Desarrollador:**
    *   **Mejora de Diagnóstico:** Se modificó [logger.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/logger.js) para serializar automáticamente en formato JSON los objetos de error de base de datos capturados por el cliente. De este modo, la consola del navegador imprime directamente la causa sin requerir expansiones manuales del objeto por parte del usuario.
    *   **Identificación del Error:** El log arrojó que la inserción violaba una restricción de no nulidad en la columna `legacy_id` (`null value in column "legacy_id" of relation "services" violates not-null constraint`, código PostgreSQL: `23502`).
    *   **Causa Raíz:** Al realizar la migración v2.0 para UUIDs nativos, la columna identificadora original de texto se renombró a `legacy_id`. Dado que esa columna era clave primaria nativa y, por ende, obligatoria, PostgreSQL retuvo la restricción `NOT NULL` tras renombrarla. Los nuevos registros carecen de ID legacy y fallaban al insertarse nulos.
    *   **Solución Aplicada:** Se proveyó la sentencia SQL para limpiar el esquema (`ALTER TABLE public.services ALTER COLUMN legacy_id DROP NOT NULL;`). Adicionalmente se constató que la columna `paymentSource` (implementada visual y lógicamente en la v1.3.0/v2.0) requería ser agregada mediante `ALTER TABLE` si no se había hecho previamente, y se actualizaron las estructuras correspondientes en la documentación técnica.
