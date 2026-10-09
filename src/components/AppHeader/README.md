# `AppHeader`

Cabecera de la aplicación. Se corresponde con la captura de referencia del diseño: barra superior y, debajo, el bloque de bienvenida.

## Contenido

**Barra superior**

- Marca: icono «G» y texto `gymmy.` (enlace de inicio con `aria-label`).
- Estado de conexión: punto de color y texto «En línea» / «Sin conexión».
- Botón «Instalar»: solo visible cuando el navegador permite instalar la PWA.
- Botón «Progreso» con icono: abre el historial.

**Bloque de bienvenida (hero)**

- Texto superior «TU COMPAÑERO DE ENTRENAMIENTO» con línea decorativa.
- Título «Un día más. / Un poco más fuerte.» (segunda línea en color de acento).
- Texto de apoyo: «Apunta tus series. La próxima vez, sabrás exactamente dónde lo dejaste.»
- Decoración de círculos concéntricos con insignia «HOY» y la fecha actual en formato corto (p. ej. `09 OCT`). La decoración es `aria-hidden`.

## Interfaz

| Prop          | Tipo      | Descripción                  |
| ------------- | --------- | ---------------------------- |
| `online`      | `boolean` | Estado de conexión mostrado. |
| `installable` | `boolean` | Muestra el botón «Instalar». |

| Evento         | Carga                    | Cuándo                |
| -------------- | ------------------------ | --------------------- |
| `open-history` | `HTMLElement` (el botón) | Al pulsar «Progreso». |
| `install`      | —                        | Al pulsar «Instalar». |

El evento `open-history` entrega el botón que lo originó para que el contenedor pueda devolverle el foco al cerrar el diálogo.

## Reglas

- No accede al store: recibe todo por props y emite eventos.
- La fecha de «HOY» se calcula con `Intl.DateTimeFormat("es-ES")`.
- Es responsive: en pantallas estrechas la decoración se recorta y el texto del estado de conexión se oculta, dejando solo el punto.
