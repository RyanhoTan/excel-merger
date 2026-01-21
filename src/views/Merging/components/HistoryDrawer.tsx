// src/views/Merging/components/HistoryDrawer.tsx

import type { FC } from "react";
import { Download, Eye, History, RefreshCcw, Trash2, X } from "lucide-react";

import type { MergeHistoryRecord } from "../../../db/index";

export interface HistoryDrawerProps {
  // Whether the history drawer is visible on the Merging page.
  open: boolean;
  // Loading state for fetching history list.
  loading: boolean;
  // Merge history records to render.
  items: MergeHistoryRecord[];
  // Close the drawer.
  onClose: () => void;
  // Refresh the history list.
  onRefresh: () => void;
  // Preview a selected history record by restoring its snapshot to the main preview table.
  onPreview: (item: MergeHistoryRecord) => void;
  // Re-download Excel based on a selected history record snapshot.
  onRedownload: (item: MergeHistoryRecord) => void;
  // Delete a selected history record.
  onDelete: (id: number) => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const HistoryDrawer: FC<HistoryDrawerProps> = ({
  open,
  loading,
  items,
  onClose,
  onRefresh,
  onPreview,
  onRedownload,
  onDelete,
}) => {
  if (!open) return null;

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="合并历史记录"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <div className="drawer__title">
            <History size={16} />
            <span>历史记录</span>
          </div>

          <div className="drawer__header-actions">
            <button
              className="icon-button"
              type="button"
              onClick={onRefresh}
              aria-label="刷新"
              title="刷新"
            >
              <RefreshCcw size={16} />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={onClose}
              aria-label="关闭"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="drawer__body">
          {loading ? (
            <div className="drawer__empty">加载中…</div>
          ) : items.length === 0 ? (
            <div className="drawer__empty">暂无历史记录</div>
          ) : (
            <div className="history-list">
              {items.map((item) => (
                <div key={item.id ?? item.timestamp} className="history-item">
                  <div className="history-item__meta">
                    <div className="history-item__time">
                      {formatDateTime(item.timestamp)}
                    </div>
                    <div className="history-item__sub">
                      {item.fileCount} 个文件 · {item.studentCount} 名学生 ·{" "}
                      {item.operator || "老师"}
                    </div>
                  </div>

                  <div className="history-item__actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onPreview(item)}
                      aria-label="预览"
                      title="预览"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onRedownload(item)}
                      aria-label="重新下载"
                      title="重新下载"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => {
                        if (!item.id) return;
                        if (window.confirm("确认删除该条历史记录？"))
                          onDelete(item.id);
                      }}
                      disabled={!item.id}
                      aria-label="删除"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default HistoryDrawer;
