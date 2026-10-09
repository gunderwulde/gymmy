# Instrucciones del proyecto

## 📘 Ficheros README.md
*   Los ficheros `README.md` son **clave para definir el funcionamiento de la aplicación**. Deben leerse antes de trabajar en cualquier directorio.
*   Cada `README.md` aplica a **toda la estructura por debajo del directorio donde aparece** (subcarpetas incluidas). **Solo se aplican hacia abajo, nunca hacia arriba**: un `README.md` no afecta a directorios superiores ni hermanos. Si hay varios en la ruta de un fichero, el más cercano complementa a los de niveles superiores.
*   **No se modifican** salvo por el usuario o con su permiso previo, indicándole de forma específica los cambios que se van a realizar.

## Calidad y verificación

- Ejecuta las pruebas (`npm test`) y, cuando estén definidos, `npm run lint`, `npm run typecheck` y `npm run build`.
- Comprueba en el navegador el flujo completo: editar valores, pulsar «Hecho», ver el progreso y recargar conservando los datos.
- Verifica el modo sin conexión de verdad (tras la primera carga, activa «Sin conexión» en las herramientas de desarrollo). No afirmes que funciona offline sin haberlo comprobado.
- Cuando cambie un recurso servido, incrementa la versión de caché o equivalente.

## Forma de trabajar

- Si el usuario pide solo ciertos archivos, limítate a ellos y no generes el resto.
- Mantén separadas las responsabilidades y la lógica testeable sin DOM.
- Nunca borres ni sobrescribas datos del usuario sin avisar.
