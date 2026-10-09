<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { formatElapsedTime } from "../../timer";
import { formatVariableValues, parseVariableValue } from "../../variables";
import type { Exercise, TimeEntry } from "../../types";

const props = defineProps<{
  exercise: Exercise;
  lastEntry: TimeEntry | null;
  elapsedMs: number;
  status: "idle" | "running" | "paused";
  blocked: boolean;
  values: Record<string, string>;
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const opener = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  "update:value": [value: { variable: string; value: string }];
  commit: [];
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
  const details = formatVariableValues(
    props.exercise.v1 ? [props.exercise.v1] : [],
    props.lastEntry.values,
  );
  return `Última vez: ${date} · ${[
    formatElapsedTime(props.lastEntry.durationSeconds * 1000),
    details,
  ]
    .filter(Boolean)
    .join(" · ")}`;
});
const variable = computed(() => props.exercise.v1);
const variableSummary = computed(() => {
  if (!variable.value) return "";
  const raw =
    props.values[variable.value.var] ?? String(variable.value.default);
  const value = parseVariableValue(raw, variable.value);
  const formatted =
    value === null
      ? raw
      : new Intl.NumberFormat("es-ES", {
          maximumFractionDigits: 2,
        }).format(value);
  return `${variable.value.txt}: ${formatted}`;
});
const variableError = computed(() => {
  if (!variable.value) return "";
  const value =
    props.values[variable.value.var] ?? String(variable.value.default);
  return parseVariableValue(value, variable.value) === null
    ? "Indica un número válido igual o mayor que 0."
    : "";
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

function updateValue(event: Event) {
  if (variable.value && event.target instanceof HTMLInputElement) {
    emit("update:value", {
      variable: variable.value.var,
      value: event.target.value,
    });
  }
}

function openEditor(control: HTMLElement) {
  opener.value = control;
  if (!dialog.value?.open) dialog.value?.showModal();
  void nextTick(() => {
    const input = dialog.value?.querySelector<HTMLInputElement>("input");
    if (input) input.focus();
    else closeButton.value?.focus();
  });
}

defineExpose({ openEditor });

function closeEditor() {
  dialog.value?.close();
}

function restoreFocus() {
  const lastOpener = opener.value;
  opener.value = null;
  window.setTimeout(() => lastOpener?.focus(), 0);
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
    <p v-if="variable" class="variable-summary">
      {{ variableSummary }}
    </p>
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
          @click.stop="emit('start')"
        >
          Iniciar
        </button>
        <button
          v-if="status === 'running'"
          class="timer-button timer-button--pause"
          data-action="pause"
          type="button"
          :aria-label="`Pausar: ${exercise.name}`"
          @click.stop="emit('pause')"
        >
          Pausar
        </button>
        <button
          v-if="status === 'paused'"
          class="timer-button timer-button--resume"
          data-action="resume"
          type="button"
          :aria-label="`Reanudar: ${exercise.name}`"
          @click.stop="emit('resume')"
        >
          Reanudar
        </button>
        <button
          v-if="status !== 'idle'"
          class="timer-button timer-button--finish"
          data-action="finish"
          type="button"
          :aria-label="`Finalizar: ${exercise.name}`"
          @click.stop="emit('finish')"
        >
          Finalizar
        </button>
      </div>
    </div>
  </div>

  <dialog
    ref="dialog"
    class="activity-dialog"
    :aria-labelledby="`activity-title-${exercise.id}`"
    @close="restoreFocus"
    @cancel.prevent="closeEditor"
  >
    <div class="dialog-header">
      <div>
        <p class="eyebrow">ACTIVIDAD TEMPORIZADA</p>
        <h2 :id="`activity-title-${exercise.id}`">{{ exercise.name }}</h2>
      </div>
      <button
        ref="closeButton"
        class="close-button"
        type="button"
        :aria-label="`Cerrar actividad de ${exercise.name}`"
        @click="closeEditor"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <label
      v-if="variable"
      class="variable-field"
      :for="`${exercise.id}-${variable.var}`"
    >
      {{ variable.txt }}
      <input
        :id="`${exercise.id}-${variable.var}`"
        class="field-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        :value="values[variable.var] ?? variable.default"
        :aria-invalid="Boolean(variableError)"
        :aria-describedby="`${exercise.id}-${variable.var}-error`"
        @input="updateValue"
        @change="emit('commit')"
      />
      <span :id="`${exercise.id}-${variable.var}-error`" class="field-error">
        {{ variableError }}
      </span>
    </label>
    <p v-else class="empty-variable">
      Esta actividad no tiene variables adicionales.
    </p>
  </dialog>
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

.variable-summary {
  width: 100%;
  min-width: 0;
  margin: 0 0 10px;
  overflow: hidden;
  color: var(--text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-variable {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
}

.variable-field {
  max-width: 170px;
  margin-bottom: 10px;
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
  min-height: 0;
  color: var(--danger);
  font-size: 10px;
}

.activity-dialog {
  width: min(440px, calc(100% - 28px));
  max-height: min(82vh, 620px);
  margin: auto;
  padding: 22px;
  overflow: auto;
  border: 1px solid #3a493e;
  border-radius: 18px;
  background: #151d17;
  color: var(--text);
  box-shadow: 0 24px 90px #000a;
}

.activity-dialog::backdrop {
  background: #080c09c9;
  backdrop-filter: blur(4px);
}

.dialog-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.close-button {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
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
}

.history-shortcut {
  position: relative;
  z-index: 2;
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
  position: relative;
  z-index: 2;
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
.timer-button--resume,
.timer-button--configure {
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
