"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRecord } from "@/api/records";
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

type Phase = {
  id: "jump" | "highlight";
  label: string;
  durationMs: number;
};

type CircleTarget = {
  id: string;
  x: number;
  y: number;
};

const PHASES: Phase[] = [
  { id: "jump", label: "Random Target Jump", durationMs: 25000 },
  { id: "highlight", label: "Choose the Highlighted Target", durationMs: 25000 },
];

const EXERCISE_NAME = "Level 2: Direction & Accuracy";

const SMOOTHING_ALPHA = 0.15;
const BASE_DOT_RADIUS = 14;
const GAZE_DOT_RADIUS = 6;
const TARGET_THRESHOLD = 65;
const REACTION_MIN_MS = 200;
const REACTION_MAX_MS = 1200;

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

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const randomPoint = (radius: number) => ({
  x: randomInRange(radius + 40, window.innerWidth - radius - 40),
  y: randomInRange(radius + 80, window.innerHeight - radius - 80),
});

const createGridTargets = (): CircleTarget[] => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const grid = [
    { id: "top-left", x: 0.1, y: 0.15 },
    { id: "top-center", x: 0.5, y: 0.15 },
    { id: "top-right", x: 0.9, y: 0.15 },
    { id: "middle-left", x: 0.1, y: 0.5 },
    { id: "middle-center", x: 0.5, y: 0.5 },
    { id: "middle-right", x: 0.9, y: 0.5 },
    { id: "bottom-left", x: 0.1, y: 0.85 },
    { id: "bottom-center", x: 0.5, y: 0.85 },
    { id: "bottom-right", x: 0.9, y: 0.85 },
  ];

  return grid.map((point) => ({
    id: point.id,
    x: point.x * width,
    y: point.y * height,
  }));
};

