# 🛡️ Análisis de Seguridad: Vulnerabilidades XSS y Otros Vectores de Ataque en ServiTrack

Este documento detalla el análisis de seguridad realizado sobre la base de código de **ServiTrack** (v2.0), evaluando la viabilidad de ataques de **Cross-Site Scripting (XSS)**, **Inyección SQL (SQLi)**, **Bypass de Autorización**, **Inyección de Fórmulas en Excel** y otras amenazas potenciales.

---

## 📌 1. Resumen Ejecutivo

| Tipo de Ataque | Nivel de Riesgo | ¿Es Vulnerable? | Descripción del Estado Actual |
| :--- | :---: | :---: | :--- |
| **XSS (Cross-Site Scripting)** | 🟢 **Muy Bajo** | **No** | React escapa automáticamente el renderizado en JSX. No se utiliza `dangerouslySetInnerHTML` ni URLs dinámicas no verificadas. |
| **Inyección SQL (SQLi)** | 🟢 **Muy Bajo** | **No** | El cliente de Supabase utiliza la API de PostgREST, la cual parametriza el 100% de las consultas a la base de datos PostgreSQL. |
| **Bypass de Acceso a Datos** | 🟢 **Bajo** | **No** | Row Level Security (RLS) está activo en la base de datos, restringiendo las filas según el UID del usuario autenticado (`auth.uid() = user_id`). |
| **Inyección de Fórmulas en Excel** | 🟡 **Medio** | **Sí (Teórico)** | El exportador de Excel en [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js) escribe texto directamente sin sanitizar caracteres de inicio de fórmulas (`=`, `+`, `-`, `@`). |
| **Denegación de Servicio (DoS)** | 🟢 **Bajo** | **No** | Mitigado en el cliente (límite estricto de 1000 registros). Pendiente de aplicar el trigger en la base de datos de Supabase. |

---

## 🧼 2. Análisis Detallado de XSS (Cross-Site Scripting)

El ataque XSS consiste en la inyección de scripts maliciosos (normalmente JavaScript) en una aplicación web para que se ejecuten en el navegador del usuario víctima.

### 2.1 ¿Por qué ServiTrack es altamente seguro frente a XSS?

1. **Auto-escaping de React:**
   La aplicación está construida sobre React 18. Por defecto, cuando se renderizan variables en JSX (como `{item.name}` en [ServiceCard.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceCard.js)), React convierte las variables en texto plano (`document.createTextNode`) antes de renderizarlas en el DOM.
   * Si un atacante ingresa como nombre del servicio: `<script>alert('XSS')</script>`, el navegador lo mostrará literalmente como texto en pantalla en lugar de ejecutar el script.
   
2. **Ausencia de directivas inseguras:**
   No se encontraron instancias de `dangerouslySetInnerHTML` en ningún componente del directorio `src`. Tampoco se hace uso de funciones JavaScript peligrosas como `eval()`, `setTimeout(string)`, o manipulación manual directa del DOM como `element.innerHTML`.

3. **Sin inyecciones en URLs:**
   Un vector común de XSS ocurre cuando se renderiza texto del usuario dentro de atributos de enlace (`<a href={userUrl}>`), lo que permite inyectar el protocolo `javascript:alert(1)`. En ServiTrack, no existen atributos `href` dinámicos que dependan de la entrada del usuario. Los únicos usos de `href` son selectores fijos para el control del foco de accesibilidad en modales como en [SimulationModal.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/SimulationModal.js).

4. **Sanitización en la importación de Excel:**
   El flujo de importación de archivos en [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js) lee las celdas del archivo `.xlsx` cargado por el usuario y extrae su texto. Posteriormente, este texto es asignado al estado reactivo del componente y se renderiza a través de JSX de forma segura, anulando la ejecución de cualquier script incrustado en el archivo importado.

---

## 💾 3. Análisis de otros Vectores de Ataque

### 3.1 Inyección SQL (SQLi)
* **Descripción:** Intentar manipular las consultas enviadas a la base de datos agregando sentencias SQL en los campos de entrada.
* **Estado en ServiTrack:** **Protegido**. El proyecto interactúa con la base de datos mediante el cliente oficial de Supabase (`@supabase/supabase-js`) definido en [supabase.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/supabase.js). Supabase utiliza PostgREST en el servidor, lo que significa que todas las operaciones de consulta (`select`, `insert`, `upsert`, `delete`) son traducidas automáticamente a consultas parametrizadas. Los datos del usuario nunca se concatenan directamente a una consulta SQL cruda en el frontend ni en el backend.

