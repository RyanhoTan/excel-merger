// src/db/repository.ts

import Dexie from "dexie";

import { db } from "./index";
import type { Student } from "../models/student";
import type { ScoreRecord } from "../models/score";
import type { MergeHistoryRecord } from "./index";

export interface StudentWithScores extends Student {
  scores: ScoreRecord[];
}

export interface MergeTask {
  timestamp: number;
  fileName: string;
  fileCount: number;
  studentCount: number;
  operator?: string;
  headerKeys?: string[];
  snapshot: Record<string, unknown>[];
}

export interface DashboardRecentActivity {
  // Dashboard data: Merge history record id.
  id: number;
  // Dashboard data: Activity time.
  timestamp: number;
  // Dashboard data: Primary title to render.
  title: string;
  // Dashboard data: Secondary description to render.
  description: string;
}

export interface DashboardStats {
  // Dashboard data: Total students count.
  studentCount: number;
  // Dashboard data: Total merged tasks count.
  mergeCount: number;
  // Dashboard data: Total score records count.
  scoreCount: number;
  // Dashboard data: Total imported files count.
  fileCount: number;
  // Dashboard data: Latest merge timestamp.
  lastMergeAt?: number;
  // Dashboard data: Trend percent for students (recent period vs previous period).
  studentTrend?: number;
  // Dashboard data: Trend percent for merges (recent period vs previous period).
  mergeTrend?: number;
  // Dashboard data: Trend percent for scores (recent period vs previous period).
  scoreTrend?: number;
  // Dashboard data: Recent activities list.
  recentActivities: DashboardRecentActivity[];
}

export interface GlobalTrendPoint {
  // Dashboard analysis module: Exam name to show on X-axis.
  name: string;
  // Dashboard analysis module: Average score value.
  score: number;
}

