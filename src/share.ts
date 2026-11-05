export type ShareResult =
  "shared-file" | "shared-text" | "downloaded" | "cancelled";

interface ShareDeps {
  nav?: Navigator;
  doc?: Document;
}

/**
 * Comparte el Markdown con la hoja nativa del sistema. Orden de preferencia:
 * archivo .md → texto plano → descarga del archivo. Debe llamarse desde un
 * gesto del usuario (clic) y en contexto seguro (HTTPS).
 */
export async function shareMarkdown(
  fileName: string,
  title: string,
  content: string,
  asText = false,
  { nav = navigator, doc = document }: ShareDeps = {},
): Promise<ShareResult> {
  const file = new File([content], fileName, { type: "text/markdown" });
  try {
    if (typeof nav.share === "function") {
      if (!asText && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title });
        return "shared-file";
      }
      await nav.share({ title, text: content });
      return "shared-text";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    // Si el sistema rechaza compartir, se cae a la descarga.
  }
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
