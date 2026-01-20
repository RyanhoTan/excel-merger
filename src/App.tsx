import { useState } from "react";
// 正确引入类型
import type { FC, DragEvent, ChangeEvent } from "react";
import { AlertCircle, Check, File, Loader2, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

type ExcelValue = string | number | boolean | null | undefined;
type ExcelRow = Record<string, ExcelValue>;

type FileStatus = "success" | "error" | "pending";

interface FileWithStatus {
  file: File;
  status: FileStatus;
}

const App: FC = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDedupEnabled, setIsDedupEnabled] = useState<boolean>(true);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]); // 新增：存储表头
  const [dedupKey, setDedupKey] = useState<string>(""); // 修改：初始值设为空
  const [isSortEnabled, setIsSortEnabled] = useState<boolean>(false); // 排序开关
  const [sortKey, setSortKey] = useState<string>(""); // 排序依据列
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // 排序方式

  // --- 1. 使用 ChangeEvent ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const addFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    const fileArray = Array.from(newFiles);
    const newFilesWithStatus: FileWithStatus[] = fileArray.map((file) => ({
      file,
      status: "pending" as FileStatus,
    }));

    // 检查重复
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

    if (filesToAdd.length > 0) {
      setFiles((prev) => [...prev, ...filesToAdd]);

      // 异步解析文件
      for (const fws of filesToAdd) {
        try {
          const buffer = await fws.file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const sheetData =
            XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

          if (sheetData.length > 0) {
            const keys = Object.keys(sheetData[0]);
            setAvailableKeys(keys);
            if (!dedupKey) setDedupKey(keys[0]);
            if (!sortKey) setSortKey(keys[0]);
          }

          // 更新状态为成功
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fws.file.name ? { ...f, status: "success" } : f,
            ),
          );
        } catch (err) {
          console.error("解析文件失败", err);
          // 更新状态为错误
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fws.file.name ? { ...f, status: "error" } : f,
            ),
          );
        }
      }
    }

    // 重置 input
    const input = document.getElementById("fileInput") as HTMLInputElement;
    if (input) input.value = "";
  };

  // --- 2. 使用 DragEvent ---
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleMerge = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      let allData: ExcelRow[] = [];
      for (const fws of files) {
        if (fws.status !== "success") continue;
        const data = await fws.file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        allData = [...allData, ...jsonData];
      }

      let finalData = allData;
      if (isDedupEnabled) {
        const uniqueDataMap = new Map<string | number, ExcelRow>();
        allData.forEach((row) => {
          const keyVal = row[dedupKey] ?? JSON.stringify(row);
          uniqueDataMap.set(keyVal as string | number, row);
        });
        finalData = Array.from(uniqueDataMap.values());
      }

      // 排序功能
      if (isSortEnabled && sortKey) {
        finalData.sort((a, b) => {
          const aVal = a[sortKey];
          const bVal = b[sortKey];

          // 处理空值
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sortOrder === "asc" ? 1 : -1;
          if (bVal == null) return sortOrder === "asc" ? -1 : 1;

          // 数值比较
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
          }

          // 字符串比较
          const aStr = String(aVal);
          const bStr = String(bVal);
          const comparison = aStr.localeCompare(bStr, "zh-CN", {
            numeric: true,
          });
          return sortOrder === "asc" ? comparison : -comparison;
        });
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
  };

  const hasUsableFiles = files.some((f) => f.status === "success");
  const useGridView = files.length > 4;

  return (
    <div className="app-shell">
      {/* 左侧配置栏 */}
      <aside className="control-hub">
        <div className="control-hub__card">
          {/* 标题 */}
          <div className="brand">
            <h1 className="brand__title">Excel Merger</h1>
            <p className="brand__subtitle">轻量级表格合并工具</p>
          </div>

          {/* 配置区 */}
          <div>
            <h2 className="section-title">处理选项</h2>

            {/* 去重配置 */}
            <div className={`panel ${isDedupEnabled ? "panel--active" : ""}`}>
              <div className="panel__header">
                <div className="panel__title">数据去重</div>
                <label className="toggle" aria-label="数据去重">
                  <input
                    className="toggle__input"
                    type="checkbox"
                    checked={isDedupEnabled}
                    onChange={(e) => setIsDedupEnabled(e.target.checked)}
                  />
                  <span className="toggle__track" />
                </label>
              </div>

              {isDedupEnabled && availableKeys.length > 0 && (
                <div className="panel__body">
                  <label className="field-label">依据列</label>
                  <select
                    className="select"
                    value={dedupKey}
                    onChange={(e) => setDedupKey(e.target.value)}
                  >
                    {availableKeys.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 排序配置 */}
            <div className={`panel ${isSortEnabled ? "panel--active" : ""}`}>
              <div className="panel__header">
                <div className="panel__title">数据排序</div>
                <label className="toggle" aria-label="数据排序">
                  <input
                    className="toggle__input"
                    type="checkbox"
                    checked={isSortEnabled}
                    onChange={(e) => setIsSortEnabled(e.target.checked)}
                  />
                  <span className="toggle__track" />
                </label>
              </div>

              {isSortEnabled && availableKeys.length > 0 && (
                <div className="panel__body">
                  <div style={{ marginBottom: "10px" }}>
                    <label className="field-label">依据列</label>
                    <select
                      className="select"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value)}
                    >
                      {availableKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">排序方式</label>
                    <select
                      className="select"
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                    >
                      <option value="asc">↑ 升序</option>
                      <option value="desc">↓ 降序</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="content">
        <div className="content__inner">
          {/* 拖拽上传区 - 根据是否有文件动态调整大小 */}
          <div
            className={`dropzone ${files.length > 0 ? "dropzone--compact" : ""}`}
            data-dragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <div className="dropzone__icon" aria-hidden="true">
              <Upload size={18} strokeWidth={1.6} />
            </div>

            <h3 className="dropzone__title">
              {isDragging
                ? "释放以上传文件"
                : files.length > 0
                  ? "继续添加文件"
                  : "拖拽文件至此"}
            </h3>
            <p className="dropzone__hint">
              {files.length === 0
                ? "支持 .xlsx 和 .xls 格式"
                : "点击或拖拽以继续添加"}
            </p>

            <input
              id="fileInput"
              type="file"
              multiple
              accept=".xlsx,.xls"
              hidden
              onChange={handleInputChange}
            />
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div>
              <div className="file-header">
                <h3 className="file-header__title">
                  文件列表
                  <span className="file-header__count">
                    {files.length} 个文件
                  </span>
                </h3>
              </div>

              {useGridView ? (
                <div className="file-grid">
                  {files.map((fws, i) => (
                    <div
                      key={i}
                      className={`file-item file-card ${
                        fws.status === "error" ? "file-item--error" : ""
                      }`}
                    >
                      <div className="file-main">
                        <div className="file-leading" aria-hidden="true">
                          {fws.status === "pending" ? (
                            <Loader2
                              className="lucide--spin"
                              size={16}
                              strokeWidth={1.6}
                            />
                          ) : fws.status === "error" ? (
                            <AlertCircle size={16} strokeWidth={1.6} />
                          ) : (
                            <File size={16} strokeWidth={1.6} />
                          )}
                        </div>

                        <div className="file-text">
                          <div className="file-name" title={fws.file.name}>
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {fws.file.name}
                            </span>
                            {fws.status === "success" && (
                              <Check
                                className="check"
                                size={14}
                                strokeWidth={2}
                              />
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
                            setFiles((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          }}
                          aria-label="移除文件"
                          type="button"
                        >
                          <X size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="file-surface">
                  {files.map((fws, i) => (
                    <div
                      key={i}
                      className={`file-item file-row ${
                        fws.status === "error" ? "file-item--error" : ""
                      }`}
                    >
                      <div className="file-main">
                        <div className="file-leading" aria-hidden="true">
                          {fws.status === "pending" ? (
                            <Loader2
                              className="lucide--spin"
                              size={16}
                              strokeWidth={1.6}
                            />
                          ) : fws.status === "error" ? (
                            <AlertCircle size={16} strokeWidth={1.6} />
                          ) : (
                            <File size={16} strokeWidth={1.6} />
                          )}
                        </div>

                        <div className="file-text">
                          <div className="file-name" title={fws.file.name}>
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {fws.file.name}
                            </span>
                            {fws.status === "success" && (
                              <Check
                                className="check"
                                size={14}
                                strokeWidth={2}
                              />
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
                            setFiles((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          }}
                          aria-label="移除文件"
                          type="button"
                        >
                          <X size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 合并按钮 */}
              <button
                className="btn btn--primary"
                onClick={handleMerge}
                disabled={loading || !hasUsableFiles}
                data-loading={loading}
                type="button"
              >
                <span className="btn__inner">
                  <span
                    className="btn__label"
                    style={{ opacity: loading ? 0 : 1 }}
                  >
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
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
