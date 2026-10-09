<script setup lang="ts">
defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  update: [];
  dismiss: [];
}>();
</script>

<template>
  <div v-if="visible" class="update-banner" role="status">
    <span>Hay una actualización lista.</span>
    <button type="button" @click="emit('update')">Actualizar ahora</button>
    <button
      class="dismiss-update"
      type="button"
      aria-label="Descartar aviso"
      @click="emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.update-banner {
  position: fixed;
  z-index: 5;
  right: 18px;
  bottom: max(18px, env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 14px;
  border: 1px solid #526b3d;
  border-radius: 12px;
  background: #1c2818;
  box-shadow: 0 12px 35px #0008;
  color: var(--text);
  font-size: 12px;
}

.update-banner button {
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
}

.update-banner .dismiss-update {
  color: var(--muted);
  font-size: 20px;
}

@media (max-width: 480px) {
  .update-banner {
    right: 10px;
    left: 10px;
    justify-content: space-between;
    gap: 7px;
  }
}
</style>
