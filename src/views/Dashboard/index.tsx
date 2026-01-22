// src/views/Dashboard/index.tsx

import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Combine,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboardStats, type DashboardStats } from "../../db/repository";
import StatCard from "./components/StatCard";

import buttonStyles from "../../components/ui/Button.module.css";
import typographyStyles from "../../components/ui/Typography.module.css";
import styles from "./Dashboard.module.css";

export interface DashboardPageProps {
  // Navigate to a target route (e.g. open the Merging page).
  onNavigateToMerging: () => void;
}

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const DashboardPage: FC<DashboardPageProps> = ({ onNavigateToMerging }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(() => ({
    studentCount: 0,
    mergeCount: 0,
    scoreCount: 0,
    fileCount: 0,
    recentActivities: [],
  }));

  // Dashboard page / Data loading: Fetch stats + activities via repository API.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const next = await getDashboardStats();
        if (!cancelled) setStats(next);
      } catch (err) {
        console.error("Dashboard stats load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dashboard page / Empty state: Guide users to import/merge data when no students exist.
  const isEmpty = useMemo(() => stats.studentCount === 0, [stats.studentCount]);

  // Dashboard page / Chart placeholder: Convert activities into a small time-series dataset.
  const trendData = useMemo(() => {
    if (stats.recentActivities.length === 0) return [];
    const items = [...stats.recentActivities]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((a, idx) => ({
        name: String(idx + 1),
        time: formatDateTime(a.timestamp).slice(5, 16),
        merges: idx + 1,
      }));
    return items;
  }, [stats.recentActivities]);

  return (
    <div>
      <h1 className={typographyStyles.pageTitle}>首页</h1>
      <p className={typographyStyles.pageSubtitle}>
        {loading
          ? "正在加载你的班级数据…"
          : "快速查看班级数据概况，并从这里开始一次新的合并。"}
      </p>

      {/* Dashboard page / Top stats: 4 StatCard components */}
      <div className={styles.statsGrid}>
        <StatCard
          title="学生总数"
          value={stats.studentCount}
          icon={<Users size={16} />}
          trend={stats.studentTrend}
        />
        <StatCard
          title="合并次数"
          value={stats.mergeCount}
          icon={<Combine size={16} />}
          trend={stats.mergeTrend}
        />
        <StatCard
          title="成绩记录"
          value={stats.scoreCount}
          icon={<BarChart3 size={16} />}
          trend={stats.scoreTrend}
        />
        <StatCard
          title="已导入文件"
          value={stats.fileCount}
          icon={<FileSpreadsheet size={16} />}
        />
      </div>

      {/* Dashboard page / Empty state: shown when there are no students */}
      {isEmpty ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyTitle}>还没有导入任何学生数据</div>
          <div className={styles.emptyDesc}>
            先前往“数据合并”上传 Excel 完成导入，系统会自动生成合并历史与统计。
          </div>

          <button
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.btnInline}`}
            type="button"
            onClick={onNavigateToMerging}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              前往导入数据
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      ) : (
        <div className={styles.mainGrid}>
          {/* Dashboard page / Recent activity: merge history list */}
          <section className={styles.panelCard} aria-label="最近动态">
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>最近动态</div>
              <div className={styles.panelSubtitle}>
                来自合并历史（mergeHistory）
              </div>
            </div>

            {stats.recentActivities.length === 0 ? (
              <div className={styles.panelEmpty}>
                暂无动态，去合并一次试试。
              </div>
            ) : (
              <ul className={styles.activityList}>
                {stats.recentActivities.map((a) => (
                  <li key={a.id} className={styles.activityItem}>
                    <div className={styles.activityTitle}>{a.title}</div>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityDesc}>
                        {a.description}
                      </span>
                      <span className={styles.activityTime}>
                        {formatDateTime(a.timestamp)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Dashboard page / Trend chart: Recharts reserved area */}
          <section className={styles.panelCard} aria-label="趋势图">
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>趋势图（预留）</div>
              <div className={styles.panelSubtitle}>
                后续可接入更完整的指标维度
              </div>
            </div>

            {trendData.length === 0 ? (
              <div className={styles.panelEmpty}>暂无趋势数据</div>
            ) : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" hide />
                    <YAxis allowDecimals={false} width={20} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="merges"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
