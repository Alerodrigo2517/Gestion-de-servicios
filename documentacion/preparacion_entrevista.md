# 🚀 Guía de Preparación para Entrevistas Técnicas — ServiTrack

Esta guía compila las preguntas más difíciles, decisiones de diseño de software y conceptos de arquitectura que se implementaron en **ServiTrack** (v2.1). Está diseñada para que repases y puedas explicar con total seguridad y solidez técnica cada rincón de este proyecto ante un entrevistador o arquitecto de software.

---

## 🎙️ 1. El Elevator Pitch (Cómo vender el proyecto en 30 segundos)

> **Pregunta típica:** *"Háblame de un proyecto reciente que hayas desarrollado y los desafíos técnicos que enfrentaste."*
>
> **Respuesta ideal:**
> *"Desarrollé **ServiTrack**, una Single Page Application (SPA) premium construida sobre **Next.js (React)** y **Supabase** diseñada para el control y análisis inteligente de gastos del hogar. El mayor reto técnico no fue la interfaz, sino la **seguridad y robustez del estado**. Eliminé el caché en el cliente (`localStorage`) por razones de privacidad financiera y conecté la persistencia en tiempo real a PostgreSQL. Implementé **Seguridad a Nivel de Fila (RLS)** para aislar inquilinos (*multi-tenancy*), mitigaciones contra inyecciones XSS y de fórmulas de Excel, límites de tamaño (DoS) y optimicé la accesibilidad web bajo los estándares **WCAG 2.1 AA** implementando trampas de foco (*Focus Trap*) nativas y soporte para reducción de movimiento."*

---

## 🏛️ 2. Arquitectura General y Flujo de Datos

### P: ¿Por qué elegiste Next.js con la directiva `'use client'` en lugar de Server Components para este dashboard?
* **Respuesta sin pestañear:**
  "ServiTrack funciona como una SPA altamente reactiva e interactiva. Al ser un dashboard financiero donde el usuario actualiza estados en tiempo real (pagar un servicio, simular bajas con algoritmos, filtrar el calendario, abrir modales), la mayor parte de la lógica reside en el lado del cliente. Usar `'use client'` en [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) nos permite mantener un estado local unificado (`useState`) y actualizar la interfaz de manera optimista en milisegundos sin requerir re-renderizados del servidor en cada clic."

### P: ¿Cómo garantizas la integridad y seguridad de la base de datos si las peticiones se hacen directamente desde el navegador del cliente?
* **Respuesta sin pestañear:**
  "Utilizo tres capas de defensa complementarias:
  1. **Autenticación JWT:** El cliente se comunica con Supabase mediante tokens JWT firmados criptográficamente.
  2. **Row Level Security (RLS) en PostgreSQL:** La base de datos tiene habilitado RLS en la tabla `services`. Cualquier consulta (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) valida la condición `auth.uid() = user_id`. Si un atacante intenta enviar un payload alterado o interceptar la API usando la key pública anónima, PostgreSQL filtra e impide la lectura o escritura de datos ajenos.
  3. **CHECK Constraints en la Base de Datos:** Las validaciones de negocio críticas no se delegan solo al frontend. En la base de datos tenemos restricciones físicas como `amount >= 0`, `amount <= 1000000000` y `type IN ('service', 'loan', 'overdue', 'income')` para evitar datos corruptos."

---

## 🧼 3. Reactividad y Gestión de Estado (React)

### P: ¿Cómo manejas las llamadas asíncronas y previenes fugas de memoria (*memory leaks*) en la carga inicial?
* **Respuesta sin pestañear:**
  "En [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js), utilizo un `useEffect` para escuchar el cambio de estado de autenticación a través de `supabase.auth.onAuthStateChange`. Para prevenir fugas de memoria o suscripciones duplicadas, la función de callback del efecto retorna una función de limpieza (*cleanup function*) que desinscribe el listener de autenticación (`subscription.unsubscribe()`) al desmontarse el componente."

