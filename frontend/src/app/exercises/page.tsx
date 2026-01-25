"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GazePoint = {
  x: number;
  y: number;
};

type WebGazer = {
  setRegression: (name: string) => WebGazer;
  setGazeListener: (
    callback: (data: GazePoint | null, elapsedTime?: number) => void,
  ) => WebGazer;
  saveDataAcrossSessions: (value: boolean) => WebGazer;
  begin: () => Promise<void> | void;
  end: () => void;
  showVideoPreview: (show: boolean) => WebGazer;
  showPredictionPoints: (show: boolean) => WebGazer;
  applyKalmanFilter: (enabled: boolean) => WebGazer;
  getStoredPoints: () => [number[], number[]];
  removeMouseEventListeners: () => void;
};

const SMOOTHING_ALPHA = 0.15;

const smoothEMA = (
  prev: GazePoint | null,
  next: GazePoint,
  alpha = SMOOTHING_ALPHA,
) => {
  if (!prev) {
    return next;
  }
  return {
    x: prev.x + alpha * (next.x - prev.x),
    y: prev.y + alpha * (next.y - prev.y),
  };
};

const clampToViewport = (point: GazePoint) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    left: Math.min(Math.max(point.x, 0), width),
    top: Math.min(Math.max(point.y, 0), height),
  };
};

export default function ExercisesPage() {
  const [smoothedGazePoint, setSmoothedGazePoint] = useState<GazePoint | null>(
    null,
  );
  const [isWebgazerReady, setIsWebgazerReady] = useState(false);
  const [hasSavedCalibration, setHasSavedCalibration] = useState(false);
  const [status, setStatus] = useState("Initializing eye tracker...");

  const webgazerRef = useRef<WebGazer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupWebgazer = async () => {
      try {
        const { default: webgazer } = await import("webgazer");

        if (!isMounted) {
          return;
        }

        const instance = webgazer as WebGazer;
        webgazerRef.current = instance;

        instance
          .setRegression("ridge")
          .setGazeListener((data: GazePoint | null) => {
            if (!data || !isMounted) {
              return;
            }
            const nextPoint = { x: data.x, y: data.y };
            setSmoothedGazePoint((prev) => smoothEMA(prev, nextPoint));
          })
          .saveDataAcrossSessions(true);

        await instance.begin();
        instance
          .showVideoPreview(true)
          .showPredictionPoints(false)
          .applyKalmanFilter(true);

        instance.removeMouseEventListeners();

        const stored = instance.getStoredPoints();
        const hasStoredData = stored[0].length > 0 && stored[1].length > 0;

        if (!isMounted) {
          return;
        }
        setHasSavedCalibration(hasStoredData);
        setIsWebgazerReady(true);
        setStatus(
          hasStoredData
            ? "Calibration loaded. Tracking gaze."
            : "No calibration found. Please calibrate first.",
        );
      } catch (error) {
        console.error("Failed to initialize webgazer", error);
        setStatus("Unable to start eye tracking.");
      }
    };

    setupWebgazer();

    return () => {
      isMounted = false;
      if (webgazerRef.current) {
        webgazerRef.current.end();
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const exercises = [
    {
      id: "level-1-visual-tracking",
      title: "Level 1: Visual Tracking",
      difficulty: "Easy",
      imageLabel: "Visual tracking paths",
      href: "/exercises/level-1-visual-tracking",
      parts: [
        "Follow the Dot (horizontal)",
        "Follow the Dot (vertical)",
        "Circle Path",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <canvas
        ref={canvasRef}
        id="plotting_canvas"
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12 text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Eye Exercises</h1>
        <p className="text-base text-zinc-300">Follow the exercises below.</p>
        <span className="w-fit rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
          {status}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </Link>
          {isWebgazerReady && (
            <Link
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
              href="/calibration"
            >
              {hasSavedCalibration ? "Recalibrate" : "Calibrate"}
            </Link>
          )}
        </div>
        <section className="grid gap-4 md:grid-cols-2">
          {exercises.map((exercise) => (
            <Link key={exercise.id} href={exercise.href} className="block">
              <Card className="border-zinc-800 bg-zinc-900/60 transition hover:border-emerald-400/60 hover:bg-zinc-900">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl text-white">
                      {exercise.title}
                    </CardTitle>
                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {exercise.difficulty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 text-sm text-zinc-400">
                    {exercise.imageLabel}
                  </div>
                  <div className="space-y-2 text-sm text-zinc-200">
                    <p className="font-semibold text-white">Parts</p>
                    <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                      {exercise.parts.map((part) => (
                        <li key={part}>{part}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </main>

      {smoothedGazePoint && (
        <div
          className="pointer-events-none fixed z-50 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
          style={clampToViewport(smoothedGazePoint)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
