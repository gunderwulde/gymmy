<script setup lang="ts">
import { computed, nextTick, ref, type ComponentPublicInstance } from "vue";
import { doneOnDay, exerciseZone, sortForToday } from "../../catalog";
import { targetText } from "../../plan";
import { useWorkoutStore } from "../../stores/workout";
import type { Exercise, ExerciseZone, HistoryEntry } from "../../types";
import ExerciseCardSets from "../ExerciseCardSets/ExerciseCardSets.vue";
import ExerciseCardTimed from "../ExerciseCardTimed/ExerciseCardTimed.vue";

const filters: Array<{ id: ExerciseZone; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "upper", label: "Superiores" },
  { id: "lower", label: "Inferiores" },
  { id: "cardio", label: "Cardio" },
];

const store = useWorkoutStore();
const selectedZone = ref<ExerciseZone>("all");
type CardEditor = {
  openEditor: (opener: HTMLElement) => void;
  closeEditor?: () => void;
};
const cardEditors = new Map<string, CardEditor>();

const filteredExercises = computed(() => {
  const ordered = sortForToday(
    store.sortedCatalog,
    store.history,
    new Date(),
    store.todayIds,
  );
  return ordered.filter((exercise) => {
    return (
      selectedZone.value === "all" ||
      exerciseZone(exercise.muscleGroup) === selectedZone.value
    );
  });
});

const historyByExercise = computed(() => {
  const map = new Map<string, HistoryEntry[]>();
  for (const entry of store.history) {
    const list = map.get(entry.exerciseId);
    if (list) list.push(entry);
    else map.set(entry.exerciseId, [entry]);
  }
  return map;
});

function exerciseHistory(exerciseId: string): HistoryEntry[] {
  return historyByExercise.value.get(exerciseId) ?? [];
}

function targetFor(exercise: Exercise): string {
  const target = store.planRecord?.plan.targets[exercise.id];
  return target ? targetText(exercise, target) : "";
}

function isOffToday(exercise: Exercise): boolean {
  return store.todayIds !== null && !store.todayIds.has(exercise.id);
}

function chooseRoutine(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  void store.selectRoutine(event.target.value || null);
}

function isDoneToday(exercise: Exercise): boolean {
  return doneOnDay(store.history, exercise.id, new Date());
}

function setCardEditor(
  exerciseId: string,
  editor: Element | ComponentPublicInstance | null,
) {
  if (!editor) {
    cardEditors.delete(exerciseId);
  } else if (
    !(editor instanceof Element) &&
    "openEditor" in editor &&
    typeof editor.openEditor === "function"
  ) {
    const openEditor = editor.openEditor;
    const closeEditor: unknown = Reflect.get(editor, "closeEditor");
    cardEditors.set(exerciseId, {
      openEditor: (opener) => Reflect.apply(openEditor, editor, [opener]),
      closeEditor:
        typeof closeEditor === "function"
          ? () => Reflect.apply(closeEditor, editor, [])
          : undefined,
    });
  }
}

function openCardEditor(exerciseId: string, event: MouseEvent) {
  const opener = event.currentTarget;
  if (opener instanceof HTMLElement) {
    cardEditors.get(exerciseId)?.openEditor(opener);
  }
}

async function recordSet(exercise: Exercise) {
  const saved = await store.recordSet(exercise);
  if (!saved) return;
  cardEditors.get(exercise.id)?.closeEditor?.();
}

async function startTimer(exerciseId: string) {
  await store.startTimer(exerciseId);
  await nextTick();
  document
    .querySelector<HTMLElement>(
      `#exercise-${CSS.escape(exerciseId)} [data-action="pause"]`,
    )
    ?.focus();
}

async function pauseTimer() {
  await store.pauseTimer();
  await nextTick();
  document
    .querySelector<HTMLElement>(
      `[data-exercise-id="${CSS.escape(store.timer?.exerciseId ?? "")}"] [data-action="resume"]`,
    )
    ?.focus();
}

async function resumeTimer() {
  await store.resumeTimer();
  await nextTick();
  document
    .querySelector<HTMLElement>(
      `[data-exercise-id="${CSS.escape(store.timer?.exerciseId ?? "")}"] [data-action="pause"]`,
    )
    ?.focus();
}

async function finishTimer() {
  const exerciseId = store.timer?.exerciseId;
  const saved = await store.finishTimer();
  if (!saved || !exerciseId) return;
  await nextTick();
  document
    .querySelector<HTMLElement>(
      `#exercise-${CSS.escape(exerciseId)} [data-action="configure"]`,
    )
    ?.focus();
}
</script>

