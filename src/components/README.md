# `src/components/`

Reglas comunes para todos los componentes de la interfaz. Cada componente tiene además su propio README, que complementa a este.

## Organización

- **Un directorio por componente**, con el nombre del componente en PascalCase: `components/NombreComponente/`.
- Cada directorio contiene, como mínimo:
  - `NombreComponente.vue`: el componente.
  - `README.md`: responsabilidad, props, eventos, estado que consume y reglas de accesibilidad.
- Los estilos del componente viven en su propio `.vue` (`<style scoped>`). Los tokens globales (colores, tipografía, `:root`) siguen en `styles.css`.
- Un componente que solo se usa dentro de otro puede anidarse en un subdirectorio del componente padre, con su propio README.
- Los componentes no se importan entre hermanos salvo que el README del padre lo indique: la composición la hace el padre.

## Componentes

| Componente                                           | Qué es                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| [`AppHeader`](./AppHeader/README.md)                 | Cabecera: barra superior y bloque de bienvenida.             |
| [`ExerciseList`](./ExerciseList/README.md)           | Búsqueda, filtros y lista de ejercicios.                     |
| [`ExerciseCardSets`](./ExerciseCardSets/README.md)   | La tarjeta abre el popup para editar y registrar series.     |
| [`ExerciseCardTimed`](./ExerciseCardTimed/README.md) | Cronómetro y controles; la tarjeta abre el popup de edición. |
| [`HistoryDialog`](./HistoryDialog/README.md)         | Ventana emergente con el historial de progreso.              |
| [`UpdateBanner`](./UpdateBanner/README.md)           | Aviso de actualización disponible de la PWA.                 |

## Reglas

- Los componentes son **presentacionales** siempre que sea posible: reciben datos por `props` y comunican acciones con `emit`. El acceso al store de Pinia se limita a los contenedores indicados en cada README.
- Sin lógica de dominio en los `.vue`: validación, formato, orden y cronómetro viven en módulos testeables sin DOM (`catalog.ts`, `timer.ts`).
- TypeScript con `<script setup lang="ts">`, props y eventos tipados.
- Textos visibles en español, accesibles (etiquetas, `aria-*`, foco visible) y táctiles, según el README raíz.
- Los componentes no usan `localStorage` ni cookies ni hacen peticiones HTTP.
