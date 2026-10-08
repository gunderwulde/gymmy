import { loadCatalog } from "./catalog.js";
import { latestEntry, loadState, saveState } from "./storage.js";
import { mountUI } from "./ui.js";

function showFatalError(message) {
  const list = document.querySelector("#exercise-list");
  const status = document.querySelector("#app-message");
  status.hidden = false;
  status.classList.add("is-error");
  status.textContent = message;
  list.replaceChildren();
}

async function start() {
  const status = document.querySelector("#connection-status");
  const today = document.querySelector("#today-label");
  today.textContent = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })
    .format(new Date()).replace(".", "").toUpperCase();
  const updateConnection = () => {
    const online = navigator.onLine;
    status.classList.toggle("is-offline", !online);
    status.lastChild.textContent = online ? "En línea" : "Sin conexión";
  };
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();

  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    showFatalError(error.message);
    return;
  }

  let loaded;
  try {
    loaded = loadState();
  } catch (error) {
    loaded = { state: { version: 1, values: {}, history: [] }, warning: `No se pudo acceder al almacenamiento local: ${error.message}`, blocked: true };
  }
  mountUI(catalog, loaded, { latestEntry, saveState });
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch((error) => {
      console.warn("El navegador no pudo marcar los datos como persistentes:", error);
    });
  }
  setupInstallPrompt();
  registerServiceWorker();
}

function setupInstallPrompt() {
  const button = document.querySelector("#install-button");
  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });
  button.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    button.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js")
    .then((registration) => {
      const banner = document.querySelector("#update-banner");
      const updateButton = document.querySelector("#update-button");
      const dismissButton = document.querySelector("#dismiss-update");
      const showUpdate = () => { banner.hidden = false; };
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate();
        });
      });
      updateButton.addEventListener("click", () => {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
      dismissButton.addEventListener("click", () => { banner.hidden = true; });
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      });
    })
    .catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
}

start();
