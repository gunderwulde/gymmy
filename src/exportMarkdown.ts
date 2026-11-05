import { buildProgressSeries } from "./progress";
import { PLAN_FENCE, PLAN_VERSION, WARMUP_ID, WARMUP_MINUTES } from "./plan";
import { exerciseVariables, formatVariableValues } from "./variables";
import { formatElapsedTime } from "./timer";
import type { Exercise, HistoryEntry } from "./types";

const GROUP_NAMES: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  arms: "Brazos",
  legs: "Piernas",
  glutes: "Glúteos",
  core: "Core",
  cardio: "Cardio",
};

/** Sesiones recientes que se detallan por ejercicio. */
export const RECENT_SESSIONS = 8;

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function localDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function describeEntry(exercise: Exercise, entry: HistoryEntry): string {
  const values = formatVariableValues(
    exerciseVariables(exercise),
    entry.values,
  );
  if (entry.mode !== "time") return values;
  return [formatElapsedTime(entry.durationSeconds * 1000), values]
    .filter(Boolean)
    .join(", ");
}

function section(
  exercise: Exercise,
  history: HistoryEntry[],
  formatter: (entry: HistoryEntry) => string,
): string[] {
  const own = history.filter((entry) => entry.exerciseId === exercise.id);
  const series = buildProgressSeries(exercise, own);
  const lines = [
    `### ${exercise.name}`,
    "",
    `- Id: \`${exercise.id}\` · Variables (clave = etiqueta): ${
      exerciseVariables(exercise)
        .map((variable) => `${variable.var} = ${variable.txt}`)
        .join(", ") || "ninguna"
    }${exercise.tracking === "time" ? " · Actividad temporizada (objetivo en minutos)" : ""}`,
    `- Tipo: ${exercise.type === "machine" ? "máquina" : "peso libre"} · Grupo: ${GROUP_NAMES[exercise.muscleGroup] ?? exercise.muscleGroup}`,
  ];
  if (!own.length) {
    lines.push("- Sin registros todavía.", "");
    return lines;
  }
  const points = series.points;
  const first = points[0];
  const last = points.at(-1);
  lines.push(`- Días con registro: ${points.length}`);
  if (first && last) {
    const unit = series.unit ? ` ${series.unit}` : "";
    const delta = last.value - first.value;
    lines.push(
      `- ${series.title}: ${number.format(first.value)}${unit} → ${number.format(last.value)}${unit} (${delta >= 0 ? "+" : "−"}${number.format(Math.abs(delta))}${unit}) entre ${localDay(new Date(first.date))} y ${localDay(new Date(last.date))}`,
    );
  }
  lines.push("", "| Fecha | Registro |", "| --- | --- |");
  for (const entry of [...own]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, RECENT_SESSIONS)) {
    lines.push(
      `| ${localDay(new Date(entry.date))} | ${formatter(entry) || "—"} |`,
    );
  }
  lines.push("");
  return lines;
}

/**
 * Genera un informe en Markdown con el catálogo y el historial, listo para
 * pasárselo a una IA junto con la petición de sugerencias de mejora.
 */
