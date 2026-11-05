# `SharedDataDialog`

Ventana emergente (`<dialog>` modal) que confirma la recepción de datos compartidos con Gymmy desde otra aplicación (por ejemplo, una IA) mediante la hoja de compartir del sistema.

## Contenido

- Título «¡Datos recibidos!» y el número de caracteres recibidos.
- Botón «Aceptar» que cierra el diálogo.

## Interfaz

| Prop   | Tipo                 | Descripción                                                         |
| ------ | -------------------- | ------------------------------------------------------------------- |
| `data` | `SharedData \| null` | Datos recibidos; al pasar de `null` a un valor, el diálogo se abre. |

| Evento  | Cuándo                  |
| ------- | ----------------------- |
| `close` | Al cerrarse el diálogo. |

## Reglas

- No accede al store ni procesa los datos: de momento solo avisa de que se han recibido.
- La lectura de los parámetros vive en `src/sharedData.ts` (sin DOM, con tests). `App.vue` los lee al arrancar, limpia la URL con `history.replaceState` y abre el diálogo.
- El manifest declara `share_target` (método GET, parámetros `title`, `text` y `url`); solo funciona con la PWA instalada.
