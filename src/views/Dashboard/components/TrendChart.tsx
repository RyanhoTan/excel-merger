// src/views/Dashboard/components/TrendChart.tsx (Dashboard page / Analysis module)

import type { FC } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendChartPoint {
  // Dashboard analysis module: X-axis label (exam name).
  name: string;
  // Dashboard analysis module: Average score value.
  score: number;
}

export interface TrendChartProps {
  // Dashboard analysis module: chart dataset.
  data: TrendChartPoint[];
}

const TrendChart: FC<TrendChartProps> = ({ data }) => {
  return (
    // Dashboard analysis module: Responsive container ensures the chart scales with its parent.
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        // Dashboard analysis module: chart margin controls padding so axis/tooltip won't be clipped.
        margin={{ top: 8, right: 12, bottom: 0, left: 8 }}
      >
        {/* Dashboard analysis module: grid improves readability of score changes. */}
        <CartesianGrid strokeDasharray="3 3" />

        {/* Dashboard analysis module: XAxis shows exam names. */}
        <XAxis
          dataKey="name"
          // Hide long tick labels on smaller screens; tooltip still provides exact value.
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />

        {/* Dashboard analysis module: YAxis represents average score values. */}
        <YAxis
          // Keep a compact axis width so the chart area remains large.
          width={36}
          // Average score usually doesn't need too many decimals.
          tick={{ fontSize: 12 }}
          domain={[0, "auto"]}
        />

        {/* Dashboard analysis module: Tooltip shows exact exam + score when hovering. */}
        <Tooltip
          // Use subtle separator to make multi-series future-proof.
          separator=": "
          formatter={(value) => {
            const v = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(v)) return "-";
            return v.toFixed(1);
          }}
        />

        {/* Dashboard analysis module: Line renders the average score trend. */}
        <Line
          type="monotone"
          dataKey="score"
          // Use CSS variable for theming; fallback ensures the line remains visible.
          stroke={"var(--primary, #0052ff)"}
          strokeWidth={2}
          // Disable dot by default to reduce visual noise for small datasets.
          dot={false}
          // Show a slightly larger dot when active (hover) for easier reading.
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