### P: ¿Cuál es la diferencia entre un `upsert` y un `insert` en tu flujo de datos y cómo afecta al estado de React?
* **Respuesta sin pestañear:**
  "En `handleSaveItem`, diferencio el comportamiento basándome en la presencia del `id` del registro:
  * **Creación:** El registro no tiene `id`. Hago un `insert()` a Supabase. Como el `id` (UUIDv4) y la fecha de creación son autogenerados por PostgreSQL, utilizo `.select().single()` en la petición para recibir la fila final creada y agregarla al estado local con `setServices((prev) => [...prev, data])`.
  * **Edición:** El registro ya posee un `id`. Realizo un `upsert()` en Supabase. En el frontend, actualizo el estado de manera optimista mapeando el array: `services.map((s) => s.id === itemData.id ? itemData : s)`. Esto asegura consistencia y evita viajes de red innecesarios para recargar toda la base de datos."

---

## 🛡️ 4. Seguridad Avanzada (XSS, SQLi, DoS y CSV Injection)

### P: ¿Es tu aplicación vulnerable a ataques XSS (Cross-Site Scripting)? ¿Por qué?
* **Respuesta sin pestañear:**
  "No. La aplicación está blindada contra XSS a través de tres mecanismos:
  1. **Estructura Declarativa de React:** React escapa por defecto todo el contenido renderizado dentro de llaves JSX `{}` convirtiéndolo en nodos de texto seguro (`document.createTextNode`). Si un usuario ingresa `<script>badCode()</script>` en el nombre de un servicio, se dibuja como texto literal en pantalla y no se ejecuta.
  2. **Ausencia de Directivas Inseguras:** La base de código no contiene `dangerouslySetInnerHTML`, ni llamadas a `eval()`, `document.write()` o asignaciones directas a `element.innerHTML`.
  3. **Control de Enlaces:** No hay atributos `href` expuestos que acepten texto dinámico del usuario, previniendo inyecciones del tipo `javascript:alert(1)`."

### P: ¿Cómo preveniste ataques de Denegación de Servicio (DoS) por almacenamiento en la aplicación y base de datos?
* **Respuesta sin pestañear:**
  "Implementé una mitigación en dos capas en la v2.1:
  1. **Capa Cliente (Frontend):** En [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js) y [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js), limitamos el almacenamiento a un máximo de **1000 registros por usuario** en todas las inserciones, importaciones de Excel o duplicación mensual. Adicionalmente, limitamos el tamaño de carga de archivos Excel a **2MB** para evitar que archivos gigantescos congelen el navegador al procesarse. En [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js) se agregaron límites de longitud de texto (`maxLength={100}`) en todos los inputs.
  2. **Capa Servidor (Base de Datos):** Para evitar que se salten el cliente usando peticiones directas HTTP a PostgREST con la clave anónima de la API, diseñamos un trigger en PostgreSQL (`trigger_check_services_limit`) que corre `BEFORE INSERT` y aborta la transacción lanzando una excepción si el usuario supera el límite de 1000 filas. También agregamos restricciones `CHECK (char_length(col) <= 100)` en las columnas de texto."

### P: ¿Qué es la inyección de fórmulas de Excel (CSV Injection) y cómo impacta a este sistema?
* **Respuesta sin pestañear:**
  "Es una vulnerabilidad que ocurre cuando la aplicación exporta datos ingresados por usuarios a un archivo Excel o CSV sin sanitizar. Si un usuario nombra un servicio como `=SUM(1+2)` o `=CMD|' /C calc'!A1` e interactúa con el sistema, al exportar los datos con ExcelJS y abrir el archivo en Microsoft Excel local, la suite intentará ejecutar el comando.
  * **Mitigación:** Prependemos una comilla simple `'` al inicio del texto si detectamos caracteres de fórmulas (`=`, `+`, `-`, `@`) para indicarle a Excel que debe procesar la celda como texto plano estrictamente."

---

## 🧮 5. Algoritmos y Lógica de Negocio

### P: Explica cómo implementaste el algoritmo de sugerencia en el simulador de bajas.
* **Respuesta sin pestañear:**
  "En [SimulationModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/SimulationModal.js), implementé un **Algoritmo Greedy (Ávido)** para resolver el problema de optimización de liquidez. El objetivo es sugerir al usuario qué servicios opcionales dar de baja para salir de una proyección de saldo negativa.
  * El algoritmo filtra los servicios no pagados de tipo 'service' (excluyendo deudas y préstamos obligatorios), los ordena de **mayor a menor costo** (priorizando el mayor impacto financiero inmediato), y va agregándolos a la lista de bajas sugeridas hasta que la proyección de liquidez resultante sea mayor o igual a cero. Esto proporciona una solución rápida y computacionalmente eficiente en $O(N \log N)$."

