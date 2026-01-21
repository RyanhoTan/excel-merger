// src/hooks/useExcelProcessor.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  addScoreRecords,
  getAllStudentsWithScores,
  saveStudents,
  upsertFileMeta,
} from "../db/repository";
import type { Student } from "../models/student";
import type { ScoreRecord } from "../models/score";

export type ExcelValue = string | number | boolean | null | undefined;
export type ExcelRow = Record<string, ExcelValue>;

export type FileStatus = "success" | "error" | "pending";

export interface FileWithStatus {
  file: File;
  status: FileStatus;
}

export type SortOrder = "asc" | "desc";

export interface UseExcelProcessorState {
  files: FileWithStatus[];
  availableKeys: string[];
  isDedupEnabled: boolean;
  dedupKey: string;
  isSortEnabled: boolean;
  sortKey: string;
  sortOrder: SortOrder;
  previewData: ExcelRow[];
  loading: boolean;
  isDragging: boolean;
}

export interface UseExcelProcessorActions {
  addFiles: (newFiles: FileList | null) => Promise<void>;
  processData: () => Promise<ExcelRow[]>;
  handleMerge: () => Promise<void>;
  clearAll: () => void;
  removeFileAt: (index: number) => void;

  setIsDedupEnabled: (next: boolean) => void;
  setDedupKey: (next: string) => void;
  setIsSortEnabled: (next: boolean) => void;
  setSortKey: (next: string) => void;
  setSortOrder: (next: SortOrder) => void;

  setIsDragging: (next: boolean) => void;
}

export type UseExcelProcessorReturn = UseExcelProcessorState &
  UseExcelProcessorActions;

