# Plan Maestro de Implementación: ServiTrack (Next.js & Supabase)

Este documento contiene el plan de implementación detallado y actualizado para replicar de manera idéntica la aplicación **ServiTrack** construida hasta la fecha. Si sigues estas instrucciones y especificaciones técnicas, obtendrás el mismo resultado.

---

## 📋 Descripción del Proyecto

Una aplicación web de una sola página (Single Page Application - SPA) premium, construida con **Next.js 14**, **React 18** y **Supabase** (para autenticación y persistencia de base de datos PostgreSQL). La aplicación permite al usuario registrar, visualizar y organizar los gastos de servicios del hogar ordenados por "Mes de Pago", con soporte para importar servicios recurrentes, analizar el gasto mediante gráficos dinámicos y exportar/importar información a Excel de forma avanzada.

---

## 🛠️ Tecnologías y Dependencias Core

*   **Framework principal:** Next.js `^14.1.4` (App Router) y React `^18.2.0`.
*   **Base de datos y Auth:** `@supabase/supabase-js ^2.39.8`.
*   **Estilos:** Tailwind CSS `^3.4.1`, PostCSS `^8.4.38`, Autoprefixer `^10.4.19`.
*   **Gráficos e Informes:** Chart.js `^4.4.2`, ExcelJS `^4.4.0` y File-Saver `^2.0.5`.
*   **Variables de entorno:** `.env.local` configurado en local para ocultar URL y API Keys de Supabase.

---

## 🎨 Diseño Visual (Aesthetics)

El diseño es de nivel premium, utilizando una interfaz "Dark Mode" con técnicas de **Glassmorphism** y micro-animaciones dinámicas.

*   **Fondo (Background):** Un color base oscuro (`#0b0f19`) con un `radial-gradient` en las esquinas que mezcla tonos celestes y morados tenues para simular profundidad.
*   **Efecto Vidrio (Glassmorphism):** Paneles translúcidos con `backdrop-filter: blur(16px)`, bordes blancos semitransparentes (`border-white/10`) y fondos de color con opacidad reducida (`bg-slate-900/60`).
*   **Tipografía:** Fuente **Inter** integrada localmente con la optimización de Next.js.
*   **Esquema de Colores Semánticos:**
    *   *Ingresos:* Gradiente esmeralda/verde (`from-emerald-500 to-teal-600`).
    *   *Servicios recurrentes:* Gradiente azul/indigo (`from-sky-500 to-indigo-600`).
    *   *Préstamos:* Gradiente morado/violeta (`from-purple-500 to-indigo-600`).
    *   *Deudas Atrasadas:* Gradiente rosa/rojo (`from-rose-500 to-red-600`).

---

## 📁 Arquitectura del Proyecto y Archivos a Crear

### 1. Inicialización y Configuración de Dependencias
*   **`package.json`**: Configurar los scripts para compilación e incluir las dependencias requeridas de Supabase, React, Tailwind, Chart.js y ExcelJS.
*   **`tailwind.config.js`** y **`postcss.config.mjs`**: Registrar la detección de componentes de React en `src/` para el purgado de estilos CSS.
*   **`jsconfig.json`**: Definir alias `@/*` direccionado a la raíz de la carpeta `src/`.

### 2. Biblioteca y Capa de Datos (`src/lib/`)
*   **`supabase.js`**: Instanciar y exportar el cliente de Supabase usando variables de entorno seguras (`process.env.NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
*   **`excelHelper.js`**: Centralizar las lógicas de escritura de libros Excel (con colores institucionales oscuros, fuentes personalizadas, anulación de grillas predeterminadas, subtotales, e inserción de imagen de gráficos en Base64) y lectura reactiva autodetectando columnas.
*   **`utils.js`**: Helper para dar formato monetario `es-AR` (`$ 0.00`).

### 3. Componentes de UI (`src/components/`)
*   **`AuthComponent.js`**: Formulario de ingreso, registro y cambio de contraseña adaptativo.
*   **`Dashboard.js`**: Muestra indicadores de rendimiento (ingresos netos, gastos totales, liquidez real, deudas pendientes y proyección de balance) y la barra de navegación de meses del año.
*   **`ServiceForm.js`**: Formulario de alta y edición con inputs dinámicos de consumo físico (para Luz/Gas) y cierres de facturación (para Internet/Cable) que se disparan según lo que el usuario tipea en el campo nombre.
*   **`ServiceCard.js` y `ServiceList.js`**: Contenedores para visualizar y modular de forma independiente cada registro financiero y sus estados.
*   **`SimulationModal.js`**: Modal interactivo de simulación que aplica un algoritmo codicioso (*Greedy*) de optimización para listar de menor a mayor qué deudas reales puedes saldar con tus ahorros simulados.
*   **`ChartsModal.js`**: Canvas para desplegar gráficos de proyección anual y consumo histórico de recursos con Chart.js.

### 4. Página Principal (`src/app/page.js`)
*   Manejar el estado de la sesión autenticada.
*   Mantener el array central de servicios e ingresos y el índice del mes visible (`currentMonthIndex`).
*   Implementar el CRUD asíncrono con **Supabase Database** (inserts, updates, deletes) y mantener una sincronización optimista con `localStorage` como caché local rápida.
*   Implementar el algoritmo `handleImportPrevious()` para importar de forma inteligente gastos fijos del mes anterior al mes actual, actualizando cuotas de préstamos y recalculando meses de consumo.

---

## 🚀 Proceso de Despliegue e Instalación
1.  Instalar dependencias mediante `npm install`.
2.  Configurar variables de acceso en el archivo `.env.local`.
3.  Ejecutar el servidor local para verificar el sistema con `npm run dev`.
4.  Compilar el entregable para producción ejecutando `npm run build`.
