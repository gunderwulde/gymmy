export type ExerciseType = "machine" | "exercise";
export type TrackingMode = "sets" | "time";
export type ExerciseZone = "all" | "upper" | "lower" | "cardio";

export interface ExerciseVariable {
  var: string;
  txt: string;
  default: number;
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  tracking?: TrackingMode;
  muscleGroup: string;
  image: string;
  v1?: ExerciseVariable;
  v2?: ExerciseVariable;
  v3?: ExerciseVariable;
}

export interface ExerciseValue {
  exerciseId: string;
  values: Record<string, number>;
}

export interface SetEntry {
  id?: number;
  exerciseId: string;
  mode: "sets";
  values: Record<string, number>;
  date: string;
}

export interface TimeEntry {
  id?: number;
  exerciseId: string;
  mode: "time";
  durationSeconds: number;
  values?: Record<string, number>;
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
