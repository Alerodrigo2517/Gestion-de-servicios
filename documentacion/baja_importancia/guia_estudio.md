# Guía de Estudio: Conceptos de Arquitectura y Lógica de ServiTrack

Esta guía desglosa los conceptos de ingeniería de software, patrones de diseño y lógicas algorítmicas utilizadas para la construcción de **ServiTrack**. Su objetivo es afianzar tus conocimientos en desarrollo moderno con **Next.js, React y Supabase**.

---

## 1. Arquitectura de una Single Page Application (SPA) con React y Next.js

A diferencia del desarrollo tradicional en JS Vanilla, ServiTrack está construido sobre **React**, un framework declarativo basado en componentes.

*   **Paradigma Declarativo vs. Imperativo:** En JS Vanilla, se modifica el DOM de manera manual e imperativa (ej: `document.getElementById('total').innerText = valor`). En React, defines la interfaz de forma declarativa basándote en el **estado**. Cuando el estado cambia, React vuelve a renderizar eficientemente los componentes afectados.
*   **Componentización:** La interfaz está segmentada en piezas pequeñas, independientes y reutilizables en la carpeta `src/components/` (ej: `ServiceCard.js`, `ChartsModal.js`). Cada uno maneja sus propiedades (`props`) y su propio estilo visual encapsulado.

---

## 2. Estado Global y Flujo Unidireccional de Datos

El punto de entrada principal ([src/app/page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js)) actúa como el cerebro del sistema:

1.  **Estado Raíz:** Controla tres estados globales:
    *   `session`: Sesión activa del usuario de Supabase.
    *   `services`: Lista de registros financieros (ingresos, préstamos, egresos).
    *   `currentMonthIndex`: Mes actual que se está consultando en el Dashboard (0 a 11).
2.  **Flujo de Datos Descendente:** El estado raíz se pasa como propiedad (`props`) hacia los componentes hijos (como `Dashboard.js` o `ServiceForm.js`).
3.  **Acciones Ascendentes:** Los componentes hijos no pueden modificar directamente el estado del padre. En su lugar, el padre les pasa funciones Callback (ej: `onSubmit`, `onImportPrevious`). Cuando ocurre un evento en el hijo (ej: hacer clic en borrar), se ejecuta la función callback del padre, actualizando el estado central y re-renderizando automáticamente la UI.

---

## 3. Sincronización de Datos Optimista e Híbrida

Para proveer una experiencia rápida y sin latencias de red, se implementó un flujo híbrido:

*   **Lectura Inicial:** Al iniciar la app, carga instantáneamente los datos guardados en el `localStorage` del navegador (caché local rápida) para evitar pantallas en blanco.
*   **Sincronización en la Nube:** De forma asíncrona, consulta a la base de datos remota de Supabase. Una vez recibidos los datos reales del servidor, actualiza el estado en React y el caché local (si existen discrepancias).
*   **Escritura Optimista:** Al registrar, modificar o borrar un servicio, la aplicación actualiza de inmediato el estado en memoria de React y el `localStorage`, dando una sensación de respuesta instantánea al usuario, mientras envía silenciosamente la petición de escritura (`upsert` / `delete`) a la base de datos de Supabase de fondo.

---

## 4. Algoritmos Clave del Proyecto

### A. Algoritmo de Importación Inteligente (`handleImportPrevious`)
Ubicado en `page.js`, automatiza el inicio de un nuevo mes financiero:
1.  Filtra los servicios registrados en el mes anterior (`currentMonthIndex - 1`).
2.  Valida si ya existen en el mes actual mediante sus nombres (comparando en minúsculas y sin espacios) para evitar duplicados.
3.  Si es un **Préstamo (`loan`)**:
    *   Incrementa la cuota actual (`currentInstallment = currentInstallment + 1`).
    *   Solo lo importa si la cuota resultante no supera el total de cuotas pactadas.
4.  Si es un **Servicio (`service`)**:
    *   Mueve el mes de consumo al mes en curso.
    *   Resetea el estado de pago (`isPaid = false`).

### B. Algoritmo Codicioso (*Greedy*) de Sugerencias de Pago
Ubicado en `SimulationModal.js`, ayuda al usuario a optimizar su dinero:
1.  Cuando la simulación detecta un excedente de dinero (Ahorro $> 0$), se filtran todos los servicios reales que están pendientes de pago.
2.  Ordena esta lista de gastos pendientes de **menor a mayor costo**.
3.  Itera la lista ordenada agregando servicios a la lista de "sugerencias de pago" hasta agotar el saldo de ahorro simulado. Al ordenar de menor a mayor, se maximiza la cantidad total de facturas que el usuario puede saldar de inmediato.

---

## 5. Integración de Servicios en la Nube (BaaS con Supabase)

*   **Supabase Auth:** Administra el registro y login seguro. Retorna tokens JWT que validan las consultas al servidor PostgreSQL.
*   **Row Level Security (RLS):** Mecanismo de seguridad en la base de datos que restringe las consultas basándose en el usuario que realiza la petición. La política `auth.uid() = user_id` garantiza que nadie pueda leer ni modificar datos ajenos, protegiendo la privacidad del hogar.
