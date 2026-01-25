"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchRecords, RecordEntry } from "@/api/records";
import { LineChartCard, LineChartPoint } from "@/components/charts/linechart";

export default function Home() {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [recordsStatus, setRecordsStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setRecordsStatus("loading");
        const data = await fetchRecords();
        setRecords(data);
        setRecordsStatus("idle");
      } catch (error) {
        console.error("Failed to load records", error);
        setRecordsStatus("error");
      }
    };

    loadRecords();
  }, []);

  const buildSeries = (
    input: RecordEntry[],
    filter?: (record: RecordEntry) => boolean,
  ): LineChartPoint[] => {
    const grouped: Record<string, { sum: number; count: number }> = {};
    const filtered = filter ? input.filter(filter) : input;

    filtered.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().slice(0, 10);
      if (!grouped[dateKey]) {
        grouped[dateKey] = { sum: 0, count: 0 };
      }
      grouped[dateKey].sum += record.score;
      grouped[dateKey].count += 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([dateKey, bucket]) => {
        const value = Math.round(bucket.sum / bucket.count);
        const label = new Date(dateKey).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return { label, value };
      });
  };

  const progressData = useMemo(
    () => buildSeries(records),
    [records],
  );

  const accuracyData = useMemo(
    () =>
      buildSeries(
        records,
        (record) => record.exercise === "Level 1: Visual Tracking",
      ),
    [records],
  );

  const buildTrendLabel = (data: LineChartPoint[]) => {
    if (data.length < 2) {
      return "Log more sessions to see trends";
    }
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const delta = last - first;
    const direction = delta >= 0 ? "Improved" : "Dropped";
    return `${direction} ${Math.abs(delta)} pts over ${
      data.length
    } sessions`;
  };

  return (
    <div className="relative min-h-screen text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 text-left">
        <section className="flex flex-col gap-4 text-left">
          <h1 className="text-3xl font-semibold tracking-tight">
            Webgazer Home
          </h1>
          <p className="max-w-2xl text-base text-zinc-300">
            Pick an activity or review how your accuracy is trending over time.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
              href="/progress"
            >
              Session History
            </Link>
            <Link
              className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
              href="/workout-plan"
            >
              Workout Plan
            </Link>
            <Link
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
              href="/exercises"
            >
              Exercises
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <LineChartCard
            title="Overall progress"
            description="Average score across all exercises."
            data={progressData}
            trendLabel={buildTrendLabel(progressData)}
            emptyLabel={
              recordsStatus === "loading"
                ? "Loading progress..."
                : "Complete a session to see progress"
            }
          />
          <LineChartCard
            title="Accuracy improvement"
            description="Level 1 visual tracking accuracy over time."
            data={accuracyData}
            color="#fbbf24"
            trendLabel={buildTrendLabel(accuracyData)}
            emptyLabel={
              recordsStatus === "loading"
                ? "Loading accuracy..."
                : "Complete Level 1 to see accuracy trends"
            }
          />
        </section>
      </main>
    </div>
  );
}
