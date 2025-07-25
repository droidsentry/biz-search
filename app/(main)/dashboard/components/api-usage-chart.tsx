"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface ApiUsageChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export function ApiUsageChart({ data }: ApiUsageChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: format(new Date(item.date), "M/d", { locale: ja }),
    dayOfWeek: format(new Date(item.date), "E", { locale: ja }),
  }));

  const maxCount = Math.max(...data.map(d => d.count));
  const avgCount = Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label} ({data.dayOfWeek})</p>
          <p className="text-sm text-muted-foreground mt-1">
            API呼び出し: <span className="font-semibold text-foreground">{data.count}回</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="displayDate"
            stroke="#e5e7eb"
            tick={{
              fill: "#6b7280",
              fontSize: 12,
            }}
            axisLine={{ stroke: "#e5e7eb" }}
            label={{
              value: "日付",
              position: "insideBottom",
              offset: -5,
              style: {
                textAnchor: "middle",
                fill: "#6b7280",
                fontSize: 12,
              },
            }}
          />
          <YAxis
            stroke="#e5e7eb"
            tick={{
              fill: "#6b7280",
              fontSize: 12,
            }}
            axisLine={{ stroke: "#e5e7eb" }}
            domain={[0, Math.ceil(maxCount * 1.2)]}
            label={{
              value: "API呼び出し回数",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
                fill: "#6b7280",
                fontSize: 12,
              },
            }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: "#3b82f6",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />
          <ReferenceLine 
            y={avgCount} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5" 
            opacity={0.5}
          >
            <label
              x="98%"
              y={0}
              offset={-5}
              fill="hsl(var(--muted-foreground))"
              fontSize={10}
              textAnchor="end"
            >
              平均: {avgCount}回
            </label>
          </ReferenceLine>
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorApi)"
            strokeWidth={2}
            animationDuration={1000}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ApiUsageByPatternChartProps {
  data: {
    pattern_name: string;
    count: number;
  }[];
}

export function ApiUsageByPatternChart({ data }: ApiUsageByPatternChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 5);
  const maxCount = Math.max(...sortedData.map(d => d.count));

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium truncate max-w-[200px]">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            使用回数: <span className="font-semibold text-foreground">{payload[0].value}回</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            全体の{((payload[0].value / sortedData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>検索パターン別使用回数</CardTitle>
        <CardDescription>最も使用されている検索パターントップ5</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData} 
              margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
              layout="horizontal"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="pattern_name"
                stroke="hsl(var(--muted-foreground))"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
                angle={-20}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                domain={[0, Math.ceil(maxCount * 1.1)]}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {sortedData.map((pattern, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {pattern.pattern_name}
                </span>
              </div>
              <span className="font-medium tabular-nums">{pattern.count}回</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
