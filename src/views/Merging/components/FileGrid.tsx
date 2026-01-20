// src/views/Merging/components/FileGrid.tsx

import { AlertCircle, Check, File, Loader2, Trash2, X } from "lucide-react";
import type { FC } from "react";
import type { FileWithStatus } from "../../../hooks/useExcelProcessor";

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
      return <Loader2 className="lucide--spin" size={16} strokeWidth={1.6} />;
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
        className={`file-item ${useGridView ? "file-card" : "file-row"} ${
          fws.status === "error" ? "file-item--error" : ""
        }`}
      >
        <div className="file-main">
          <div className="file-leading" aria-hidden="true">
            {renderLeading(fws.status)}
          </div>

          <div className="file-text">
            <div className="file-name" title={fws.file.name}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {fws.file.name}
              </span>
              {fws.status === "success" && (
                <Check className="check" size={14} strokeWidth={2} />
              )}
            </div>
            <div className="file-meta">
              <span>{(fws.file.size / 1024).toFixed(1)} KB</span>
              <span>·</span>
              <span
                className={`status-text ${
                  fws.status === "error"
                    ? "status-text--error"
                    : fws.status === "pending"
                      ? "status-text--pending"
                      : "status-text--success"
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

        <div className="file-actions">
          <button
            className="icon-button icon-button--danger"
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
      <div className="file-header">
        <h3 className="file-header__title">
          文件列表
          <span className="file-header__count">{files.length} 个文件</span>
        </h3>

        <button
          className="icon-button"
          type="button"
          onClick={onClearAll}
          aria-label="清空列表"
          title="清空"
        >
          <Trash2 size={16} strokeWidth={1.6} />
        </button>
      </div>

      {useGridView ? (
        <div className="file-grid">{files.map(renderItem)}</div>
      ) : (
        <div className="file-surface">{files.map(renderItem)}</div>
      )}

      <button
        className="btn btn--primary"
        onClick={onMerge}
        disabled={loading || !hasUsableFiles}
        type="button"
      >
        <span className="btn__inner">
          <span className="btn__label" style={{ opacity: loading ? 0 : 1 }}>
            合并并导出
          </span>
        </span>
        {loading && (
          <span className="btn__loading" aria-hidden="true">
            <span className="loading-dots">
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
