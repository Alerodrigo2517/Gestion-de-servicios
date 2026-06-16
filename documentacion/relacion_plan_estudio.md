# 🎓 Relación del Plan de Estudio de Desarrollo de Software con ServiTrack

Este documento detalla cómo los contenidos teóricos y prácticos de la **Tecnicatura Superior en Desarrollo de Software (Resolución 5847/19)** se ven aplicados en el código de **ServiTrack**. Utiliza esta guía para repasar los temas de la carrera con ejemplos reales de este proyecto.

---

## 📌 Primer Año

### 1. Administración y Gestión de Base de Datos (96 Hs)
* **Contenido curricular:** Diseño de bases de datos relacionales, Modelo Entidad-Relación, lenguaje SQL (DDL, consultas, modificaciones), restricciones de integridad, seguridad y accesos.
* **Aplicación en ServiTrack:**
  * **Modelo de Datos y DDL:** El esquema de base de datos relacional para PostgreSQL y las restricciones (`CHECK constraints`) están documentados en la sección SQL DDL de [documentacion_tecnica.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/documentacion_tecnica.md#L102-L159).
  * **Restricciones Físicas (Integridad):** Validaciones a nivel base de datos como `amount >= 0`, `type IN (...)` y `paymentSource IN (...)` evitan el ingreso de datos corruptos independientemente del frontend.
  * **Seguridad a Nivel de Fila (RLS):** Las políticas de Supabase aseguran que cada usuario acceda únicamente a sus datos (`auth.uid() = user_id`).
  * **Triggers y Performance:** El límite físico de registros se mitiga mediante triggers en PostgreSQL y cuenta con índices compuestos (`idx_services_user_month`) para mejorar el rendimiento de búsqueda.

### 2. Introducción a la Programación (96 Hs)
* **Contenido curricular:** Concepto de algoritmo, estructuras fundamentales (variables, tipos, expresiones, asignaciones, control condicional e iterativo), manipulación de colecciones (arreglos/listas) y pasaje de parámetros.
* **Aplicación en ServiTrack:**
  * **Algoritmos de CRUD:** Lógica para insertar, editar y eliminar registros en el frontend manipulando estados reactivos en [page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js).
  * **Estructuras de Control y Manipulación de Listas:** Uso intensivo de métodos funcionales de ES6 como `.map()`, `.filter()` y `.reduce()` para procesar los servicios mensuales.
  * **Pasaje de Parámetros e Inmutabilidad:** Flujo de datos e inmutabilidad en React para evitar efectos secundarios al actualizar el estado local de los registros financieros.

---

## 📌 Segundo Año

### 3. Programación (96 Hs) y Desarrollo de Sistemas Orientado a Objetos (128 Hs)
* **Contenido curricular:** Modularidad, encapsulación, clases y objetos, colecciones de tamaño variable (listas, colas), administración de excepciones y programación orientada a eventos.
* **Aplicación en ServiTrack:**
  * **Estructura Modular:** El software está dividido en componentes autocontenidos y reutilizables dentro de `src/components/`.
  * **Programación Orientada a Eventos:** Interacción con el usuario mediante manejadores de eventos (clicks, envíos de formulario, cambios de input) que alteran el estado global.
  * **Manejo de Excepciones:** Flujo de captura de errores (`try-catch`) al comunicarse con la API de Supabase para evitar caídas de la interfaz.

### 4. Diseño Web (64 Hs)
* **Contenido curricular:** Código HTML5 semántico, maquetación CSS3, selectores, variables CSS nativas, DOM, JSON para intercambio de datos y llamadas asíncronas con eventos.
* **Aplicación en ServiTrack:**
  * **Estructura y Estilos:** Combinación de HTML dinámico (JSX) con **Tailwind CSS** para un diseño responsivo de alta calidad.
  * **Intercambio de Datos:** Consumo de APIs remotas enviando y recibiendo payloads en formato **JSON** en tiempo real.
  * **Variables CSS (Custom Properties):** Definición de la paleta de colores y variables globales en [globals.css](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/globals.css).

### 5. Álgebra y Lógica (64 Hs) / Estadística y Probabilidades (64 Hs)
* **Contenido curricular:** Álgebra de Boole (tablas de verdad y lógica de control), representación gráfica de datos, estadística descriptiva y recolección de información.
* **Aplicación en ServiTrack:**
  * **Estadística Descriptiva y Gráficos:** Visualización interactiva del consumo estacional y de la distribución de gastos por categoría utilizando la librería **Chart.js** dentro de [ChartsModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ChartsModal.js).
  * **Fórmulas Financieras y Lógica Booleana:** Cálculos matemáticos en el dashboard ([Dashboard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/Dashboard.js)) para calcular ingresos netos, deudas pendientes, liquidez real (evaluando el origen de fondos `paymentSource`) y proyecciones de saldo.

### 6. Desarrollo de Aplicativos Móviles (96 Hs)
* **Contenido curricular:** Diseño de layouts, interfaces de usuario, componentes multimedia y adaptabilidad a dispositivos móviles.
* **Aplicación en ServiTrack:**
  * **Diseño Mobile-First:** El dashboard y el menú principal están diseñados bajo la filosofía responsiva con Tailwind para asemejar el comportamiento de una app nativa en dispositivos iOS y Android.

---

## 📌 Tercer Año

### 7. Desarrollo de Sistemas Web (128 Hs)
* **Contenido curricular:** Concepto de Backend y Frontend, sesiones de usuario, transferencia segura de datos, cookies, autenticación, autorización y seguridad avanzada (mitigación de inyecciones y ataques web).
* **Aplicación en ServiTrack:**
  * **Autenticación y Sesiones:** Integración completa de login, registro, restablecimiento de contraseña y gestión de la sesión del usuario mediante tokens JWT en [AuthComponent.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/AuthComponent.js).
  * **Seguridad (OWASP Top 10):**
    * **XSS:** Mitigado por el sistema de escape de strings nativo de React (JSX).
    * **CSV/Excel Injection (Inyección de fórmulas):** En [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js), se antepone una comilla simple (`'`) a celdas que inician con `=`, `+`, `-` o `@` para neutralizar la ejecución de comandos locales en Excel al exportar.
    * **DoS (Denegación de Servicio):** Control de carga de archivos Excel limitado a **2MB** en el cliente y validación de un máximo de **1000 registros por usuario** (tanto en el frontend como mediante un trigger en base de datos PostgreSQL).

### 8. Ingeniería de Software (128 Hs)
* **Contenido curricular:** Ciclo de vida del software, especificación de requerimientos (funcionales y no funcionales), patrones de diseño, arquitectura de software en capas e integración.
* **Aplicación en ServiTrack:**
  * **Arquitectura de Software:** Separación limpia de responsabilidades (*Separation of Concerns*). La capa visual está en `src/components/`, mientras que la lógica de cálculo y conexión a servicios externos está en `src/lib/`.
  * **Algoritmos Greedy (Ávidos):** En [SimulationModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/SimulationModal.js), se aplica un algoritmo greedy para el simulador de bajas. Ordena los servicios opcionales de mayor a menor costo y sugiere darlos de baja de forma óptima hasta resolver el saldo negativo.

### 9. Metodología de Pruebas de Sistemas (64 Hs)
* **Contenido curricular:** Tipos de pruebas (unitarias, integración, funcionales), diseño de casos de prueba y frameworks de automatización.
* **Aplicación en ServiTrack:**
  * **Pruebas Automatizadas:** Configuración de la suite de pruebas mediante [jest.config.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/jest.config.js).
  * **Casos de Test:** Pruebas unitarias de Jest bajo el directorio `tests/` para verificar el funcionamiento de las reglas matemáticas de balances financieros y desbordes de fecha.

### 10. Gestión de Proyectos (64 Hs)
* **Contenido curricular:** Planificación de proyectos, técnicas de relevamiento, análisis de requisitos, documentación de usuario y trabajo colaborativo.
* **Aplicación en ServiTrack:**
  * **Documentación Técnica:** Planificación y guías de desarrollo documentadas en la carpeta [documentacion/](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion).

---

## 🔍 Temas del Plan de Estudio que Faltan en el Proyecto

Debido a que ServiTrack es una aplicación web de alto nivel (SPA), hay ciertas áreas del plan de estudios que no están representadas en este proyecto:

1. **Sistemas Digitales (Bajo Nivel):** Álgebra de Boole a nivel físico, compuertas lógicas, simplificaciones con mapas de Karnaugh y circuitos combinacionales.
2. **Laboratorio de Hardware:** Componentes físicos (motherboard, chipset), diagnóstico de fallas físicas y configuración de BIOS/CMOS.
3. **Sistemas Operativos:** Algoritmos de planificación de CPU, paginación/segmentación de memoria virtual y llamadas al sistema del kernel.
4. **Redes de Datos (Capa Física y Enlace):** Cableado, subredes, configuración de hardware de red (Routers/Switches) y protocolos locales.
5. **Desarrollo Móvil Nativo:** Compilación con lenguajes nativos (Kotlin/Swift) y acceso a APIs internas de hardware (cámara local, micrófono o intents telefónicos).
6. **Matemáticas Aplicadas Avanzadas:** Matrices y espacios vectoriales (Análisis Matemático) y distribuciones/teoremas de probabilidad complejos (Estadística).

---

## 💡 Viabilidad de Nuevas Implementaciones en este Repositorio

Si deseas ampliar el proyecto para repasar más temas del plan de estudio, considera la siguiente viabilidad técnica:

### 🟢 Lo que SÍ se puede implementar (Viable)
* **Estadística Predictiva:** Implementar algoritmos de **regresión lineal** en JavaScript para proyectar el consumo futuro basándote en el historial de gastos.
* **Bases de Datos Avanzadas:** Diseñar **Vistas de PostgreSQL** (Views) en la base de datos de Supabase para agregaciones complejas y consumirlas en Next.js.
* **Sincronización en Tiempo Real:** Configurar el cliente en tiempo real de Supabase para actualizar la UI en vivo entre múltiples dispositivos abiertos a la vez.
* **Pruebas y DevOps:** Crear flujos de integración continua (CI/CD) con **GitHub Actions** y pruebas automatizadas de extremo a extremo (E2E) con **Playwright**.
* **Aplicación Web Progresiva (PWA):** Configurar un Service Worker para permitir la instalación de ServiTrack en teléfonos inteligentes y su uso sin conexión.

### 🔴 Lo que ROTUNDAMENTE NO se puede implementar (Inviable)
* **Control de Hardware:** Modificar o leer voltajes, buses de datos, slots de memoria o registros físicos del procesador.
* **Acceso Directo al Kernel:** Programar algoritmos de asignación de CPU del SO o esquemas de paginación de memoria real.
* **Manipulación de Archivos del Sistema:** Leer o escribir fuera del almacenamiento aislado del navegador web (sandbox) por motivos de seguridad.
* **Configuración de Dispositivos de Red:** Cambiar tablas de ruteo IP del cliente o configurar hardware local de enlace mediante código JS/Next.js.
* **Código Nativo Directo:** Compilar archivos nativos Swift/Kotlin sin un wrapper híbrido (como Capacitor/Cordova).

