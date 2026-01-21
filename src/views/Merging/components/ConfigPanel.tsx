// src/views/Merging/components/ConfigPanel.tsx

import type { FC, ReactNode } from "react";

import styles from "./ConfigPanel.module.css";

export interface ConfigPanelProps {
  // Optional action area rendered at the top-right of the panel header.
  headerAction?: ReactNode;
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
  headerAction,
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
          处理选项
        </h2>
        {headerAction}
      </div>

      <div
        className={`${styles.panel} ${isDedupEnabled ? styles.panelActive : ""}`}
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>数据去重</div>
          <label className={styles.toggle} aria-label="数据去重">
            <input
              className={styles.toggleInput}
              type="checkbox"
              checked={isDedupEnabled}
              onChange={(e) => setIsDedupEnabled(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        {isDedupEnabled && availableKeys.length > 0 && (
          <div className={styles.panelBody}>
            <label className={styles.fieldLabel}>依据列</label>
            <select
              className={styles.select}
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

      <div
        className={`${styles.panel} ${isSortEnabled ? styles.panelActive : ""}`}
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>数据排序</div>
          <label className={styles.toggle} aria-label="数据排序">
            <input
              className={styles.toggleInput}
              type="checkbox"
              checked={isSortEnabled}
              onChange={(e) => setIsSortEnabled(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        {isSortEnabled && availableKeys.length > 0 && (
          <div className={styles.panelBody}>
            <div style={{ marginBottom: "10px" }}>
              <label className={styles.fieldLabel}>依据列</label>
              <select
                className={styles.select}
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
              <label className={styles.fieldLabel}>排序方式</label>
              <select
                className={styles.select}
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
