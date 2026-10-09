<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import AppHeader from "./components/AppHeader/AppHeader.vue";
import ExerciseList from "./components/ExerciseList/ExerciseList.vue";
import HistoryDialog from "./components/HistoryDialog/HistoryDialog.vue";
import UpdateBanner from "./components/UpdateBanner/UpdateBanner.vue";
import { useWorkoutStore } from "./stores/workout";

const store = useWorkoutStore();
const historyDialog = ref<InstanceType<typeof HistoryDialog> | null>(null);
const online = ref(navigator.onLine);
const installable = ref(false);
const updateDismissed = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW();

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let installPrompt: InstallPromptEvent | null = null;

function onOnline() {
  online.value = true;
}

function onOffline() {
  online.value = false;
}

function onBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  installPrompt = event as InstallPromptEvent;
  installable.value = true;
}

function onAppInstalled() {
  installPrompt = null;
  installable.value = false;
}

async function installApp() {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installable.value = false;
  } catch (error) {
    store.announce(
      `No se pudo iniciar la instalación: ${errorMessage(error)}`,
      true,
    );
  }
}

function openHistory(opener: HTMLElement, exerciseId = "all") {
  historyDialog.value?.open(opener, exerciseId);
}

onMounted(() => {
  void store.load();
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.removeEventListener("appinstalled", onAppInstalled);
  store.stopTicker();
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "error desconocido";
}
</script>

<template>
  <div class="app-shell">
    <AppHeader
      :online="online"
      :installable="installable"
      @install="installApp"
      @open-history="(opener) => openHistory(opener)"
    />
    <main>
      <ExerciseList @open-history="openHistory" />
    </main>
    <footer class="footer">
      <span>GYMMY</span><span>Tus datos se quedan en este dispositivo.</span>
    </footer>
  </div>

  <HistoryDialog
    ref="historyDialog"
    :catalog="store.catalog"
    :history="store.history"
  />
  <UpdateBanner
    :visible="needRefresh && !updateDismissed"
    @update="updateServiceWorker(true)"
    @dismiss="updateDismissed = true"
  />
</template>

<style scoped>
.app-shell {
  width: min(1040px, 100% - 48px);
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  margin-inline: auto;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

main {
  min-height: 0;
  overflow: hidden;
}

.footer {
  min-height: 0;
  margin: 12px 0 10px;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #ffffff12;
  color: #77837a;
  font-size: 10px;
}

.footer span:first-child {
  color: var(--muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100% - 32px, 560px);
  }
}

@media (max-width: 480px) {
  .app-shell {
    width: calc(100% - 24px);
  }

  .footer {
    margin: 8px 0;
    padding-top: 8px;
    font-size: 9px;
  }
}
</style>
