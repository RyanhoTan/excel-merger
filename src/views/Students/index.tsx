// src/views/Students/index.tsx

import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, GraduationCap, Users } from "lucide-react";

import {
  getClassesSummary,
  getStudentsByClass,
  type ClassSummary,
  type StudentProfileWithStats,
} from "../../db/repository";
import ClassDetailView from "./components/ClassDetailView";

import typographyStyles from "../../components/ui/Typography.module.css";

import styles from "./Students.module.css";

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const StudentsPage: FC = () => {
  // 学生档案页：通过 selectedClass 控制“班级列表 -> 学生列表”的二级视图切换。
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

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
      <h1 className={typographyStyles.pageTitle}>学生档案</h1>
      <p className={typographyStyles.pageSubtitle}>
        {selectedClass
          ? "查看班级内学生列表与成绩统计。"
          : "按班级聚合管理学生信息，支持二级查看。"}
      </p>

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
          />
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
