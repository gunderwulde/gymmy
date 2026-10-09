<script setup lang="ts">
import { computed } from "vue";
import { parseReps, parseWeight } from "../../timer";
import type { Exercise, SetEntry } from "../../types";

const props = defineProps<{
  exercise: Exercise;
  lastEntry: SetEntry | null;
  weight: string;
  reps: string;
}>();

const emit = defineEmits<{
  "update:weight": [value: string];
  "update:reps": [value: string];
  commit: [];
  done: [];
  "open-history": [opener: HTMLElement];
}>();

const lastSession = computed(() => {
  if (!props.lastEntry) return "Aún no has registrado este ejercicio";
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(props.lastEntry.date));
  const weight = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(props.lastEntry.weight);
  return `Última vez: ${date} · ${weight} kg × ${props.lastEntry.reps}`;
});

const weightError = computed(() =>
  parseWeight(props.weight) === null ? "Usa un peso válido (ej.: 12,5)." : "",
);
const repsError = computed(() =>
  parseReps(props.reps) === null ? "Indica al menos 1 repetición." : "",
);
const imageUrl = computed(
  () => `${import.meta.env.BASE_URL}${props.exercise.image}`,
);
const placeholderUrl = `${import.meta.env.BASE_URL}assets/icons/image-placeholder.svg`;
const groupNames: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  arms: "Brazos",
  legs: "Piernas",
  glutes: "Glúteos",
  core: "Core",
  cardio: "Cardio",
};
const typeNames = {
  machine: "Máquina",
  exercise: "Libre",
} as const;

function updateWeight(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    emit("update:weight", event.target.value);
  }
}

function updateReps(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    emit("update:reps", event.target.value);
  }
}

function commit() {
  emit("commit");
}

function record() {
  if (parseWeight(props.weight) === null || parseReps(props.reps) === null) {
    return;
  }
  emit("done");
}

function usePlaceholder(event: Event) {
  const image = event.target;
  if (
    image instanceof HTMLImageElement &&
    !image.src.endsWith("/assets/icons/image-placeholder.svg")
  ) {
    image.src = placeholderUrl;
  }
}
</script>

<template>
  <img
    class="exercise-image"
    :src="imageUrl"
    :alt="`${exercise.name}, ilustración`"
    width="82"
    height="82"
    loading="lazy"
    @error="usePlaceholder"
  />
  <div class="exercise-info">
    <div class="exercise-title-row">
      <h3 class="exercise-name">{{ exercise.name }}</h3>
      <span
        class="type-pill"
        :class="{ 'is-free': exercise.type === 'exercise' }"
      >
        {{ typeNames[exercise.type] }}
      </span>
    </div>
    <span class="muscle-label">{{
      groupNames[exercise.muscleGroup] ?? exercise.muscleGroup
    }}</span>
    <div class="last-session-row">
      <p class="last-session" :class="{ 'no-session': !lastEntry }">
        {{ lastSession }}
      </p>
      <button
        v-if="lastEntry"
        class="history-shortcut"
        type="button"
        :aria-label="`Ver progreso de ${exercise.name}`"
        @click="emit('open-history', $event.currentTarget as HTMLElement)"
      >
        Progreso
      </button>
    </div>

    <div class="entry-controls">
      <label class="field-label" :for="`weight-${exercise.id}`">
        Peso (kg)
        <input
          :id="`weight-${exercise.id}`"
          class="field-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          :value="weight"
          :aria-invalid="Boolean(weightError)"
          :aria-describedby="`weight-${exercise.id}-error`"
          @input="updateWeight"
          @change="commit"
        />
        <span :id="`weight-${exercise.id}-error`" class="field-error">
          {{ weightError }}
        </span>
      </label>
      <label class="field-label" :for="`reps-${exercise.id}`">
        Repeticiones
        <input
          :id="`reps-${exercise.id}`"
          class="field-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :value="reps"
          :aria-invalid="Boolean(repsError)"
          :aria-describedby="`reps-${exercise.id}-error`"
          @input="updateReps"
          @change="commit"
        />
        <span :id="`reps-${exercise.id}-error`" class="field-error">
          {{ repsError }}
        </span>
      </label>
      <button
        class="done-button"
        type="button"
        :aria-label="`Registrar ${exercise.name} como hecho`"
        @click="record"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m5 12 4.5 4.5L19 7" />
        </svg>
        Hecho
      </button>
    </div>
  </div>
</template>

<style scoped>
.exercise-image {
  width: 82px;
  height: 82px;
  align-self: start;
  object-fit: cover;
  border-radius: 11px;
  background: #e8eee5;
}

.exercise-info {
  min-width: 0;
}

.exercise-title-row {
  min-height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 6px;
}

.exercise-name {
  margin: 0;
  font-size: 14px;
  font-weight: 730;
  line-height: 1.3;
}

.type-pill {
  flex: 0 0 auto;
  padding: 4px 6px;
  border-radius: 5px;
  background: #263125;
  color: #b7c9a6;
  font-size: 8px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.type-pill.is-free {
  background: #272b3a;
  color: #b8c1e7;
}

.muscle-label {
  display: block;
  margin: 4px 0 10px;
  color: var(--muted);
  font-size: 10px;
}

.last-session-row {
  min-height: 25px;
  display: flex;
  align-items: start;
  gap: 8px;
}

.last-session {
  min-height: 15px;
  margin: 0 0 10px;
  color: #a8b79e;
  font-size: 10px;
  line-height: 1.4;
}

.last-session.no-session {
  color: #77837a;
}

.history-shortcut {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-size: 10px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.entry-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 7px;
  align-items: end;
}

.field-label {
  min-width: 0;
  display: grid;
  gap: 4px;
  color: var(--muted);
  font-size: 9px;
}

.field-input {
  width: 100%;
  height: 35px;
  padding: 0 8px;
  border: 1px solid #35433a;
  border-radius: 8px;
  outline: 0;
  background: #111813;
  color: var(--text);
  font-size: 12px;
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px #c3f36b22;
}

.field-input[aria-invalid="true"] {
  border-color: var(--danger);
}

.field-error {
  grid-column: 1 / -1;
  min-height: 0;
  color: var(--danger);
  font-size: 10px;
}

.done-button {
  height: 35px;
  padding: 0 10px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: #17220f;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition: filter 0.15s;
}

.done-button:hover {
  filter: brightness(1.08);
}

.done-button svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 480px) {
  .exercise-image {
    width: 72px;
    height: 72px;
  }

  .exercise-name {
    font-size: 13px;
  }

  .entry-controls {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 5px;
  }

  .done-button {
    padding-inline: 8px;
    font-size: 10px;
  }
}
</style>
