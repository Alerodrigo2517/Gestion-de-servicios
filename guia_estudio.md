# Guía de Estudio: Lógica Detrás de ServiTrack

¡Qué gran iniciativa! Construir un proyecto de cero es la mejor forma de afianzar tus conocimientos en desarrollo de software. Esta guía desglosa toda la lógica y los conceptos fundamentales que utilicé para construir esta aplicación sin usar frameworks (pura lógica Vanilla JS).

---

## 1. Arquitectura: Single Page Application (SPA) en Vanilla JS

El proyecto sigue un patrón de **SPA (Aplicación de Página Única)**. Esto significa que el archivo `index.html` se carga solo una vez. Toda la navegación entre meses, el filtrado y las actualizaciones visuales ocurren inyectando código HTML dinámicamente usando JavaScript, sin recargar el navegador.

- **HTML:** Actúa solo como el esqueleto (contenedores vacíos como `<div id="services-list">`).
- **CSS:** Se encarga de la estética (Glassmorphism, Dark Mode).
- **JavaScript:** Es el "cerebro" que controla qué datos se insertan en ese esqueleto.

## 2. Gestión de Estado (State Management)

Toda aplicación necesita recordar en qué "estado" se encuentra. En nuestro código tenemos dos variables globales fundamentales:

```javascript
let services = []; // Guarda todos los gastos registrados.
let currentMonthIndex = new Date().getMonth(); // Guarda el mes que estás viendo (0 = Enero, 11 = Diciembre).
```

### ¿Por qué esto es importante?

Porque nuestra función principal `renderApp()` se basa en el estado. Cada vez que cambias de mes (modificas `currentMonthIndex`) o agregas un servicio (modificas `services`), llamamos a `renderApp()`. Esta función limpia la pantalla (`innerHTML = ''`) y la vuelve a dibujar basándose _únicamente_ en el estado actual. Este es el mismo principio que usan librerías modernas como React.

## 3. Almacenamiento Persistente (localStorage)

Para que los datos no se borren al cerrar la pestaña, usamos la API del navegador `localStorage`. Esta API solo permite guardar **texto (strings)**, por lo que tenemos que transformar nuestros objetos de Javascript.

- **Al Guardar (Serialización):** Convertimos el array a texto usando `JSON.stringify()`.
- **Al Cargar (Deserialización):** Convertimos el texto de vuelta a un array usando `JSON.parse()`.

```javascript
// Cargar al inicio:
let services = JSON.parse(localStorage.getItem('mi_llave')) || [];

// Guardar después de un cambio:
localStorage.setItem('mi_llave', JSON.stringify(services));
```

## 4. Modelado de Datos (Estructuras de Objetos)

Cada servicio o préstamo no es solo un texto; es un Objeto Javascript con propiedades bien definidas. Es vital pensar en esto como si fuera una base de datos.

```json
{
  "id": "168427954123", // Un identificador único (creado con Date.now())
  "type": "loan", // Distingue entre "service" y "loan"
  "name": "Auto", // El texto que el usuario ingresa
  "amount": 50000, // Número (float) para poder sumar luego
  "paymentMonth": 1, // Índice del mes (1 = Febrero)
  "isPaid": false, // Booleano para saber si se tachó

  // Propiedades opcionales (Solo existen si aplica)
  "currentInstallment": 5,
  "totalInstallments": 12,
  "paymentDate": "16/05/2026"
}
```

> [!TIP]
> **Polimorfismo Simple:** Al guardar todo en una misma lista (`services`), usamos la propiedad `"type"` para decidir en JavaScript si dibujamos una tarjeta normal o una tarjeta de préstamo con barra de progreso.

## 5. Manipulación de Arrays (El corazón de la lógica)

Si aprendes a dominar los métodos de Arrays en JS, tendrás el 80% del trabajo resuelto. En este proyecto se usan intensivamente:

- **`.filter()`**: Lo usamos para obtener solo los servicios del mes actual.
  ```javascript
  const currentItems = services.filter(
    (item) => item.paymentMonth === currentMonthIndex
  );
  ```
- **`.reduce()`**: Lo usamos para calcular los totales (sumar todos los `.amount` de la lista).
  ```javascript
  const total = currentItems.reduce((suma, item) => suma + item.amount, 0);
  ```
- **`.map()`**: Lo usamos en los gráficos para transformar la lista de objetos en una lista simple de números (eje Y del gráfico).
- **`.some()` y `.findIndex()`**: Los usamos durante la importación para saber si un servicio ya existe y evitar duplicados.

## 6. Manipulación del DOM y Eventos

JavaScript interactúa con el HTML a través del DOM (Document Object Model).

- **Escuchar Acciones (`addEventListener`)**: Capturamos cuando el usuario hace clic o envía el formulario. Usamos `e.preventDefault()` en los formularios para evitar que la página se recargue.
- **Creación de Nodos vs inyección de HTML**:
  - Puedes crear elementos uno a uno: `document.createElement('div')`.
  - O puedes usar **Template Literals (Backticks \`)**: Son las comillas invertidas que nos permiten inyectar variables directamente en un bloque de HTML gigante usando la sintaxis `${variable}` y asignarlo a `.innerHTML`. Esta última es la técnica principal de esta app para generar las tarjetas.

## 7. Lógica Dinámica (Campos y Alertas)

¿Cómo sabe la app cuándo mostrar el campo de "Consumo de Gas"?
Al agregar un evento de tipo `input` (que se dispara en cada tecla presionada) en el campo del nombre, chequeamos el valor:

```javascript
inputNombre.addEventListener('input', (e) => {
  const texto = e.target.value.toLowerCase();
  if (texto.includes('gas') || texto.includes('luz')) {
    document.getElementById('campos-ocultos').style.display = 'block';
  }
});
```

## 8. Librerías de Terceros (CDN)

No reinventamos la rueda. Para funciones complejas usamos librerías importándolas mediante etiquetas `<script src="...">` en el HTML.

- **Chart.js:** Le pasas un array de etiquetas (meses) y un array de datos (dinero), y te renderiza un gráfico de líneas o barras en un elemento `<canvas>`.
- **ExcelJS:** Funciona en la memoria del navegador simulando un libro de Excel. Creamos celdas, filas (`worksheet.addRow()`), aplicamos formato (colores) y luego descargamos ese archivo "virtual" al disco duro del usuario.

## Pasos recomendados para construir tu clon desde cero:

1. **Dibuja el HTML/CSS estático:** Haz una tarjeta de ejemplo a mano en el HTML sin nada de Javascript para que el diseño quede bien.
2. **Crea el estado global en JS:** Define tu array vacío y tu mes actual.
3. **Crea la función `render()`:** Escribe una función que tome tu array e inyecte HTML (reemplazando tu tarjeta estática del paso 1).
4. **Captura el Formulario:** Añade el evento `submit`, captura los valores de los inputs, haz un `.push()` a tu array y llama a `render()`.
5. **Agrega el `localStorage`:** Modifica tu array inicial para que lea del almacenamiento y añade el guardado en tu formulario.
6. **Desarrolla el CRUD:** Implementa el botoncito de Borrar y el botoncito de Pagar.

¡Con esta base lógica, estás más que listo para replicarlo! Mucho éxito en tu aprendizaje en el desarrollo de software.
