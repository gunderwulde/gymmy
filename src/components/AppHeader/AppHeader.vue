<script setup lang="ts">
import { computed } from "vue";

defineProps<{
  installable: boolean;
}>();

const emit = defineEmits<{
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
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-content">
        <h1 id="page-title" class="brand-title">
          <a class="brand" href="./" aria-label="Gymmy, inicio">
            <span class="brand-mark" aria-hidden="true">G</span>
            <span>gymmy<span class="brand-period">.</span></span>
          </a>
        </h1>
        <button
          v-if="installable"
          class="install-button"
          type="button"
          @click="emit('install')"
        >
          Instalar
        </button>
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

.hero-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.brand-title {
  margin: 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1.5px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px 14px 14px 4px;
  background: var(--accent);
  color: #14200e;
  font-size: 26px;
  letter-spacing: 0;
}

.brand-period {
  color: var(--accent);
}

.install-button {
  min-height: 42px;
  padding: 0 14px;
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

.install-button:hover {
  border-color: #61744c;
  background: var(--panel-soft);
}

.hero-decoration {
  width: 88px;
  height: 88px;
  justify-self: end;
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

  .brand {
    font-size: 28px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .install-button {
    min-height: 44px;
  }
}

@media (max-height: 740px) {
  .hero {
    margin: 8px 0 10px;
    padding-block: 10px;
  }
}

@media (max-height: 600px) {
  .hero {
    margin: 5px 0 7px;
    padding-block: 8px;
    grid-template-columns: minmax(0, 1fr) 60px;
  }

  .hero-decoration {
    width: 60px;
    height: 60px;
  }

  .brand {
    font-size: 24px;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}

@media (max-height: 420px) {
  .hero {
    margin: 3px 0 4px;
    padding: 6px 10px;
    grid-template-columns: minmax(0, 1fr) 52px;
    gap: 6px;
  }

  .hero-decoration {
    width: 52px;
    height: 52px;
  }

  .brand {
    font-size: 20px;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}
</style>
