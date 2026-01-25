"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type GazePoint = {
  x: number;
  y: number;
};

type CalibrationPoint = {
  id: string;
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
  clearData: () => void;
  showVideoPreview: (show: boolean) => WebGazer;
  showPredictionPoints: (show: boolean) => WebGazer;
  applyKalmanFilter: (enabled: boolean) => WebGazer;
  recordScreenPosition: (x: number, y: number, eventType?: string) => void;
  getStoredPoints: () => [number[], number[]];
  addMouseEventListeners: () => void;
  removeMouseEventListeners: () => void;
  params: {
    storingPoints: boolean;
    applyKalmanFilter: boolean;
  };
};

const SMOOTHING_ALPHA = 0.15;
const CALIBRATION_POINTS: CalibrationPoint[] = [
  { id: "top-left", x: 0.1, y: 0.1 },
  { id: "top-center", x: 0.5, y: 0.1 },
  { id: "top-right", x: 0.9, y: 0.1 },
  { id: "middle-left", x: 0.1, y: 0.5 },
  { id: "middle-center", x: 0.5, y: 0.5 },
  { id: "middle-right", x: 0.9, y: 0.5 },
  { id: "bottom-left", x: 0.1, y: 0.9 },
  { id: "bottom-center", x: 0.5, y: 0.9 },
  { id: "bottom-right", x: 0.9, y: 0.9 },
];

const CALIBRATION_CLICKS = 5;
const ACCURACY_SAMPLE_MS = 5000;
const CALIBRATION_ROUND_OFFSETS = [0.12, 0.08, 0.05];

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

const getAdjustedValue = (value: number, offset: number) => {
  if (value === 0.5) {
    return 0.5;
  }
  return value < 0.5 ? offset : 1 - offset;
};

const getCalibrationPointsForRound = (roundIndex: number) => {
  const offset =
    CALIBRATION_ROUND_OFFSETS[
      Math.min(roundIndex, CALIBRATION_ROUND_OFFSETS.length - 1)
    ];

  return CALIBRATION_POINTS.map((point) => ({
    ...point,
    x: getAdjustedValue(point.x, offset),
    y: getAdjustedValue(point.y, offset),
  }));
};

function calculatePrecision(past50Array: [number[], number[]]) {
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  const x50 = past50Array[0];
  const y50 = past50Array[1];

  const staringPointX = windowWidth / 2;
  const staringPointY = windowHeight / 2;

  const precisionPercentages = new Array(50).fill(0);
  calculatePrecisionPercentages(
    precisionPercentages,
    windowHeight,
    x50,
    y50,
    staringPointX,
    staringPointY,
  );

  return Math.round(calculateAverage(precisionPercentages));
}

function calculatePrecisionPercentages(
  precisionPercentages: number[],
  windowHeight: number,
  x50: number[],
  y50: number[],
  staringPointX: number,
  staringPointY: number,
) {
  for (let x = 0; x < 50; x += 1) {
    const xDiff = staringPointX - x50[x];
    const yDiff = staringPointY - y50[x];
    const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    const halfWindowHeight = windowHeight / 2;

    let precision = 0;
    if (distance <= halfWindowHeight && distance > -1) {
      precision = 100 - (distance / halfWindowHeight) * 100;
    } else if (distance > halfWindowHeight) {
      precision = 0;
    } else if (distance > -1) {
      precision = 100;
    }

    precisionPercentages[x] = precision;
  }
}

function calculateAverage(precisionPercentages: number[]) {
  let precision = 0;
  for (let x = 0; x < 50; x += 1) {
    precision += precisionPercentages[x];
  }
  return precision / 50;
}

