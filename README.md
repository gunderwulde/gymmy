# Gymmy

Gymmy es una aplicación web progresiva (PWA) para llevar un registro de tus entrenamientos de gimnasio, consultar tus últimas series y revisar el progreso. La interfaz y el catálogo están en español.

## Funciones

- Catálogo de máquinas y ejercicios con ilustraciones SVG locales.
- Filtros por tipo y búsqueda por nombre o grupo muscular.
- Peso y repeticiones editables; cada pulsación de **Hecho** añade una serie al historial.
- Cinta de correr y bicicleta estática con cronómetro `HH:MM:SS`; las pausas no cuentan en la duración y al terminar se guarda el tiempo en el historial.
- Recordatorio de la fecha, el peso y las repeticiones de la última sesión de cada ejercicio.
- Historial cronológico con filtro por ejercicio.
- Datos guardados en el almacenamiento local del navegador; no se envían a un servidor.
- PWA instalable y disponible sin conexión después de cargarla por primera vez.

## Probar en local

El service worker necesita un servidor local; no abras `index.html` directamente con `file://`.

```sh
npx serve .
```

Abre la dirección local que indique el servidor. Para ejecutar las pruebas:

```sh
npm test
```

## Publicación

El workflow de GitHub Actions ejecuta las pruebas y publica la aplicación en GitHub Pages al subir cambios a `main`. En la configuración del repositorio, selecciona **Settings → Pages → Build and deployment → Source → GitHub Actions** si Pages aún no está habilitado.

La URL esperada es <https://gunderwulde.github.io/gymmy/>.

## Datos

El catálogo del gimnasio está en [`data/exercises.json`](./data/exercises.json) y sus ilustraciones en [`assets/exercises/`](./assets/exercises/). Los entrenamientos se guardan solo en este dispositivo y navegador; borrar sus datos locales elimina el historial.
