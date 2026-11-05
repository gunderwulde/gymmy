<script setup lang="ts">
import { computed, ref } from "vue";
import { parsePlan, planChanges, type Plan } from "../../plan";
import type { Exercise } from "../../types";

const props = defineProps<{
  catalog: Exercise[];
  values: Record<string, Record<string, string>>;
}>();
const emit = defineEmits<{ apply: [plan: Plan] }>();

const dialog = ref<HTMLDialogElement | null>(null);
const text = ref("");
const error = ref("");
const parsed = ref<{ plan: Plan; warnings: string[] } | null>(null);

const changes = computed(() =>
  parsed.value
    ? planChanges(parsed.value.plan, props.catalog, props.values)
    : [],
);
const routines = computed(() => parsed.value?.plan.routines ?? []);

function analyze(source: string): boolean {
  const result = parsePlan(source, props.catalog);
  if (result.ok) {
    parsed.value = { plan: result.plan, warnings: result.warnings };
    error.value = "";
    return true;
  }
  parsed.value = null;
  error.value = result.error;
  return false;
}

async function pasteFromClipboard() {
  try {
    const clipboard = await navigator.clipboard.readText();
    text.value = clipboard;
    if (!clipboard.trim()) {
      error.value = "El portapapeles está vacío.";
      return;
    }
    analyze(clipboard);
  } catch {
    error.value =
      "No se pudo leer el portapapeles. Pega el texto en el cuadro y pulsa «Analizar».";
  }
}

function open() {
  text.value = "";
  error.value = "";
  parsed.value = null;
  if (!dialog.value?.open) dialog.value?.showModal();
  void pasteFromClipboard();
}

function apply() {
  if (!parsed.value) return;
  emit("apply", parsed.value.plan);
  dialog.value?.close();
}

defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="plan-dialog"
      aria-labelledby="plan-dialog-title"
      @cancel.prevent="dialog?.close()"
    >
      <div class="plan-header">
        <h2 id="plan-dialog-title">Plan de la IA</h2>
        <button
          class="plan-close"
          type="button"
          aria-label="Cerrar"
          @click="dialog?.close()"
        >
          ×
        </button>
      </div>

      <template v-if="parsed">
        <p v-if="parsed.plan.notes" class="plan-notes">
          {{ parsed.plan.notes }}
        </p>
        <h3 v-if="routines.length" class="plan-subtitle">Rutinas</h3>
        <ul v-if="routines.length" class="plan-list">
          <li v-for="routine in routines" :key="routine.id">
            <strong>{{ routine.name }}</strong>
            <span class="plan-days">{{
              routine.days.length ? routine.days.join(", ") : "sin día fijo"
            }}</span>
          </li>
        </ul>
        <h3 class="plan-subtitle">Valores que se van a sustituir</h3>
        <ul class="plan-list">
          <li v-for="change in changes" :key="change.exerciseId">
            <strong>{{ change.name }}</strong>
            <span class="plan-before">{{ change.before || "—" }}</span>
            <span class="plan-after">→ {{ change.after }}</span>
          </li>
        </ul>
        <ul v-if="parsed.warnings.length" class="plan-warnings">
          <li v-for="warning in parsed.warnings" :key="warning">
            {{ warning }}
          </li>
        </ul>
        <p class="plan-hint">
          Los valores editados se sustituyen por los objetivos. El historial no
          se toca.
        </p>
        <div class="plan-actions">
          <button class="plan-secondary" type="button" @click="dialog?.close()">
            Cancelar
          </button>
          <button class="plan-primary" type="button" @click="apply">
            Aplicar plan
          </button>
        </div>
      </template>

      <template v-else>
        <p class="plan-hint">
          Copia la respuesta de la IA y pégala aquí. Debe incluir el bloque
          «gymmy-plan».
        </p>
        <textarea
          v-model="text"
          class="plan-text"
          rows="6"
          aria-label="Respuesta de la IA"
          placeholder="Pega aquí la respuesta de la IA"
        ></textarea>
        <p v-if="error" class="plan-error" role="alert">{{ error }}</p>
        <div class="plan-actions">
          <button
            class="plan-secondary"
            type="button"
            @click="pasteFromClipboard"
          >
            Pegar del portapapeles
          </button>
          <button class="plan-primary" type="button" @click="analyze(text)">
            Analizar
          </button>
        </div>
      </template>
    </dialog>
  </Teleport>
</template>

<style scoped>
.plan-dialog {
  width: min(440px, calc(100% - 28px));
  max-height: min(86vh, 640px);
  margin: auto;
  padding: 20px;
  overflow: auto;
  border: 1px solid #3a493e;
  border-radius: 18px;
  background: #151d17;
  color: var(--text);
  box-shadow: 0 24px 90px #000a;
}

.plan-dialog::backdrop {
  background: #080c09c9;
  backdrop-filter: blur(4px);
}

.plan-header {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plan-header h2 {
  margin: 0;
  font-size: 20px;
}

.plan-close {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  font-size: 22px;
}

.plan-subtitle {
  margin: 14px 0 6px;
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.plan-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  list-style: none;
  font-size: 13px;
}

.plan-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  align-items: baseline;
}

.plan-days,
.plan-before {
  color: var(--muted);
  font-size: 12px;
}

.plan-after {
  color: var(--accent);
  font-weight: 700;
}

.plan-notes,
.plan-hint {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 13px;
}

.plan-warnings {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #ffd3cd;
  font-size: 12px;
}

.plan-text {
  width: 100%;
  padding: 10px;
  border: 1px solid #35433a;
  border-radius: 8px;
  background: #111813;
  color: var(--text);
  font-size: 16px;
  resize: vertical;
}

.plan-error {
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 13px;
}

.plan-actions {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}

.plan-primary,
.plan-secondary {
  min-height: 44px;
  flex: 1;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
}

.plan-primary {
  border: 0;
  background: var(--accent);
  color: #17220f;
}

.plan-secondary {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
}
</style>
