# `ExerciseList`

Sección «Ejercicios»: encabezado con contador, barra de búsqueda y filtros, mensajes y lista de tarjetas de ejercicio.

## Responsabilidades

- Es el **único** componente que decide qué tarjeta usar para cada ejercicio:
  - `tracking: "time"` → [`ExerciseCardTimed`](../ExerciseCardTimed/README.md).
  - resto (`sets` o sin `tracking`) → [`ExerciseCardSets`](../ExerciseCardSets/README.md).
- No fija etiquetas ni número de controles: cada tarjeta recibe su ejercicio y presenta las variables `v1`–`v3` (no temporizados) o, opcionalmente, `v1` (temporizados) del catálogo. La tarjeta de series abre su popup al pulsar su superficie; la tarjeta temporizada lo abre al pulsar fuera de sus botones. «Iniciar», pausa, reanudación y finalización son acciones de la tarjeta; la edición de `v1` temporizada queda en el popup.
- Filtra por texto y por zona del cuerpo, y muestra el contador de resultados.
- Muestra el mensaje del store (guardado correcto o error), el estado de carga y el estado vacío («No hay ejercicios que coincidan con tu búsqueda.»).
- Es contenedor: lee el catálogo ordenado del store (`sortedCatalog`) y pasa a cada tarjeta lo que necesita.

## Área de desplazamiento

- La sección ocupa el espacio central disponible entre el header y el footer de `App.vue`; no desplaza esos elementos.
- Con resultados, solo la cuadrícula `.exercise-list` tiene scroll vertical. El encabezado, la búsqueda, los filtros y los mensajes permanecen visibles.
- El gesto de desplazamiento de la lista no debe propagarse a la página ni permitir scroll fuera del área de la aplicación.

## Clasificación

Los filtros son **Todos**, **Superiores**, **Inferiores** y **Cardio** (sustituyen a «Todos / Máquinas / Libres»).

| Filtro       | Grupos musculares del catálogo               |
| ------------ | -------------------------------------------- |
| `Todos`      | Todos los ejercicios.                        |
| `Superiores` | `chest`, `back`, `shoulders`, `arms`, `core` |
| `Inferiores` | `legs`, `glutes`                             |
| `Cardio`     | `cardio`                                     |

- La zona se **deriva** de `muscleGroup` mediante una función de dominio testeable (en `catalog.ts`); el catálogo no cambia de formato y los `id` no se tocan.
- `core` se agrupa en Superiores (tronco). Reparto confirmado por el usuario.
- La distinción máquina/libre sigue visible en cada tarjeta como etiqueta (`type`), pero deja de ser un filtro.
- La búsqueda sigue siendo por nombre o grupo muscular y se combina con el filtro de zona.
- Filtros con `role="group"`, `aria-label="Filtrar ejercicios"` y `aria-pressed` en cada botón.

## Orden

Se mantiene el orden por último uso: primero la actividad más reciente; las que no tienen historial quedan al final en su orden original. Se reordena tras cada registro. El filtro no altera el criterio de orden.

## Interfaz

Lee del store y no recibe props obligatorias. Cada tarjeta se identifica con `id="exercise-<id>"` para poder devolverle el foco tras registrar.

| Evento (de las tarjetas) | Gestión                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `open-history`           | Se reenvía al contenedor con el `id` del ejercicio, para abrir `HistoryDialog` filtrado. |
