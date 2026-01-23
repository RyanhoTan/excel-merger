// src/views/Students/index.tsx

import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";

import {
  getClassesSummary,
  getStudentsByClass,
  type ImportStudentsResult,
  type ClassSummary,
  type StudentProfileWithStats,
} from "@/db/repository";
import ClassDetailView from "./components/ClassDetailView";
import CreateClassModal from "./components/CreateClassModal";
import EditStudentDrawer from "./components/EditStudentDrawer";
import ImportStudentModal from "./components/ImportStudentModal";
import StudentsToast from "./components/StudentsToast";

import typographyStyles from "@/components/ui/Typography.module.css";

import styles from "./Students.module.css";

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const StudentsPage: FC = () => {
  // 学生档案页：通过 selectedClass 控制“班级列表 -> 学生列表”的二级视图切换。
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // 学生档案页：导入弹窗 / 创建班级弹窗 / 编辑抽屉。
  const [importOpen, setImportOpen] = useState(false);
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentProfileWithStats | null>(null);

  // 学生档案页：轻提示 Toast（用于导入/创建/编辑成功反馈）。
  const [toastMessage, setToastMessage] = useState<string>("");

  // 学生档案页：班级概览列表。
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // 学生档案页：班级内学生列表。
  const [students, setStudents] = useState<StudentProfileWithStats[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // 学生档案页：加载班级列表。
  const refreshClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const list = await getClassesSummary();
      setClasses(list);
    } catch (err) {
      alert(
        `获取班级列表失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setClassesLoading(false);
    }
  }, []);

  // 学生档案页：刷新当前已选班级的学生列表。
  const refreshCurrentClass = useCallback(async () => {
    if (!selectedClass) return;
    setStudentsLoading(true);
    try {
      const list = await getStudentsByClass(selectedClass);
      setStudents(list);
    } catch (err) {
      alert(
        `获取班级学生失败: ${err instanceof Error ? err.message : String(err)}`,
      );
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedClass]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? "" : current));
    }, 2800);
  }, []);

  const handleImportSuccess = useCallback(
    async (result: ImportStudentsResult) => {
      await refreshClasses();

      const classCount = result.affectedClasses.length;
      const studentCount = result.importedCount;

      showToast(`成功导入 ${classCount} 个班级，${studentCount} 名学生`);
    },
    [refreshClasses, showToast],
  );

  const handleCreateClass = useCallback(
    async (name: string) => {
      // 学生档案页：CreateClassModal 内部已经写库，这里只负责刷新与反馈。
      await refreshClasses();
      showToast(`已创建班级：${name}`);
    },
    [refreshClasses, showToast],
  );

  const handleEditSaved = useCallback(async () => {
    // 学生档案页：编辑保存后，刷新班级列表 + 当前班级学生。
    await refreshClasses();
    await refreshCurrentClass();
    showToast("学生信息已更新");
  }, [refreshClasses, refreshCurrentClass, showToast]);

  // 学生档案页：进入某班级时加载其学生列表。
  const openClass = useCallback(async (className: string) => {
    setSelectedClass(className);
    setStudentsLoading(true);
    try {
      const list = await getStudentsByClass(className);
      setStudents(list);
    } catch (err) {
      alert(
        `获取班级学生失败: ${err instanceof Error ? err.message : String(err)}`,
      );
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // 学生档案页：返回班级列表。
  const backToClasses = useCallback(() => {
    setSelectedClass(null);
    setStudents([]);
  }, []);

  // 学生档案页：首次加载班级列表。
  useEffect(() => {
    void refreshClasses();
  }, [refreshClasses]);

  const emptyClasses = useMemo(
    () => !classesLoading && classes.length === 0,
    [classes.length, classesLoading],
  );

  return (
    <div>
      <div className={styles.pageHeaderRow}>
        <div className={styles.pageHeaderText}>
          <h1 className={typographyStyles.pageTitle}>学生档案</h1>
          <p className={typographyStyles.pageSubtitle}>
            {selectedClass
              ? "查看班级内学生列表与成绩统计。"
              : "按班级聚合管理学生信息，支持二级查看。"}
          </p>
        </div>

        {!selectedClass && (
          <div className={styles.pageActions}>
            <button
              type="button"
              className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
              onClick={() => setImportOpen(true)}
            >
              <FileSpreadsheet size={16} />
              导入学生名单
            </button>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setCreateClassOpen(true)}
            >
              <Plus size={16} />
              创建新班级
            </button>
          </div>
        )}
      </div>

      <ImportStudentModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={(result) => void handleImportSuccess(result)}
      />

      <CreateClassModal
        open={createClassOpen}
        onClose={() => setCreateClassOpen(false)}
        onSuccess={(name) => void handleCreateClass(name)}
      />

      <EditStudentDrawer
        open={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaved={() => void handleEditSaved()}
      />

      <StudentsToast
        open={toastMessage.trim().length > 0}
        message={toastMessage}
        onClose={() => setToastMessage("")}
      />

      {/* 学生档案页：转场动画（opacity 渐变），通过 CSS 控制两层面板显示/隐藏。 */}
      <div className={styles.stage}>
        {/* 学生档案页 / 班级列表视图 */}
        <div
          className={`${styles.panel} ${
            selectedClass ? styles.panelHidden : styles.panelVisible
          }`}
        >
          {classesLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>正在加载班级…</div>
              <div className={styles.emptyDesc}>请稍候</div>
            </div>
          ) : emptyClasses ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIllustration} aria-hidden>
                <Users size={30} />
              </div>
              <div className={styles.emptyTitle}>暂无班级数据</div>
              <div className={styles.emptyDesc}>
                请先在“数据合并”模块导入带班级字段的成绩数据。
              </div>
            </div>
          ) : (
            <div className={styles.classGrid} aria-label="班级列表">
              {classes.map((c) => {
                const percent = Math.round((c.completionRate || 0) * 100);
                return (
                  <div
                    key={c.className}
                    className={styles.classCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => void openClass(c.className)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void openClass(c.className);
                      }
                    }}
                  >
                    <div className={styles.classCardTop}>
                      <div className={styles.classCardIcon} aria-hidden>
                        <GraduationCap size={16} />
                      </div>
                      <ChevronRight size={18} color="var(--muted)" />
                    </div>

                    <div className={styles.classCardTitle}>{c.className}</div>

                    <div className={styles.classCardMeta}>
                      <div className={styles.metaRow}>
                        <div className={styles.metaLabel}>总人数</div>
                        <div className={styles.metaValue}>
                          {c.studentCount} 人
                        </div>
                      </div>
                      <div className={styles.metaRow}>
                        <div className={styles.metaLabel}>最近活跃</div>
                        <div className={styles.metaValue}>
                          {typeof c.lastActiveAt === "number"
                            ? formatDateTime(c.lastActiveAt)
                            : "暂无"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.progressWrap}>
                      <div className={styles.progressHeader}>
                        <div className={styles.progressLabel}>录入完整度</div>
                        <div className={styles.progressValue}>{percent}%</div>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressBarInner}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 学生档案页 / 班级学生列表视图 */}
        <div
          className={`${styles.panel} ${
            selectedClass ? styles.panelVisible : styles.panelHidden
          }`}
        >
          <ClassDetailView
            className={selectedClass ?? ""}
            data={students}
            loading={studentsLoading}
            onBack={backToClasses}
            onEdit={(student) => setEditingStudent(student)}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
