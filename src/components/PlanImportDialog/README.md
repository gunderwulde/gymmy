# `PlanImportDialog`

Ventana emergente (`<dialog>` modal) para importar el **plan de la IA**: la respuesta a la que se le pasó el `.md` exportado.

## Flujo

1. Al abrirse (`open()`, desde un clic) intenta leer el portapapeles con `navigator.clipboard.readText()`.
2. Si el texto contiene un plan válido (ver protocolo), muestra la vista previa: rutinas, valores que se sustituyen («antes → después») y avisos de lo descartado.
3. «Aplicar plan» emite `apply` con el plan; «Cancelar» no cambia nada.
4. Si no se puede leer el portapapeles (permiso denegado, iOS) o no hay plan, muestra un cuadro de texto para pegar a mano, con «Pegar del portapapeles» y «Analizar».

## Interfaz

| Prop      | Tipo                                     | Descripción                             |
| --------- | ---------------------------------------- | --------------------------------------- |
| `catalog` | `Exercise[]`                             | Para validar ids y variables del plan.  |
| `values`  | `Record<string, Record<string, string>>` | Valores actuales, para la vista previa. |

| Evento  | Carga  | Cuándo                       |
| ------- | ------ | ---------------------------- |
| `apply` | `Plan` | Al confirmar «Aplicar plan». |

Expone `open()`.

## Protocolo (versión 1)

La respuesta de la IA debe terminar con **un bloque** ` ```gymmy-plan ` con JSON válido (también se acepta JSON suelto con `"gymmy": 1`):

```json
{
  "gymmy": 1,
  "routines": [
    {
      "id": "empuje",
      "name": "Empuje",
      "days": ["lun", "jue"],
      "exercises": ["pec-deck"]
    }
  ],
  "targets": {
    "pec-deck": { "values": { "peso": 42.5, "repeticiones": 10 } },
    "cinta-correr": { "minutes": 20 }
  },
  "notes": "Texto opcional"
}
```

- `days`: `lun mar mie jue vie sab dom` (se aceptan nombres completos y con tildes).
- `targets[id].values` usa las claves de las variables del ejercicio; `minutes` solo en actividades temporizadas.
- Ids o valores desconocidos o inválidos se descartan con un aviso.
- Regla fija: `cinta-correr` es el calentamiento diario de 20 minutos; Gymmy lo añade siempre.
- El `.md` exportado incluye estas reglas, los ids y las claves de cada ejercicio.

## Reglas

- No accede al store: el contenedor (`App.vue`) aplica el plan con `store.applyPlan`.
- Aplicar sustituye los valores editados de los ejercicios con objetivo; el historial nunca se modifica.
- La lógica de lectura y validación vive en `src/plan.ts` (sin DOM, con tests).
