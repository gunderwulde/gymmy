# Gymmy

Aplicación web companion para entrenamientos de gimnasio, instalable como PWA y utilizable completamente sin conexión. La interfaz está en español y permite consultar y registrar el entrenamiento fácilmente desde el móvil.

Publicada en <https://gunderwulde.github.io/gymmy/>.

## Funcionalidad

- Máquinas y ejercicios típicos en una lista desplazable. Cada elemento incluye nombre e ilustración a la izquierda. Los ejercicios de fuerza ofrecen peso y repeticiones editables más «Hecho»; las actividades con `tracking: "time"` ofrecen cronómetro y controles de actividad.
- Al pulsar «Hecho» se añade al historial una entrada con id del ejercicio, peso (kg), repeticiones y fecha y hora ISO. Pulsar varias veces genera varias entradas (series); nunca se sobrescriben las anteriores.
- Cada elemento actúa como recordatorio: peso y repeticiones se inicializan con los de la última entrada de ese ejercicio y se muestra un texto como «Última vez: 05/10/2026 · 40 kg × 10». Sin historial, se usan los valores por defecto del catálogo.
- El catálogo se ordena por última fecha de uso, primero la actividad más reciente; las que no tienen historial quedan al final en el orden original. Se reordena tras cada registro completado.
- Un botón de progreso abre una ventana emergente (`<dialog>`) con el historial agrupado por día, del más reciente al más antiguo, con filtro por ejercicio y peso y repeticiones por fecha.
- Las actividades temporizadas (cinta de correr, bicicleta estática) muestran `HH:MM:SS` y ofrecen «Iniciar», «Pausar»/«Continuar» y «Terminar». El cronómetro acumula tiempo monotónico activo, excluye las pausas y guarda la duración al terminar. Solo puede haber una actividad temporizada en marcha a la vez.
- Las máquinas se distinguen visualmente de los ejercicios libres (etiqueta) y la lista se puede filtrar por tipo y buscar por nombre o grupo muscular.

## Stack y estructura

Stack objetivo:

- Vue 3 con TypeScript y Vite; Pinia para el estado de la interfaz; Dexie.js sobre IndexedDB para los datos locales; `vite-plugin-pwa` para manifiesto, service worker y precaché. No se añade otro framework ni otra solución de estado o persistencia.
- `fetch` nativo encapsulado en un cliente REST tipado y reutilizable cuando una función necesite un servicio. Las funciones principales deben funcionar sin red y sin depender de una API.
- ESLint (lint), Prettier (formato) y Vitest (pruebas), como `devDependencies`.
- Desarrollo local con el servidor de Vite (`npm run dev`); el service worker requiere un origen seguro como `localhost`, no `file://`.
- Responsabilidades separadas: componentes Vue (interfaz), stores Pinia (estado de presentación), módulos de dominio testeables sin DOM y con tipos explícitos, capa Dexie (persistencia) y cliente API.

Estado actual de la implementación: HTML, CSS y JavaScript con módulos ES, sin compilación, servida como archivos estáticos con `localStorage` y un service worker propio:

- `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js` en la raíz.
- `src/`: `catalog.js` (carga, validación, orden), `storage.js` (estado y persistencia), `timer.js` (cronómetro), `ui.js` (render y eventos) y `main.js`.
- `data/exercises.json`, `assets/exercises/` y `assets/icons/`.

## Catálogo (`data/exercises.json`)

Máquinas y ejercicios típicos agrupados por zona (pecho, espalda, hombros, brazos, piernas, glúteos, core, cardio), con máquinas (prensa, polea, pec deck, jalón, remo…) y ejercicios libres (press banca, sentadilla, peso muerto, curl con mancuernas…).

```json
{
  "id": "press-banca",
  "name": "Press de banca",
  "type": "exercise",
  "tracking": "sets",
  "muscleGroup": "chest",
  "image": "assets/exercises/press-banca.svg",
  "defaultWeight": 20,
  "defaultReps": 10
}
```

- `type` es `machine` o `exercise`; `tracking` es opcional: `sets` (por defecto) o `time`.
- Las actividades temporizadas declaran `"tracking": "time"` y omiten `defaultWeight` y `defaultReps`; las demás requieren ambos.
- Los `id` son únicos, estables y en kebab-case; nunca se renombran, porque el historial depende de ellos. Los textos visibles van en español.
- Hay una ilustración SVG por entrada con el mismo nombre que su `id`: mismo tamaño y viewBox, trazo simple, paleta común, ligera y sin referencias externas. Cada `image` apunta a un archivo existente y no sobra ninguno.
- El catálogo se valida al cargarlo (campos obligatorios, tipos, `id` únicos) y, si es inválido, se muestra un error visible.

## Persistencia

- Valores editados e historial se guardan localmente con clave/esquema versionado y migraciones (actualmente `localStorage`, clave `gymmy:v1`; en el stack objetivo, IndexedDB con Dexie y transacciones). Se solicita `navigator.storage.persist()`.
- El historial referencia los ejercicios por `id`. Si un `id` ya no existe en el catálogo, la entrada se conserva y se muestra con un nombre genérico.
- Si los datos guardados están corruptos, no se borran ni sobrescriben en silencio: se avisa al usuario y se conserva una copia de seguridad.
- El catálogo está separado del estado del usuario; actualizar el catálogo o la app nunca borra historial ni valores editados.
- Los datos solo existen en este dispositivo y navegador; borrar los datos locales elimina el historial.

## PWA y funcionamiento sin conexión

- Manifiesto, iconos (192, 512 y maskable) y service worker configurados para instalar la app y abrirla sin conexión tras la primera carga.
- Precaché en la instalación de todos los recursos de la experiencia principal: HTML, CSS, JS, `data/exercises.json`, ilustraciones, iconos y fuentes locales; no se cachea solo lo visitado.
- Cache-first para recursos estáticos, con navegación que responde `index.html` desde caché sin red.
- Sin dependencias de red, cuentas, CDN ni servicios externos.
- Caché versionada (`CACHE_VERSION` en `sw.js`) con limpieza de cachés antiguas en `activate`; en el stack objetivo lo gestiona `vite-plugin-pwa`. Cada cambio de recurso incrementa la versión y se avisa al usuario de que hay una actualización disponible sin recargar de golpe.

## Interfaz y accesibilidad

- Diseño adaptable y táctil, con controles legibles en pantallas pequeñas.
- Peso (`inputmode="decimal"`, paso 0,5 kg, mínimo 0) y repeticiones (`inputmode="numeric"`, entero ≥ 1) editables por entrada, con etiquetas accesibles. «Hecho» no registra valores vacíos, negativos ni no numéricos y muestra el error junto al campo. Se acepta la coma decimal.
- Ilustraciones con `loading="lazy"`, dimensiones fijas y a la izquierda del nombre, con texto alternativo útil; si falta una imagen se muestra un reemplazo local.
- El popup de progreso se abre y cierra con teclado, tiene título accesible y devuelve el foco al control que lo abrió.
- El resultado de guardar un registro y los errores se comunican de forma visible.

## Pruebas y calidad

- Pruebas unitarias de validación del catálogo, entradas de fuerza y tiempo, persistencia/migración, selección de la última entrada, orden por último uso y cálculo/formato del cronómetro: `npm test`.
- Para probar en local con la implementación actual: `npx serve .` (no abrir con `file://`).
- Un workflow de GitHub Actions ejecuta las pruebas y publica en GitHub Pages al subir a `main` (Settings → Pages → Source → GitHub Actions).
