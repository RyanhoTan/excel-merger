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

export interface ClassMeta {
  // 学生档案页：班级名称（主键）。
  className: string;
  // 学生档案页：创建时间（用于排序/审计）。
  createdAt?: number;
  // 学生档案页：更新时间（用于审计）。
  updatedAt?: number;
}

export class ClassManagerDB extends Dexie {
  students!: Table<Student, Student["studentId"]>;
  scores!: Table<ScoreRecord, number>;
  files!: Table<StoredFileMeta, StoredFileMeta["name"]>;
  mergeHistory!: Table<MergeHistoryRecord, number>;
  classes!: Table<ClassMeta, ClassMeta["className"]>;

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

    this.version(3).stores({
      students: "&studentId, name",
      scores: "++id, studentId, subject, term, category",
      files: "&name",
      mergeHistory: "++id, timestamp, fileName",
      classes: "&className, createdAt, updatedAt",
    });
  }
}

export const db = new ClassManagerDB();
