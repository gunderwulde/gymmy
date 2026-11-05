# `AppHeader`

Cabecera de la aplicación: un único bloque (hero) con la marca y la fecha.

## Contenido

- Marca: icono «G» y texto `gymmy.` (título `h1` con enlace de inicio y `aria-label`).
- Botón «Instalar»: solo visible cuando el navegador permite instalar la PWA.
- Botón «Pegar plan de la IA»: pide importar el plan desde el portapapeles.
- Botón «Compartir datos con la IA»: pide exportar las rutinas como texto Markdown.
- Insignia circular «HOY» con la fecha actual en formato corto (p. ej. `09 OCT`), a la derecha. Es `aria-hidden`.

## Interfaz

| Prop          | Tipo      | Descripción                  |
| ------------- | --------- | ---------------------------- |
| `installable` | `boolean` | Muestra el botón «Instalar». |

| Evento        | Carga | Cuándo                                 |
| ------------- | ----- | -------------------------------------- |
| `install`     | —     | Al pulsar «Instalar».                  |
| `import-plan` | —     | Al pulsar «Pegar plan de la IA».       |
| `export`      | —     | Al pulsar «Compartir datos con la IA». |

## Reglas

- No accede al store: recibe todo por props y emite eventos. `App.vue` genera y comparte el Markdown.
- La fecha de «HOY» se calcula con `Intl.DateTimeFormat("es-ES")`.
- Es responsive: en pantallas bajas se reducen márgenes y tamaños.
