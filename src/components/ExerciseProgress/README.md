# `ExerciseProgress`

Historial de un único ejercicio, mostrado dentro del popup de edición de sus tarjetas ([`ExerciseCardSets`](../ExerciseCardSets/README.md) y [`ExerciseCardTimed`](../ExerciseCardTimed/README.md)), debajo de los campos.

## Contenido

- Título «Progreso» y las entradas agrupadas por día, del más reciente al más antiguo; cada entrada muestra la hora y los valores registrados con las etiquetas del catálogo. Las actividades temporizadas también muestran `HH:MM:SS`.
- Sin entradas: «Aún no has registrado este ejercicio.»
- La lista tiene su propio scroll vertical (altura máxima) para no alargar el popup.

## Interfaz

| Prop       | Tipo             | Descripción                                     |
| ---------- | ---------------- | ----------------------------------------------- |
| `exercise` | `Exercise`       | Ejercicio, para las etiquetas de las variables. |
| `history`  | `HistoryEntry[]` | Entradas de **este** ejercicio (ya filtradas).  |

Sin eventos.

## Reglas

- Presentacional: no accede al store; `ExerciseList` filtra y pasa el historial de cada ejercicio.
- Sección con `aria-labelledby` apuntando a su título.
