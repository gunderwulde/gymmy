# `ExerciseCardSets`

Tarjeta de un ejercicio **no temporizado**: el que se registra por series (peso y repeticiones).

## Cuándo se usa

Para toda entrada del catálogo con `tracking: "sets"` o sin `tracking`. `ExerciseList` elige este componente; la tarjeta no decide nada sobre su tipo.

## Contenido

- Ilustración a la izquierda (82×82, `loading="lazy"`, texto alternativo `«<nombre>, ilustración»`, reemplazo local si falla la carga).
- Nombre, etiqueta del tipo (Máquina / Libre) y grupo muscular.
- Línea de recordatorio: «Última vez: 05/10/2026 · 40 kg × 10» o «Aún no has registrado este ejercicio».
- Campo **Peso (kg)**: `inputmode="decimal"`, acepta coma decimal, mínimo 0, paso 0,5.
- Campo **Repeticiones**: `inputmode="numeric"`, entero ≥ 1.
- Botón **Hecho** (con `aria-label="Registrar <nombre> como hecho"`).
- Error de validación junto a cada campo, enlazado con `aria-describedby`.

## Interfaz

| Prop        | Tipo               | Descripción                                          |
| ----------- | ------------------ | ---------------------------------------------------- |
| `exercise`  | `Exercise`         | Entrada del catálogo.                                |
| `lastEntry` | `SetEntry \| null` | Última serie registrada, para el recordatorio.       |
| `weight`    | `string`           | Valor editable del peso (`v-model:weight`).          |
| `reps`      | `string`           | Valor editable de las repeticiones (`v-model:reps`). |

| Evento          | Cuándo                                                           |
| --------------- | ---------------------------------------------------------------- |
| `update:weight` | Al editar el peso.                                               |
| `update:reps`   | Al editar las repeticiones.                                      |
| `commit`        | Al terminar de editar (`change`): persiste el borrador.          |
| `done`          | Al pulsar «Hecho» con valores válidos.                           |
| `open-history`  | Si se ofrece acceso al historial del ejercicio desde la tarjeta. |

## Reglas

- Presentacional: no accede al store; `ExerciseList` conecta eventos y valores.
- Valida con `parseWeight` / `parseReps` (`timer.ts`). «Hecho» no registra valores vacíos, negativos ni no numéricos y muestra el error junto al campo.
- Cada pulsación de «Hecho» añade una serie al historial; nunca sobrescribe las anteriores (lo garantiza el store).
- Al registrar, el foco debe volver al botón «Hecho» de esta tarjeta aunque la lista se reordene.
- Los valores iniciales son los de la última entrada; sin historial, los del catálogo.
