<script setup lang="ts">
import { ref, watch } from "vue";
import type { SharedData } from "../../sharedData";

const props = defineProps<{ data: SharedData | null }>();
const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.data,
  (data) => {
    if (data && !dialog.value?.open) dialog.value?.showModal();
  },
  { flush: "post" },
);
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="shared-dialog"
      aria-labelledby="shared-title"
      @close="emit('close')"
    >
      <h2 id="shared-title">¡Datos recibidos!</h2>
      <p v-if="data" class="shared-size">
        {{ data.text.length }} caracteres recibidos.
      </p>
      <button class="shared-close" type="button" @click="dialog?.close()">
        Aceptar
      </button>
    </dialog>
  </Teleport>
</template>

<style scoped>
.shared-dialog {
  width: min(360px, calc(100% - 28px));
  margin: auto;
  padding: 22px;
  border: 1px solid #3a493e;
  border-radius: 18px;
  background: #151d17;
  color: var(--text);
  box-shadow: 0 24px 90px #000a;
  text-align: center;
}

.shared-dialog::backdrop {
  background: #080c09c9;
  backdrop-filter: blur(4px);
}

.shared-dialog h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.shared-size {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}

.shared-close {
  min-height: 44px;
  padding: 0 22px;
  border: 0;
  border-radius: 10px;
  background: var(--accent);
  color: #17220f;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
}
</style>
