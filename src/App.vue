<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import AppHeader from "./components/AppHeader/AppHeader.vue";
import ExerciseList from "./components/ExerciseList/ExerciseList.vue";
import UpdateBanner from "./components/UpdateBanner/UpdateBanner.vue";
import { useWorkoutStore } from "./stores/workout";
import { buildRoutineMarkdown, EXPORT_FILE_NAME } from "./exportMarkdown";
import { shareMarkdown } from "./share";

const store = useWorkoutStore();
const installable = ref(false);
const updateDismissed = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW();

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let installPrompt: InstallPromptEvent | null = null;

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

async function exportRoutines() {
  const markdown = buildRoutineMarkdown(store.catalog, store.history);
  try {
    const result = await shareMarkdown(
      EXPORT_FILE_NAME,
      "Mis rutinas de Gymmy",
      markdown,
    );
    if (result === "downloaded") {
      store.announce("Archivo .md descargado: adjúntalo en tu app de IA.");
    }
  } catch (error) {
    store.announce(`No se pudo exportar: ${errorMessage(error)}`, true);
  }
}

onMounted(() => {
  void store.load();
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
});

onBeforeUnmount(() => {
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
      :installable="installable"
      @install="installApp"
      @export="exportRoutines"
    />
    <main>
      <ExerciseList />
    </main>
  </div>

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
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(env(safe-area-inset-bottom) + 18px);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

main {
  min-height: 0;
  overflow: hidden;
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
}
</style>
