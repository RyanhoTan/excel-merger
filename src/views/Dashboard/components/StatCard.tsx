// src/views/Dashboard/components/StatCard.tsx (Dashboard page / StatCard)

import type { FC, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import styles from "./StatCard.module.css";

export interface StatCardProps {
  // Dashboard / StatCard: Card title.
  title: string;
  // Dashboard / StatCard: Main numeric value.
  value: string | number;
  // Dashboard / StatCard: Leading icon.
  icon: ReactNode;
  // Dashboard / StatCard: Trend percent value (e.g. 12.5 means +12.5%).
  trend?: number;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, trend }) => {
  const hasTrend = typeof trend === "number" && Number.isFinite(trend);
  const isPositive = hasTrend ? trend >= 0 : false;

  return (
    <div className={styles.card} role="group" aria-label={title}>
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden>
          {icon}
        </div>
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.valueRow}>
        <div className={styles.value}>{value}</div>

        <div
          className={`${styles.trend} ${
            hasTrend
              ? isPositive
                ? styles.trendPositive
                : styles.trendNegative
              : styles.trendMuted
          }`}
          aria-label="趋势"
        >
          {hasTrend ? (
            <span className={styles.trendInner}>
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {isPositive ? "+" : "-"}
              {Math.abs(trend).toFixed(1)}%
            </span>
          ) : (
            <span className={styles.trendInner}>—</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
