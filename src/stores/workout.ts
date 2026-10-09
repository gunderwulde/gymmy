import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { latestEntry, loadCatalog, sortByLatestUsage } from "../catalog";
import {
  addSetEntry,
  addTimeEntry,
  loadWorkoutData,
  saveExerciseValue,
  saveTimerSession,
} from "../storage/database";
import { elapsedMilliseconds, formatElapsedTime } from "../timer";
import {
  exerciseVariables,
  formatVariableValues,
  parseVariableValues,
} from "../variables";
import type {
  Exercise,
  ExerciseValue,
  HistoryEntry,
  SetEntry,
  TimeEntry,
  TimerSession,
  TimerState,
} from "../types";

export const useWorkoutStore = defineStore("workout", () => {
  const catalog = ref<Exercise[]>([]);
  const history = ref<HistoryEntry[]>([]);
  const values = ref<Record<string, Record<string, string>>>({});
  const timer = ref<TimerState | null>(null);
  const now = ref(Date.now());
  const ready = ref(false);
  const blocked = ref(false);
  const message = ref("");
  const messageIsError = ref(false);
  let ticker: ReturnType<typeof setInterval> | null = null;

  const sortedCatalog = computed(() =>
    sortByLatestUsage(catalog.value, history.value),
  );

  function announce(text: string, isError = false) {
    message.value = text;
    messageIsError.value = isError;
  }

  function startTicker() {
    stopTicker();
    now.value = Date.now();
    ticker = setInterval(() => {
      now.value = Date.now();
    }, 250);
  }

  function stopTicker() {
    if (ticker !== null) {
      clearInterval(ticker);
      ticker = null;
    }
  }

  async function load() {
    try {
      catalog.value = loadCatalog();
      const data = await loadWorkoutData();
      history.value = data.history;
      blocked.value = data.blocked;
      const saved = new Map(data.values.map((item) => [item.exerciseId, item]));
      const drafts: Record<string, Record<string, string>> = {};
      for (const exercise of catalog.value) {
        const previous = latestEntry(data.history, exercise.id);
        const stored = saved.get(exercise.id);
        drafts[exercise.id] = Object.fromEntries(
          exerciseVariables(exercise).map((variable) => [
            variable.var,
            String(
              stored?.values[variable.var] ??
                previous?.values?.[variable.var] ??
                variable.default,
            ),
          ]),
        );
      }
      values.value = drafts;
      timer.value = data.timer
        ? {
            exerciseId: data.timer.exerciseId,
            elapsedMs: data.timer.elapsedMs,
            startedAt: data.timer.startedAt,
          }
        : null;
      if (timer.value && timer.value.startedAt !== null) startTicker();
      if (data.warning) announce(data.warning, true);
      ready.value = true;
      if (!data.warning) requestStoragePersistence();
    } catch (error) {
      announce(`No se pudo iniciar Gymmy: ${errorMessage(error)}`, true);
      ready.value = true;
    }
  }

  function updateDraft(exerciseId: string, variable: string, value: string) {
    const current = values.value[exerciseId];
    if (!current) return;
    values.value[exerciseId] = { ...current, [variable]: value };
  }

  async function saveDraft(exerciseId: string): Promise<void> {
    if (blocked.value) return;
    const exercise = catalog.value.find((item) => item.id === exerciseId);
    const draft = values.value[exerciseId];
    if (!exercise || !draft) return;
    const parsedValues = parseVariableValues(
      exerciseVariables(exercise),
      draft,
    );
    if (!parsedValues || !Object.keys(parsedValues).length) return;
    try {
      await saveExerciseValue({ exerciseId, values: parsedValues });
    } catch (error) {
      announce(
        `No se pudieron guardar los valores: ${errorMessage(error)}`,
        true,
      );
    }
  }

  async function recordSet(exercise: Exercise): Promise<boolean> {
    if (blocked.value) {
      announce(
        "El almacenamiento está bloqueado para proteger los datos dañados.",
        true,
      );
      return false;
    }
    const exerciseVariablesList = exerciseVariables(exercise);
    const parsedValues = parseVariableValues(
      exerciseVariablesList,
      values.value[exercise.id],
    );
    if (!parsedValues || !Object.keys(parsedValues).length) {
      announce(
        "Revisa las variables del ejercicio antes de registrar la serie.",
        true,
      );
      return false;
    }
    const value: ExerciseValue = {
      exerciseId: exercise.id,
      values: parsedValues,
    };
    const entry: SetEntry = {
      exerciseId: exercise.id,
      mode: "sets",
      values: parsedValues,
      date: new Date().toISOString(),
    };
    try {
      const savedEntry = await addSetEntry(entry, value);
      history.value = [...history.value, savedEntry];
      const result = formatVariableValues(exerciseVariablesList, parsedValues);
      announce(`${exercise.name}: ${result} registrado.`);
      return true;
    } catch (error) {
      announce(`No se pudo guardar el registro: ${errorMessage(error)}`, true);
      return false;
    }
  }

  async function startTimer(exerciseId: string): Promise<void> {
    if (timer.value) {
      announce("Termina la actividad en curso antes de iniciar otra.", true);
      return;
    }
    if (blocked.value) {
      announce(
        "El almacenamiento está bloqueado para proteger los datos dañados.",
        true,
      );
      return;
    }
    const running: TimerState = {
      exerciseId,
      elapsedMs: 0,
      startedAt: Date.now(),
    };
    timer.value = running;
    startTicker();
    try {
      await saveTimerSession(toTimerSession(running));
      announce("Cronómetro iniciado.");
    } catch (error) {
      timer.value = null;
      stopTicker();
      announce(
        `No se pudo iniciar el cronómetro: ${errorMessage(error)}`,
        true,
      );
    }
  }

  async function pauseTimer(): Promise<void> {
    const running = timer.value;
    if (!running || running.startedAt === null) return;
    const paused: TimerState = {
      ...running,
      elapsedMs: elapsedMilliseconds(running, Date.now()),
      startedAt: null,
    };
    timer.value = paused;
    stopTicker();
    try {
      await saveTimerSession(toTimerSession(paused));
      announce("Actividad en pausa. El tiempo de pausa no se contará.");
    } catch (error) {
      timer.value = running;
      startTicker();
      announce(`No se pudo guardar la pausa: ${errorMessage(error)}`, true);
    }
  }

  async function resumeTimer(): Promise<void> {
    const paused = timer.value;
    if (!paused || paused.startedAt !== null) return;
    const running = { ...paused, startedAt: Date.now() };
    timer.value = running;
    startTicker();
    try {
      await saveTimerSession(toTimerSession(running));
      announce("Cronómetro en marcha.");
    } catch (error) {
      timer.value = paused;
      stopTicker();
      announce(
        `No se pudo reanudar el cronómetro: ${errorMessage(error)}`,
        true,
      );
    }
  }

  async function finishTimer(): Promise<boolean> {
    if (!timer.value) return false;
    const current = timer.value;
    const durationSeconds = Math.floor(
      elapsedMilliseconds(current, Date.now()) / 1000,
    );
    if (durationSeconds < 1) {
      announce(
        "Registra al menos un segundo de actividad antes de terminar.",
        true,
      );
      return false;
    }
    if (blocked.value) {
      announce(
        "El almacenamiento está bloqueado para proteger los datos dañados.",
        true,
      );
      return false;
    }
    const exercise = catalog.value.find(
      (item) => item.id === current.exerciseId,
    );
    const configuredVariables = exercise ? exerciseVariables(exercise) : [];
    const parsedValues = parseVariableValues(
      configuredVariables,
      values.value[current.exerciseId],
    );
    if (!parsedValues) {
      announce("Revisa la variable de la actividad antes de terminar.", true);
      return false;
    }
    const value: ExerciseValue | undefined = Object.keys(parsedValues).length
      ? { exerciseId: current.exerciseId, values: parsedValues }
      : undefined;
    const entry: TimeEntry = {
      exerciseId: current.exerciseId,
      mode: "time",
      durationSeconds,
      ...(value ? { values: parsedValues } : {}),
      date: new Date().toISOString(),
    };
    try {
      const savedEntry = await addTimeEntry(entry, value);
      history.value = [...history.value, savedEntry];
      timer.value = null;
      stopTicker();
      const result = formatVariableValues(configuredVariables, parsedValues);
      announce(
        `${exercise?.name ?? "Actividad"}: ${[
          formatElapsedTime(durationSeconds * 1000),
          result,
        ]
          .filter(Boolean)
          .join(" · ")} registrado.`,
      );
      return true;
    } catch (error) {
      announce(`No se pudo guardar el registro: ${errorMessage(error)}`, true);
      return false;
    }
  }

  function timerElapsed(exerciseId: string): number {
    if (timer.value?.exerciseId === exerciseId) {
      return elapsedMilliseconds(timer.value, now.value || Date.now());
    }
    const last = latestEntry(history.value, exerciseId);
    return last?.mode === "time" ? last.durationSeconds * 1000 : 0;
  }

  return {
    catalog,
    history,
    values,
    timer,
    now,
    ready,
    blocked,
    message,
    messageIsError,
    sortedCatalog,
    load,
    updateDraft,
    saveDraft,
    recordSet,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    timerElapsed,
    announce,
    stopTicker,
  };
});

function toTimerSession(timer: TimerState): TimerSession {
  return {
    id: "active",
    exerciseId: timer.exerciseId,
    elapsedMs: timer.elapsedMs,
    startedAt: timer.startedAt,
  };
}

function requestStoragePersistence() {
  const navigatorValue: unknown = Reflect.get(globalThis, "navigator");
  if (!navigatorValue || typeof navigatorValue !== "object") return;
  const storage: unknown = Reflect.get(navigatorValue, "storage");
  if (!storage || typeof storage !== "object") return;
  const persist = Reflect.get(storage, "persist");
  if (typeof persist !== "function") return;
  try {
    void Promise.resolve(Reflect.apply(persist, storage, [])).catch(
      (error: unknown) => {
        console.warn(
          "El navegador no pudo marcar los datos como persistentes:",
          error,
        );
      },
    );
  } catch (error) {
    console.warn(
      "El navegador no pudo marcar los datos como persistentes:",
      error,
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}
