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
        <p class="eyebrow">
          <span class="eyebrow-line" /> TU COMPAÑERO DE ENTRENAMIENTO
        </p>
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
  min-height: 294px;
  margin: 34px 0 53px;
  padding: 46px 54px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  border: 1px solid #ffffff0b;
  border-radius: 24px;
  background: radial-gradient(
    ellipse at 87% 45%,
    #34452a 0,
    #1d2b21 26%,
    #19231c 59%,
    #18201a 100%
  );
}

.eyebrow {
  margin: 0 0 17px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.eyebrow-line {
  width: 17px;
  height: 1px;
  background: var(--accent);
}

h1 {
  margin: 0 0 13px;
  font-size: clamp(32px, 5vw, 47px);
  line-height: 1.08;
  letter-spacing: -1.9px;
}

h1 span {
  color: var(--accent);
}

.hero-copy {
  max-width: 405px;
  margin: 0;
  color: #b0b9b1;
  font-size: 14px;
  line-height: 1.6;
}

.hero-decoration {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 88px;
  height: 88px;
}

.hero-content {
  max-width: 405px;
}

.hero-badge {
  position: absolute;
  inset: 0;
  width: 88px;
  height: 88px;
  display: grid;
  align-content: center;
  justify-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #182213;
  font-size: 9px;
  line-height: 1.5;
  letter-spacing: 1.4px;
  font-weight: 800;
}

.hero-badge strong {
  font-size: 16px;
  letter-spacing: 0;
}

@media (max-width: 760px) {
  .hero {
    min-height: 270px;
    margin: 23px 0 38px;
    padding: 32px 28px;
  }

  .hero-decoration {
    top: 12px;
    right: 12px;
    width: 68px;
    height: 68px;
  }

  .hero-badge {
    width: 68px;
    height: 68px;
    font-size: 7px;
  }

  .hero-badge strong {
    font-size: 12px;
  }

  .hero-content {
    max-width: calc(100% - 84px);
  }

  .hero-copy {
    max-width: 330px;
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

  .hero {
    min-height: 250px;
    margin-top: 17px;
    padding: 27px 21px;
    border-radius: 19px;
  }

  h1 {
    font-size: 34px;
  }

  .hero-copy {
    max-width: 285px;
    font-size: 13px;
  }

  .hero-decoration {
    top: 8px;
    right: 8px;
    width: 52px;
    height: 52px;
  }

  .hero-badge {
    width: 52px;
    height: 52px;
    font-size: 6px;
    letter-spacing: 0.8px;
  }

  .hero-badge strong {
    font-size: 10px;
  }
}

@media (max-height: 740px) {
  .topbar {
    height: 52px;
  }

  .hero {
    min-height: 150px;
    margin: 8px 0 10px;
    padding: 14px 20px;
  }

  .eyebrow {
    margin-bottom: 8px;
    font-size: 8px;
  }

  h1 {
    margin-bottom: 6px;
    font-size: 26px;
  }

  .hero-copy {
    font-size: 10px;
    line-height: 1.35;
  }

  .hero-decoration {
    top: 8px;
    right: 8px;
    width: 62px;
    height: 62px;
  }

  .hero-badge {
    width: 62px;
    height: 62px;
    font-size: 7px;
  }

  .hero-badge strong {
    font-size: 12px;
  }
}

@media (max-height: 600px) {
  .hero {
    min-height: 125px;
    margin: 5px 0 7px;
    padding: 10px 14px;
  }

  .eyebrow {
    margin-bottom: 5px;
  }

  h1 {
    margin-bottom: 4px;
    font-size: 22px;
  }

  .hero-copy {
    font-size: 10px;
    line-height: 1.2;
  }

  .hero-decoration {
    width: 54px;
    height: 54px;
  }

  .hero-badge {
    width: 54px;
    height: 54px;
  }

  .hero-badge strong {
    font-size: 11px;
  }
}

@media (max-height: 420px) {
  .topbar {
    height: 44px;
  }

  .hero {
    min-height: 92px;
    margin: 3px 0 4px;
    padding: 8px 12px;
  }

  .eyebrow {
    margin-bottom: 4px;
  }

  h1 {
    margin-bottom: 0;
    font-size: 20px;
  }

  .hero-copy {
    display: none;
  }

  .hero-decoration {
    top: 6px;
    right: 6px;
    width: 48px;
    height: 48px;
  }

  .hero-badge {
    width: 48px;
    height: 48px;
    font-size: 6px;
  }

  .hero-badge strong {
    font-size: 10px;
  }
}
</style>
