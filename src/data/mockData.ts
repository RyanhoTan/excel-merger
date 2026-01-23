// src/data/mockData.ts

// Dashboard 首页 / 趋势图 mock 数据：用于在没有真实后端/数据库数据时，预览“近几次考试平均分趋势”效果。
// 数据格式：数组中的每一项代表一次考试（或一次测验）。
// - name: 考试名称（用于图表 X 轴）
// - averageScore: 班级平均分（用于图表 Y 轴），建议范围 60~95
// - timestamp: 时间戳（可选），可用于排序/去重
export interface AverageScoreTrendPoint {
  // 考试名称（例如：第一次月考、期中考试）
  name: string;
  // 班级平均分（60~95之间，带波动，模拟真实起伏）
  averageScore: number;
  // 考试时间（可选，用于排序或区分同名考试）
  timestamp?: number;
}

// Dashboard 首页 / 趋势图 mock 数据（5-7条）：用于展示班级近几次考试平均分趋势。
export const mockAverageScoresData: AverageScoreTrendPoint[] = [
  { name: "第一次月考", averageScore: 78.4, timestamp: 1735689600000 },
  { name: "第二次月考", averageScore: 82.1, timestamp: 1736899200000 },
  { name: "期中考试", averageScore: 79.6, timestamp: 1738108800000 },
  { name: "第三次月考", averageScore: 85.3, timestamp: 1739318400000 },
  { name: "期末考试", averageScore: 83.2, timestamp: 1740528000000 },
  { name: "开学摸底测", averageScore: 76.7, timestamp: 1741737600000 },
];

// 使用方式示例：
// 1) 在 Dashboard/index.tsx 中使用（推荐：把 averageScore 映射为 TrendChart 需要的 score 字段）
//    import { mockAverageScoresData } from "../../data/mockData";
//    const chartData = mockAverageScoresData
//      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
//      .map((p) => ({ name: p.name, score: p.averageScore }));
//
// 2) 或在 TrendChart.tsx 外层容器中直接传入
//    <TrendChart data={chartData} />

// Dashboard 首页 / 统计卡片 mock 数据：用于在没有真实统计接口时预览顶部 StatCard 的展示效果。
export interface StatCardData {
  // 唯一标识（用于列表渲染 key）
  id: string;
  // 卡片标题（例如：学生总数、累计导入）
  title: string;
  // 展示的数值（可以是数字或字符串百分比）
  value: string | number;
  // 数值单位（例如：人、次、分、%）
  unit: string;
  // 较上月/上次的波动百分比：正数代表上升，负数代表下降
  trend: number;
  // 图标名称（适配 lucide-react，例如 Users、FileSpreadsheet）
  iconName: string;
}

// Dashboard 首页 / 统计卡片 mock 数据（4条）：每条代表一个统计维度。
export const mockStatCardsData: StatCardData[] = [
  {
    id: "studentCount",
    title: "学生总数",
    value: 52,
    unit: "人",
    trend: 3.8,
    iconName: "Users",
  },
  {
    id: "importCount",
    title: "累计导入",
    value: 128,
    unit: "次",
    trend: 12.0,
    iconName: "FileSpreadsheet",
  },
  {
    id: "avgScore",
    title: "班级平均分",
    value: 88.5,
    unit: "分",
    trend: -1.6,
    iconName: "TrendingUp",
  },
  {
    id: "passRate",
    title: "及格率",
    value: "98%",
    unit: "%",
    trend: 2.4,
    iconName: "CheckCircle",
  },
];

// 使用方式示例：
// import { mockStatCardsData } from "../../data/mockData";
// mockStatCardsData.map((item) => (
//   <StatCard
//     key={item.id}
//     title={`${item.title}${item.unit ? `（${item.unit}）` : ""}`}
//     value={item.value}
//     icon={<Users size={16} />} // iconName 需要你在代码里做一个映射表（name -> Lucide 图标组件）
//     trend={item.trend}
//   />
// ));
