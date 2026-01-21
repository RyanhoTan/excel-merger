// src/views/Dashboard/index.tsx

import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, History, Users } from "lucide-react";

import { db } from "../../db";

import buttonStyles from "../../components/ui/Button.module.css";
import typographyStyles from "../../components/ui/Typography.module.css";
import styles from "./Dashboard.module.css";

export interface DashboardPageProps {
  // Navigate to a target route (e.g. open the Merging page).
  onNavigateToMerging: () => void;
}

interface DashboardStats {
  studentsCount: number;
  mergeCount: number;
  lastMergeAt?: number;
  scoresCount: number;
}

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const DashboardPage: FC<DashboardPageProps> = ({ onNavigateToMerging }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    studentsCount: 0,
    mergeCount: 0,
    scoresCount: 0,
  });

  // Fetch basic stats from IndexedDB via Dexie.
  // This reads students/scores/mergeHistory tables to power the dashboard cards.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [studentsCount, scoresCount, mergeCount, latest] =
          await Promise.all([
            db.students.count(),
            db.scores.count(),
            db.mergeHistory.count(),
            db.mergeHistory.orderBy("timestamp").last(),
          ]);

        if (cancelled) return;

        setStats({
          studentsCount,
          scoresCount,
          mergeCount,
          lastMergeAt: latest?.timestamp,
        });
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

  const isEmpty = useMemo(
    () => stats.mergeCount === 0 && stats.studentsCount === 0,
    [stats.mergeCount, stats.studentsCount],
  );

  return (
    <div>
      <h1 className={typographyStyles.pageTitle}>首页</h1>
      <p className={typographyStyles.pageSubtitle}>
        {loading
          ? "正在加载你的班级数据…"
          : "快速查看班级数据概况，并从这里开始一次新的合并。"}
      </p>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>学生总数</div>
          <div className={styles.statCardValue}>{stats.studentsCount}</div>
          <div className={styles.statCardHint}>来自学生表（students）</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>已合并记录数</div>
          <div className={styles.statCardValue}>{stats.mergeCount}</div>
          <div className={styles.statCardHint}>来自历史表（mergeHistory）</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>成绩记录数</div>
          <div className={styles.statCardValue}>{stats.scoresCount}</div>
          <div className={styles.statCardHint}>来自成绩表（scores）</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardLabel}>最近一次合并</div>
          <div className={styles.statCardValue}>
            {stats.lastMergeAt ? "有" : "暂无"}
          </div>
          <div className={styles.statCardHint}>
            {stats.lastMergeAt
              ? formatDateTime(stats.lastMergeAt)
              : "完成第一次合并后将显示"}
          </div>
        </div>
      </div>

      <div className={styles.ctaRow}>
        <div className={styles.ctaRowCopy}>
          <div className={styles.ctaRowTitle}>
            {isEmpty ? "欢迎使用：开始第一次合并" : "开始一次新的合并"}
          </div>
          <div className={styles.ctaRowDesc}>
            {isEmpty
              ? "还没有任何数据。点击右侧按钮上传 Excel 并生成第一条合并历史。"
              : "上传 Excel、去重排序、导出结果，并自动写入历史记录。"}
          </div>
        </div>

        <button
          className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.btnInline}`}
          type="button"
          onClick={onNavigateToMerging}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <History size={16} />
            去合并
            <ArrowRight size={16} />
          </span>
        </button>
      </div>

      {isEmpty ? (
        <div className={styles.ctaRow} style={{ marginTop: 12 }}>
          <div className={styles.ctaRowCopy}>
            <div className={styles.ctaRowTitle}>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Users size={16} />
                小提示
              </span>
            </div>
            <div className={styles.ctaRowDesc}>
              合并完成后，你可以在“数据合并”页右上角打开历史抽屉，进行预览、重新下载和删除。
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardPage;
