<script setup lang="ts">
import { computed, ref } from "vue";
import { formatElapsedTime } from "../../timer";
import { buildProgressSeries, niceScale } from "../../progress";
import { exerciseVariables, formatVariableValues } from "../../variables";
import type { Exercise, HistoryEntry } from "../../types";

const props = defineProps<{
  exercise: Exercise;
  history: HistoryEntry[];
}>();

const WIDTH = 320;
const HEIGHT = 170;
const MARGIN = { top: 12, right: 14, bottom: 24, left: 36 };
const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

const series = computed(() =>
  buildProgressSeries(props.exercise, props.history),
);
const points = computed(() => series.value.points);
const variables = computed(() => exerciseVariables(props.exercise));

const scale = computed(() => {
  const values = points.value.map((point) => point.value);
  return niceScale(Math.min(...values), Math.max(...values));
});

const chartPoints = computed(() =>
  points.value.map((point, index) => ({
    ...point,
    x:
      points.value.length === 1
        ? MARGIN.left + plotWidth / 2
        : MARGIN.left + (plotWidth * index) / (points.value.length - 1),
    y: yFor(point.value),
  })),
);
const linePath = computed(() =>
  chartPoints.value
    .map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`)
    .join(" "),
);
const yTicks = computed(() =>
  scale.value.ticks.map((tick) => ({ value: tick, y: yFor(tick) })),
);

const selected = ref<number | null>(null);
const activeIndex = computed(() =>
  Math.min(selected.value ?? points.value.length - 1, points.value.length - 1),
);
const active = computed(() => chartPoints.value[activeIndex.value]);

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const summary = computed(() => {
  const last = chartPoints.value.at(-1);
  const first = chartPoints.value[0];
  if (!last || !first) return null;
  const delta = last.value - first.value;
  return {
    latest: format(last.value),
    change:
      chartPoints.value.length > 1
        ? `${delta >= 0 ? "+" : "−"}${number.format(Math.abs(delta))}${unitSuffix.value} desde el ${formatShortDate(first.date)}`
        : "Primer registro",
  };
});
const unitSuffix = computed(() =>
  series.value.unit ? ` ${series.value.unit}` : "",
);
const ariaLabel = computed(() =>
  summary.value
    ? `Gráfica de ${series.value.title.toLowerCase()} de ${props.exercise.name}: ${points.value.length} registros, último ${summary.value.latest}. ${summary.value.change}.`
    : "",
);

function yFor(value: number): number {
  const { min, max } = scale.value;
  return MARGIN.top + plotHeight * (1 - (value - min) / (max - min || 1));
}

function format(value: number): string {
  return `${number.format(value)}${unitSuffix.value}`;
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  })
    .format(new Date(date))
    .replace(".", "");
}

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(date))
    .replace(/\./g, "");
}

function detail(entry: HistoryEntry): string {
  const values = formatVariableValues(variables.value, entry.values);
  if (entry.mode !== "time") return values;
  return [formatElapsedTime(entry.durationSeconds * 1000), values]
    .filter(Boolean)
    .join(" · ");
}

function selectFromPointer(event: PointerEvent) {
  const target = event.currentTarget;
  if (!(target instanceof SVGElement) || !chartPoints.value.length) return;
  const box = target.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * WIDTH;
  let nearest = 0;
  chartPoints.value.forEach((point, index) => {
    if (Math.abs(point.x - x) < Math.abs(chartPoints.value[nearest].x - x)) {
      nearest = index;
    }
  });
  selected.value = nearest;
}

function selectFromKeyboard(event: KeyboardEvent) {
  const last = points.value.length - 1;
  const moves: Record<string, number> = {
    ArrowLeft: Math.max(0, activeIndex.value - 1),
    ArrowRight: Math.min(last, activeIndex.value + 1),
    Home: 0,
    End: last,
  };
  const next = moves[event.key];
  if (next === undefined) return;
  event.preventDefault();
  selected.value = next;
}
</script>

<template>
  <section class="progress" :aria-labelledby="`progress-title-${exercise.id}`">
    <h3 :id="`progress-title-${exercise.id}`" class="progress-title">
      Progreso · {{ series.title }}
    </h3>
    <p v-if="!summary" class="progress-empty">
      Aún no has registrado este ejercicio.
    </p>
    <template v-else>
      <p class="progress-summary">
        <strong class="progress-latest">{{ summary.latest }}</strong>
        <span class="progress-change">{{ summary.change }}</span>
      </p>
      <svg
        class="progress-chart"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        role="img"
        tabindex="0"
        :aria-label="ariaLabel"
        @pointerdown="selectFromPointer"
        @pointermove="selectFromPointer"
        @keydown="selectFromKeyboard"
      >
        <g class="progress-grid">
          <line
            v-for="tick in yTicks"
            :key="tick.value"
            :x1="MARGIN.left"
            :x2="WIDTH - MARGIN.right"
            :y1="tick.y"
            :y2="tick.y"
          />
        </g>
        <g class="progress-axis">
          <text
            v-for="tick in yTicks"
            :key="tick.value"
            :x="MARGIN.left - 6"
            :y="tick.y + 3.5"
            text-anchor="end"
          >
            {{ number.format(tick.value) }}
          </text>
          <text
            :x="chartPoints[0].x"
            :y="HEIGHT - 6"
            :text-anchor="chartPoints.length > 1 ? 'start' : 'middle'"
          >
            {{ formatShortDate(chartPoints[0].date) }}
          </text>
          <text
            v-if="chartPoints.length > 1"
            :x="chartPoints[chartPoints.length - 1].x"
            :y="HEIGHT - 6"
            text-anchor="end"
          >
            {{ formatShortDate(chartPoints[chartPoints.length - 1].date) }}
          </text>
        </g>
        <line
          class="progress-crosshair"
          :x1="active.x"
          :x2="active.x"
          :y1="MARGIN.top"
          :y2="MARGIN.top + plotHeight"
        />
        <path
          v-if="chartPoints.length > 1"
          class="progress-line"
          :d="linePath"
        />
        <circle
          v-for="(point, index) in chartPoints"
          :key="point.date"
          class="progress-dot"
          :class="{ 'is-active': index === activeIndex }"
          :cx="point.x"
          :cy="point.y"
          :r="index === activeIndex ? 5 : chartPoints.length > 24 ? 2.5 : 4"
        />
      </svg>
      <p class="progress-detail" aria-live="polite">
        <span class="progress-detail-date">{{
          formatLongDate(active.date)
        }}</span>
        <span class="progress-detail-value">{{ format(active.value) }}</span>
        <span v-if="detail(active.entry)" class="progress-detail-entry">
          {{ detail(active.entry) }}
        </span>
      </p>
      <div class="visually-hidden">
        <table>
          <caption>
            {{
              series.title
            }}
            de
            {{
              exercise.name
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">{{ series.title }}</th>
              <th scope="col">Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.date">
              <td>{{ formatLongDate(point.date) }}</td>
              <td>{{ format(point.value) }}</td>
              <td>{{ detail(point.entry) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.progress {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ffffff14;
}

.progress-title {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.progress-empty {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.progress-summary {
  margin: 0 0 6px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.progress-latest {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}

.progress-change {
  color: var(--muted);
  font-size: 11px;
}

.progress-chart {
  width: 100%;
  height: auto;
  display: block;
  touch-action: pan-y;
  border-radius: 8px;
  cursor: crosshair;
}

.progress-chart:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.progress-grid line {
  stroke: #ffffff14;
  stroke-width: 1;
}

.progress-axis text {
  fill: var(--muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.progress-crosshair {
  stroke: #ffffff33;
  stroke-width: 1;
}

.progress-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.progress-dot {
  fill: var(--accent);
  stroke: #151d17;
  stroke-width: 2;
}

.progress-dot.is-active {
  fill: #151d17;
  stroke: var(--accent);
}

.progress-detail {
  height: 42px;
  margin: 6px 0 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: 18px 18px;
  column-gap: 12px;
  align-items: baseline;
  overflow: hidden;
}

.progress-detail-date {
  color: var(--muted);
  font-size: 11px;
  text-transform: capitalize;
}

.progress-detail-value {
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
}

.progress-detail-entry {
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-size: 12px;
}

@media (max-width: 480px) {
  .progress-detail {
    height: 46px;
    grid-template-rows: 20px 20px;
  }

  .progress-title {
    font-size: 11px;
  }

  .progress-change,
  .progress-detail-date {
    font-size: 12px;
  }

  .progress-detail-value {
    font-size: 14px;
  }

  .progress-detail-entry {
    font-size: 13px;
  }
}
</style>
