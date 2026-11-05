export type ShareResult = "shared" | "downloaded" | "cancelled";

interface ShareDeps {
  nav?: Navigator;
  doc?: Document;
}

/**
 * Comparte el Markdown como texto con la hoja nativa del sistema. Si no está
 * disponible, descarga el archivo. Debe llamarse desde un gesto del usuario
 * (clic) y en contexto seguro (HTTPS).
 */
export async function shareMarkdown(
  fileName: string,
  title: string,
  content: string,
  { nav = navigator, doc = document }: ShareDeps = {},
): Promise<ShareResult> {
  try {
    if (typeof nav.share === "function") {
      await nav.share({ title, text: content });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    // Si el sistema rechaza compartir, se cae a la descarga.
  }
  const file = new File([content], fileName, { type: "text/markdown" });
  const url = URL.createObjectURL(file);
  const link = doc.createElement("a");
  link.href = url;
  link.download = fileName;
  doc.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
