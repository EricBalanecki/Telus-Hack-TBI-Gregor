"use client";

import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export type LineChartPoint = {
  label: string;
  value: number;
};

type LineChartCardProps = {
  title: string;
  description?: string;
  data: LineChartPoint[];
  trendLabel?: string;
  color?: string;
  emptyLabel?: string;
};

export function LineChartCard({
  title,
  description,
  data,
  trendLabel,
  color = "#34d399",
  emptyLabel = "No data yet",
}: LineChartCardProps) {
  const hasData = data.length > 0;

  return (
    <Card className="border-zinc-800 bg-zinc-950/70 text-white">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
        {description && (
          <CardDescription className="text-zinc-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[0, 100]}
                  stroke="#94a3b8"
                />
                <Tooltip
                  cursor={{ stroke: "#334155", strokeWidth: 1 }}
                  contentStyle={{
                    background: "rgba(24, 24, 27, 0.9)",
                    border: "1px solid #27272a",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-zinc-400">
            {emptyLabel}
          </div>
        )}
      </CardContent>
      {trendLabel && (
        <CardFooter className="flex items-center gap-2 text-xs text-zinc-400">
          <TrendingUp className="h-4 w-4 text-emerald-300" />
          {trendLabel}
        </CardFooter>
      )}
    </Card>
  );
}
