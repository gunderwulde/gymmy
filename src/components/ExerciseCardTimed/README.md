# `ExerciseCardTimed`

Tarjeta de una actividad **temporizada** (cinta de correr, bicicleta estática…): no tiene peso ni repeticiones, tiene cronómetro.

## Cuándo se usa

Para toda entrada del catálogo con `tracking: "time"`. `ExerciseList` elige este componente.

## Contenido

- Ilustración, nombre, etiqueta del tipo y grupo muscular, igual que en [`ExerciseCardSets`](../ExerciseCardSets/README.md).
- Línea de recordatorio: «Última vez: 09/10/2026 · 00:30:00» o «Aún no has registrado este ejercicio».
- Tiempo transcurrido en formato `HH:MM:SS` (elemento `<output>`, `aria-label="Tiempo transcurrido en <nombre>"`, `aria-live="off"` para no saturar a lectores de pantalla).
- Controles según estado:

| Estado                 | Botones                  |
| ---------------------- | ------------------------ |
| Sin actividad en curso | «Iniciar»                |
| En marcha              | «Pausar» y «Terminar»    |
| En pausa               | «Continuar» y «Terminar» |

- «Iniciar» queda deshabilitado si **otra** actividad temporizada está en curso: solo puede haber una a la vez.

## Interfaz

| Prop        | Tipo                              | Descripción                                         |
| ----------- | --------------------------------- | --------------------------------------------------- |
| `exercise`  | `Exercise`                        | Entrada del catálogo.                               |
| `lastEntry` | `TimeEntry \| null`               | Última duración registrada.                         |
| `elapsedMs` | `number`                          | Tiempo activo acumulado a mostrar.                  |
| `status`    | `"idle" \| "running" \| "paused"` | Estado del cronómetro de **esta** actividad.        |
| `blocked`   | `boolean`                         | Hay otra actividad en curso; deshabilita «Iniciar». |

| Evento   | Cuándo                 |
| -------- | ---------------------- |
| `start`  | Al pulsar «Iniciar».   |
| `pause`  | Al pulsar «Pausar».    |
| `resume` | Al pulsar «Continuar». |
| `finish` | Al pulsar «Terminar».  |

## Reglas

- Presentacional: no mide el tiempo. El store usa timestamps de reloj en milisegundos (`Date.now()`), que permiten recalcular el tiempo al volver del reposo del móvil o recargar la app. El tiempo visible es el acumulado más `max(0, ahora - startedAt)` cuando la actividad está en marcha.
- La sesión mantiene `elapsedMs` como acumulado y `startedAt` como timestamp del tramo actual (`null` si está en pausa). Al pausar, suma el tramo al acumulado, pone `startedAt` a `null` y persiste ambos valores en IndexedDB. Al continuar, conserva el acumulado y asigna un nuevo timestamp. Al terminar, incluye el tramo final antes de guardar la duración.
- El intervalo del store solo refresca la presentación; no es la fuente del tiempo transcurrido ni se usa para contar segundos. Al volver la app a primer plano, el display se actualiza usando el timestamp.
- Al terminar se guarda la duración en el historial y no se admite un registro de menos de un segundo.
- Tras cada acción, el foco pasa al botón más lógico del nuevo estado (p. ej. de «Iniciar» a «Pausar»).
- Los botones llevan `aria-label` con el nombre de la actividad («Pausar: Cinta de correr»).
- La sesión en curso se persiste en IndexedDB para no perderla al recargar (ver README raíz).
