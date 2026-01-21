// src/models/score.ts

export interface ScoreRecord {
  id?: number;
  studentId: string;
  subject: string;
  term: string;
  category: string;
  score: number;
  raw?: Record<string, unknown>;
  createdAt?: number;
}

export type ScoreRecordId = NonNullable<ScoreRecord["id"]>;
