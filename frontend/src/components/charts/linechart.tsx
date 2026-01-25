"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

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
  const chart = useMemo(() => {
    if (!hasData) {
      return null;
    }

    const width = 100;
    const height = 40;
    const padding = 6;
    const maxValue = Math.max(100, ...data.map((point) => point.value));
    const minValue = Math.min(0, ...data.map((point) => point.value));
    const range = Math.max(1, maxValue - minValue);

    const points = data
      .map((point, index) => {
        const x =
          padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
        const normalized = (point.value - minValue) / range;
        const y = height - padding - normalized * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    return { width, height, padding, points };
  }, [data, hasData]);

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
            <div className="flex h-full w-full flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{data[0]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
              </div>
              <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                {chart && (
                  <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      points={chart.points}
                    />
                  </svg>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
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
