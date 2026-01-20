// src/views/Merging/components/Dropzone.tsx

import { Upload } from "lucide-react";
import type { ChangeEvent, DragEvent, FC } from "react";
import { useRef } from "react";

export interface DropzoneProps {
  filesCount: number;
  isDragging: boolean;
  setIsDragging: (next: boolean) => void;
  addFiles: (newFiles: FileList | null) => Promise<void>;
}

const Dropzone: FC<DropzoneProps> = ({
  filesCount,
  isDragging,
  setIsDragging,
  addFiles,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`dropzone ${filesCount > 0 ? "dropzone--compact" : ""}`}
      data-dragging={isDragging}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="dropzone__icon" aria-hidden="true">
        <Upload size={18} strokeWidth={1.6} />
      </div>

      <h3 className="dropzone__title">
        {isDragging
          ? "释放以上传文件"
          : filesCount > 0
            ? "继续添加文件"
            : "拖拽文件至此"}
      </h3>
      <p className="dropzone__hint">
        {filesCount === 0 ? "支持 .xlsx 和 .xls 格式" : "点击或拖拽以继续添加"}
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls"
        hidden
        onChange={handleInputChange}
      />
    </div>
  );
};

export default Dropzone;