<template>
  <section class="workout-section" aria-labelledby="exercise-heading">
    <div class="section-heading">
      <h2 id="exercise-heading">
        Ejercicios
        <span class="count-badge">{{ filteredExercises.length }}</span>
      </h2>
      <div class="filters" role="group" aria-label="Filtrar ejercicios">
        <button
          v-for="filter in filters"
          :key="filter.id"
          type="button"
          class="filter-button"
          :class="{ 'is-active': selectedZone === filter.id }"
          :aria-pressed="selectedZone === filter.id"
          @click="selectedZone = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
    <label v-if="store.planRecord" class="routine-picker">
      Rutina de hoy
      <select :value="store.routineId ?? ''" @change="chooseRoutine">
        <option value="">Solo calentamiento</option>
        <option
          v-for="routine in store.planRecord.plan.routines"
          :key="routine.id"
          :value="routine.id"
        >
          {{ routine.name }}
        </option>
      </select>
    </label>
    <p
      v-if="store.message"
      class="app-message"
      :class="{ 'is-error': store.messageIsError }"
      role="status"
      aria-live="polite"
    >
      {{ store.message }}
    </p>
    <p v-if="!store.ready" class="empty-state" role="status">
      Cargando ejercicios…
    </p>
    <div
      v-else-if="filteredExercises.length > 0"
      class="exercise-list"
      aria-live="polite"
    >
      <article
        v-for="exercise in filteredExercises"
        :id="`exercise-${exercise.id}`"
        :key="exercise.id"
        class="exercise-card"
        :class="{
          'is-done-today': isDoneToday(exercise),
          'is-off-today': isOffToday(exercise),
        }"
        :data-exercise-id="exercise.id"
      >
        <button
          class="card-activation"
          type="button"
          :aria-label="`${
            exercise.tracking === 'time'
              ? `Editar datos de ${exercise.name}`
              : `Editar variables y registrar ${exercise.name}`
          }${isDoneToday(exercise) ? ' (hecho hoy)' : ''}`"
          aria-haspopup="dialog"
          data-action="configure"
          @click="openCardEditor(exercise.id, $event)"
        />
        <ExerciseCardSets
          v-if="exercise.tracking !== 'time'"
          :ref="(editor) => setCardEditor(exercise.id, editor)"
          :exercise="exercise"
          :history="exerciseHistory(exercise.id)"
          :values="store.values[exercise.id] ?? {}"
          :target="targetFor(exercise)"
          @update:value="
            ({ variable, value }) =>
              store.updateDraft(exercise.id, variable, value)
          "
          @commit="store.saveDraft(exercise.id)"
          @done="recordSet(exercise)"
        />
        <ExerciseCardTimed
          v-else
          :ref="(editor) => setCardEditor(exercise.id, editor)"
          :exercise="exercise"
          :history="exerciseHistory(exercise.id)"
          :values="store.values[exercise.id] ?? {}"
          :target="targetFor(exercise)"
          :elapsed-ms="store.timerElapsed(exercise.id)"
          :status="
            store.timer?.exerciseId !== exercise.id
              ? 'idle'
              : store.timer.startedAt === null
                ? 'paused'
                : 'running'
          "
          :blocked="
            Boolean(store.timer && store.timer.exerciseId !== exercise.id)
          "
          @update:value="
            ({ variable, value }) =>
              store.updateDraft(exercise.id, variable, value)
          "
          @commit="store.saveDraft(exercise.id)"
          @start="startTimer(exercise.id)"
          @pause="pauseTimer"
          @resume="resumeTimer"
          @finish="finishTimer"
        />
      </article>
    </div>
    <p v-else class="empty-state">No hay ejercicios en esta categoría.</p>
  </section>
</template>

<style scoped>
.workout-section {
  height: 100%;
  min-height: 0;
  padding: 0 5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-heading {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.count-badge {
  display: inline-grid;
  vertical-align: 3px;
  place-items: center;
  min-width: 20px;
  height: 19px;
  border-radius: 6px;
  background: var(--panel-soft);
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0;
}

.filters {
  min-width: 0;
  display: flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
}

.filter-button {
  padding: 6px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

.filter-button.is-active {
  background: var(--accent);
  color: #17220f;
}

.exercise-list {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.exercise-card {
  position: relative;
  min-width: 0;
  padding: 10px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  transition:
    border-color 0.18s,
    transform 0.18s;
}

.exercise-card.is-done-today {
  border-color: #6b3a35;
  background: #2b1a19;
}

.exercise-card.is-off-today {
  opacity: 0.5;
}

.routine-picker {
  flex: 0 0 auto;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}

.routine-picker select {
  min-height: 40px;
  min-width: 0;
  flex: 1;
  padding: 0 8px;
  border: 1px solid #35433a;
  border-radius: 8px;
  background: #111813;
  color: var(--text);
  font-size: 16px;
}

.card-activation {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  cursor: pointer;
}

.card-activation:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (hover: hover) {
  .exercise-card:hover {
    border-color: #435447;
    transform: translateY(-1px);
  }

  .exercise-card.is-done-today:hover {
    border-color: #8a4a43;
  }
}

.empty-state {
  flex: 1 1 0;
  min-height: 0;
  margin: 0;
  padding: 28px;
  display: grid;
  place-items: center;
  overflow: auto;
  border: 1px dashed var(--line);
  border-radius: 14px;
  color: var(--muted);
  text-align: center;
  font-size: 13px;
}

.app-message {
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 1px solid #536c3b;
  border-radius: 10px;
  background: #202d19;
  color: #d7edbe;
  font-size: 12px;
}

.app-message.is-error {
  border-color: #70453f;
  background: #321f1d;
  color: #ffd3cd;
}

@media (max-width: 760px) {
  .exercise-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .section-heading {
    flex-wrap: wrap;
  }

  .filters {
    flex: 1 1 auto;
    justify-content: space-between;
  }

  .filter-button {
    flex: 1 1 0;
    min-height: 36px;
    padding-inline: 6px;
    font-size: 12px;
  }

  .exercise-list {
    gap: 10px;
    padding-bottom: 4px;
  }

  .exercise-card {
    padding: 10px;
    gap: 10px;
    grid-template-columns: 64px minmax(0, 1fr);
  }
}

@media (max-width: 360px) {
  .filter-button {
    padding-inline: 3px;
    font-size: 11px;
  }
}

@media (max-height: 600px) {
  .section-heading {
    margin-bottom: 8px;
  }

  .filter-button {
    padding-block: 5px;
  }
}

@media (max-height: 420px) {
  .section-heading {
    margin-bottom: 4px;
  }

  .filter-button {
    padding-block: 3px;
  }
}
</style>