export const useExcelProcessor = (): UseExcelProcessorReturn => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);

  const [isDedupEnabled, setIsDedupEnabled] = useState<boolean>(true);
  const [dedupKey, setDedupKey] = useState<string>("");

  const [isSortEnabled, setIsSortEnabled] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileDataCacheRef = useRef<Map<string, ExcelRow[]>>(new Map());

  const hasUsableFiles = useMemo(
    () => files.some((f) => f.status === "success"),
    [files],
  );

  const ensureHeaderKeys = useCallback(
    (rows: ExcelRow[]) => {
      if (rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      if (keys.length === 0) return;

      setAvailableKeys(keys);
      setDedupKey((prev) => prev || keys[0]);
      setSortKey((prev) => prev || keys[0]);
    },
    [setAvailableKeys, setDedupKey, setSortKey],
  );

  const parseExcelFile = useCallback(
    async (file: File): Promise<ExcelRow[]> => {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);
    },
    [],
  );

  const pickFirstKeyMatch = useCallback(
    (row: ExcelRow, candidates: string[]) => {
      for (const key of candidates) {
        const v = row[key];
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }
      return "";
    },
    [],
  );

  const pickFirstNumberMatch = useCallback(
    (row: ExcelRow, candidates: string[]) => {
      for (const key of candidates) {
        const v = row[key];
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const n = Number(v);
          if (!Number.isNaN(n)) return n;
        }
      }
      return NaN;
    },
    [],
  );

  const addFiles = useCallback(
    async (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return;

      const fileArray = Array.from(newFiles);
      const newFilesWithStatus: FileWithStatus[] = fileArray.map((file) => ({
        file,
        status: "pending",
      }));

      const filesToAdd: FileWithStatus[] = [];
      for (const fws of newFilesWithStatus) {
        const isDuplicate = files.some((f) => f.file.name === fws.file.name);
        if (isDuplicate) {
          if (
            window.confirm(`检测到同名文件：${fws.file.name}，是否继续添加？`)
          ) {
            filesToAdd.push(fws);
          }
        } else {
          filesToAdd.push(fws);
        }
      }

      if (filesToAdd.length === 0) return;

      setFiles((prev) => [...prev, ...filesToAdd]);

      for (const fws of filesToAdd) {
        try {
          void upsertFileMeta({
            name: fws.file.name,
            size: fws.file.size,
            lastModified: fws.file.lastModified,
          });

          const rows = await parseExcelFile(fws.file);
          fileDataCacheRef.current.set(fws.file.name, rows);
          ensureHeaderKeys(rows);

          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fws.file.name ? { ...f, status: "success" } : f,
            ),
          );
        } catch (err) {
          console.error("解析文件失败", err);
          fileDataCacheRef.current.delete(fws.file.name);

          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fws.file.name ? { ...f, status: "error" } : f,
            ),
          );
        }
      }
    },
    [ensureHeaderKeys, files, parseExcelFile],
  );

  const processData = useCallback(async (): Promise<ExcelRow[]> => {
    let allData: ExcelRow[] = [];

    for (const fws of files) {
      if (fws.status !== "success") continue;

      const cached = fileDataCacheRef.current.get(fws.file.name);
      if (cached) {
        allData = [...allData, ...cached];
        continue;
      }

      try {
        const rows = await parseExcelFile(fws.file);
        fileDataCacheRef.current.set(fws.file.name, rows);
        allData = [...allData, ...rows];
      } catch {
        // ignore
      }
    }

    let finalData = allData;

    if (isDedupEnabled) {
      const uniqueDataMap = new Map<string | number, ExcelRow>();
      finalData.forEach((row) => {
        const key =
          dedupKey && row[dedupKey] != null
            ? row[dedupKey]
            : JSON.stringify(row);
        uniqueDataMap.set(key as string | number, row);
      });
      finalData = Array.from(uniqueDataMap.values());
    }

    if (isSortEnabled && sortKey) {
      finalData.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortOrder === "asc" ? 1 : -1;
        if (bVal == null) return sortOrder === "asc" ? -1 : 1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        const comparison = aStr.localeCompare(bStr, "zh-CN", { numeric: true });
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    setPreviewData(finalData.slice(0, 50));
    return finalData;
  }, [
    dedupKey,
    files,
    isDedupEnabled,
    isSortEnabled,
    parseExcelFile,
    sortKey,
    sortOrder,
  ]);

  const handleMerge = useCallback(async () => {
    if (!hasUsableFiles) return;

    setLoading(true);
    try {
      const finalData = await processData();

      // Persist to IndexedDB (best-effort, do not block export on DB failure)
      try {
        const studentIdCandidates = [
          "studentId",
          "学号",
          "学号/班级ID",
          "id",
          "ID",
        ];
        const nameCandidates = ["name", "姓名", "学生姓名"];
        const subjectCandidates = ["subject", "科目"];
        const termCandidates = ["term", "学期"];
        const categoryCandidates = ["category", "考试类型", "类型"];
        const scoreCandidates = ["score", "成绩", "分数"];

        const studentsMap = new Map<string, Student>();
        const scoreRecords: ScoreRecord[] = [];

        for (const row of finalData) {
          const studentId = pickFirstKeyMatch(row, studentIdCandidates);
          if (!studentId) continue;

          const name = pickFirstKeyMatch(row, nameCandidates);
          const subject = pickFirstKeyMatch(row, subjectCandidates) || "";
          const term = pickFirstKeyMatch(row, termCandidates) || "";
          const category = pickFirstKeyMatch(row, categoryCandidates) || "";
          const score = pickFirstNumberMatch(row, scoreCandidates);

          if (!studentsMap.has(studentId)) {
            studentsMap.set(studentId, {
              studentId,
              name,
            });
          } else if (name) {
            const existing = studentsMap.get(studentId);
            if (existing && !existing.name) {
              studentsMap.set(studentId, { ...existing, name });
            }
          }

          if (!Number.isNaN(score)) {
            scoreRecords.push({
              studentId,
              subject,
              term,
              category,
              score,
              raw: row as unknown as Record<string, unknown>,
            });
          }
        }

        await saveStudents(Array.from(studentsMap.values()));
        await addScoreRecords(scoreRecords);
      } catch (err) {
        console.error("IndexedDB persist failed", err);
      }

      const newSheet = XLSX.utils.json_to_sheet(finalData);
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Result");
      XLSX.writeFile(newWorkbook, `merged_${Date.now()}.xlsx`);
    } catch (err) {
      alert(`失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [hasUsableFiles, pickFirstKeyMatch, pickFirstNumberMatch, processData]);

  const clearAll = useCallback(() => {
    setFiles([]);
    setAvailableKeys([]);
    setPreviewData([]);

    setIsDedupEnabled(true);
    setDedupKey("");

    setIsSortEnabled(false);
    setSortKey("");
    setSortOrder("asc");

    fileDataCacheRef.current.clear();
  }, []);

  const removeFileAt = useCallback((index: number) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target) fileDataCacheRef.current.delete(target.file.name);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  useEffect(() => {
    if (!hasUsableFiles) return;
    void processData();
  }, [hasUsableFiles, processData]);

  useEffect(() => {
    let cancelled = false;

    const restoreFromDb = async () => {
      try {
        const studentsWithScores = await getAllStudentsWithScores();
        if (cancelled) return;

        const restoredRows: ExcelRow[] = [];

        for (const s of studentsWithScores) {
          if (s.scores.length === 0) {
            restoredRows.push({
              studentId: s.studentId,
              name: s.name,
            });
            continue;
          }

          for (const score of s.scores) {
            restoredRows.push({
              studentId: s.studentId,
              name: s.name,
              subject: score.subject,
              term: score.term,
              category: score.category,
              score: score.score,
            });
          }
        }

        setPreviewData(restoredRows.slice(0, 50));
        if (restoredRows.length > 0) ensureHeaderKeys(restoredRows);
      } catch (err) {
        console.error("restoreFromDb failed", err);
      }
    };

    void restoreFromDb();

    return () => {
      cancelled = true;
    };
  }, [ensureHeaderKeys]);

  return {
    files,
    availableKeys,
    isDedupEnabled,
    dedupKey,
    isSortEnabled,
    sortKey,
    sortOrder,
    previewData,
    loading,
    isDragging,

    addFiles,
    processData,
    handleMerge,
    clearAll,
    removeFileAt,

    setIsDedupEnabled,
    setDedupKey,
    setIsSortEnabled,
    setSortKey,
    setSortOrder,

    setIsDragging,
  };
};