export default function CalibrationPage() {
  const [status, setStatus] = useState("Initializing eye tracker...");
  const [isWebgazerReady, setIsWebgazerReady] = useState(false);
  const [smoothedGazePoint, setSmoothedGazePoint] = useState<GazePoint | null>(
    null,
  );
  const [hasSavedCalibration, setHasSavedCalibration] = useState(false);
  const [calibrationCounts, setCalibrationCounts] = useState<
    Record<string, number>
  >({});
  const [pointCalibrate, setPointCalibrate] = useState(0);
  const [calibrationRound, setCalibrationRound] = useState(0);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [isCalibrationVisible, setIsCalibrationVisible] = useState(false);
  const [isAccuracyStage, setIsAccuracyStage] = useState(false);
  const [isImproveMode, setIsImproveMode] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const webgazerRef = useRef<WebGazer | null>(null);
  const accuracyTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const calibrationBasePoints = useMemo(
    () => getCalibrationPointsForRound(calibrationRound),
    [calibrationRound],
  );
  const showMiddlePoint = pointCalibrate >= calibrationBasePoints.length - 1;
  const centerPoint = calibrationBasePoints.find(
    (point) => point.id === "middle-center",
  );

  const calibrationPoints = useMemo(() => {
    if (viewport.width === 0 || viewport.height === 0) {
      return [];
    }
    return calibrationBasePoints.map((point) => ({
      ...point,
      left: Math.round(point.x * viewport.width),
      top: Math.round(point.y * viewport.height),
    }));
  }, [calibrationBasePoints, viewport.height, viewport.width]);

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
        const stored = instance.getStoredPoints();
        const hasStoredData = stored[0].length > 0 && stored[1].length > 0;
        setHasSavedCalibration(hasStoredData);
        setIsWebgazerReady(true);
        setStatus(
          hasStoredData
            ? "Calibration loaded. Choose a mode below."
            : "No calibration found. Start dot calibration.",
        );
      } catch (error) {
        console.error("Failed to initialize webgazer", error);
        setStatus("Unable to start eye tracking.");
      }
    };

    setupWebgazer();

    return () => {
      isMounted = false;
      if (accuracyTimeoutRef.current) {
        window.clearTimeout(accuracyTimeoutRef.current);
      }
      if (webgazerRef.current) {
        webgazerRef.current.end();
      }
    };
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = viewport.width || window.innerWidth;
    canvas.height = viewport.height || window.innerHeight;
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    if (!isAccuracyStage) {
      return undefined;
    }

    const instance = webgazerRef.current;
    if (!instance) {
      return undefined;
    }

    instance.params.storingPoints = true;

    accuracyTimeoutRef.current = window.setTimeout(() => {
      instance.params.storingPoints = false;
      const past50 = instance.getStoredPoints();
      const precision = calculatePrecision(past50);
      setAccuracy(precision);
      setStatus(`Accuracy ${precision}%`);
      setIsAccuracyStage(false);
      setCalibrationComplete(true);
      setHasSavedCalibration(true);
      setIsImproveMode(true);
      instance.addMouseEventListeners();
    }, ACCURACY_SAMPLE_MS);

    return () => {
      if (accuracyTimeoutRef.current) {
        window.clearTimeout(accuracyTimeoutRef.current);
      }
    };
  }, [isAccuracyStage]);

  useEffect(() => {
    const instance = webgazerRef.current;
    if (!instance) {
      return;
    }
    if (isImproveMode) {
      instance.addMouseEventListeners();
    } else {
      instance.removeMouseEventListeners();
    }
  }, [isImproveMode]);

  useEffect(() => {
    if (!isImproveMode) {
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      webgazerRef.current?.recordScreenPosition(
        event.clientX,
        event.clientY,
        "click",
      );
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isImproveMode]);

  const resetCalibration = () => {
    setCalibrationCounts({});
    setPointCalibrate(0);
    setCalibrationRound(0);
    setAccuracy(null);
    setCalibrationComplete(false);
    setIsAccuracyStage(false);
    setIsCalibrationVisible(true);
    setIsImproveMode(false);
    setStatus("Calibration round 1/3: click each point 5 times.");
  };

  const startCalibration = () => {
    webgazerRef.current?.clearData();
    resetCalibration();
  };

  const startImproveMode = () => {
    setIsCalibrationVisible(false);
    setIsAccuracyStage(false);
    setIsImproveMode(true);
    setStatus("Improvement mode: click anywhere to add samples.");
  };

  const handlePointClick = (pointId: string, x: number, y: number) => {
    if (!isCalibrationVisible || isAccuracyStage) {
      return;
    }

    webgazerRef.current?.recordScreenPosition(x, y, "click");

    setCalibrationCounts((prev) => {
      const nextCount = (prev[pointId] ?? 0) + 1;
      const next = { ...prev, [pointId]: nextCount };
      const completed = Object.values(next).filter(
        (count) => count >= CALIBRATION_CLICKS,
      ).length;

      setPointCalibrate(completed);

      if (completed >= calibrationBasePoints.length) {
        if (calibrationRound < CALIBRATION_ROUND_OFFSETS.length - 1) {
          const nextRound = calibrationRound + 1;
          setCalibrationRound(nextRound);
          setCalibrationCounts({});
          setPointCalibrate(0);
          setStatus(
            `Calibration round ${nextRound + 1}/${
              CALIBRATION_ROUND_OFFSETS.length
            }: click each point 5 times.`,
          );
        } else {
          setIsCalibrationVisible(false);
          setIsAccuracyStage(true);
          setStatus("Calculating accuracy...");
        }
      }

      return next;
    });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <canvas
        ref={canvasRef}
        id="plotting_canvas"
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Calibration</h1>
        <p className="max-w-xl text-base text-zinc-300">
          Calibration is the only place to improve accuracy. Click each point 5
          times. The sequence repeats 3 rounds, moving closer to the corners.
        </p>
        <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-200">
          {status}
        </span>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/exercises"
          >
            Back to exercises
          </Link>
          {isWebgazerReady && (
            <button
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
              onClick={startCalibration}
            >
              {hasSavedCalibration
                ? "Restart dot calibration"
                : "Start dot calibration"}
            </button>
          )}
          {isWebgazerReady && (
            <button
              className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
              onClick={startImproveMode}
            >
              Improve by clicking
            </button>
          )}
        </div>
        {accuracy !== null && (
          <span className="text-sm text-zinc-300">
            Accuracy estimate: {accuracy}%
          </span>
        )}
      </main>

      {isCalibrationVisible && calibrationPoints.length > 0 && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 2147483647 }}
        >
          {calibrationPoints.map((point) => {
            if (point.id === "middle-center" && !showMiddlePoint) {
              return null;
            }

            const clicks = calibrationCounts[point.id] ?? 0;
            const isComplete = clicks >= CALIBRATION_CLICKS;
            const opacity = isComplete ? 1 : Math.min(0.2 * clicks + 0.2, 1);

            return (
              <button
                key={point.id}
                className="pointer-events-auto fixed h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full transition"
                style={{
                  left: point.left,
                  top: point.top,
                  backgroundColor: isComplete ? "yellow" : "red",
                  opacity,
                  zIndex: 2147483647,
                }}
                onClick={() =>
                  handlePointClick(point.id, point.left, point.top)
                }
                disabled={isComplete}
                aria-label={`Calibration point ${point.id}`}
              />
            );
          })}
        </div>
      )}

      {isAccuracyStage && centerPoint && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black"
          style={{ zIndex: 2147483647 }}
        >
          <div className="fixed left-1/2 top-8 -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs text-zinc-200">
            Please stare at the center dot for 5 seconds.
          </div>
          <div
            className="fixed h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 shadow-[0_0_16px_rgba(253,224,71,0.9)]"
            style={{
              left: Math.round(centerPoint.x * window.innerWidth),
              top: Math.round(centerPoint.y * window.innerHeight),
              zIndex: 2147483647,
            }}
          />
        </div>
      )}

      {isImproveMode && smoothedGazePoint && (
        <div
          className="pointer-events-none fixed h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
          style={{
            ...clampToViewport(smoothedGazePoint),
            zIndex: 2147483647,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
