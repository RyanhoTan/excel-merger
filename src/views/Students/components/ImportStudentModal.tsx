// src/views/Students/components/ImportStudentModal.tsx（学生档案页 / 班级列表：Excel 批量导入弹窗）

import type { ChangeEvent, DragEvent, FC } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  importStudentsFromExcel,
  type ImportStudentsResult,
} from "@/db/repository";

import buttonStyles from "@/components/ui/Button.module.css";
import iconButtonStyles from "@/components/ui/IconButton.module.css";
import styles from "../Students.module.css";

export interface ImportStudentModalProps {
  // 学生档案页：是否打开导入弹窗。
  open: boolean;
  // 学生档案页：关闭弹窗回调。
  onClose: () => void;
  // 学生档案页：导入成功回调（onSuccess 用于导入成功后的列表刷新回调）。
  onSuccess: (result: ImportStudentsResult) => void;
}

type PreviewRow = {
  index: number;
  studentId: string;
  name: string;
  gender: string;
  className: string;
  missingClass: boolean;
  errors: string[];
};

const ImportStudentModal: FC<ImportStudentModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  // 学生档案页：拖拽态（用于 dropzone 高亮）。
  const [isDragging, setIsDragging] = useState(false);
  // 学生档案页：解析状态（用于展示“解析中…”）。
  const [parsing, setParsing] = useState(false);
  // 学生档案页：预检数据（用于渲染预览表格 + 高亮错误）。
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  // 学生档案页：用于最终写库的标准化数据（表头统一为 studentId/name/gender/className）。
  const [normalizedData, setNormalizedData] = useState<
    Array<{
      studentId: string;
      name: string;
      gender?: string;
      className?: string;
    }>
  >([]);
  // 学生档案页：导入中态（用于禁用确认按钮）。
  const [importing, setImporting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setIsDragging(false);
    setParsing(false);
    setPreview([]);
    setNormalizedData([]);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickFirst = useCallback(
    (row: Record<string, unknown>, keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v == null) continue;
        const s = String(v).trim();
        if (s !== "") return s;
      }
      return "";
    },
    [],
  );

  // 学生档案页：解析 Excel 数据流（File -> ArrayBuffer -> xlsx -> JSON rows）。
  const parseExcelFile = useCallback(
    async (file: File) => {
      setParsing(true);
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          setPreview([]);
          setNormalizedData([]);
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        }) as Record<string, unknown>[];

        const nextPreview: PreviewRow[] = [];
        const nextNormalized: Array<{
          studentId: string;
          name: string;
          gender?: string;
          className?: string;
        }> = [];

        rawRows.forEach((row, i) => {
          const studentId = pickFirst(row, [
            "studentId",
            "学号",
            "id",
            "ID",
            "学号/ID",
          ]);
          const name = pickFirst(row, ["name", "姓名", "学生姓名"]);
          const gender = pickFirst(row, ["gender", "性别"]);
          const classNameRaw = pickFirst(row, [
            "className",
            "class",
            "Class",
            "班级",
            "班级名称",
            "班级名",
            "年级班级",
          ]);
          const className = classNameRaw || "未分班";

          const errors: string[] = [];
          if (!studentId) errors.push("学号不能为空");
          if (!name) errors.push("姓名不能为空");

          const missingClass = !classNameRaw;

          nextPreview.push({
            index: i + 2,
            studentId,
            name,
            gender,
            className,
            missingClass,
            errors,
          });

          nextNormalized.push({
            studentId,
            name,
            gender: gender || undefined,
            className: className || undefined,
          });
        });

        setPreview(nextPreview);
        setNormalizedData(nextNormalized);
      } catch (err) {
        console.error("[Students] parse excel failed", err);
        setPreview([]);
        setNormalizedData([]);
      } finally {
        setParsing(false);
      }
    },
    [pickFirst],
  );

  const stats = useMemo(() => {
    const invalid = preview.filter((r) => r.errors.length > 0).length;
    const missingClassCount = preview.filter((r) => r.missingClass).length;
    return {
      total: preview.length,
      invalid,
      valid: Math.max(0, preview.length - invalid),
      missingClassCount,
    };
  }, [preview]);

  const validNormalized = useMemo(() => {
    return normalizedData.filter((r) => r.studentId.trim() && r.name.trim());
  }, [normalizedData]);

  const downloadTemplate = useCallback(() => {
    // 学生档案页：导入模板（Import Template）- 规范表头字段，降低解析错误率。
    const headers = [["studentId", "name", "gender", "className"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_import_template.xlsx");
  }, []);

  const handleInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await parseExcelFile(file);
    },
    [parseExcelFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      await parseExcelFile(file);
    },
    [parseExcelFile],
  );

  const handleConfirmImport = useCallback(async () => {
    if (validNormalized.length === 0) return;
    setImporting(true);
    try {
      const result = await importStudentsFromExcel(validNormalized);
      onSuccess(result);
      resetState();
      onClose();
    } catch (err) {
      alert(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  }, [onClose, onSuccess, resetState, validNormalized]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="导入学生名单"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          resetState();
          onClose();
        }
      }}
    >
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FileSpreadsheet size={16} />
            <span>导入学生名单</span>
          </div>

          <button
            className={iconButtonStyles.iconButton}
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            aria-label="关闭"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div
            className={styles.importDropzone}
            data-dragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className={styles.importDropzoneIcon} aria-hidden>
              <Upload size={18} strokeWidth={1.6} />
            </div>
            <div className={styles.importDropzoneTitle}>
              {isDragging ? "释放以上传" : "拖拽 .xlsx 文件到这里"}
            </div>
            <div className={styles.importDropzoneHint}>
              支持点击选择文件；导入前会先进行预检
            </div>

            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.importToolbar}>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={downloadTemplate}
            >
              <Download size={14} />
              下载标准 Excel 模板
            </button>

            {stats.missingClassCount > 0 && (
              <div className={styles.importWarn}>
                <span className={styles.dotDanger} aria-hidden />有{" "}
                {stats.missingClassCount} 行未填写班级，将归入“未分班”
              </div>
            )}
          </div>

          <div className={styles.importPreviewCard}>
            <div className={styles.importPreviewHeader}>
              <div className={styles.importPreviewTitle}>预检视图</div>
              <div className={styles.importPreviewMeta}>
                {parsing
                  ? "解析中…"
                  : stats.total === 0
                    ? "请先上传文件"
                    : `共 ${stats.total} 行，合法 ${stats.valid} 行，错误 ${stats.invalid} 行`}
              </div>
            </div>

            {stats.total > 0 && !parsing ? (
              <div className={styles.tableScroll}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th className={styles.th}>行号</th>
                      <th className={styles.th}>学号*</th>
                      <th className={styles.th}>姓名*</th>
                      <th className={styles.th}>性别</th>
                      <th className={styles.th}>班级</th>
                      <th className={styles.th}>问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r) => (
                      <tr
                        key={`${r.index}-${r.studentId}-${r.name}`}
                        className={`${styles.tr} ${
                          r.errors.length > 0 ? styles.trDanger : ""
                        }`}
                      >
                        <td className={styles.td}>{r.index}</td>
                        <td
                          className={`${styles.td} ${
                            !r.studentId ? styles.tdDanger : ""
                          }`}
                        >
                          {r.studentId || "—"}
                        </td>
                        <td
                          className={`${styles.td} ${
                            !r.name ? styles.tdDanger : ""
                          }`}
                        >
                          {r.name || "—"}
                        </td>
                        <td className={styles.td}>{r.gender || "—"}</td>
                        <td className={styles.td}>
                          {r.missingClass && (
                            <span className={styles.dotDanger} aria-hidden />
                          )}
                          {r.className}
                        </td>
                        <td className={styles.td}>
                          {r.errors.length > 0 ? (
                            <span className={styles.badgeDanger}>
                              <AlertTriangle size={14} />
                              {r.errors[0]}
                            </span>
                          ) : (
                            <span className={styles.badgeOk}>OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.importPreviewEmpty}>
                {parsing ? "正在解析文件…" : "上传文件后将在此处展示预检结果"}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            取消
          </button>

          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.btnInline}`}
            disabled={importing || parsing || validNormalized.length === 0}
            onClick={() => void handleConfirmImport()}
          >
            <span className={buttonStyles.btnInner}>
              <span
                className={buttonStyles.btnLabel}
                style={{ opacity: importing ? 0 : 1 }}
              >
                确认导入（{validNormalized.length}）
              </span>
            </span>
            {importing && (
              <span className={buttonStyles.btnLoading} aria-hidden="true">
                <span className={buttonStyles.loadingDots}>
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentModal;
