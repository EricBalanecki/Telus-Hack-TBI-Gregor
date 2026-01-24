"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [smoothedGazePoint, setSmoothedGazePoint] =
    useState<GazePoint | null>(null);
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
          .showVideoPreview(false)
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <canvas
        ref={canvasRef}
        id="plotting_canvas"
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Eye Exercises
        </h1>
        <p className="text-base text-zinc-300">
          Follow the exercises below. The gaze dot is active here, but clicking
          does not change calibration.
        </p>
        <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
          {status}
        </span>
        <div className="flex flex-col items-center gap-3">
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
      </main>

      {smoothedGazePoint && (
        <div
          className="pointer-events-none fixed h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
          style={clampToViewport(smoothedGazePoint)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
