# Pila Tecnológica de ServiTrack

Este documento detalla los componentes, dependencias y herramientas que conforman la arquitectura de la aplicación **ServiTrack**.

---

## 1. Núcleo del Frontend (Core)

- **Next.js (`^14.1.4`):** React Framework utilizado para estructurar la SPA (Single Page Application). Emplea el enrutador App Router y la directiva `'use client'` para el manejo reactivo del estado en el lado del cliente.
- **React (`^18.2.0`) & React DOM (`^18.2.0`):** Biblioteca base para la creación de componentes dinámicos y reutilizables.

---

## 2. Base de Datos, Autenticación y Seguridad

- **Supabase Client (`@supabase/supabase-js ^2.39.8`):** Plataforma Backend-as-a-Service (BaaS).
  - **Supabase Auth:** Manejo de sesiones de usuario persistentes, registro, login y restablecimiento de contraseña.
  - **Supabase Database (PostgreSQL):** Persistencia de registros de servicios y RLS (Row Level Security) activo para aislar la información por identificador de usuario (`auth.uid() = user_id`).
- **Almacenamiento Local (Local Cache):** Integración nativa de `localStorage` para proveer almacenamiento optimista rápido en caso de fallos de red.

---

## 3. Estilos y Diseño Visual (Aesthetics)

- **Tailwind CSS (`^3.4.1`):** Framework CSS utilitario para la maquetación responsiva rápida.
- **PostCSS (`^8.4.38`) & Autoprefixer (`^10.4.19`):** Herramientas de postprocesamiento de CSS que añaden compatibilidad entre navegadores móviles y de escritorio.
- **Variables CSS Nativas & Google Fonts (Inter):** La fuente `Inter` está vinculada a través de la API optimizada de fuentes de Next.js, aplicada como la fuente predeterminada del sistema.

---

## 4. Visualización de Datos e Informes

- **Chart.js (`^4.4.2`):** Biblioteca de renderización de gráficos interactivos a través de Canvas. Utilizado para:
  - _Proyección Anual:_ Gráfico de barras apiladas.
  - _Consumo Físico:_ Gráfico de línea suavizada con rellenos en degradados translúcidos.
- **ExcelJS (`^4.4.0`):** Generador y lector de archivos `.xlsx` enriquecidos desde el navegador. Permite insertar datos ordenados, formatos monetarios, bordes de cebra, subtotales automatizados e insertar el gráfico de Chart.js renderizado en memoria como imagen base64.
- **File-Saver (`^2.0.5`):** Utilidad para disparar la descarga directa en local del archivo Excel generado en memoria.

---

## 5. Entorno de Desarrollo y Pruebas

- **Jest (`^29.7.0`):** Framework de pruebas unitarias utilizado para validar los algoritmos de cálculo de balances, deudas y sugerencias greedy.
- **ESLint (`^8.57.0`) & eslint-config-next (`^14.1.4`):** Herramienta de análisis estático para asegurar que el código cumpla con los estándares y buenas prácticas de React/Next.js.
- **Prettier (`^3.2.5`):** Formateador de código automático para asegurar consistencia en el estilo.
