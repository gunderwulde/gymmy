export const STORAGE_KEY = "gymmy:v1";
const BACKUP_KEY = "gymmy:v1:corrupt-backup";

function emptyState() {
  return { version: 1, values: {}, history: [] };
}

export function validateState(value) {
  if (!value || typeof value !== "object" || value.version !== 1 ||
      !value.values || typeof value.values !== "object" || Array.isArray(value.values) ||
      !Array.isArray(value.history)) {
    throw new Error("Los datos guardados tienen un formato no reconocido.");
  }
  for (const [id, fields] of Object.entries(value.values)) {
    if (!id || !fields || typeof fields !== "object" ||
        !Number.isFinite(fields.weight) || fields.weight < 0 ||
        !Number.isInteger(fields.reps) || fields.reps < 1) {
      throw new Error("Hay valores de entrenamiento guardados que no son válidos.");
    }
  }
  for (const entry of value.history) {
    const validDate = typeof entry?.date === "string" && !Number.isNaN(Date.parse(entry.date));
    const validTimeEntry = entry?.mode === "time" &&
      Number.isInteger(entry.durationSeconds) && entry.durationSeconds >= 1;
    const validSetEntry = (entry?.mode === undefined || entry.mode === "sets") &&
      Number.isFinite(entry?.weight) && entry.weight >= 0 &&
      Number.isInteger(entry?.reps) && entry.reps >= 1;
    if (!entry || typeof entry.exerciseId !== "string" || !validDate ||
        (!validTimeEntry && !validSetEntry)) {
      throw new Error("Hay entradas del historial guardadas que no son válidas.");
    }
  }
  return value;
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return { state: emptyState(), warning: "" };
  try {
    const state = validateState(JSON.parse(raw));
    return { state, warning: "" };
  } catch (error) {
    try {
      localStorage.setItem(BACKUP_KEY, raw);
    } catch (backupError) {
      return {
        state: emptyState(),
        warning: `No se pudieron leer los datos guardados ni crear una copia de seguridad (${backupError.message}). No se han sobrescrito.`,
        blocked: true
      };
    }
    return {
      state: emptyState(),
      warning: `${error.message} Se conservó una copia de seguridad local; al guardar nuevos datos se iniciará un historial nuevo.`
    };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validateState(state)));
}

export function latestEntry(history, exerciseId) {
  let latest = null;
  for (const entry of history) {
    if (entry.exerciseId === exerciseId && (!latest || Date.parse(entry.date) > Date.parse(latest.date))) {
      latest = entry;
    }
  }
  return latest;
}
