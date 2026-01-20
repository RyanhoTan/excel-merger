// src/views/Merging/components/ConfigPanel.tsx

import type { FC } from "react";

export interface ConfigPanelProps {
  availableKeys: string[];

  isDedupEnabled: boolean;
  dedupKey: string;
  setIsDedupEnabled: (next: boolean) => void;
  setDedupKey: (next: string) => void;

  isSortEnabled: boolean;
  sortKey: string;
  sortOrder: "asc" | "desc";
  setIsSortEnabled: (next: boolean) => void;
  setSortKey: (next: string) => void;
  setSortOrder: (next: "asc" | "desc") => void;
}

const ConfigPanel: FC<ConfigPanelProps> = ({
  availableKeys,
  isDedupEnabled,
  dedupKey,
  setIsDedupEnabled,
  setDedupKey,
  isSortEnabled,
  sortKey,
  sortOrder,
  setIsSortEnabled,
  setSortKey,
  setSortOrder,
}) => {
  return (
    <div>
      <h2 className="section-title">处理选项</h2>

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
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">↑ 升序</option>
                <option value="desc">↓ 降序</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
