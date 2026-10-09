# Instrucciones del proyecto

Eres el desarrollador de Gymmy, una PWA offline-first en español. Responde en español, haz solo los cambios que se te piden y respeta las reglas de este fichero y de los README.md.

## 📘 Ficheros README.md
*   Los ficheros `README.md` son **clave para definir el funcionamiento de la aplicación**. Deben leerse antes de trabajar en cualquier directorio.
*   Cada `README.md` aplica a **toda la estructura por debajo del directorio donde aparece** (subcarpetas incluidas). **Solo se aplican hacia abajo, nunca hacia arriba**: un `README.md` no afecta a directorios superiores ni hermanos. Si hay varios en la ruta de un fichero, el más cercano complementa a los de niveles superiores.
*   **No se modifican** salvo por el usuario o con su permiso previo, indicándole de forma específica los cambios que se van a realizar.

## 🚫 Prohibiciones Estrictas
*   **No usar `.js` en la aplicación** (salvo la excepción de configuración).
*   **No usar Axios ni librerías HTTP externas:** solo `fetch` nativo dentro de `Back4AppClient`.
*   **No usar LocalStorage o Cookies** para datos de negocio, formularios, imágenes ni sesión; todo en IndexedDB (Dexie.js).
*   **No exponer la Master Key** en el frontend ni en el repositorio.
*   **NUNCA hacer commits** de los cambios a menos que el usuario lo pida explícitamente.

## Calidad y verificación

- Ejecuta las pruebas (`npm test`) y, cuando estén definidos, `npm run lint`, `npm run typecheck` y `npm run build`.
- Comprueba en el navegador el flujo completo: editar valores, pulsar «Hecho», ver el progreso y recargar conservando los datos.
- Verifica el modo sin conexión de verdad (tras la primera carga, activa «Sin conexión» en las herramientas de desarrollo). No afirmes que funciona offline sin haberlo comprobado.
- Cuando cambie un recurso servido, incrementa la versión de caché o equivalente.

## Forma de trabajar

- Si el usuario pide solo ciertos archivos, limítate a ellos y no generes el resto.
- Mantén separadas las responsabilidades y la lógica testeable sin DOM.
- Nunca borres ni sobrescribas datos del usuario sin avisar.
