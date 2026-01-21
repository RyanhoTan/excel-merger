// src/db/index.ts

import Dexie, { type Table } from "dexie";

import type { Student } from "../models/student";
import type { ScoreRecord } from "../models/score";

export interface StoredFileMeta {
  name: string;
  size?: number;
  lastModified?: number;
  createdAt?: number;
}

export interface MergeHistoryRecord {
  id?: number;
  timestamp: number;
  fileName: string;
  fileCount: number;
  studentCount: number;
  operator: string;
  headerKeys?: string[];
  snapshot: Record<string, unknown>[];
}

export class ClassManagerDB extends Dexie {
  students!: Table<Student, Student["studentId"]>;
  scores!: Table<ScoreRecord, number>;
  files!: Table<StoredFileMeta, StoredFileMeta["name"]>;
  mergeHistory!: Table<MergeHistoryRecord, number>;

  constructor() {
    super("ClassManagerDB");

    this.version(1).stores({
      students: "&studentId, name",
      scores: "++id, studentId, subject, term, category",
      files: "&name",
    });

    this.version(2).stores({
      students: "&studentId, name",
      scores: "++id, studentId, subject, term, category",
      files: "&name",
      mergeHistory: "++id, timestamp, fileName",
    });
  }
}

export const db = new ClassManagerDB();
