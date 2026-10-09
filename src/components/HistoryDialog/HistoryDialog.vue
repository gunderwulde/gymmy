<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { formatElapsedTime } from "../../timer";
import type { Exercise, HistoryEntry } from "../../types";

const props = defineProps<{
  catalog: Exercise[];
  history: HistoryEntry[];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const selectedExercise = ref("all");
const opener = ref<HTMLElement | null>(null);

const groups = computed(() => {
  const entries = props.history
    .filter(
      (entry) =>
        selectedExercise.value === "all" ||
        entry.exerciseId === selectedExercise.value,
    )
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const byDay = new Map<string, { date: Date; entries: HistoryEntry[] }>();
  for (const entry of entries) {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, { date, entries: [] });
    byDay.get(key)?.entries.push(entry);
  }
  return [...byDay.values()];
});

const historyIsEmpty = computed(() => groups.value.length === 0);

function open(control: HTMLElement, exerciseId = "all") {
  opener.value = control;
  selectedExercise.value = exerciseId;
  if (!dialog.value?.open) dialog.value?.showModal();
  void nextTick(() => closeButton.value?.focus());
}

function close() {
  dialog.value?.close();
}

function restoreFocus() {
  const lastOpener = opener.value;
  opener.value = null;
  window.setTimeout(() => lastOpener?.focus(), 0);
}

function exerciseName(exerciseId: string): string {
  return (
    props.catalog.find((exercise) => exercise.id === exerciseId)?.name ??
    "Ejercicio eliminado"
  );
}

function historyResult(entry: HistoryEntry): string {
  return entry.mode === "time"
    ? formatElapsedTime(entry.durationSeconds * 1000)
    : `${formatWeight(entry.weight)} kg × ${entry.reps}`;
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(
    weight,
  );
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

defineExpose({ open });
</script>

<template>
  <dialog
    ref="dialog"
    class="history-dialog"
    aria-labelledby="history-title"
    @close="restoreFocus"
  >
    <div class="dialog-header">
      <div>
        <p class="eyebrow section-eyebrow">CADA REPETICIÓN CUENTA</p>
        <h2 id="history-title">Tu progreso</h2>
      </div>
      <button
        ref="closeButton"
        class="close-button"
        type="button"
        aria-label="Cerrar historial"
        @click="close"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <label class="history-filter-label" for="history-filter"
      >Ver historial</label
    >
    <select
      id="history-filter"
      v-model="selectedExercise"
      class="history-filter"
    >
      <option value="all">Todos los ejercicios</option>
      <option
        v-for="exercise in catalog"
        :key="exercise.id"
        :value="exercise.id"
      >
        {{ exercise.name }}
      </option>
    </select>
    <div class="history-content">
      <p v-if="historyIsEmpty" class="history-empty">
        {{
          history.length
            ? "Todavía no hay registros para este ejercicio."
            : "Aún no hay entrenamientos guardados. Pulsa «Hecho» en un ejercicio para empezar a seguir tu progreso."
        }}
      </p>
      <section v-for="group in groups" :key="group.date.toISOString()">
        <h3 class="history-day">{{ formatDay(group.date) }}</h3>
        <div
          v-for="entry in group.entries"
          :key="entry.id ?? `${entry.exerciseId}-${entry.date}`"
          class="history-entry"
        >
          <div>
            <span class="history-exercise">
              {{ exerciseName(entry.exerciseId) }}
            </span>
            <span class="history-time">{{ formatTime(entry.date) }}</span>
          </div>
          <span class="history-result">{{ historyResult(entry) }}</span>
        </div>
      </section>
    </div>
  </dialog>
</template>

<style scoped>
.history-dialog {
  width: min(560px, calc(100% - 28px));
  max-height: min(82vh, 760px);
  padding: 24px;
  overflow: hidden;
  border: 1px solid #3a493e;
  border-radius: 20px;
  background: #151d17;
  color: var(--text);
  box-shadow: 0 24px 90px #000a;
}

.history-dialog::backdrop {
  background: #080c09c9;
  backdrop-filter: blur(4px);
}

.dialog-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 26px;
}

.section-eyebrow {
  margin-bottom: 7px;
  color: var(--accent);
  font-size: 9px;
  letter-spacing: 1.6px;
}

.close-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
}

.close-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.history-filter-label {
  display: block;
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 11px;
}

.history-filter {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--text);
}

.history-content {
  max-height: 48vh;
  margin-top: 15px;
  overflow-y: auto;
  scrollbar-color: #455442 transparent;
}

.history-empty {
  padding: 34px 14px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.history-day {
  margin: 21px 0 9px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}

.history-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ffffff10;
}

.history-exercise {
  font-size: 13px;
  font-weight: 650;
}

.history-time {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
}

.history-result {
  flex: 0 0 auto;
  color: var(--text);
  font-size: 12px;
  font-weight: 750;
}

@media (max-width: 480px) {
  .history-dialog {
    padding: 20px 17px;
  }
}
</style>
