export type ExerciseType = "machine" | "exercise";
export type TrackingMode = "sets" | "time";
export type ExerciseZone = "all" | "upper" | "lower" | "cardio";

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  tracking?: TrackingMode;
  muscleGroup: string;
  image: string;
  defaultWeight?: number;
  defaultReps?: number;
}

export interface ExerciseValue {
  exerciseId: string;
  weight: number;
  reps: number;
}

export interface SetEntry {
  id?: number;
  exerciseId: string;
  mode?: "sets";
  weight: number;
  reps: number;
  date: string;
}

export interface TimeEntry {
  id?: number;
  exerciseId: string;
  mode: "time";
  durationSeconds: number;
  date: string;
}

export type HistoryEntry = SetEntry | TimeEntry;

export interface TimerSession {
  id: "active";
  exerciseId: string;
  elapsedMs: number;
  startedAt: number | null;
}

export interface TimerState {
  exerciseId: string;
  elapsedMs: number;
  startedAt: number | null;
}
