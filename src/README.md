# `src/`

Código de la aplicación. Complementa al [README.md](../README.md) raíz; en caso de conflicto sobre estructura de la interfaz, manda el README más cercano al fichero.

## Página principal

[`App.vue`](./App.vue) es **solo un contenedor**: no contiene lógica de negocio ni marcado de ejercicios. Su única responsabilidad es componer, en este orden:

1. `AppHeader`: cabecera con marca, estado, botón «Progreso» y bloque de bienvenida.
2. `ExerciseList`: búsqueda, filtros y lista de ejercicios.
3. `HistoryDialog`: ventana emergente con el progreso (fuera del flujo visual, abierta desde la cabecera).
4. `UpdateBanner`: aviso de nueva versión disponible.

`App.vue` conecta los componentes entre sí (por ejemplo, el evento de «Progreso» de `AppHeader` abre `HistoryDialog`) y arranca la carga inicial del store. No importa componentes de ejercicio directamente: eso lo hace `ExerciseList`.

## Distribución móvil

- El header (`AppHeader`) y el footer de `App.vue` son inamovibles: permanecen anclados a los bordes superior e inferior del área visible y no se desplazan al recorrer los ejercicios.
- `ExerciseList` ocupa la zona central disponible y es la zona con scroll. El desplazamiento de la lista no debe mover el header ni el footer ni provocar scroll fuera del área de la aplicación.
- La interfaz está pensada para móvil; no se debe permitir ampliar la aplicación mediante zoom.

## Estructura

- `components/`: un directorio por componente. Ver [components/README.md](./components/README.md).
- `stores/`: estado compartido con Pinia (`workout`).
- `storage/`: capa Dexie / IndexedDB.
- `catalog.ts`, `timer.ts`, `variables.ts`, `types.ts`: dominio testeable sin DOM.