### P: ¿Cómo manejas las fechas para evitar problemas de desfases de zonas horarias (UTC) o desbordes de fin de mes?
* **Respuesta sin pestañear:**
  "Toda la lógica de fechas está centralizada en funciones puras dentro de [statusHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/statusHelper.js).
  * **Zonas Horarias:** Normalizamos los objetos `Date` a la medianoche local (`00:00:00`), evitando que desfases de zona horaria alteren los días restantes calculados para los vencimientos.
  * **Desborde de fin de mes:** JavaScript por defecto mueve al mes siguiente si se asigna un día inválido (ej: 31 de Febrero se convierte en 3 de Marzo). Diseñamos la función `getSafeDate(year, month, day)` que restringe el día máximo permitido para el mes destino (ej: si es Febrero, calcula si el año es bisiesto para limitar a 28 o 29 días), recortando la fecha de forma segura sin saltar de mes."

---

## ♿ 6. Accesibilidad Web (a11y) y Estándares WCAG 2.1 AA

### P: ¿Qué medidas de accesibilidad técnica implementaste en este proyecto?
* **Respuesta sin pestañear:**
  "Diseñé la aplicación bajo las pautas del nivel **WCAG 2.1 AA**:
  1. **Navegación por Teclado Completa:** Todos los formularios y diálogos son navegables mediante `Tab` y `Shift+Tab`. Al presionar `Escape`, los modales se cierran.
  2. **Focus Trap (Captura de Foco):** En los componentes de modales ([SimulationModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/SimulationModal.js), [ChartsModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ChartsModal.js)), implementé un handler nativo de teclado. Si el usuario presiona `Tab` en el último elemento enfocable, el foco regresa al primero (y viceversa con `Shift+Tab`), impidiendo que el foco se pierda en el fondo del dashboard. Al cerrarse el modal, se restaura el foco al botón que lo abrió.
  3. **Segregación Semántica de Alertas (ARIA):** Usamos `role="alert"` (anuncio prioritario) exclusivamente para fallos críticos o validaciones erróneas. Para actualizaciones de estado regulares (éxitos y cambios del banner) usamos `role="status"` con `aria-live="polite"` para no saturar a los usuarios de lectores de pantalla.
  4. **Reduced Motion:** En [globals.css](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/globals.css) implementé `@media (prefers-reduced-motion: reduce)` para desactivar animaciones complejas en usuarios sensibles."

---

## 🛠️ 7. Calidad de Software, Pruebas y DevOps

### P: ¿Cómo estructuraste las pruebas unitarias y qué validan?
* **Respuesta sin pestañear:**
  "Utilizo **Jest** para ejecutar pruebas de integración y unitarias automatizadas. Las pruebas se dividen en:
  * **Lógica de Fechas y Límites (`tests/logic.test.js`):** Valida bisiestos en `getSafeDate`, normalizaciones en transiciones de fin de año, y resolución retrocompatible de fechas en formatos antiguos.
  * **Reglas de Negocio y Liquidez (`tests/db.test.js`):** Prueba el impacto de `paymentSource` (Yo vs. Terceros), garantizando que las deudas costeadas por terceros no resten liquidez al balance mensual."

---

## 🎨 8. Diseño y Estética Premium (Aesthetics)

### P: ¿Cómo estructuraste la interfaz responsiva del footer para que se adapte perfectamente a móviles?
* **Respuesta sin pestañear:**
  "En [Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js) y [AuthComponent.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/AuthComponent.js), implementamos un footer con clases responsivas de Tailwind CSS.
  * Usamos `flex flex-col sm:flex-row items-center justify-center gap-1`. 
  * En dispositivos móviles, los elementos se apilan verticalmente de forma limpia y centrada, y ocultamos la barra vertical (`|`) mediante `hidden sm:inline`.
  * En pantallas mayores, se reorganizan de forma horizontal en una sola fila con la barra de separación visible, asegurando una estética impecable en cualquier resolución sin desbordamientos."
