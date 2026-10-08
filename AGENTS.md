# Instrucciones del proyecto

## Producto

Construye una aplicación web companion para entrenamientos de gimnasio, instalable como PWA y utilizable completamente sin conexión. La interfaz debe estar en español y permitir consultar y registrar fácilmente el entrenamiento desde el móvil.

## Funcionalidad

- Muestra máquinas y ejercicios típicos en una lista desplazable. Cada elemento incluye nombre, ilustración a la izquierda, peso editable y número de repeticiones editable, además de un botón «Hecho».
- Al pulsar «Hecho», añade al historial una entrada con id del ejercicio, peso (kg), repeticiones y fecha y hora ISO. Pulsar varias veces genera varias entradas (series); no sobrescribas las anteriores.
- Cada elemento actúa como recordatorio: sus campos de peso y repeticiones se inicializan con los de la última entrada registrada de ese ejercicio y muestra un texto breve con la fecha de la última vez (por ejemplo, «Última vez: 05/10/2026 · 40 kg × 10»). Sin historial, usa los valores por defecto del catálogo.
- Un botón de progreso abre una ventana emergente (`<dialog>`) con el historial. Agrupa por día, del más reciente al más antiguo, y permite ver el de un ejercicio concreto (p. ej. filtro o acceso desde su entrada) con peso y repeticiones por fecha.
- Distingue visualmente máquinas de ejercicios libres (etiqueta o icono) y permite filtrarlos o buscarlos por nombre si la lista es larga.

## Stack y estructura

- Usa HTML, CSS y JavaScript con módulos ES, sin framework ni paso de compilación ni dependencias de ejecución, para que se pueda servir como archivos estáticos. Si necesitas herramientas de desarrollo (tests, linter), que sean solo `devDependencies` en `package.json`.
- Estructura esperada:
  - `index.html`, `manifest.webmanifest`, `sw.js` en la raíz.
  - `src/` con módulos separados: `catalog.js` (carga y validación), `storage.js` (estado y persistencia), `ui.js` (render y eventos) y `main.js`.
  - `data/exercises.json` con el catálogo.
  - `assets/exercises/` con las ilustraciones y `assets/icons/` con los iconos de la PWA (192, 512 y maskable).
- Para probar en local, sirve la raíz con un servidor estático (p. ej. `npx serve .`); el service worker no funciona desde `file://`.

## Catálogo (`data/exercises.json`)

- Genera el catálogo con las máquinas y ejercicios típicos de un gimnasio, agrupados por zona (pecho, espalda, hombros, brazos, piernas, glúteos, core, cardio). Incluye máquinas (prensa, polea, pec deck, jalón, remo, extensión y curl de piernas, etc.) y ejercicios libres (press banca, sentadilla, peso muerto, curl con mancuernas, etc.).
- Formato de cada entrada:

  ```json
  {
    "id": "press-banca",
    "name": "Press de banca",
    "type": "exercise",
    "muscleGroup": "chest",
    "image": "assets/exercises/press-banca.svg",
    "defaultWeight": 20,
    "defaultReps": 10
  }
  ```

  `type` es `machine` o `exercise`. Los `id` son únicos, estables y en kebab-case; nunca los renombres, porque el historial depende de ellos. Los textos visibles van en español.
- Genera una ilustración por entrada, con el mismo nombre que su `id`. Crea las imágenes como SVG con estilo uniforme (mismo tamaño y viewBox, trazo simple y paleta común), ligeras y sin referencias externas. Verifica que cada `image` apunta a un archivo existente y que no sobra ninguno sin usar.
- Valida el catálogo al cargarlo (campos obligatorios, tipos, `id` únicos) y muestra un error visible si es inválido.

## Persistencia

- Guarda los valores editados y el historial en `localStorage` o IndexedDB, con una clave versionada (p. ej. `gymmy:v1`) y migraciones cuando cambie el formato. Solicita `navigator.storage.persist()` para reducir el riesgo de borrado.
- El historial referencia los ejercicios por `id`. Si un `id` ya no existe en el catálogo, conserva la entrada y muéstrala con un nombre genérico.
- Si los datos guardados están corruptos o son ilegibles, no los borres ni los sobrescribas en silencio: avisa al usuario y conserva una copia de seguridad.
- Mantén el catálogo separado del estado del usuario; actualizar el catálogo o la app nunca debe borrar historial ni valores editados.

## PWA y funcionamiento sin conexión

- Proporciona manifiesto, iconos y service worker correctamente configurados para que la aplicación se pueda instalar y abrir sin conexión tras su primera carga.
- Precachea en la instalación del service worker todos los recursos de la experiencia principal: HTML, CSS, JS, `data/exercises.json`, todas las ilustraciones, iconos y fuentes locales. Usa una lista de precaché que incluya cada archivo del catálogo; no cachees solo lo visitado.
- Estrategia: cache-first para recursos estáticos, con navegación que responda `index.html` desde caché sin red.
- No dependas de red, cuentas, CDN ni servicios externos (fuentes, librerías, analíticas).
- Versiona la caché (`CACHE_VERSION`) y elimina las cachés antiguas en `activate`. Cada vez que cambie un recurso, incrementa la versión; informa al usuario de que hay una actualización disponible en lugar de recargar de golpe y perder una edición en curso.

## Interfaz y accesibilidad

- Prioriza un diseño adaptable y táctil, con controles legibles y cómodos en pantallas pequeñas.
- El peso (`inputmode="decimal"`, paso 0,5 kg, mínimo 0) y las repeticiones (`inputmode="numeric"`, entero ≥ 1) son editables en cada entrada, con etiquetas accesibles. «Hecho» no registra valores vacíos, negativos ni no numéricos y muestra el error junto al campo. Acepta la coma decimal.
- Las ilustraciones usan `loading="lazy"`, dimensiones fijas para evitar saltos de layout y se muestran a la izquierda del nombre.
- La ilustración debe tener texto alternativo útil; si falta una imagen, muestra un reemplazo local sin romper la lista.
- El popup de progreso debe poder abrirse y cerrarse con teclado, tener un título accesible y devolver el foco al control que lo abrió.
- Comunica de forma visible el resultado de guardar un registro y los errores que impidan guardarlo.

## Desarrollo y calidad

- Mantén separadas las responsabilidades de catálogo, almacenamiento, interfaz y registro; la lógica de validación e historial debe ser testeable sin DOM.
- Añade pruebas unitarias para validación del catálogo, validación de entradas, persistencia/migración y selección de la última entrada. Ejecútalas con el script `npm test` cuando exista.
- Comprueba una PWA instalable (manifiesto e iconos válidos) y, en el navegador, el flujo completo: editar valores, pulsar «Hecho», ver el progreso y recargar conservando los datos.
- Verifica el modo sin conexión de verdad: tras la primera carga, activa «Sin conexión» en las herramientas de desarrollo y confirma que la app, el catálogo y todas las imágenes cargan. No afirmes que funciona offline sin haberlo comprobado.
- Si el usuario pide solo ciertos archivos, limítate a ellos y no generes el resto.
