# `UpdateBanner`

Aviso de que hay una nueva versión de la aplicación lista. Hoy vive dentro de `App.vue`.

## Contenido

- Texto «Hay una actualización lista.»
- Botón «Actualizar ahora» y botón de descartar (`aria-label="Descartar aviso"`).

## Interfaz

| Prop      | Tipo      | Descripción                       |
| --------- | --------- | --------------------------------- |
| `visible` | `boolean` | Hay una actualización disponible. |

| Evento    | Cuándo                        |
| --------- | ----------------------------- |
| `update`  | Al pulsar «Actualizar ahora». |
| `dismiss` | Al descartar el aviso.        |

## Reglas

- No recarga la página por sí mismo: la actualización solo se aplica cuando el usuario lo pide, para no perder una edición en curso.
- El estado de la PWA (`needRefresh`, `updateServiceWorker`) lo gestiona el contenedor con `vite-plugin-pwa`; el componente es presentacional.
