// src/views/Merging/components/PreviewTable.tsx

import type { FC } from "react";
import type { ExcelRow } from "../../../hooks/useExcelProcessor";

import styles from "./PreviewTable.module.css";

export interface PreviewTableProps {
  previewData: ExcelRow[];
}

const PreviewTable: FC<PreviewTableProps> = ({ previewData }) => {
  const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className={styles.preview}>
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>预览</h3>
        <div className={styles.previewHint}>
          {previewData.length > 0
            ? `展示前 ${previewData.length} 行`
            : "合并后数据将在这里预览"}
        </div>
      </div>

      <div className={styles.previewSurface}>
        {previewData.length === 0 ? (
          <div className={styles.previewEmpty}>暂无预览数据</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} title={col}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>
                        {row[col] == null ? "" : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTable;