### 3.2 Bypass de Políticas de Acceso a Datos
* **Descripción:** Intentar leer o modificar registros financieros pertenecientes a otros usuarios enviando peticiones manipuladas directamente a la API de Supabase.
* **Estado en ServiTrack:** **Protegido en Base de Datos**. Aunque la clave anónima de Supabase (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) está expuesta en el cliente (lo cual es normal en aplicaciones serverless/SPA), la seguridad de los datos depende estrictamente de las políticas de **Seguridad a Nivel de Fila (RLS)** configuradas en PostgreSQL.
* El archivo [documentacion_tecnica.md](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/documentacion/documentacion_tecnica.md#L128-L145) confirma que las políticas de RLS están activas:
  ```sql
  create policy "Los usuarios pueden ver solo sus propios servicios"
    on public.services for select
    using (auth.uid() = user_id);
  ```
  Esto garantiza que, incluso si un atacante intenta modificar la petición HTTP para consultar los servicios de otro `user_id`, PostgreSQL rechazará la consulta porque el token JWT firmado del atacante no coincide con el `user_id` de las filas consultadas.

### 3.3 CSRF (Cross-Site Request Forgery)
* **Descripción:** Forzar a un usuario autenticado a realizar acciones no deseadas en la aplicación web a través de un sitio malicioso de terceros.
* **Estado en ServiTrack:** **Protegido**. Supabase Auth maneja la autenticación mediante JSON Web Tokens (JWT) enviados en los encabezados HTTP (`Authorization: Bearer <TOKEN>`) en lugar de depender únicamente de cookies de sesión automáticas del navegador. Dado que los navegadores no adjuntan encabezados personalizados en solicitudes de origen cruzado de forma automática, un atacante no puede forjar peticiones API válidas desde otro sitio web.

### 3.4 Riesgo: Inyección de Fórmulas en Excel (CSV/Formula Injection)
* **Descripción:** Si un usuario malicioso (o un atacante que de alguna manera logre registrar un servicio con un nombre específico) ingresa un nombre de gasto que comienza con caracteres de comando (`=`, `+`, `-`, `@`), e.g., `=SUM(1+2)` o `=CMD|' /C calc'!A1`.
* Al exportar los datos mediante [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js), ExcelJS escribirá dicho valor literalmente en la celda del archivo `.xlsx`.
* **Consecuencia:** Cuando la víctima abra el archivo Excel en su suite ofimática local (como Microsoft Excel o LibreOffice), la aplicación intentará evaluar el texto como una fórmula. En el peor escenario, esto podría resultar en la ejecución remota de comandos (vía DDE) o la exfiltración de datos locales.

### 3.5 Riesgo: Denegación de Servicio en Base de Datos por Lotes (Mitigado en v2.1)
* **Descripción:** Los flujos de guardado e importación masiva no limitaban el número de registros cargados. Un atacante podría subir millones de filas para agotar la memoria del cliente o el almacenamiento de la base de datos de Supabase.
* **Mitigación:** Se ha implementado un límite estricto de **1000 registros máximos** en el cliente ([page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js)) antes de procesar inserciones individuales, importaciones mensuales, importaciones de Excel o carga de demos. Asimismo, se maneja el error del servidor si la base de datos rechaza la operación por exceder el trigger de límite.

### 3.6 Riesgo: Inyección de Textos Masivos / Cadenas Gigantes (Mitigado en v2.1)
* **Descripción:** Al declarar las columnas `name`, `creditor` y `titular` como tipo `text` sin restricción de longitud en la base de datos, un atacante podría enviar strings de varios megabytes por campo, logrando saturar el ancho de banda del cliente o agotar el espacio en disco de Supabase.
* **Mitigación:** 
  * En el frontend, se ha añadido la propiedad `maxLength={100}` a todos los inputs de texto relevantes en [ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js), limitando la longitud máxima ingresada por interfaz.
  * En el parser de archivos Excel ([excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js)), se ha implementado un bloqueo para archivos que superen los **2MB**, previniendo el congelamiento de la pestaña del navegador por procesamiento de archivos masivos.

---

## 🛠️ 4. Recomendaciones para el Fortalecimiento del Sistema

Para mitigar los riesgos teóricos detectados y elevar ServiTrack a un estándar de seguridad de nivel bancario/empresarial, se sugiere implementar las siguientes mejoras:

### 4.1 Sanitización contra Inyección de Fórmulas en Excel
Modificar [excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js) para sanitizar los nombres de los servicios antes de escribirlos en la celda. Si el valor comienza con `=`, `+`, `-` o `@`, se debe anteponer una comilla simple `'` para obligar a Excel a tratar el valor como texto estricto.

*Ejemplo de mitigación:*
```js
function sanitizeForExcel(value) {
  if (typeof value === 'string' && /^[=\+\-\@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
```

### 4.2 Límites de Tamaño y Payload (Implementado en Frontend)
* **Frontend:** Se ha configurado un tope de 1000 registros en el cliente ([page.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/app/page.js)), un tamaño máximo de 2MB para archivos cargados ([excelHelper.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/lib/excelHelper.js)) y una longitud máxima de 100 caracteres en inputs de texto ([ServiceForm.js](file:///c:/Users/Desktop/OneDrive/Desktop/Git%20Hub/Gestion-de-servicios/src/components/ServiceForm.js)).
* **Base de Datos (Recomendado):** Para evitar que usuarios maliciosos evadan la aplicación usando clientes API personalizados (como Postman o cURL) y envíen miles de filas, se deben aplicar restricciones de longitud y cantidad en PostgreSQL ejecutando el siguiente script en el panel de control de Supabase (SQL Editor):


```sql
-- 1. Crear la función del trigger para validar el límite
CREATE OR REPLACE FUNCTION check_user_services_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_limit CONSTANT INTEGER := 1000;
BEGIN
    -- Contar registros existentes del usuario
    SELECT COUNT(*) INTO current_count 
    FROM public.services 
    WHERE user_id = NEW.user_id;

    -- Si se supera el límite
    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'Límite de almacenamiento excedido. Máximo % registros por usuario.', max_limit
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear el trigger BEFORE INSERT
CREATE OR REPLACE TRIGGER trigger_check_services_limit
    BEFORE INSERT ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION check_user_services_limit();

-- 3. Aplicar restricciones de longitud de texto para evitar DoS por payloads masivos
ALTER TABLE public.services 
  ADD CONSTRAINT chk_name_length CHECK (char_length(name) <= 100),
  ADD CONSTRAINT chk_creditor_length CHECK (creditor IS NULL OR char_length(creditor) <= 100),
  ADD CONSTRAINT chk_titular_length CHECK (titular IS NULL OR char_length(titular) <= 100);
```

### 4.3 Auditoría Continua de RLS
Asegurar que las variables de entorno de producción no utilicen la clave de servicio de Supabase (`service_role`), ya que esta clave bypassea RLS por completo. La aplicación debe usar únicamente la clave pública anónima (`anon`).
