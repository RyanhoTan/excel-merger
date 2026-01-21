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

export class ClassManagerDB extends Dexie {
  students!: Table<Student, Student["studentId"]>;
  scores!: Table<ScoreRecord, number>;
  files!: Table<StoredFileMeta, StoredFileMeta["name"]>;

  constructor() {
    super("ClassManagerDB");

    this.version(1).stores({
      students: "&studentId, name",
      scores: "++id, studentId, subject, term, category",
      files: "&name",
    });
  }
}

export const db = new ClassManagerDB();
