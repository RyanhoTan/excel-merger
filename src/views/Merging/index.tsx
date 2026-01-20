// src/views/Merging/index.tsx

import type { FC } from "react";

import { useExcelProcessor } from "../../hooks/useExcelProcessor";
import ConfigPanel from "./components/ConfigPanel";
import Dropzone from "./components/Dropzone";
import FileGrid from "./components/FileGrid";
import PreviewTable from "./components/PreviewTable";

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
    clearAll,
    removeFileAt,

    setIsDedupEnabled,
    setDedupKey,
    setIsSortEnabled,
    setSortKey,
    setSortOrder,
    setIsDragging,
  } = useExcelProcessor();

  return (
    <div className="app-shell">
      <aside className="control-hub">
        <div className="control-hub__card">
          <div className="brand">
            <h1 className="brand__title">Excel Merger</h1>
            <p className="brand__subtitle">轻量级表格合并工具</p>
          </div>

          <ConfigPanel
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

      <main className="content">
        <div className="content__inner">
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
        </div>
      </main>
    </div>
  );
};

export default MergingPage;
