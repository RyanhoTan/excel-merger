// src/views/Students/components/EditStudentDrawer.tsx（学生档案页 / 班级详情：学生信息编辑侧边栏）

import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Save, X } from "lucide-react";

import type { StudentProfileWithStats } from "../../../db/repository";
import { updateStudentInfo } from "../../../db/repository";

import buttonStyles from "../../../components/ui/Button.module.css";
import iconButtonStyles from "../../../components/ui/IconButton.module.css";
import styles from "../Students.module.css";

export interface EditStudentDrawerProps {
  // 学生档案页：是否打开编辑侧边栏。
  open: boolean;
  // 学生档案页：当前选中的学生数据（用于回填表单）。
  student: StudentProfileWithStats | null;
  // 学生档案页：关闭抽屉回调。
  onClose: () => void;
  // 学生档案页：保存成功回调（用于刷新当前班级列表）。
  onSaved: () => void;
}

type FormState = {
  studentId: string;
  name: string;
  gender: string;
  className: string;
};

const normalizeGenderForUI = (v: string): string => {
  const s = v.trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (["男", "male", "m", "1"].includes(low)) return "男";
  if (["女", "female", "f", "0"].includes(low)) return "女";
  return s;
};

const EditStudentDrawer: FC<EditStudentDrawerProps> = ({
  open,
  student,
  onClose,
  onSaved,
}) => {
  // 学生档案页：表单状态。
  const [form, setForm] = useState<FormState>({
    studentId: "",
    name: "",
    gender: "",
    className: "",
  });

  // 学生档案页：提交状态（防止重复提交）。
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!student) {
      setForm({ studentId: "", name: "", gender: "", className: "" });
      return;
    }

    setForm({
      studentId: student.studentId,
      name: student.name,
      gender: normalizeGenderForUI(student.gender ?? ""),
      className: student.className,
    });
  }, [open, student]);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!form.studentId.trim()) list.push("学号不能为空");
    if (!form.name.trim()) list.push("姓名不能为空");
    if (!form.className.trim()) list.push("班级名称不能为空");
    return list;
  }, [form.className, form.name, form.studentId]);

  const canSubmit = useMemo(
    () => errors.length === 0 && !saving && !!student,
    [errors.length, saving, student],
  );

  const setField = useCallback(
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!student) return;
    if (errors.length > 0) return;

    setSaving(true);
    try {
      // 学生档案页：更新学生元数据（允许修改学号，repository 会同步迁移成绩关联）。
      await updateStudentInfo(student.studentId, {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        gender: form.gender.trim()
          ? normalizeGenderForUI(form.gender)
          : undefined,
        className: form.className.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      alert(`保存失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [
    errors.length,
    form.className,
    form.gender,
    form.name,
    form.studentId,
    onClose,
    onSaved,
    student,
  ]);

  if (!open) return null;

  return (
    <div
      className={styles.drawerOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="编辑学生信息"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className={styles.drawer} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <Pencil size={16} />
            <span>编辑学生信息</span>
          </div>

          <button
            type="button"
            className={iconButtonStyles.iconButton}
            aria-label="关闭"
            title="关闭"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <div className={styles.formLabel}>学号 *</div>
              <input
                className={`${styles.input} ${
                  !form.studentId.trim() ? styles.inputDanger : ""
                }`}
                value={form.studentId}
                onChange={setField("studentId")}
                placeholder="例如：20250101"
              />
            </div>

            <div className={styles.formField}>
              <div className={styles.formLabel}>姓名 *</div>
              <input
                className={`${styles.input} ${
                  !form.name.trim() ? styles.inputDanger : ""
                }`}
                value={form.name}
                onChange={setField("name")}
                placeholder="例如：张三"
              />
            </div>

            <div className={styles.formField}>
              <div className={styles.formLabel}>性别</div>
              <input
                className={styles.input}
                value={form.gender}
                onChange={setField("gender")}
                placeholder="男 / 女"
              />
            </div>

            <div className={styles.formField}>
              <div className={styles.formLabel}>班级名称 *</div>
              <input
                className={`${styles.input} ${
                  !form.className.trim() ? styles.inputDanger : ""
                }`}
                value={form.className}
                onChange={setField("className")}
                placeholder="例如：高三 1 班"
              />
            </div>
          </div>

          {errors.length > 0 && (
            <div className={styles.formError}>{errors[0]}</div>
          )}

          <button
            type="button"
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary}`}
            disabled={!canSubmit}
            onClick={() => void handleSave()}
          >
            <span className={buttonStyles.btnInner}>
              <span
                className={buttonStyles.btnLabel}
                style={{ opacity: saving ? 0 : 1 }}
              >
                <span className={styles.btnIconInline} aria-hidden>
                  <Save size={16} />
                </span>
                保存
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
      </aside>
    </div>
  );
};

export default EditStudentDrawer;