export default function LevelTwoDirectionAccuracy() {
  const [smoothedGazePoint, setSmoothedGazePoint] =
    useState<GazePoint | null>(null);
  const [isWebgazerReady, setIsWebgazerReady] = useState(false);
  const [status, setStatus] = useState("Initializing eye tracker...");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [targetPoint, setTargetPoint] = useState<GazePoint | null>(null);
  const [highlightTargets, setHighlightTargets] = useState<CircleTarget[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(8);
  const [dotSizeScale, setDotSizeScale] = useState(2);
  const [speedScale, setSpeedScale] = useState(1);

  const webgazerRef = useRef<WebGazer | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number | null>(null);
  const targetChangeAtRef = useRef<number>(0);
  const targetStartRef = useRef<number>(0);
  const acquiredRef = useRef(false);
  const isRestingRef = useRef(false);
  const restStartRef = useRef<number | null>(null);

  const reactionTimesRef = useRef<number[]>([]);
  const accuracySamplesRef = useRef(0);
  const accuracyHitsRef = useRef(0);

  const highlightReactionRef = useRef<number[]>([]);
  const highlightSamplesRef = useRef(0);
  const highlightCorrectRef = useRef(0);

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
        setStatus("Ready to start Level 2.");
      } catch (error) {
        console.error("Failed to initialize webgazer", error);
        setStatus("Unable to start eye tracking.");
      }
    };

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

  const resetMetrics = () => {
    reactionTimesRef.current = [];
    accuracySamplesRef.current = 0;
    accuracyHitsRef.current = 0;
    highlightReactionRef.current = [];
    highlightSamplesRef.current = 0;
    highlightCorrectRef.current = 0;
  };

  const getTargetInterval = () =>
    randomInRange(2000, 3000) / speedScale;

  const startJumpTarget = (timestamp: number) => {
    setTargetPoint(randomPoint(targetRadius));
    targetStartRef.current = timestamp;
    acquiredRef.current = false;
    targetChangeAtRef.current = timestamp + getTargetInterval();
  };

  const startHighlightTargets = (timestamp: number) => {
    const grid = createGridTargets();
    setHighlightTargets(grid);
    const initial = Math.floor(randomInRange(0, grid.length));
    setHighlightIndex(initial);
    targetStartRef.current = timestamp;
    acquiredRef.current = false;
    targetChangeAtRef.current = timestamp + getTargetInterval();
  };

  const finishRun = async () => {
    const avgReaction =
      reactionTimesRef.current.length > 0
        ? Math.round(
            reactionTimesRef.current.reduce((a, b) => a + b, 0) /
              reactionTimesRef.current.length,
          )
        : null;
    const accuracy =
      accuracySamplesRef.current > 0
        ? Math.round(
            (accuracyHitsRef.current / accuracySamplesRef.current) * 100,
          )
        : null;
    const highlightAccuracy =
      highlightSamplesRef.current > 0
        ? Math.round(
            (highlightCorrectRef.current / highlightSamplesRef.current) * 100,
          )
        : null;
    const highlightReaction =
      highlightReactionRef.current.length > 0
        ? Math.round(
            highlightReactionRef.current.reduce((a, b) => a + b, 0) /
              highlightReactionRef.current.length,
          )
        : null;

    const combinedAccuracy =
      accuracySamplesRef.current + highlightSamplesRef.current > 0
        ? Math.round(
            ((accuracyHitsRef.current + highlightCorrectRef.current) /
              (accuracySamplesRef.current + highlightSamplesRef.current)) *
              100,
          )
        : null;

    const combinedReactionSamples = [
      ...reactionTimesRef.current,
      ...highlightReactionRef.current,
    ];
    const combinedReaction =
      combinedReactionSamples.length > 0
        ? Math.round(
            combinedReactionSamples.reduce((a, b) => a + b, 0) /
              combinedReactionSamples.length,
          )
        : null;

    const reactionScore =
      combinedReaction !== null
        ? Math.max(
            0,
            Math.round(
              100 -
                ((combinedReaction - REACTION_MIN_MS) /
                  (REACTION_MAX_MS - REACTION_MIN_MS)) *
                  100,
            ),
          )
        : 0;

    const accuracyScore = combinedAccuracy ?? 0;
    const combinedScore = Math.round(accuracyScore * 0.6 + reactionScore * 0.4);

    const summary = [
      avgReaction !== null ? `Reaction ${avgReaction}ms` : null,
      accuracy !== null ? `Accuracy ${accuracy}%` : null,
      highlightAccuracy !== null ? `Select ${highlightAccuracy}%` : null,
      highlightReaction !== null ? `Select RT ${highlightReaction}ms` : null,
      `Score ${combinedScore}%`,
    ]
      .filter(Boolean)
      .join(" • ");

    setScoreSummary(summary || "Session complete");
    setStatus(`Score ${combinedScore}%`);
    setScore(combinedScore);
    setIsRunning(false);

    try {
      await createRecord({
        date: new Date().toISOString(),
        exercise: EXERCISE_NAME,
        score: combinedScore,
        notes: "",
      });
    } catch (error) {
      console.error("Failed to save score", error);
    }
  };

  const startRun = () => {
    setScoreSummary(null);
    setScore(null);
    setPhaseIndex(0);
    setIsRunning(true);
    setStatus(`Running • ${PHASES[0].label}`);
    resetMetrics();
    isRestingRef.current = false;
    restStartRef.current = null;
    phaseStartRef.current = performance.now();
    startJumpTarget(phaseStartRef.current);
  };

  useEffect(() => {
    if (!isRunning || !currentPhase) {
      return;
    }

    const tick = (timestamp: number) => {
      if (!isRunning || !currentPhase) {
        return;
      }

      const phaseStart = phaseStartRef.current ?? timestamp;
      const elapsedPhase = timestamp - phaseStart;

      if (isRestingRef.current) {
        const restStart = restStartRef.current ?? timestamp;
        const restElapsed = timestamp - restStart;
        if (restElapsed >= restSeconds * 1000) {
          isRestingRef.current = false;
          restStartRef.current = null;
          const nextIndex = phaseIndex + 1;
          setPhaseIndex(nextIndex);
          setStatus(`Running • ${PHASES[nextIndex].label}`);
          phaseStartRef.current = timestamp;
          if (PHASES[nextIndex].id === "highlight") {
            startHighlightTargets(timestamp);
          } else {
            startJumpTarget(timestamp);
          }
          animationRef.current = window.requestAnimationFrame(tick);
          return;
        }
        animationRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (currentPhase.id === "jump" && targetPoint) {
        accuracySamplesRef.current += 1;
        const dx = smoothedGazePoint ? smoothedGazePoint.x - targetPoint.x : 0;
        const dy = smoothedGazePoint ? smoothedGazePoint.y - targetPoint.y : 0;
        const distance = Math.hypot(dx, dy);
        if (distance <= TARGET_THRESHOLD) {
          accuracyHitsRef.current += 1;
          if (!acquiredRef.current) {
            acquiredRef.current = true;
            reactionTimesRef.current.push(timestamp - targetStartRef.current);
          }
        }
        if (timestamp >= targetChangeAtRef.current) {
          startJumpTarget(timestamp);
        }
      }

      if (currentPhase.id === "highlight" && highlightTargets.length > 0) {
        highlightSamplesRef.current += 1;
        if (smoothedGazePoint) {
          const target = highlightTargets[highlightIndex];
          const dx = smoothedGazePoint.x - target.x;
          const dy = smoothedGazePoint.y - target.y;
          const distance = Math.hypot(dx, dy);
          if (distance <= TARGET_THRESHOLD) {
            highlightCorrectRef.current += 1;
            if (!acquiredRef.current) {
              acquiredRef.current = true;
              highlightReactionRef.current.push(
                timestamp - targetStartRef.current,
              );
            }
          }
        }
        if (timestamp >= targetChangeAtRef.current) {
          setHighlightIndex((prev) => {
            if (highlightTargets.length === 1) {
              return prev;
            }
            let next = Math.floor(randomInRange(0, highlightTargets.length));
            if (next === prev) {
              next = (next + 1) % highlightTargets.length;
            }
            targetStartRef.current = timestamp;
            acquiredRef.current = false;
            targetChangeAtRef.current = timestamp + getTargetInterval();
            return next;
          });
        }
      }

      if (elapsedPhase >= currentPhase.durationMs) {
        if (phaseIndex < PHASES.length - 1) {
          isRestingRef.current = true;
          restStartRef.current = timestamp;
          setStatus(`Resting • ${restSeconds}s`);
          setTargetPoint(null);
          setHighlightTargets([]);
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
    highlightIndex,
    highlightTargets,
    isRunning,
    phaseIndex,
    restSeconds,
    smoothedGazePoint,
    speedScale,
    targetPoint,
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
                  Level 2: Direction & Accuracy
                </h1>
                <p className="text-xs text-zinc-400">
                  Random target jumps and highlighted choices.
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

            {scoreSummary && (
              <div className="mt-3 text-xs text-emerald-200">
                {scoreSummary}
              </div>
            )}
          </div>
        </div>
      )}

      {isRunning && currentPhase?.id === "jump" && targetPoint && (
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

      {isRunning &&
        currentPhase?.id === "highlight" &&
        highlightTargets.map((target, index) => (
          <div
            key={target.id}
            className={`pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              index === highlightIndex
                ? "border-emerald-300 bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                : "border-zinc-600 bg-zinc-800/60"
            }`}
            style={{
              ...clampToViewport(target, targetRadius),
              width: targetRadius * 2,
              height: targetRadius * 2,
            }}
            aria-hidden="true"
          />
        ))}

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
