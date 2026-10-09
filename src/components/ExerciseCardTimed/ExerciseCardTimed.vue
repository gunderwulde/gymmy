<script setup lang="ts">
import { computed } from "vue";
import { formatElapsedTime } from "../../timer";
import type { Exercise, TimeEntry } from "../../types";

const props = defineProps<{
  exercise: Exercise;
  lastEntry: TimeEntry | null;
  elapsedMs: number;
  status: "idle" | "running" | "paused";
  blocked: boolean;
}>();

const emit = defineEmits<{
  start: [];
  pause: [];
  resume: [];
  finish: [];
  "open-history": [opener: HTMLElement];
}>();

const lastSession = computed(() => {
  if (!props.lastEntry) return "Aún no has registrado este ejercicio";
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(props.lastEntry.date));
  return `Última vez: ${date} · ${formatElapsedTime(props.lastEntry.durationSeconds * 1000)}`;
});

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
    <div class="entry-controls timer-controls">
      <output
        class="timer-display"
        :aria-label="`Tiempo transcurrido en ${exercise.name}`"
        aria-live="off"
      >
        {{ formatElapsedTime(elapsedMs) }}
      </output>
      <div class="timer-actions">
        <button
          v-if="status === 'idle'"
          class="timer-button timer-button--start"
          data-action="start"
          type="button"
          :disabled="blocked"
          :aria-label="`Iniciar: ${exercise.name}`"
          @click="emit('start')"
        >
          Iniciar
        </button>
        <template v-else>
          <button
            v-if="status === 'running'"
            class="timer-button timer-button--pause"
            data-action="pause"
            type="button"
            :aria-label="`Pausar: ${exercise.name}`"
            @click="emit('pause')"
          >
            Pausar
          </button>
          <button
            v-else
            class="timer-button timer-button--resume"
            data-action="resume"
            type="button"
            :aria-label="`Continuar: ${exercise.name}`"
            @click="emit('resume')"
          >
            Continuar
          </button>
          <button
            class="timer-button timer-button--finish"
            data-action="finish"
            type="button"
            :aria-label="`Terminar: ${exercise.name}`"
            @click="emit('finish')"
          >
            Terminar
          </button>
        </template>
      </div>
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

.entry-controls.timer-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
}

.timer-display {
  display: block;
  color: var(--accent);
  font-size: 25px;
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  letter-spacing: 1px;
  line-height: 1.25;
}

.timer-actions {
  display: flex;
  gap: 8px;
}

.timer-button {
  min-width: 0;
  min-height: 36px;
  flex: 1;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  transition:
    filter 0.15s,
    background 0.15s;
}

.timer-button:hover:not(:disabled) {
  filter: brightness(1.08);
}

.timer-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.timer-button--start,
.timer-button--resume {
  background: var(--accent);
  color: #17220f;
}

.timer-button--pause {
  border-color: #465747;
  background: #263329;
  color: var(--text);
}

.timer-button--finish {
  border-color: #65413d;
  background: #342421;
  color: #ffc0b7;
}

@media (max-width: 480px) {
  .exercise-image {
    width: 72px;
    height: 72px;
  }

  .exercise-name {
    font-size: 13px;
  }
}
</style>
