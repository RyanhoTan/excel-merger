// src/views/Students/components/StudentsToast.tsx（学生档案页 / UI：轻提示 Toast）

import type { FC } from "react";
import { CheckCircle2, X } from "lucide-react";

import iconButtonStyles from "@/components/ui/IconButton.module.css";
import styles from "../Students.module.css";

export interface StudentsToastProps {
  // 学生档案页：是否显示 Toast。
  open: boolean;
  // 学生档案页：Toast 主文案。
  message: string;
  // 学生档案页：关闭 Toast 的回调。
  onClose: () => void;
}

const StudentsToast: FC<StudentsToastProps> = ({ open, message, onClose }) => {
  if (!open) return null;

  return (
    <div className={styles.toastHost} aria-live="polite" aria-atomic="true">
      <div className={styles.toast} role="status">
        <div className={styles.toastIcon} aria-hidden>
          <CheckCircle2 size={16} />
        </div>
        <div className={styles.toastMessage}>{message}</div>
        <button
          type="button"
          className={iconButtonStyles.iconButton}
          aria-label="关闭提示"
          title="关闭"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default StudentsToast;
