# Plan Maestro: Gestión de Servicios del Hogar

Este documento contiene el plan de implementación detallado para replicar de manera idéntica la aplicación de "Gestión de Servicios del Hogar" construida hasta la fecha. Si sigues estas instrucciones y especificaciones técnicas, obtendrás el mismo resultado.

## Descripción del Proyecto

Una aplicación web (Single Page Application) sin framework, construida con HTML, CSS (Vanilla) y JavaScript (Vanilla). La aplicación permite al usuario registrar, visualizar y organizar los gastos de servicios del hogar ordenados por "Mes de Pago", con soporte para importar servicios recurrentes, analizar el gasto mediante _insights_ inteligentes y gráficos, y exportar/importar toda la información a Excel (incluyendo el gráfico de proyección en el propio Excel).

## Tecnologías Utilizadas

- **Core:** HTML5, CSS3, JavaScript (ES6+).
- **Almacenamiento:** `localStorage` (bajo la clave `household_services_v2`).
- **Librerías Externas:**
  - `Chart.js`: Para renderizar la proyección anual en un gráfico de barras apiladas.
  - `ExcelJS`: Para generar y leer archivos `.xlsx` complejos en el navegador.
  - `FileSaver.js`: Para disparar la descarga automática del archivo Excel generado.
  - **Fuentes e Íconos:** `Inter` (Google Fonts) y SVGs inline para la iconografía.

## Diseño Visual (Aesthetics)

El diseño es premium, utilizando una interfaz "Dark Mode" con técnicas de **Glassmorphism**.

- **Fondo (Background):** Un color base oscuro (`#0f172a`) con un `radial-gradient` en las esquinas que mezcla tonos celestes (`rgba(56, 189, 248, 0.1)`) y morados (`rgba(168, 85, 247, 0.1)`).
- **Tarjetas (Glass):** Fondos traslúcidos `rgba(30, 41, 59, 0.7)` con `backdrop-filter: blur(12px)` y bordes blancos tenues para dar la sensación de cristal.
- **Tipografía:** Familia tipográfica `Inter`. Los títulos principales utilizan un gradiente de color (`-webkit-background-clip: text`) de azul a morado.
- **Botones:** Botones con iconos SVG, animaciones de transición suaves al hacer `hover`, y colores semánticos (azul para importar, esmeralda para exportar, rojo para eliminar, verde para pagar).

## Estructura de Archivos

El proyecto se compone de 3 archivos principales:

### 1. `index.html` (Estructura)

Contiene la estructura básica de la página:

- Importación de Google Fonts y librerías por CDN (`chart.js`, `exceljs`, `FileSaver.js`).
- Un `<header>` con el título y botones de acciones globales (Importar Excel, Exportar Excel, Ver Proyección).
- Una navegación principal (`<nav id="months-tabs">`) que renderizará los botones de los 12 meses (tabs).
- Un área principal (`<main>`) dividida en:
  - Título del mes y Totales (Pendiente/Pagado).
  - Panel de _Insights_ (alertas inteligentes de ahorro o aumento de gastos).
  - Formulario para añadir gastos (Nombre, Monto estimado, Mes de Consumo y opcionalmente hasta qué mes abarca).
  - Lista de Gastos generada dinámicamente.
- Un modal superpuesto (oculto por defecto) para mostrar el Canvas del gráfico de Chart.js.

### 2. `style.css` (Estilos)

Define todo el sistema de diseño visual:

- **Variables CSS (`:root`):** Colores principales (`--bg-color`, `--text-main`, `--primary`, `--danger`, `--success`, `--warning`) y valores para el efecto "Glass".
- **Sistema de Grid/Flexbox:** Para asegurar que el formulario y la lista se posicionen lado a lado en pantallas grandes.
- **Clases para UI:**
  - `.glass`: Aplicado al contenedor principal de la carpeta y al modal.
  - Estilos de pestañas (Tabs) simulando pestañas de carpetas físicas.
  - Estilos condicionales para tarjetas de servicio: tachado (`text-decoration: line-through`) y baja opacidad cuando están "pagados".
  - Estilos semánticos para los _insights_ (borde izquierdo rojo, verde o azul).

