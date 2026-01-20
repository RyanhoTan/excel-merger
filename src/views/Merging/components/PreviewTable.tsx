// src/views/Merging/components/PreviewTable.tsx

import type { FC } from "react";
import type { ExcelRow } from "../../../hooks/useExcelProcessor";

export interface PreviewTableProps {
  previewData: ExcelRow[];
}

const PreviewTable: FC<PreviewTableProps> = ({ previewData }) => {
  const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className="preview">
      <div className="preview__header">
        <h3 className="preview__title">预览</h3>
        <div className="preview__hint">
          {previewData.length > 0
            ? `展示前 ${previewData.length} 行`
            : "合并后数据将在这里预览"}
        </div>
      </div>

      <div className="preview__surface">
        {previewData.length === 0 ? (
          <div className="preview__empty">暂无预览数据</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
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
