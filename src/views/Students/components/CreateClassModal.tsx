// src/views/Students/components/CreateClassModal.tsx（学生档案页 / 班级列表：创建新班级弹窗）

import type { ChangeEvent, FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { createClass } from "../../../db/repository";

import buttonStyles from "../../../components/ui/Button.module.css";
import iconButtonStyles from "../../../components/ui/IconButton.module.css";
import styles from "../Students.module.css";

export interface CreateClassModalProps {
  // 学生档案页：是否打开创建班级弹窗。
  open: boolean;
  // 学生档案页：关闭弹窗回调。
  onClose: () => void;
  // 学生档案页：创建成功回调（用于刷新班级列表）。
  onSuccess: (className: string) => void;
}

const CreateClassModal: FC<CreateClassModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  // 学生档案页：班级名称输入。
  const [className, setClassName] = useState("");
  // 学生档案页：提交状态。
  const [saving, setSaving] = useState(false);

  const error = useMemo(() => {
    if (!className.trim()) return "班级名称不能为空";
    return "";
  }, [className]);

  const resetState = useCallback(() => {
    setClassName("");
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleCreate = useCallback(async () => {
    if (error) return;

    setSaving(true);
    try {
      // 学生档案页：创建“空班级”，用于提前搭建班级结构。
      await createClass(className.trim());
      onSuccess(className.trim());
      handleClose();
    } catch (err) {
      alert(`创建失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [className, error, handleClose, onSuccess]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="创建新班级"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Plus size={16} />
            <span>创建新班级</span>
          </div>

          <button
            className={iconButtonStyles.iconButton}
            type="button"
            onClick={handleClose}
            aria-label="关闭"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <div className={styles.formLabel}>班级名称 *</div>
              <input
                className={`${styles.input} ${error ? styles.inputDanger : ""}`}
                value={className}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setClassName(e.target.value)
                }
                placeholder="例如：高三 1 班"
              />
            </div>
          </div>

          {error && <div className={styles.formError}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleClose}
          >
            取消
          </button>

          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.btnInline}`}
            disabled={saving || !!error}
            onClick={() => void handleCreate()}
          >
            <span className={buttonStyles.btnInner}>
              <span
                className={buttonStyles.btnLabel}
                style={{ opacity: saving ? 0 : 1 }}
              >
                创建
              </span>
            </span>
            {saving && (
              <span className={buttonStyles.btnLoading} aria-hidden="true">
                <span className={buttonStyles.loadingDots}>
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassModal;