### 3. `app.js` (Lógica de Negocio)

Es el corazón de la aplicación y maneja todo el flujo de datos:

#### A. Gestión de Estado y Pestañas

- Usa un arreglo global `services` cargado desde el `localStorage`.
- Gestiona una variable `currentMonthIndex` para saber en qué pestaña se encuentra el usuario.
- Función `renderApp()` centralizada que se ejecuta cada vez que cambia el mes o los datos, actualizando los totales, la lista y los insights.

#### B. Operaciones CRUD (Crear, Leer, Actualizar, Eliminar)

- El formulario intercepta el evento `submit` para agregar o editar un servicio.
- Cada servicio se guarda con un objeto de la forma:
  ```json
  {
    "id": "1653141...",
    "name": "Luz",
    "amount": 5000,
    "consumptionMonth": 0,
    "consumptionMonthEnd": null,
    "paymentMonth": 0,
    "isPaid": false
  }
  ```
- Funciones expuestas al `window` para `editService`, `togglePaid`, y `deleteService` para que el HTML pueda llamarlas directamente desde eventos inline `onclick`.

#### C. Funcionalidad: "Importar del Mes Anterior"

- Si hay servicios en el mes anterior (mes X-1), aparece un botón "Importar del mes anterior".
- Al presionar, copia los servicios que aún no existan en el mes actual (mes X), basándose en el nombre (ignorando mayúsculas/minúsculas).
- Desplaza el `consumptionMonth` automáticamente +1 para que refleje el período correcto de consumo del nuevo mes.

#### D. Motor de Insights Inteligentes

- Compara los servicios del `paymentMonth` actual vs el `paymentMonth - 1`.
- Calcula 3 métricas que se muestran sobre el formulario:
  1. Diferencia en el subtotal estimado (Aumentó o Disminuyó el gasto global).
  2. Detección de nuevos servicios agregados este mes que no estaban el mes anterior.
  3. Variaciones individuales por servicio (ej. "Luz subió $500", "Ahorraste $200 en Agua") si la variación supera el 5%.

#### E. Proyección Anual (Chart.js)

- Al abrir el modal, destruye la instancia anterior y crea un gráfico de barras apiladas (`type: 'bar', stacked: true`).
- En el Eje X están los 12 meses.
- Crea un `dataset` único por cada servicio pendiente (no pagado), asignándole un color dinámico a partir de una paleta predefinida.

#### F. Importación y Exportación a Excel (ExcelJS)

- **Exportar (`exportToExcel`)**:
  - Ordena los datos cronológicamente por mes.
  - Inserta subtotales calculados debajo de cada mes (agrupación visual).
  - Inserta debajo del subtotal las frases del _insight_ en la hoja de Excel, fusionando celdas e italicizándolas.
  - Inserta un total general anual al final.
  - Aplica estilos (colores de fuente, bordes, patrón cebra, y formato numérico de moneda).
  - **Generación de Gráfico Invisible:** Renderiza el chart en un `canvas` oculto en memoria, lo exporta a Base64, e inserta la imagen de la proyección directamente en la misma hoja de Excel (Columna G, Fila 1).
- **Importar (`fileImportExcel.addEventListener`)**:
  - Lee el archivo `.xlsx`, salta el encabezado y las filas de "TOTAL".
  - Parsea el nombre, monto, meses (de texto a índice) y estado.
  - Valida, crea un ID temporal y lo agrega a la matriz `services`.
  - Fuerza el re-renderizado (`renderApp`) y guarda en localStorage.

## Resumen de Aprobación

Con este plan tienes la "receta" exacta. Puedes crear los archivos, copiar sus lógicas basándote en esta estructura, y la aplicación funcionará de manera idéntica.

> [!IMPORTANT]
> **Aprobación Requerida:** Por favor, revisa este Plan de Implementación. Si consideras que captura al 100% lo que hemos construido hasta el momento, aprueba el plan y habremos completado tu solicitud exitosamente.
