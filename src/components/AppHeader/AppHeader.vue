<script setup lang="ts">
import { computed } from "vue";

defineProps<{
  online: boolean;
  installable: boolean;
}>();

const emit = defineEmits<{
  "open-history": [opener: HTMLElement];
  install: [];
}>();

const today = computed(() =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date())
    .replace(".", "")
    .toUpperCase(),
);
</script>

<template>
  <header>
    <div class="topbar">
      <a class="brand" href="./" aria-label="Gymmy, inicio">
        <span class="brand-mark" aria-hidden="true">G</span>
        <span>gymmy<span class="brand-period">.</span></span>
      </a>
      <div class="header-actions">
        <span class="connection-status" :class="{ 'is-offline': !online }">
          <span class="status-dot" aria-hidden="true" />
          {{ online ? "En línea" : "Sin conexión" }}
        </span>
        <button
          v-if="installable"
          class="icon-button install-button"
          type="button"
          @click="emit('install')"
        >
          Instalar
        </button>
        <button
          class="icon-button history-button"
          type="button"
          @click="emit('open-history', $event.currentTarget as HTMLElement)"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 5.5h16M4 12h16M4 18.5h16M8 3v5M16 9.5v5M10 16v5" />
          </svg>
          <span>Progreso</span>
        </button>
      </div>
    </div>

    <section class="hero" aria-labelledby="page-title">
      <div class="hero-content">
        <h1 id="page-title">
          Un día más.<br /><span>Un poco más fuerte.</span>
        </h1>
        <p class="hero-copy">
          Apunta tus series. La próxima vez, sabrás exactamente dónde lo
          dejaste.
        </p>
      </div>
      <div class="hero-decoration" aria-hidden="true">
        <span class="hero-badge"
          >HOY<br /><strong>{{ today }}</strong></span
        >
      </div>
    </section>
  </header>
</template>

<style scoped>
.topbar {
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ffffff12;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  text-decoration: none;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -1px;
}

.brand-mark {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px 10px 10px 3px;
  background: var(--accent);
  color: #14200e;
  font-size: 18px;
}

.brand-period {
  color: var(--accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 12px #c3f36b88;
}

.connection-status.is-offline .status-dot {
  background: #ffbd69;
  box-shadow: none;
}

.icon-button {
  min-height: 42px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
  cursor: pointer;
  font-weight: 650;
  font-size: 13px;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.icon-button:hover {
  border-color: #61744c;
  background: var(--panel-soft);
}

.icon-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hero {
  min-height: 0;
  margin: 14px 0 18px;
  padding: 14px 18px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  align-items: center;
  gap: 12px;
  border: 1px solid #ffffff0b;
  border-radius: 19px;
  background: radial-gradient(
    ellipse at 87% 45%,
    #34452a 0,
    #1d2b21 26%,
    #19231c 59%,
    #18201a 100%
  );
}

h1 {
  margin: 0 0 3px;
  font-size: 28px;
  line-height: 1.04;
  letter-spacing: -1px;
}

h1 span {
  color: var(--accent);
}

.hero-copy {
  max-width: 405px;
  margin: 0;
  color: #b0b9b1;
  font-size: 11px;
  line-height: 1.2;
}

.hero-content {
  min-width: 0;
  max-width: 405px;
}

.hero-decoration {
  width: 88px;
  height: 88px;
  justify-self: end;
  align-self: start;
}

.hero-badge {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: center;
  justify-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #182213;
  font-size: 9px;
  line-height: 1.3;
  letter-spacing: 1px;
  font-weight: 800;
}

.hero-badge strong {
  font-size: 14px;
  letter-spacing: 0;
}

@media (max-width: 760px) {
  .hero {
    margin: 10px 0 14px;
    padding: 12px 14px;
    grid-template-columns: minmax(0, 1fr) 68px;
    gap: 8px;
    border-radius: 16px;
  }

  .hero-decoration {
    width: 68px;
    height: 68px;
  }

  h1 {
    font-size: 18px;
    letter-spacing: -0.5px;
  }

  .hero-copy {
    font-size: 9px;
    line-height: 1.15;
  }
}

@media (max-width: 480px) {
  .topbar {
    height: 66px;
  }

  .connection-status {
    font-size: 0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
  }

  .header-actions {
    gap: 7px;
  }

  .icon-button {
    min-height: 39px;
    padding: 0 10px;
    font-size: 11px;
  }

  .icon-button svg {
    width: 16px;
    height: 16px;
  }

  h1 {
    font-size: 17px;
  }

  .hero-copy {
    font-size: 8px;
  }
}

@media (max-height: 740px) {
  .topbar {
    height: 52px;
  }

  .hero {
    margin: 8px 0 10px;
    padding-block: 10px;
  }
}

@media (max-height: 600px) {
  .topbar {
    height: 48px;
  }

  .hero {
    margin: 5px 0 7px;
    padding-block: 8px;
    grid-template-columns: minmax(0, 1fr) 60px;
  }

  h1 {
    font-size: 16px;
  }

  .hero-copy {
    font-size: 8px;
  }
}

@media (max-height: 420px) {
  .topbar {
    height: 44px;
  }

  .hero {
    margin: 3px 0 4px;
    padding: 6px 10px;
    grid-template-columns: minmax(0, 1fr) 52px;
    gap: 6px;
  }

  h1 {
    margin-bottom: 2px;
    font-size: 15px;
  }

  .hero-copy {
    font-size: 7px;
    line-height: 1.1;
  }

  .hero-decoration {
    width: 52px;
    height: 52px;
  }
}
</style>