export function buildRoutineMarkdown(
  catalog: Exercise[],
  history: HistoryEntry[],
  now = new Date(),
): string {
  const lines: string[] = [
    "# Mis rutinas de gimnasio (Gymmy)",
    "",
    `Exportado el ${localDay(now)}.`,
    "",
    "## Petición",
    "",
    "Actúa como entrenador personal. Analiza mis ejercicios y su evolución y dime:",
    "",
    "1. Qué grupos musculares tengo descuidados o desequilibrados.",
    "2. Qué ejercicios están estancados y cómo progresar (carga, repeticiones, frecuencia).",
    "3. Qué ejercicios añadirías o cambiarías, y cómo organizar una semana tipo.",
    "4. Señales de sobreentrenamiento o riesgos que veas.",
    "",
    "Notas sobre los datos: los pesos están en kg; el «1RM estimado» es la media de las fórmulas de Epley y Brzycki (con un máximo de 12 repeticiones); si hay varios registros el mismo día se toma el mejor.",
    "",
    "## Resumen",
    "",
  ];

  const byGroup = new Map<string, number>();
  for (const entry of history) {
    const exercise = catalog.find((item) => item.id === entry.exerciseId);
    if (!exercise) continue;
    byGroup.set(
      exercise.muscleGroup,
      (byGroup.get(exercise.muscleGroup) ?? 0) + 1,
    );
  }
  lines.push(
    `- Ejercicios en el catálogo: ${catalog.length}`,
    `- Registros totales: ${history.length}`,
  );
  if (history.length) {
    const days = new Set(
      history.map((entry) => localDay(new Date(entry.date))),
    );
    const dates = history.map((entry) => Date.parse(entry.date));
    lines.push(
      `- Días con entrenamiento: ${days.size} (del ${localDay(new Date(Math.min(...dates)))} al ${localDay(new Date(Math.max(...dates)))})`,
    );
    lines.push(
      `- Registros por grupo muscular: ${[...byGroup.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([group, count]) => `${GROUP_NAMES[group] ?? group} ${count}`)
        .join(", ")}`,
    );
  }
  lines.push("", "## Ejercicios", "");
  for (const exercise of catalog) {
    lines.push(
      ...section(exercise, history, (entry) => describeEntry(exercise, entry)),
    );
  }
  lines.push(...protocolSection(catalog));
  return `${lines.join("\n").trimEnd()}\n`;
}

export const EXPORT_FILE_NAME = "gymmy-rutinas.md";

function protocolSection(catalog: Exercise[]): string[] {
  const hasWarmup = catalog.some((exercise) => exercise.id === WARMUP_ID);
  const sample = catalog.find(
    (exercise) => exercise.tracking !== "time" && exercise.v1?.var === "peso",
  );
  const example = JSON.stringify(
    {
      gymmy: PLAN_VERSION,
      routines: [
        {
          id: "empuje",
          name: "Empuje",
          days: ["lun", "jue"],
          exercises: sample ? [sample.id] : [],
        },
      ],
      targets: {
        ...(sample
          ? { [sample.id]: { values: { peso: 42.5, repeticiones: 10 } } }
          : {}),
        ...(hasWarmup ? { [WARMUP_ID]: { minutes: WARMUP_MINUTES } } : {}),
      },
      notes: "Texto breve opcional con el motivo de los cambios.",
    },
    null,
    2,
  );
  return [
    "",
    "## Protocolo de respuesta (importante)",
    "",
    `Responde con tus comentarios y, al final, **un único bloque de código** con la etiqueta \`${PLAN_FENCE}\` que contenga JSON válido. Gymmy lo leerá automáticamente. Reglas:`,
    "",
    `- \`"gymmy": ${PLAN_VERSION}\` es obligatorio.`,
    "- `routines`: lista de rutinas con `id`, `name`, `days` (`lun`, `mar`, `mie`, `jue`, `vie`, `sab`, `dom`) y `exercises` (ids de arriba). Cada día de la semana en como mucho una rutina.",
    "- `targets`: objetivo del **próximo entrenamiento** por id de ejercicio. `values` usa las claves de cada ejercicio (números; `repeticiones` entero ≥ 1; pesos en kg). En actividades temporizadas usa `minutes`.",
    "- Usa solo ids y claves que aparezcan en este documento. No añadas ejercicios nuevos.",
    ...(hasWarmup
      ? [
          `- Regla fija: el calentamiento en la cinta de correr (\`${WARMUP_ID}\`) de ${WARMUP_MINUTES} minutos se hace **todos los días**. Gymmy lo añade siempre; no lo incluyas en las rutinas.`,
        ]
      : []),
    "- `notes` es opcional.",
    "",
    "Ejemplo del formato:",
    "",
    `\`\`\`${PLAN_FENCE}`,
    example,
    "```",
  ];
}
