# Gymmy

Aplicación web companion para entrenamientos de gimnasio, instalable como PWA y utilizable completamente sin conexión. La interfaz está en español y permite consultar y registrar el entrenamiento fácilmente desde el móvil.

Publicada en <https://gunderwulde.github.io/gymmy/>.

## Funcionalidad

- Máquinas y ejercicios típicos en una lista desplazable. Cada elemento incluye nombre e ilustración a la izquierda. Los ejercicios de fuerza ofrecen peso y repeticiones editables más «Hecho»; las actividades con `tracking: "time"` ofrecen cronómetro y controles de actividad.
- Al pulsar «Hecho» se añade al historial una entrada con id del ejercicio, peso (kg), repeticiones y fecha y hora ISO. Pulsar varias veces genera varias entradas (series); nunca se sobrescriben las anteriores.
- Cada elemento actúa como recordatorio: peso y repeticiones se inicializan con los de la última entrada de ese ejercicio y se muestra un texto como «Última vez: 05/10/2026 · 40 kg × 10». Sin historial, se usan los valores por defecto del catálogo.
- El catálogo se ordena por última fecha de uso, primero la actividad más reciente; las que no tienen historial quedan al final en el orden original. Se reordena tras cada registro completado.
- Un botón de progreso abre una ventana emergente (`<dialog>`) con el historial agrupado por día, del más reciente al más antiguo, con filtro por ejercicio y peso y repeticiones por fecha.
- Las actividades temporizadas (cinta de correr, bicicleta estática) muestran `HH:MM:SS` y ofrecen «Iniciar», «Pausar»/«Continuar» y «Terminar». El tiempo se calcula con timestamps de reloj (`Date.now()` en milisegundos), no contando intervalos: mientras está en marcha se conserva el timestamp de inicio y se muestra el tiempo acumulado más la diferencia hasta ahora. Así, al reanudar la app después de que el móvil haya quedado en reposo, el tiempo transcurrido se actualiza correctamente. Al pausar, se suma el tramo transcurrido al acumulado y se guarda; al continuar, se toma un nuevo timestamp de inicio sin perder lo acumulado. Al terminar, se suma el último tramo y se guarda la duración. Solo puede haber una actividad temporizada en marcha a la vez.
- Las máquinas se distinguen visualmente de los ejercicios libres (etiqueta en la tarjeta). La lista se filtra por zona (Todos, Superiores, Inferiores y Cardio) y se puede buscar por nombre o grupo muscular.

## Stack y estructura

- Vue 3 con TypeScript y Vite; Pinia para el estado de interfaz; Dexie.js sobre IndexedDB para los datos locales; `vite-plugin-pwa` para manifiesto, service worker y precaché.
- No hay archivos `.js` en el código fuente de la aplicación; Vite genera JavaScript empaquetado para el navegador. No se usa Axios ni otra librería HTTP externa. Gymmy no necesita comunicaciones HTTP ni credenciales para sus funciones locales y offline.
- No se usa LocalStorage ni cookies: valores editados, historial y sesión del cronómetro se guardan en IndexedDB.
- ESLint, Prettier y Vitest son herramientas de desarrollo. Las responsabilidades se separan entre componentes Vue, store Pinia, módulos de dominio testeables sin DOM y capa Dexie.
- No se hacen peticiones HTTP. Si se incorpora una integración remota, se encapsulará exclusivamente en `Back4AppClient` con `fetch` nativo y nunca expondrá la Master Key.
- Para desarrollo local, ejecuta `npm run dev`; el service worker requiere un origen seguro como `localhost`, no `file://`.

- `index.html`, `styles.css`, `vite.config.ts` y configuración TypeScript en la raíz.
- `src/`: interfaz Vue, store Pinia, validación y orden del catálogo, persistencia Dexie y lógica del cronómetro.
- Interfaz dividida en componentes, cada uno en su directorio con su README (ver `src/README.md` y `src/components/README.md`): `App.vue` es un contenedor que compone `AppHeader` y `ExerciseList`, más `HistoryDialog` y `UpdateBanner`. `ExerciseList` usa `ExerciseCardSets` para ejercicios por series y `ExerciseCardTimed` para actividades temporizadas.
- `data/exercises.json`, `assets/exercises/` y `assets/icons/`.
- Vite copia el catálogo y todos los recursos locales a la salida de producción para incluirlos en el precaché completo de Workbox.

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

- Valores editados, historial y sesión del cronómetro se guardan en IndexedDB con Dexie; los registros se escriben mediante transacciones. La sesión temporizada persiste el id de la actividad, los milisegundos activos acumulados y el timestamp del tramo en marcha; cada pausa consolida el tramo antes de iniciar otro al continuar. Se solicita `navigator.storage.persist()`.
- El historial referencia los ejercicios por `id`. Si un `id` ya no existe en el catálogo, la entrada se conserva y se muestra con un nombre genérico.
- Si los datos guardados están corruptos, no se borran ni sobrescriben en silencio: se avisa al usuario y se conserva una copia de seguridad.
- El catálogo está separado del estado del usuario; actualizar el catálogo o la app nunca borra historial ni valores editados.
- Los datos solo existen en este dispositivo y navegador; borrar los datos locales elimina el historial.

## PWA y funcionamiento sin conexión

- Manifiesto, iconos (192, 512 y maskable) y service worker configurados para instalar la app y abrirla sin conexión tras la primera carga.
- Precaché en la instalación de todos los recursos de la experiencia principal: HTML, CSS, JS, `data/exercises.json`, ilustraciones, iconos y fuentes locales; no se cachea solo lo visitado.
- Cache-first para recursos estáticos, con navegación que responde `index.html` desde caché sin red.
- Sin dependencias de red, cuentas, CDN ni servicios externos.
- `vite-plugin-pwa` y Workbox precachean los archivos de la experiencia principal y administran la versión y limpieza de cachés. La app avisa cuando hay una actualización y espera a que el usuario la aplique.

## Interfaz y accesibilidad

- Diseño adaptable y táctil, con controles legibles en pantallas pequeñas.
- Peso (`inputmode="decimal"`, paso 0,5 kg, mínimo 0) y repeticiones (`inputmode="numeric"`, entero ≥ 1) editables por entrada, con etiquetas accesibles. «Hecho» no registra valores vacíos, negativos ni no numéricos y muestra el error junto al campo. Se acepta la coma decimal.
- Ilustraciones con `loading="lazy"`, dimensiones fijas y a la izquierda del nombre, con texto alternativo útil; si falta una imagen se muestra un reemplazo local.
- El popup de progreso se abre y cierra con teclado, tiene título accesible y devuelve el foco al control que lo abrió.
- El resultado de guardar un registro y los errores se comunican de forma visible.

## Pruebas y calidad

- Pruebas unitarias de validación del catálogo, entradas de fuerza y tiempo, persistencia IndexedDB, selección de la última entrada, orden por último uso y cálculo/formato del cronómetro: `npm test`.
- Comprobaciones disponibles: `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm run build`.
- Para probar localmente: `npm run dev` (no abrir con `file://`).
- Un workflow de GitHub Actions ejecuta las pruebas y publica en GitHub Pages al subir a `main` (Settings → Pages → Source → GitHub Actions).
