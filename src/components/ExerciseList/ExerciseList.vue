<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { latestEntry, exerciseZone } from "../../catalog";
import { useWorkoutStore } from "../../stores/workout";
import type { Exercise, ExerciseZone, SetEntry, TimeEntry } from "../../types";
import ExerciseCardSets from "../ExerciseCardSets/ExerciseCardSets.vue";
import ExerciseCardTimed from "../ExerciseCardTimed/ExerciseCardTimed.vue";

const emit = defineEmits<{
  "open-history": [opener: HTMLElement, exerciseId: string];
}>();

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
const filters: Array<{ id: ExerciseZone; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "upper", label: "Superiores" },
  { id: "lower", label: "Inferiores" },
  { id: "cardio", label: "Cardio" },
];

const store = useWorkoutStore();
const search = ref("");
const selectedZone = ref<ExerciseZone>("all");

const filteredExercises = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("es");
  return store.sortedCatalog.filter((exercise) => {
    const matchesZone =
      selectedZone.value === "all" ||
      exerciseZone(exercise.muscleGroup) === selectedZone.value;
    const groupName = GROUP_NAMES[exercise.muscleGroup] ?? exercise.muscleGroup;
    const matchesSearch =
      !query ||
      `${exercise.name} ${groupName}`.toLocaleLowerCase("es").includes(query);
    return matchesZone && matchesSearch;
  });
});

function latestSet(exercise: Exercise): SetEntry | null {
  const entry = latestEntry(store.history, exercise.id);
  return entry && entry.mode !== "time" ? entry : null;
}

function latestTime(exercise: Exercise): TimeEntry | null {
  const entry = latestEntry(store.history, exercise.id);
  return entry?.mode === "time" ? entry : null;
}

async function recordSet(exercise: Exercise) {
  const saved = await store.recordSet(exercise);
  if (!saved) return;
  await nextTick();
  document
    .querySelector<HTMLElement>(
      `#exercise-${CSS.escape(exercise.id)} button.done-button`,
    )
    ?.focus();
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
      `#exercise-${CSS.escape(exerciseId)} [data-action="start"]`,
    )
    ?.focus();
}

function openExerciseHistory(exerciseId: string, opener: HTMLElement) {
  emit("open-history", opener, exerciseId);
}
</script>

<template>
  <section class="workout-section" aria-labelledby="exercise-heading">
    <div class="section-heading">
      <div>
        <p class="eyebrow section-eyebrow">TU RUTINA</p>
        <h2 id="exercise-heading">
          Ejercicios
          <span class="count-badge">{{ filteredExercises.length }}</span>
        </h2>
      </div>
    </div>
    <div class="toolbar">
      <label class="search-box">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <span class="visually-hidden">Buscar ejercicio</span>
        <input
          v-model="search"
          type="search"
          placeholder="Buscar ejercicio..."
          autocomplete="off"
        />
      </label>
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
    <div v-else class="exercise-list" aria-live="polite">
      <article
        v-for="exercise in filteredExercises"
        :id="`exercise-${exercise.id}`"
        :key="exercise.id"
        class="exercise-card"
        :data-exercise-id="exercise.id"
      >
        <ExerciseCardSets
          v-if="exercise.tracking !== 'time'"
          :exercise="exercise"
          :last-entry="latestSet(exercise)"
          :weight="store.values[exercise.id]?.weight ?? ''"
          :reps="store.values[exercise.id]?.reps ?? ''"
          @update:weight="store.updateDraft(exercise.id, 'weight', $event)"
          @update:reps="store.updateDraft(exercise.id, 'reps', $event)"
          @commit="store.saveDraft(exercise.id)"
          @done="recordSet(exercise)"
          @open-history="openExerciseHistory(exercise.id, $event)"
        />
        <ExerciseCardTimed
          v-else
          :exercise="exercise"
          :last-entry="latestTime(exercise)"
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
          @start="startTimer(exercise.id)"
          @pause="pauseTimer"
          @resume="resumeTimer"
          @finish="finishTimer"
          @open-history="openExerciseHistory(exercise.id, $event)"
        />
      </article>
    </div>
    <p v-if="store.ready && filteredExercises.length === 0" class="empty-state">
      No hay ejercicios que coincidan con tu búsqueda.
    </p>
  </section>
</template>

<style scoped>
.workout-section {
  padding: 0 5px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 19px;
}

.section-eyebrow {
  margin-bottom: 7px;
  font-size: 9px;
}

h2 {
  margin: 0;
  font-size: 25px;
  letter-spacing: -0.7px;
}

.count-badge {
  display: inline-grid;
  vertical-align: 4px;
  place-items: center;
  min-width: 23px;
  height: 22px;
  border-radius: 7px;
  background: var(--panel-soft);
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 19px;
}

.search-box {
  width: min(330px, 100%);
  height: 43px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--panel);
  color: var(--muted);
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 13px;
}

.search-box input::placeholder {
  color: #77837a;
}

.search-box svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.filters {
  display: flex;
  gap: 5px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
}

.filter-button {
  padding: 7px 11px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
}

.filter-button.is-active {
  background: var(--accent);
  color: #17220f;
}

.exercise-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.exercise-card {
  min-width: 0;
  padding: 14px;
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  transition:
    border-color 0.18s,
    transform 0.18s;
}

.exercise-card:hover {
  border-color: #435447;
  transform: translateY(-1px);
}

.empty-state {
  margin: 0;
  padding: 28px;
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
  .toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .search-box {
    width: 100%;
  }

  .filters {
    width: 100%;
    justify-content: space-between;
  }

  .filter-button {
    flex: 1;
    padding-inline: 5px;
    font-size: 11px;
  }
}
</style>
