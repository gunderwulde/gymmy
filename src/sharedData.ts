export interface SharedData {
  title: string;
  text: string;
  url: string;
}

/**
 * Lee los datos recibidos mediante `share_target` (método GET: `title`, `text`
 * y `url` en la cadena de consulta). Devuelve `null` si no hay datos.
 */
export function readSharedData(search: string): SharedData | null {
  const params = new URLSearchParams(search);
  const data = {
    title: params.get("title")?.trim() ?? "",
    text: params.get("text")?.trim() ?? "",
    url: params.get("url")?.trim() ?? "",
  };
  return data.title || data.text || data.url ? data : null;
}

/** Nombres de los parámetros que `share_target` añade a la URL. */
export const SHARE_PARAMS = ["title", "text", "url"] as const;
