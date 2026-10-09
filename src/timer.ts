import type { TimerState } from "./types";

export function elapsedMilliseconds(
  timer: TimerState | null,
  now: number,
): number {
  if (!timer) return 0;
  const runningTime =
    timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt);
  return timer.elapsedMs + runningTime;
}

export function formatElapsedTime(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
}

export function parseWeight(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const weight = Number(normalized);
  return Number.isFinite(weight) && weight >= 0 ? weight : null;
}

export function parseReps(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const reps = Number(normalized);
  return Number.isSafeInteger(reps) && reps >= 1 ? reps : null;
}
