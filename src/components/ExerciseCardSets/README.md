# `ExerciseCardSets`

Tarjeta de un ejercicio **no temporizado**: el que se registra por series.

## Cuándo se usa

Para toda entrada del catálogo con `tracking: "sets"` o sin `tracking`. `ExerciseList` elige este componente; la tarjeta no decide nada sobre su tipo.

## Contenido de la tarjeta

La tarjeta completa es la superficie táctil para abrir el popup de edición. Renderiza en una sola línea un resumen de las variables `v1`, `v2` y `v3`, en ese orden. Cada valor se muestra con `txt`; los campos no están codificados como «Peso» y «Repeticiones». No se añade un botón «Editar» alrededor del resumen.

- Ilustración a la izquierda (82×82, `loading="lazy"`, texto alternativo `«<nombre>, ilustración»`, reemplazo local si falla la carga).
- Nombre, etiqueta del tipo (Máquina / Libre) y grupo muscular.
- Línea de recordatorio: fecha más los últimos valores de las variables configuradas, con sus etiquetas; sin historial, indica que no hay registros.
- Al pulsar la tarjeta se abre el popup para editar y registrar una serie. La tarjeta no muestra campos de entrada ni el botón «Hecho».
- La tarjeta completa admite activación con puntero y teclado; los controles interiores, como el acceso al historial, conservan su propia acción y no abren el popup de registro.
- Si aún no hay valores registrados, el resumen usa los valores editados guardados o `default`.

## Popup de edición y registro

- `<dialog>` con título accesible que identifica el ejercicio y botón para cerrar.
- Un campo por variable configurada, con `txt` como etiqueta y `var` como clave de persistencia. El valor inicial es el borrador guardado o, si falta, el último valor registrado y luego `default`.
- «Repeticiones» es un entero ≥ 1; los demás campos aceptan decimales y coma decimal. No se admiten valores vacíos, negativos o no numéricos.
- El botón **Hecho** registra una nueva serie. Los errores se muestran junto al campo correspondiente y se enlazan con `aria-describedby`.
- Se puede cerrar con Escape; al cerrar, el foco vuelve a la tarjeta que abrió el popup.

## Interfaz

| Prop        | Tipo                     | Descripción                                       |
| ----------- | ------------------------ | ------------------------------------------------- |
| `exercise`  | `Exercise`               | Entrada del catálogo.                             |
| `lastEntry` | `SetEntry \| null`       | Último registro, con valores indexados por `var`. |
| `values`    | `Record<string, string>` | Borradores editables indexados por `var`.         |

| Evento         | Cuándo                                                       |
| -------------- | ------------------------------------------------------------ |
| `update:value` | Al editar, emite la clave `var` y su valor.                  |
| `commit`       | Al terminar de editar (`change`): persiste el borrador.      |
| `done`         | Al pulsar «Hecho» en el popup con todos los valores válidos. |
| `open-history` | Al abrir el historial filtrado de este ejercicio.            |

## Reglas

- Presentacional: no accede al store; `ExerciseList` conecta eventos y valores.
- «Hecho» no registra valores vacíos, negativos ni no numéricos y muestra el error junto al campo. Reglas específicas como la integralidad de las repeticiones se aplican según la variable.
- Cada pulsación de «Hecho» añade una serie al historial; nunca sobrescribe las anteriores (lo garantiza el store).
- Al registrar, la lista se puede reordenar sin perder el foco dentro del popup.
- Las entradas guardan valores por clave `var`. La migración de IndexedDB convierte registros anteriores de peso/repeticiones a `peso`/`repeticiones` sin perder entradas.
