// src/views/Merging/components/FileGrid.tsx

import { AlertCircle, Check, File, Loader2, Trash2, X } from "lucide-react";
import type { FC } from "react";
import type { FileWithStatus } from "../../../hooks/useExcelProcessor";

import buttonStyles from "../../../components/ui/Button.module.css";
import iconButtonStyles from "../../../components/ui/IconButton.module.css";
import styles from "./FileGrid.module.css";

export interface FileGridProps {
  files: FileWithStatus[];
  loading: boolean;
  onMerge: () => void;
  onClearAll: () => void;
  onRemoveFileAt: (index: number) => void;
}

const FileGrid: FC<FileGridProps> = ({
  files,
  loading,
  onMerge,
  onClearAll,
  onRemoveFileAt,
}) => {
  const hasUsableFiles = files.some((f) => f.status === "success");
  const useGridView = files.length > 4;

  if (files.length === 0) return null;

  const renderLeading = (status: FileWithStatus["status"]) => {
    if (status === "pending") {
      return (
        <Loader2 className={styles.lucideSpin} size={16} strokeWidth={1.6} />
      );
    }

    if (status === "error") {
      return <AlertCircle size={16} strokeWidth={1.6} />;
    }

    return <File size={16} strokeWidth={1.6} />;
  };

  const renderItem = (fws: FileWithStatus, i: number) => {
    return (
      <div
        key={`${fws.file.name}-${i}`}
        className={`${styles.fileItem} ${
          useGridView ? styles.fileCard : styles.fileRow
        } ${fws.status === "error" ? styles.fileItemError : ""}`}
      >
        <div className={styles.fileMain}>
          <div className={styles.fileLeading} aria-hidden="true">
            {renderLeading(fws.status)}
          </div>

          <div className={styles.fileText}>
            <div className={styles.fileName} title={fws.file.name}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {fws.file.name}
              </span>
              {fws.status === "success" && (
                <Check className={styles.check} size={14} strokeWidth={2} />
              )}
            </div>
            <div className={styles.fileMeta}>
              <span>{(fws.file.size / 1024).toFixed(1)} KB</span>
              <span>·</span>
              <span
                className={`${styles.statusText} ${
                  fws.status === "error"
                    ? styles.statusError
                    : fws.status === "pending"
                      ? styles.statusPending
                      : styles.statusSuccess
                }`}
              >
                {fws.status === "error"
                  ? "解析失败"
                  : fws.status === "pending"
                    ? "解析中..."
                    : "就绪"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.fileActions}>
          <button
            className={`${iconButtonStyles.iconButton} ${iconButtonStyles.iconButtonDanger}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFileAt(i);
            }}
            aria-label="移除文件"
            type="button"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.fileHeader}>
        <h3 className={styles.fileHeaderTitle}>
          文件列表
          <span className={styles.fileHeaderCount}>{files.length} 个文件</span>
        </h3>

        <button
          className={iconButtonStyles.iconButton}
          type="button"
          onClick={onClearAll}
          aria-label="清空列表"
          title="清空"
        >
          <Trash2 size={16} strokeWidth={1.6} />
        </button>
      </div>

      {useGridView ? (
        <div className={styles.fileGrid}>{files.map(renderItem)}</div>
      ) : (
        <div className={styles.fileSurface}>{files.map(renderItem)}</div>
      )}

      <button
        className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
        onClick={onMerge}
        disabled={loading || !hasUsableFiles}
        type="button"
      >
        <span className={buttonStyles.btnInner}>
          <span
            className={buttonStyles.btnLabel}
            style={{ opacity: loading ? 0 : 1 }}
          >
            合并并导出
          </span>
        </span>
        {loading && (
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
  );
};

export default FileGrid;
