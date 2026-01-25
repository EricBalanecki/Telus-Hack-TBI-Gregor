"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRecord, getLatestScore } from "@/api/records";
import { Slider } from "@/components/ui/slider";

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

type ExercisePhase = {
  id: "horizontal" | "vertical" | "circle";
  label: string;
  durationMs: number;
};

const PHASES: ExercisePhase[] = [
  { id: "horizontal", label: "Follow the Dot (horizontal)", durationMs: 20000 },
  { id: "vertical", label: "Follow the Dot (vertical)", durationMs: 20000 },
  { id: "circle", label: "Circle Path", durationMs: 25000 },
];

const EXERCISE_NAME = "Level 1: Visual Tracking";

const BASE_DOT_RADIUS = 12;
const GAZE_DOT_RADIUS = 6;
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

const clampToViewport = (point: GazePoint, radius: number) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    left: Math.min(Math.max(point.x, radius), width - radius),
    top: Math.min(Math.max(point.y, radius), height - radius),
  };
};

export default function LevelOneVisualTracking() {
  const [smoothedGazePoint, setSmoothedGazePoint] =
    useState<GazePoint | null>(null);
  const [isWebgazerReady, setIsWebgazerReady] = useState(false);
  const [status, setStatus] = useState("Initializing eye tracker...");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [targetPoint, setTargetPoint] = useState<GazePoint | null>(null);
  const [restSeconds, setRestSeconds] = useState(8);
  const [dotSizeScale, setDotSizeScale] = useState(2);
  const [speedScale, setSpeedScale] = useState(1);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  const webgazerRef = useRef<WebGazer | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const sampleCountRef = useRef(0);
  const totalDistanceRef = useRef(0);
  const isRestingRef = useRef(false);
  const restStartRef = useRef<number | null>(null);

  const currentPhase = PHASES[phaseIndex];
  const targetRadius = BASE_DOT_RADIUS * dotSizeScale;

  const progressLabel = useMemo(() => {
    if (!currentPhase) {
      return "Complete";
    }
    return `${phaseIndex + 1}/${PHASES.length} • ${currentPhase.label}`;
  }, [currentPhase, phaseIndex]);

  useEffect(() => {
    let isMounted = true;

    const loadLatestScore = async () => {
      try {
        const latest = await getLatestScore(EXERCISE_NAME);
        if (latest !== null) {
          setLatestScore(latest);
        }
      } catch (error) {
        console.error("Failed to load latest score", error);
      }
    };

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

        if (!isMounted) {
          return;
        }
        setIsWebgazerReady(true);
        setStatus("Ready to start Level 1.");
      } catch (error) {
        console.error("Failed to initialize webgazer", error);
        setStatus("Unable to start eye tracking.");
      }
    };

    loadLatestScore();
    setupWebgazer();

    return () => {
      isMounted = false;
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      if (webgazerRef.current) {
        webgazerRef.current.end();
      }
    };
  }, []);

  const resetScoring = () => {
    sampleCountRef.current = 0;
    totalDistanceRef.current = 0;
  };

  const computeTarget = (
    phase: ExercisePhase,
    elapsedMs: number,
    radius: number,
  ) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const travelX = width - radius * 2;
    const travelY = height - radius * 2;
    const t = (elapsedMs % phase.durationMs) / phase.durationMs;
    const eased = 0.5 - Math.cos(t * Math.PI * 2) / 2;

    switch (phase.id) {
      case "horizontal":
        return {
          x: radius + travelX * eased,
          y: height * 0.5,
        };
      case "vertical":
        return {
          x: width * 0.5,
          y: radius + travelY * eased,
        };
      case "circle": {
        const radius = Math.min(travelX, travelY) * 0.35;
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = t * Math.PI * 2;
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      }
      default:
        return { x: width / 2, y: height / 2 };
    }
  };

  const updateScore = (currentTarget: GazePoint) => {
    if (!smoothedGazePoint) {
      return;
    }
    const dx = smoothedGazePoint.x - currentTarget.x;
    const dy = smoothedGazePoint.y - currentTarget.y;
    const distance = Math.hypot(dx, dy);

    sampleCountRef.current += 1;
    totalDistanceRef.current += distance;
  };

  const finishRun = async () => {
    const total = sampleCountRef.current || 1;
    const avgDistance = totalDistanceRef.current / total;
    const halfWindowHeight = window.innerHeight / 2;
    const rawAccuracy = 100 - (avgDistance / halfWindowHeight) * 100;
    const accuracyScore = Math.max(0, Math.round(rawAccuracy));

    setScore(accuracyScore);
    setLatestScore(accuracyScore);
    setStatus(`Accuracy ${accuracyScore}%`);
    setIsRunning(false);
    isRestingRef.current = false;
    restStartRef.current = null;
    setRestRemaining(null);

    try {
      await createRecord({
        date: new Date().toISOString(),
        exercise: EXERCISE_NAME,
        score: accuracyScore,
        notes: "",
      });
    } catch (error) {
      console.error("Failed to save score", error);
    }
  };

  const startRun = () => {
    setScore(null);
    setPhaseIndex(0);
    setIsRunning(true);
    setStatus(`Running • ${PHASES[0].label}`);
    resetScoring();
    isRestingRef.current = false;
    restStartRef.current = null;
    setRestRemaining(null);
    startTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (!isRunning || !currentPhase) {
      return;
    }

    const startTime = startTimeRef.current ?? performance.now();

    const tick = (timestamp: number) => {
      if (!isRunning || !currentPhase) {
        return;
      }
      const elapsed = timestamp - startTime;
      const scaledElapsed = elapsed * speedScale;

      if (isRestingRef.current) {
        const restStart = restStartRef.current ?? timestamp;
        const restElapsed = timestamp - restStart;
        const remaining = Math.max(
          0,
          Math.ceil(restSeconds - restElapsed / 1000),
        );
        setRestRemaining(remaining);
        if (restElapsed >= restSeconds * 1000) {
          isRestingRef.current = false;
          restStartRef.current = null;
          setRestRemaining(null);
          const nextIndex = phaseIndex + 1;
          setPhaseIndex(nextIndex);
          setStatus(`Running • ${PHASES[nextIndex].label}`);
          startTimeRef.current = timestamp;
          animationRef.current = window.requestAnimationFrame(tick);
          return;
        } else {
          animationRef.current = window.requestAnimationFrame(tick);
          return;
        }
      }

      const target = computeTarget(
        currentPhase,
        scaledElapsed,
        targetRadius,
      );
      setTargetPoint(target);
      updateScore(target);

      if (elapsed >= currentPhase.durationMs) {
        if (phaseIndex < PHASES.length - 1) {
          isRestingRef.current = true;
          restStartRef.current = timestamp;
          setStatus(`Resting • ${restSeconds}s`);
          setTargetPoint(null);
          setRestRemaining(restSeconds);
        } else {
          finishRun();
          return;
        }
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    currentPhase,
    isRunning,
    phaseIndex,
    restSeconds,
    smoothedGazePoint,
    speedScale,
    targetRadius,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {!isRunning && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-30 w-[320px] -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-200 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-white">
                Level 1: Visual Tracking
              </h1>
              <p className="text-xs text-zinc-400">
                Follow the moving dot through three paths.
              </p>
            </div>
            <Link
              className="rounded-full border border-zinc-600 px-3 py-1 text-xs font-semibold text-white"
              href="/exercises"
            >
              Back
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200">
              {status}
            </span>
            <span className="text-xs text-zinc-400">{progressLabel}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black"
              onClick={startRun}
              disabled={!isWebgazerReady || isRunning}
            >
              {isRunning ? "Running..." : "Start"}
            </button>
            {score !== null && (
              <span className="text-xs text-emerald-200">
                Latest score: {score}%
              </span>
            )}
            {score === null && latestScore !== null && (
              <span className="text-xs text-emerald-200">
                Last score: {latestScore}%
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3 text-xs text-zinc-300">
            <div className="flex items-center justify-between">
              <span>Rest time between parts</span>
              <span>{restSeconds}s</span>
            </div>
            <Slider
              value={[restSeconds]}
              min={1}
              max={30}
              step={1}
              onValueChange={(value) =>
                setRestSeconds(value[0] ?? 1)
              }
            />
            <div className="flex items-center justify-between">
              <span>Dot size</span>
              <span>{dotSizeScale}</span>
            </div>
            <Slider
              value={[dotSizeScale]}
              min={1}
              max={3}
              step={1}
              onValueChange={(value) =>
                setDotSizeScale(value[0] ?? 1)
              }
            />
            <div className="flex items-center justify-between">
              <span>Speed</span>
              <span>{speedScale}</span>
            </div>
            <Slider
              value={[speedScale]}
              min={1}
              max={3}
              step={1}
              onValueChange={(value) =>
                setSpeedScale(value[0] ?? 1)
              }
            />
          </div>

          <details className="mt-3 text-xs text-zinc-400">
            <summary className="cursor-pointer text-zinc-300">
              Scoring details
            </summary>
            <p className="mt-2">
              We sample your gaze while the dot moves. Score is based on the
              average distance from the dot (same accuracy method as
              calibration). Speed/accuracy reporting will be handled by the
              backend later.
            </p>
          </details>
          </div>
        </div>
      )}

      {isRunning && targetPoint && (
        <div
          className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)]"
          style={{
            ...clampToViewport(targetPoint, targetRadius),
            width: targetRadius * 2,
            height: targetRadius * 2,
          }}
          aria-hidden="true"
        />
      )}

      {isRunning && restRemaining !== null && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
          Resting... {restRemaining}s
        </div>
      )}

      {smoothedGazePoint && (
        <div
          className="pointer-events-none fixed z-50 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/90 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
          style={clampToViewport(smoothedGazePoint, GAZE_DOT_RADIUS)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
