// src/views/Merging/index.tsx

import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";

import { useExcelProcessor } from "@/hooks/useExcelProcessor";
import { deleteMergeTask, getHistoryList } from "@/db/repository";
import type { MergeHistoryRecord } from "@/db/index";
import ConfigPanel from "./components/ConfigPanel";
import Dropzone from "./components/Dropzone";
import FileGrid from "./components/FileGrid";
import HistoryDrawer from "./components/HistoryDrawer";
import PreviewTable from "./components/PreviewTable";

import iconButtonStyles from "@/components/ui/IconButton.module.css";
import styles from "./MergingPage.module.css";

const MergingPage: FC = () => {
  const {
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
    handleMerge,
    restoreFromSnapshot,
    exportRowsToExcel,
    clearAll,
    removeFileAt,

    setIsDedupEnabled,
    setDedupKey,
    setIsSortEnabled,
    setSortKey,
    setSortOrder,
    setIsDragging,
  } = useExcelProcessor();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<MergeHistoryRecord[]>([]);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const items = await getHistoryList();
      setHistoryItems(items);
    } catch (err) {
      alert(
        `获取历史记录失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    void refreshHistory();
  }, [historyOpen, refreshHistory]);

  const handlePreviewHistory = useCallback(
    (item: MergeHistoryRecord) => {
      const rows = item.snapshot as unknown as Record<string, unknown>[];
      restoreFromSnapshot(rows, item.headerKeys);
      setHistoryOpen(false);
    },
    [restoreFromSnapshot],
  );

  const handleRedownloadHistory = useCallback(
    (item: MergeHistoryRecord) => {
      exportRowsToExcel(
        item.snapshot,
        item.fileName || `history_${item.timestamp}.xlsx`,
      );
    },
    [exportRowsToExcel],
  );

  const handleDeleteHistory = useCallback(
    async (id: number) => {
      try {
        await deleteMergeTask(id);
        await refreshHistory();
      } catch (err) {
        alert(`删除失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [refreshHistory],
  );

  return (
    <div className={styles.mergingLayout}>
      <aside className={styles.mergingPanel} aria-label="合并配置">
        <div className={styles.mergingPanelCard}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>数据合并</h1>
            <p className={styles.brandSubtitle}>
              上传 Excel，去重/排序，并自动写入历史
            </p>
          </div>

          <ConfigPanel
            headerAction={
              <button
                className={iconButtonStyles.iconButton}
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label="历史记录"
                title="历史记录"
              >
                <History size={16} />
              </button>
            }
            availableKeys={availableKeys}
            isDedupEnabled={isDedupEnabled}
            dedupKey={dedupKey}
            setIsDedupEnabled={setIsDedupEnabled}
            setDedupKey={setDedupKey}
            isSortEnabled={isSortEnabled}
            sortKey={sortKey}
            sortOrder={sortOrder}
            setIsSortEnabled={setIsSortEnabled}
            setSortKey={setSortKey}
            setSortOrder={setSortOrder}
          />
        </div>
      </aside>

      <HistoryDrawer
        open={historyOpen}
        loading={historyLoading}
        items={historyItems}
        onClose={() => setHistoryOpen(false)}
        onRefresh={refreshHistory}
        onPreview={handlePreviewHistory}
        onRedownload={handleRedownloadHistory}
        onDelete={handleDeleteHistory}
      />

      <main className={styles.mergingWork} aria-label="合并工作区">
        <Dropzone
          filesCount={files.length}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          addFiles={addFiles}
        />

        <FileGrid
          files={files}
          loading={loading}
          onMerge={handleMerge}
          onClearAll={clearAll}
          onRemoveFileAt={removeFileAt}
        />

        <PreviewTable previewData={previewData} />
      </main>
    </div>
  );
};

export default MergingPage;
