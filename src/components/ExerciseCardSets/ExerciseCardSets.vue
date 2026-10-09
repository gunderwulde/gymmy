<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  exerciseVariables,
  formatVariableValues,
  parseVariableValue,
} from "../../variables";
import type { Exercise, SetEntry } from "../../types";

const props = defineProps<{
  exercise: Exercise;
  lastEntry: SetEntry | null;
  values: Record<string, string>;
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const opener = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  "update:value": [value: { variable: string; value: string }];
  commit: [];
  done: [];
  "open-history": [opener: HTMLElement];
}>();

const variables = computed(() => exerciseVariables(props.exercise));
const variableSummary = computed(() =>
  variables.value
    .map((variable) => {
      const raw = props.values[variable.var] ?? String(variable.default);
      const value = parseVariableValue(raw, variable);
      const formatted =
        value === null
          ? raw
          : new Intl.NumberFormat("es-ES", {
              maximumFractionDigits: 2,
            }).format(value);
      return `${variable.txt}: ${formatted}`;
    })
    .join(" · "),
);
const errors = computed(
  () =>
    Object.fromEntries(
      variables.value.map((variable) => {
        const value = props.values[variable.var] ?? String(variable.default);
        return [
          variable.var,
          parseVariableValue(value, variable) === null
            ? variable.var === "repeticiones"
              ? "Indica un número entero de repeticiones (mínimo 1)."
              : "Indica un número válido igual o mayor que 0."
            : "",
        ];
      }),
    ) as Record<string, string>,
);

const lastSession = computed(() => {
  if (!props.lastEntry) return "Aún no has registrado este ejercicio";
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(props.lastEntry.date));
  const result = formatVariableValues(variables.value, props.lastEntry.values);
  return `Última vez: ${date}${result ? ` · ${result}` : ""}`;
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

function updateValue(variable: string, event: Event) {
  if (event.target instanceof HTMLInputElement) {
    emit("update:value", { variable, value: event.target.value });
  }
}

function commit() {
  emit("commit");
}

function openEditor(control: HTMLElement) {
  opener.value = control;
  if (!dialog.value?.open) dialog.value?.showModal();
  void nextTick(() => {
    dialog.value?.querySelector<HTMLInputElement>("input")?.focus();
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

function record() {
  if (Object.values(errors.value).some(Boolean)) {
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

    <p class="variable-summary">{{ variableSummary }}</p>
  </div>

  <dialog
    ref="dialog"
    class="editor-dialog"
    :aria-labelledby="`editor-title-${exercise.id}`"
    @close="restoreFocus"
    @cancel.prevent="closeEditor"
  >
    <div class="dialog-header">
      <div>
        <p class="eyebrow">REGISTRAR SERIE</p>
        <h2 :id="`editor-title-${exercise.id}`">{{ exercise.name }}</h2>
      </div>
      <button
        class="close-button"
        type="button"
        :aria-label="`Cerrar edición de ${exercise.name}`"
        @click="closeEditor"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <div class="entry-controls">
      <label
        v-for="variable in variables"
        :key="variable.var"
        class="field-label"
        :for="`${exercise.id}-${variable.var}`"
      >
        {{ variable.txt }}
        <input
          :id="`${exercise.id}-${variable.var}`"
          class="field-input"
          type="text"
          :inputmode="variable.var === 'repeticiones' ? 'numeric' : 'decimal'"
          autocomplete="off"
          :value="values[variable.var] ?? variable.default"
          :aria-invalid="Boolean(errors[variable.var])"
          :aria-describedby="`${exercise.id}-${variable.var}-error`"
          @input="updateValue(variable.var, $event)"
          @change="commit"
        />
        <span :id="`${exercise.id}-${variable.var}-error`" class="field-error">
          {{ errors[variable.var] }}
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

.variable-summary {
  width: 100%;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-dialog {
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

.editor-dialog::backdrop {
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

.entry-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .done-button {
    grid-column: 1 / -1;
    padding-inline: 8px;
    font-size: 10px;
  }
}
</style>
