// src/views/Students/components/ClassDetailView.tsx（学生档案页 / 班级详情视图）

import type { FC } from "react";
import { ChevronLeft, GraduationCap, Pencil } from "lucide-react";

import type { StudentProfileWithStats } from "../../../db/repository";

import iconButtonStyles from "../../../components/ui/IconButton.module.css";
import styles from "../Students.module.css";

export interface ClassDetailViewProps {
  // 学生档案页：当前选中的班级名称。
  className: string;
  // 学生档案页：班级内学生数据（包含成绩统计字段）。
  data: StudentProfileWithStats[];
  // 学生档案页：加载状态（用于展示 loading 文案）。
  loading: boolean;
  // 学生档案页：返回班级列表的回调。
  onBack: () => void;
  // 学生档案页：点击“编辑”图标时的回调（用于打开 EditStudentDrawer）。
  onEdit: (student: StudentProfileWithStats) => void;
}

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const ClassDetailView: FC<ClassDetailViewProps> = ({
  className,
  data,
  loading,
  onBack,
  onEdit,
}) => {
  return (
    <div className={styles.view}>
      {/* 学生档案页：面包屑导航（返回班级列表）。 */}
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.breadcrumbBtn} onClick={onBack}>
          <ChevronLeft size={16} />
          学生档案
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{className}</span>
      </div>

      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <div className={styles.detailIcon} aria-hidden>
            <GraduationCap size={16} />
          </div>
          <div className={styles.detailTitle}>{className}</div>
        </div>
        <div className={styles.detailSubtitle}>
          {loading ? "正在加载班级学生…" : `共 ${data.length} 人`}
        </div>
      </div>

      {/* 学生档案页：空状态插图（当班级内无学生）。 */}
      {!loading && data.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration} aria-hidden>
            <GraduationCap size={32} />
          </div>
          <div className={styles.emptyTitle}>该班级暂无学生</div>
          <div className={styles.emptyDesc}>
            请先通过数据合并导入学生与成绩。
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>学号</th>
                  <th className={styles.th}>姓名</th>
                  <th className={styles.th}>累计考试次数</th>
                  <th className={styles.th}>平均分</th>
                  <th className={styles.th}>最近活跃</th>
                  <th className={`${styles.th} ${styles.thActions}`}>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.studentId} className={styles.tr}>
                    <td className={styles.td}>{row.studentId}</td>
                    <td className={styles.td}>{row.name}</td>
                    <td className={styles.td}>{row.examCount}</td>
                    <td className={styles.td}>
                      {typeof row.averageScore === "number"
                        ? row.averageScore.toFixed(1)
                        : "—"}
                    </td>
                    <td className={styles.td}>
                      {typeof row.lastActiveAt === "number"
                        ? formatDateTime(row.lastActiveAt)
                        : "—"}
                    </td>
                    <td className={`${styles.td} ${styles.tdActions}`}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() =>
                          console.log("[Students] detail", row.studentId)
                        }
                      >
                        详情
                      </button>

                      <button
                        type="button"
                        className={iconButtonStyles.iconButton}
                        aria-label="编辑"
                        title="编辑"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil size={16} strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailView;
