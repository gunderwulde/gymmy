export function elapsedMilliseconds(timer, now) {
  if (!timer) return 0;
  const runningTime = timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince);
  return timer.elapsedMs + runningTime;
}

export function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}
