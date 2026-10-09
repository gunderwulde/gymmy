# `ExerciseCardTimed`

Tarjeta de una actividad **temporizada** (cinta de correr, bicicleta estática…): no tiene peso ni repeticiones, tiene cronómetro.

## Cuándo se usa

Para toda entrada del catálogo con `tracking: "time"`. `ExerciseList` elige este componente.

## Contenido

- Ilustración, nombre, etiqueta del tipo y grupo muscular, igual que en [`ExerciseCardSets`](../ExerciseCardSets/README.md).
- Línea de recordatorio: «Última vez: 09/10/2026 · 00:30:00» o «Aún no has registrado este ejercicio».
- Tiempo transcurrido en formato `HH:MM:SS` (elemento `<output>`, `aria-label="Tiempo transcurrido en <nombre>"`, `aria-live="off"` para no saturar a lectores de pantalla).
- Si el ejercicio incluye `v1`, muestra su valor actual como texto de solo lectura junto al cronómetro. La cinta de correr define «Inclinación (%)» con inicial `0`; la bicicleta estática, «Resistencia» con inicial `1`. Sin `v1`, muestra solo el temporizador.
- Al pulsar la tarjeta fuera de sus botones se abre el popup para editar `v1`. La información no es un botón ni lleva una etiqueta «Editar».
- Controles según estado:

| Estado                 | Controles en la tarjeta  | Popup               |
| ---------------------- | ------------------------ | ------------------- |
| Sin actividad en curso | «Iniciar»                | Campo `v1` opcional |
| En marcha              | «Pausar» y «Finalizar»   | Campo `v1` opcional |
| En pausa               | «Reanudar» y «Finalizar» | Campo `v1` opcional |

- «Iniciar» queda deshabilitado si **otra** actividad temporizada está en curso: solo puede haber una actividad temporizada en marcha a la vez. Los datos complementarios se validan en el popup antes de guardarse.
- Los botones de acción de la tarjeta no abren el popup. Al pulsar la tarjeta fuera de ellos, se abre el editor; el diálogo se cierra con Escape y devuelve el foco a la tarjeta. Tiene un título accesible y etiquetas y errores asociados a los campos.

## Interfaz

| Prop        | Tipo                              | Descripción                                         |
| ----------- | --------------------------------- | --------------------------------------------------- |
| `exercise`  | `Exercise`                        | Entrada del catálogo.                               |
| `lastEntry` | `TimeEntry \| null`               | Última duración registrada.                         |
| `elapsedMs` | `number`                          | Tiempo activo acumulado a mostrar.                  |
| `status`    | `"idle" \| "running" \| "paused"` | Estado del cronómetro de **esta** actividad.        |
| `blocked`   | `boolean`                         | Hay otra actividad en curso; deshabilita «Iniciar». |
| `values`    | `Record<string, string>`          | Borradores editables de las variables configuradas. |

| Evento         | Cuándo                                                   |
| -------------- | -------------------------------------------------------- |
| `start`        | Al pulsar «Iniciar» en la tarjeta.                       |
| `pause`        | Al pulsar «Pausar» en la tarjeta.                        |
| `resume`       | Al pulsar «Reanudar» en la tarjeta cuando está en pausa. |
| `finish`       | Al pulsar «Finalizar» en la tarjeta.                     |
| `update:value` | Al editar una variable complementaria en el popup.       |
| `commit`       | Al terminar de editar la variable complementaria.        |

## Reglas

- Presentacional: no mide el tiempo. El store usa timestamps de reloj en milisegundos (`Date.now()`), que permiten recalcular el tiempo al volver del reposo del móvil o recargar la app. El tiempo visible es el acumulado más `max(0, ahora - startedAt)` cuando la actividad está en marcha.
- La sesión mantiene `elapsedMs` como acumulado y `startedAt` como timestamp del tramo actual (`null` si está en pausa). Al pausar, suma el tramo al acumulado, pone `startedAt` a `null` y persiste ambos valores en IndexedDB. Al continuar, conserva el acumulado y asigna un nuevo timestamp. Al terminar, incluye el tramo final antes de guardar la duración.
- El intervalo del store solo refresca la presentación; no es la fuente del tiempo transcurrido ni se usa para contar segundos. Al volver la app a primer plano, el display se actualiza usando el timestamp.
- Al terminar se guarda la duración en el historial y no se admite un registro de menos de un segundo.
- Si hay `v1`, su `var`, `txt` y `default` se leen del catálogo. El valor se recupera del último registro o, si falta, del borrador guardado y luego de `default`; se guarda junto con `durationSeconds` al terminar. No se borra ni reinicia el valor al pausar o continuar.
- Tras cada acción, el foco pasa al control más lógico del nuevo estado.
- Los botones llevan `aria-label` con el nombre de la actividad («Pausar: Cinta de correr»).
- La sesión en curso se persiste en IndexedDB para no perderla al recargar (ver README raíz).
