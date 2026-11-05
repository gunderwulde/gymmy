# `AppHeader`

Cabecera de la aplicación: un único bloque (hero) con la marca y la fecha.

## Contenido

- Marca: icono «G» y texto `gymmy.` (título `h1` con enlace de inicio y `aria-label`).
- Botón «Instalar»: solo visible cuando el navegador permite instalar la PWA.
- Botones «Compartir .md» y «Texto»: piden exportar las rutinas como archivo Markdown o como texto plano.
- Insignia circular «HOY» con la fecha actual en formato corto (p. ej. `09 OCT`), a la derecha. Es `aria-hidden`.

## Interfaz

| Prop          | Tipo      | Descripción                  |
| ------------- | --------- | ---------------------------- |
| `installable` | `boolean` | Muestra el botón «Instalar». |

| Evento    | Carga                           | Cuándo                               |
| --------- | ------------------------------- | ------------------------------------ |
| `install` | —                               | Al pulsar «Instalar».                |
| `export`  | `boolean` (`true` = como texto) | Al pulsar «Compartir .md» o «Texto». |

## Reglas

- No accede al store: recibe todo por props y emite eventos. `App.vue` genera y comparte el Markdown.
- La fecha de «HOY» se calcula con `Intl.DateTimeFormat("es-ES")`.
- Es responsive: en pantallas bajas se reducen márgenes y tamaños.