export interface GlobalStats {
  // Dashboard data: Total students count.
  studentCount: number;
  // Dashboard data: Total merge history count.
  historyCount: number;
  // Dashboard data: Total score records count.
  scoreCount: number;
  // Dashboard data: Total imported files count.
  fileCount: number;
  // Dashboard data: Trend percent for students.
  studentTrend?: number;
  // Dashboard data: Trend percent for merge history.
  historyTrend?: number;
  // Dashboard data: Trend percent for scores.
  scoreTrend?: number;
  // Dashboard data: Recent activities list.
  recentActivities: DashboardRecentActivity[];
  // Dashboard analysis module: Trend chart data.
  trendChartData: GlobalTrendPoint[];
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

// Dashboard data API: Fetch global stats for the Dashboard page.
// This is a higher-level API used by src/views/Dashboard/index.tsx.
export const getGlobalStats = async (): Promise<GlobalStats> => {
  try {
    const dashboard = await getDashboardStats();

    // Dashboard analysis module: Build average score trend points.
    // Current DB schema doesn't have an explicit "exam" table, so we group by term.
    // term is treated as the "exam name" (fallback to category/subject if needed).
    const scoreRecords = await db.scores.toArray();
    const group = new Map<string, { sum: number; count: number }>();
    for (const r of scoreRecords) {
      const key = (r.term || r.category || r.subject || "未知考试").trim();
      const prev = group.get(key) ?? { sum: 0, count: 0 };
      group.set(key, {
        sum: prev.sum + (Number(r.score) || 0),
        count: prev.count + 1,
      });
    }

    const trendChartData: GlobalTrendPoint[] = Array.from(group.entries())
      .map(([name, agg]) => ({
        name,
        score: agg.count ? agg.sum / agg.count : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);

    return {
      studentCount: dashboard.studentCount,
      historyCount: dashboard.mergeCount,
      scoreCount: dashboard.scoreCount,
      fileCount: dashboard.fileCount,
      studentTrend: dashboard.studentTrend,
      historyTrend: dashboard.mergeTrend,
      scoreTrend: dashboard.scoreTrend,
      recentActivities: dashboard.recentActivities,
      trendChartData,
    };
  } catch (err) {
    console.error("getGlobalStats failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const saveMergeTask = async (task: MergeTask): Promise<number> => {
  try {
    const record: MergeHistoryRecord = {
      timestamp: task.timestamp,
      fileName: task.fileName,
      fileCount: task.fileCount,
      studentCount: task.studentCount,
      operator: task.operator ?? "老师",
      headerKeys: task.headerKeys,
      snapshot: task.snapshot,
    };

    return await db.mergeHistory.add(record);
  } catch (err) {
    console.error("saveMergeTask failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const getHistoryList = async (): Promise<MergeHistoryRecord[]> => {
  try {
    return await db.mergeHistory.orderBy("timestamp").reverse().toArray();
  } catch (err) {
    console.error("getHistoryList failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const deleteMergeTask = async (id: number): Promise<void> => {
  try {
    await db.mergeHistory.delete(id);
  } catch (err) {
    console.error("deleteMergeTask failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export const addScoreRecords = async (
  records: ScoreRecord[],
): Promise<void> => {
  if (records.length === 0) return;

  const now = Date.now();
  const normalized = records
    .filter((r) => r.studentId)
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

const toTrendPercent = (
  current: number,
  previous: number,
): number | undefined => {
  if (previous <= 0) return undefined;
  return ((current - previous) / previous) * 100;
};

// Dashboard data API: Fetch stats and recent activities for the Dashboard page.
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Dashboard data: basic counts and latest merge.
    const [studentCount, scoreCount, mergeCount, fileCount, latest] =
      await Promise.all([
        db.students.count(),
        db.scores.count(),
        db.mergeHistory.count(),
        db.files.count(),
        db.mergeHistory.orderBy("timestamp").last(),
      ]);

    // Dashboard data: recent merge activities (most recent first).
    const recent = await db.mergeHistory
      .orderBy("timestamp")
      .reverse()
      .limit(6)
      .toArray();

    const recentActivities: DashboardRecentActivity[] = recent
      .filter(
        (r): r is MergeHistoryRecord & { id: number } =>
          typeof r.id === "number",
      )
      .map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        title: r.fileName ? `合并：${r.fileName}` : "合并记录",
        description: `${r.fileCount} 个文件，${r.studentCount} 名学生`,
      }));

    // Dashboard data: compute simple 7-day trend vs previous 7-day window.
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const startRecent = now - 7 * dayMs;
    const startPrev = now - 14 * dayMs;

    const [recentMerges, prevMerges] = await Promise.all([
      db.mergeHistory
        .where("timestamp")
        .between(startRecent, now, true, true)
        .count(),
      db.mergeHistory
        .where("timestamp")
        .between(startPrev, startRecent, true, false)
        .count(),
    ]);

    // student.createdAt/score.createdAt is optional, so missing timestamps are ignored for trend.
    const [recentStudents, prevStudents, recentScores, prevScores] =
      await Promise.all([
        db.students
          .filter(
            (s) =>
              typeof s.createdAt === "number" && s.createdAt >= startRecent,
          )
          .count(),
        db.students
          .filter(
            (s) =>
              typeof s.createdAt === "number" &&
              s.createdAt >= startPrev &&
              s.createdAt < startRecent,
          )
          .count(),
        db.scores
          .filter(
            (r) =>
              typeof r.createdAt === "number" && r.createdAt >= startRecent,
          )
          .count(),
        db.scores
          .filter(
            (r) =>
              typeof r.createdAt === "number" &&
              r.createdAt >= startPrev &&
              r.createdAt < startRecent,
          )
          .count(),
      ]);

    return {
      studentCount,
      mergeCount,
      scoreCount,
      fileCount,
      lastMergeAt: latest?.timestamp,
      studentTrend: toTrendPercent(recentStudents, prevStudents),
      mergeTrend: toTrendPercent(recentMerges, prevMerges),
      scoreTrend: toTrendPercent(recentScores, prevScores),
      recentActivities,
    };
  } catch (err) {
    console.error("getDashboardStats failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

export interface ClassSummary {
  // 学生档案页：班级名称。
  className: string;
  // 学生档案页：班级人数。
  studentCount: number;
  // 学生档案页：最近活跃时间（用于班级卡片展示）。
  lastActiveAt?: number;
  // 学生档案页：成绩录入完整度（0~1，用于卡片底部进度条）。
  completionRate: number;
}

export interface StudentProfileWithStats {
  // 学生档案页：学号。
  studentId: string;
  // 学生档案页：姓名。
  name: string;
  // 学生档案页：班级名称。
  className: string;
  // 学生档案页：累计考试次数（按 term/category/subject 去重）。
  examCount: number;
  // 学生档案页：成绩记录条数。
  scoreCount: number;
  // 学生档案页：平均分（若无成绩则为 undefined）。
  averageScore?: number;
  // 学生档案页：最近活跃时间。
  lastActiveAt?: number;
}

// 学生档案页：尝试从学生表或成绩 raw 中提取班级名称。
const resolveStudentClassName = (
  student: Student,
  scores: ScoreRecord[],
): string => {
  const direct = student.className?.trim();
  if (direct) return direct;

  const pickFromRaw = (raw: Record<string, unknown> | undefined): string => {
    if (!raw) return "";
    const candidates = [
      "className",
      "class",
      "Class",
      "班级",
      "班级名称",
      "班级名",
      "年级班级",
    ];
    for (const key of candidates) {
      const v = raw[key];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  for (const s of scores) {
    const name = pickFromRaw(s.raw);
    if (name) return name;
  }

  return "未分班";
};

// 学生档案页：该函数用于聚合班级数据（从 students 表提取不重复班级并统计人数/活跃/完整度）。
export const getClassesSummary = async (): Promise<ClassSummary[]> => {
  try {
    const students = await db.students.toArray();
    if (students.length === 0) return [];

    const studentIds = students.map((s) => s.studentId);
    const scores = await db.scores
      .where("studentId")
      .anyOf(studentIds)
      .toArray();

    const scoresByStudentId = new Map<string, ScoreRecord[]>();
    for (const r of scores) {
      const list = scoresByStudentId.get(r.studentId) ?? [];
      list.push(r);
      scoresByStudentId.set(r.studentId, list);
    }

    const classAgg = new Map<
      string,
      { studentCount: number; lastActiveAt?: number; withScoreCount: number }
    >();

    for (const s of students) {
      const studentScores = scoresByStudentId.get(s.studentId) ?? [];
      const className = resolveStudentClassName(s, studentScores);

      const candidateTimes: number[] = [];
      if (typeof s.updatedAt === "number") candidateTimes.push(s.updatedAt);
      if (typeof s.createdAt === "number") candidateTimes.push(s.createdAt);
      for (const r of studentScores) {
        if (typeof r.createdAt === "number") candidateTimes.push(r.createdAt);
      }
      const lastActiveAt =
        candidateTimes.length > 0 ? Math.max(...candidateTimes) : undefined;

      const agg = classAgg.get(className) ?? {
        studentCount: 0,
        lastActiveAt: undefined,
        withScoreCount: 0,
      };

      agg.studentCount += 1;
      if (studentScores.length > 0) agg.withScoreCount += 1;
      if (typeof lastActiveAt === "number") {
        agg.lastActiveAt =
          typeof agg.lastActiveAt === "number"
            ? Math.max(agg.lastActiveAt, lastActiveAt)
            : lastActiveAt;
      }

      classAgg.set(className, agg);
    }

    return Array.from(classAgg.entries())
      .map(([className, agg]) => ({
        className,
        studentCount: agg.studentCount,
        lastActiveAt: agg.lastActiveAt,
        completionRate: agg.studentCount
          ? agg.withScoreCount / agg.studentCount
          : 0,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  } catch (err) {
    console.error("getClassesSummary failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};

// 学生档案页：该函数用于获取某个班级下的学生档案及成绩统计。
export const getStudentsByClass = async (
  className: string,
): Promise<StudentProfileWithStats[]> => {
  try {
    const target = className.trim() || "未分班";
    const students = await db.students.toArray();
    if (students.length === 0) return [];

    const studentIds = students.map((s) => s.studentId);
    const scores = await db.scores
      .where("studentId")
      .anyOf(studentIds)
      .toArray();

    const scoresByStudentId = new Map<string, ScoreRecord[]>();
    for (const r of scores) {
      const list = scoresByStudentId.get(r.studentId) ?? [];
      list.push(r);
      scoresByStudentId.set(r.studentId, list);
    }

    const result: StudentProfileWithStats[] = [];

    for (const s of students) {
      const studentScores = scoresByStudentId.get(s.studentId) ?? [];
      const resolvedClassName = resolveStudentClassName(s, studentScores);
      if (resolvedClassName !== target) continue;

      const examKeySet = new Set<string>();
      let sum = 0;
      let count = 0;
      let lastActiveAt: number | undefined = undefined;

      if (typeof s.updatedAt === "number") lastActiveAt = s.updatedAt;
      if (typeof s.createdAt === "number") {
        lastActiveAt =
          typeof lastActiveAt === "number"
            ? Math.max(lastActiveAt, s.createdAt)
            : s.createdAt;
      }

      for (const r of studentScores) {
        const examKey = (
          r.term ||
          r.category ||
          r.subject ||
          "未知考试"
        ).trim();
        examKeySet.add(examKey);
        sum += Number(r.score) || 0;
        count += 1;

        if (typeof r.createdAt === "number") {
          lastActiveAt =
            typeof lastActiveAt === "number"
              ? Math.max(lastActiveAt, r.createdAt)
              : r.createdAt;
        }
      }

      result.push({
        studentId: s.studentId,
        name: s.name,
        className: resolvedClassName,
        examCount: examKeySet.size,
        scoreCount: studentScores.length,
        averageScore: count ? sum / count : undefined,
        lastActiveAt,
      });
    }

    return result.sort((a, b) => a.studentId.localeCompare(b.studentId));
  } catch (err) {
    console.error("getStudentsByClass failed", err);
    throw new Error(toUserFriendlyError(err));
  }
};
