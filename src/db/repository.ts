// src/db/repository.ts

import Dexie from "dexie";

import { db } from "./index";
import type { Student } from "../models/student";
import type { ScoreRecord } from "../models/score";

export interface StudentWithScores extends Student {
  scores: ScoreRecord[];
}

const toUserFriendlyError = (err: unknown): string => {
  if (err instanceof Dexie.QuotaExceededError) return "存储空间不足";
  if (err instanceof Dexie.ConstraintError) return "数据约束冲突";
  if (err instanceof Error) return err.message;
  return String(err);
};

export const saveStudents = async (students: Student[]): Promise<void> => {
  if (students.length === 0) return;

  const now = Date.now();
  const normalized = students
    .filter((s) => s.studentId)
    .map((s) => ({
      ...s,
      name: s.name ?? "",
      createdAt: s.createdAt ?? now,
      updatedAt: now,
    }));

  try {
    await db.transaction("rw", db.students, async () => {
      await db.students.bulkPut(normalized);
    });
  } catch (err) {
    console.error("saveStudents failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const addScoreRecords = async (
  records: ScoreRecord[],
): Promise<void> => {
  if (records.length === 0) return;

  const now = Date.now();
  const normalized = records
    .filter((r) => r.studentId && r.subject && r.term && r.category)
    .map((r) => ({
      ...r,
      createdAt: r.createdAt ?? now,
    }));

  try {
    await db.transaction("rw", db.scores, async () => {
      await db.scores.bulkAdd(normalized);
    });
  } catch (err) {
    console.error("addScoreRecords failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const getAllStudentsWithScores = async (): Promise<
  StudentWithScores[]
> => {
  try {
    const students = await db.students.toArray();
    if (students.length === 0) return [];

    const studentIds = students.map((s) => s.studentId);
    const scores = await db.scores
      .where("studentId")
      .anyOf(studentIds)
      .toArray();

    const scoresByStudentId = new Map<string, ScoreRecord[]>();
    for (const score of scores) {
      const list = scoresByStudentId.get(score.studentId) ?? [];
      list.push(score);
      scoresByStudentId.set(score.studentId, list);
    }

    return students.map((s) => ({
      ...s,
      scores: scoresByStudentId.get(s.studentId) ?? [],
    }));
  } catch (err) {
    console.error("getAllStudentsWithScores failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const upsertFileMeta = async (meta: {
  name: string;
  size?: number;
  lastModified?: number;
}): Promise<void> => {
  try {
    await db.files.put({
      name: meta.name,
      size: meta.size,
      lastModified: meta.lastModified,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("upsertFileMeta failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};
