const REQUIRED_GROUPS = new Set(["chest", "back", "shoulders", "arms", "legs", "glutes", "core", "cardio"]);

export function sortByLatestUsage(catalog, history) {
  const latestDates = new Map();
  for (const entry of history) {
    const date = Date.parse(entry.date);
    if (!latestDates.has(entry.exerciseId) || date > latestDates.get(entry.exerciseId)) {
      latestDates.set(entry.exerciseId, date);
    }
  }
  return catalog
    .map((exercise, index) => ({ exercise, index, lastUsed: latestDates.get(exercise.id) ?? null }))
    .sort((a, b) => {
      if (a.lastUsed === null && b.lastUsed !== null) return 1;
      if (a.lastUsed !== null && b.lastUsed === null) return -1;
      return (b.lastUsed ?? 0) - (a.lastUsed ?? 0) || a.index - b.index;
    })
    .map(({ exercise }) => exercise);
}

export function validateCatalog(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("El catálogo de ejercicios está vacío o no tiene un formato válido.");
  }
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== "object" ||
        typeof item.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) ||
        typeof item.name !== "string" || item.name.trim() === "" ||
        !["machine", "exercise"].includes(item.type) ||
        (item.tracking !== undefined && !["sets", "time"].includes(item.tracking)) ||
        !REQUIRED_GROUPS.has(item.muscleGroup) ||
        typeof item.image !== "string" || !item.image.startsWith("assets/exercises/")) {
      throw new Error(`Hay una entrada incompleta o inválida en el catálogo${item?.id ? ` (${item.id})` : ""}.`);
    }
    const tracking = item.tracking ?? "sets";
    if (tracking === "time") {
      if ("defaultWeight" in item || "defaultReps" in item) {
        throw new Error(`La actividad por tiempo «${item.id}» no debe definir peso ni repeticiones.`);
      }
    } else if (!Number.isFinite(item.defaultWeight) || item.defaultWeight < 0 ||
        !Number.isInteger(item.defaultReps) || item.defaultReps < 1) {
      throw new Error(`Hay valores iniciales incompletos o inválidos en «${item.id}».`);
    }
    if (ids.has(item.id)) throw new Error(`El catálogo contiene el identificador duplicado «${item.id}».`);
    ids.add(item.id);
  }
  return value;
}

export async function loadCatalog() {
  const response = await fetch("./data/exercises.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo de ejercicios (${response.status}).`);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("El archivo del catálogo no contiene JSON válido.");
  }
  return validateCatalog(data);
}
