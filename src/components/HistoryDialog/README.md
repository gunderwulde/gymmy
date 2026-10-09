# `HistoryDialog`

Ventana emergente (`<dialog>`) con el progreso. Hoy vive dentro de `App.vue`; al dividir la aplicación pasa a ser su propio componente, hijo del contenedor.

## Contenido

- Título «Tu progreso» (`aria-labelledby`).
- Selector «Ver historial» para filtrar por ejercicio («Todos los ejercicios» por defecto).
- Historial agrupado por día, del más reciente al más antiguo; cada entrada muestra ejercicio, hora y resultado (`40 kg × 10` o `HH:MM:SS`).
- Entradas de ejercicios que ya no existen en el catálogo: se conservan con el nombre genérico «Ejercicio eliminado».
- Estados vacíos distintos: sin historial, o sin registros para el ejercicio filtrado.

## Interfaz

| Prop      | Tipo             | Descripción                                 |
| --------- | ---------------- | ------------------------------------------- |
| `catalog` | `Exercise[]`     | Para resolver nombres y poblar el selector. |
| `history` | `HistoryEntry[]` | Entradas a mostrar.                         |

| Método expuesto (`defineExpose`) | Descripción                                                    |
| -------------------------------- | -------------------------------------------------------------- |
| `open(opener, exerciseId?)`      | Abre el diálogo, opcionalmente filtrado, y recuerda el opener. |

## Reglas

- Abrir y cerrar con teclado (Esc cierra de forma nativa; el botón de cierre tiene `aria-label`).
- Al cerrar, devuelve el foco al control que lo abrió.
- Presentacional: no accede al store.
