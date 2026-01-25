"use client";

import Link from "next/link";
import { Activity, Brain, Eye, Gauge, Hand, Sparkles } from "lucide-react";
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

  const progressData = useMemo(() => buildSeries(records), [records]);

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
    return `${direction} ${Math.abs(delta)} pts over ${data.length} sessions`;
  };

  return (
    <div className="relative min-h-screen text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 text-left">
        <section className="flex flex-col gap-6 text-left">
          <div className="flex justify-center">
            <h1 className="rounded-full border border-white/10 bg-[#0a0a0f]/80 px-6 py-3 text-center text-3xl font-semibold tracking-tight text-white shadow-lg shadow-emerald-500/10 backdrop-blur">
              TBI Motor Recovery
            </h1>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Who it helps",
                text: "Built for people with TBI who want to rebuild visual and motor control.",
                icon: Hand,
              },
              {
                title: "What it trains",
                text: "Visual tracking, reaction time, attention shifting, and hand-eye coordination.",
                icon: Activity,
              },
              {
                title: "How it feels",
                text: "Low-pressure sessions with clear feedback and repeatable routines.",
                icon: Sparkles,
              },
              {
                title: "What you see",
                text: "Simple progress snapshots so you can notice small improvements.",
                icon: Gauge,
              },
              {
                title: "How it fits",
                text: "Short exercises that can be repeated daily without cognitive overload.",
                icon: Eye,
              },
              {
                title: "Why it works",
                text: "Consistent practice builds stability, accuracy, and confidence over time.",
                icon: Brain,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-sm text-white shadow-lg backdrop-blur"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </div>
                <p className="mt-2 text-sm text-zinc-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total sessions", value: records.length.toString() },
            {
              label: "Average score",
              value:
                records.length > 0
                  ? `${Math.round(
                      records.reduce((sum, record) => sum + record.score, 0) /
                        records.length,
                    )}%`
                  : "--",
            },
            {
              label: "Best score",
              value:
                records.length > 0
                  ? `${Math.max(...records.map((record) => record.score))}%`
                  : "--",
            },
            {
              label: "Latest session",
              value:
                records.length > 0
                  ? new Date(
                      records
                        .slice()
                        .sort((a, b) => (a.date < b.date ? 1 : -1))[0].date,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "--",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-5 text-sm text-white shadow-lg backdrop-blur"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                {stat.label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-300">
                {stat.value}
              </div>
            </div>
          ))}
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
