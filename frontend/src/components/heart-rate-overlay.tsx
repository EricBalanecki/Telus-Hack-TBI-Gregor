"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HeartRateOverlayProps = {
  enabled?: boolean;
};

type BluetoothDeviceLike = {
  gatt?: {
    connected: boolean;
    connect: () => Promise<any>;
    disconnect: () => void;
  } | null;
  addEventListener: (...args: any[]) => void;
};

export default function HeartRateOverlay({
  enabled = true,
}: HeartRateOverlayProps) {
  const [status, setStatus] = useState("Disconnected");
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [restingRate, setRestingRate] = useState<number | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationRemaining, setCalibrationRemaining] = useState(30);
  const [showBreakAlert, setShowBreakAlert] = useState(false);
  const [alertUntil, setAlertUntil] = useState<number | null>(null);
  const [lastDeviceName, setLastDeviceName] = useState<string | null>(null);
  const [dismissWarning, setDismissWarning] = useState<string | null>(null);
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const calibrationRef = useRef<number[]>([]);
  const calibrationTimerRef = useRef<number | null>(null);
  const restingRateRef = useRef<number | null>(null);
  const isCalibratingRef = useRef(false);
  const alertUntilRef = useRef<number | null>(null);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    setStatus("Disconnected");
    setRestingRate(null);
    setIsCalibrating(false);
    setCalibrationRemaining(30);
    setDismissWarning(null);
    restingRateRef.current = null;
    isCalibratingRef.current = false;
    alertUntilRef.current = null;
    if (calibrationTimerRef.current) {
      window.clearInterval(calibrationTimerRef.current);
      calibrationTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      setStatus("Connecting...");
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const bluetooth = (
        navigator as Navigator & {
          bluetooth?: {
            requestDevice: (options: {
              filters: Array<{ services: string[] }>;
            }) => Promise<BluetoothDeviceLike>;
            getDevices?: () => Promise<BluetoothDeviceLike[]>;
          };
        }
      ).bluetooth;

      if (!bluetooth) {
        throw new Error("Web Bluetooth not supported");
      }

      const device = (await bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
      })) as BluetoothDeviceLike;

      deviceRef.current = device;
      const deviceName = (device as { name?: string }).name ?? null;
      if (deviceName) {
        localStorage.setItem("lastHeartRateDeviceName", deviceName);
        setLastDeviceName(deviceName);
      }
      device.addEventListener("gattserverdisconnected", disconnect, {
        signal: abortRef.current.signal,
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("No GATT server");
      }
      const service = await server.getPrimaryService("heart_rate");
      const characteristic =
        await service.getCharacteristic("heart_rate_measurement");

      await characteristic.startNotifications();
      characteristic.addEventListener(
        "characteristicvaluechanged",
        (event: Event) => {
          const target = event.target as unknown as { value: DataView | null };
          const value = target.value;
          if (!value) {
            return;
          }
          const flags = value.getUint8(0);
          const rate16Bits = (flags & 0x01) === 0x01;
          const bpm = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
          setHeartRate(bpm);
          setStatus("Connected");

          const now = Date.now();
          if (isCalibratingRef.current) {
            calibrationRef.current = [
              ...calibrationRef.current.slice(-120),
              bpm,
            ];
            return;
          }

          if (restingRateRef.current !== null) {
            const isAboveResting = bpm >= restingRateRef.current +20;
            if (isAboveResting && (!alertUntilRef.current || now > alertUntilRef.current)) {
              setAlertUntil(now + 15 * 60 * 1000);
              setShowBreakAlert(true);
            }
          }
        },
        { signal: abortRef.current.signal },
      );

      setRestingRate(null);
      setShowBreakAlert(false);
      setAlertUntil(null);
      setDismissWarning(null);
      setIsCalibrating(true);
      setCalibrationRemaining(30);
      restingRateRef.current = null;
      isCalibratingRef.current = true;
      alertUntilRef.current = null;
      calibrationRef.current = [];
      if (calibrationTimerRef.current) {
        window.clearInterval(calibrationTimerRef.current);
      }
      calibrationTimerRef.current = window.setInterval(() => {
        setCalibrationRemaining((prev) => {
          if (prev <= 1) {
            window.clearInterval(calibrationTimerRef.current ?? 0);
            calibrationTimerRef.current = null;
            const samples = calibrationRef.current;
            if (samples.length > 0) {
              const avg =
                samples.reduce((sum, val) => sum + val, 0) / samples.length;
              const resting = Math.round(avg);
              setRestingRate(resting);
              restingRateRef.current = resting;
              setStatus("Connected");
            } else {
              setStatus("Calibration failed");
            }
            setIsCalibrating(false);
            isCalibratingRef.current = false;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Heart rate connection failed", error);
      setStatus("Failed to connect");
    }
  }, [disconnect, enabled]);

  const reconnectLastDevice = useCallback(async () => {
    try {
      const bluetooth = (
        navigator as Navigator & {
          bluetooth?: {
            getDevices?: () => Promise<BluetoothDeviceLike[]>;
          };
        }
      ).bluetooth;

      if (!bluetooth?.getDevices) {
        setStatus("Reconnect not supported");
        return;
      }

      const knownDevices = await bluetooth.getDevices();
      const storedName =
        lastDeviceName || localStorage.getItem("lastHeartRateDeviceName");
      const match = knownDevices.find((device) => {
        const name = (device as { name?: string }).name ?? "";
        return storedName ? name === storedName : false;
      });

      if (!match) {
        setStatus("No known device");
        return;
      }

      setStatus("Connecting...");
      deviceRef.current = match;
      match.addEventListener("gattserverdisconnected", disconnect);
      const server = await match.gatt?.connect();
      if (!server) {
        throw new Error("No GATT server");
      }
      const service = await server.getPrimaryService("heart_rate");
      const characteristic =
        await service.getCharacteristic("heart_rate_measurement");

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as unknown as { value: DataView | null };
        const value = target.value;
        if (!value) {
          return;
        }
        const flags = value.getUint8(0);
        const rate16Bits = (flags & 0x01) === 0x01;
        const bpm = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setHeartRate(bpm);
        setStatus("Connected");

        const now = Date.now();
        if (isCalibratingRef.current) {
          calibrationRef.current = [
            ...calibrationRef.current.slice(-120),
            bpm,
          ];
          return;
        }

        if (restingRateRef.current !== null) {
          const isAboveResting = bpm >= restingRateRef.current + 15;
          if (
            isAboveResting &&
            (!alertUntilRef.current || now > alertUntilRef.current)
          ) {
            setAlertUntil(now + 15 * 60 * 1000);
            setShowBreakAlert(true);
          }
        }
      });
    } catch (error) {
      console.error("Reconnect failed", error);
      setStatus("Reconnect failed");
    }
  }, [disconnect, lastDeviceName]);

  const startCalibration = useCallback(() => {
    if (status !== "Connected") {
      return;
    }
    setRestingRate(null);
    restingRateRef.current = null;
    setShowBreakAlert(false);
    setAlertUntil(null);
    alertUntilRef.current = null;
    setDismissWarning(null);
    setIsCalibrating(true);
    isCalibratingRef.current = true;
    setCalibrationRemaining(30);
    calibrationRef.current = [];
    if (calibrationTimerRef.current) {
      window.clearInterval(calibrationTimerRef.current);
    }
    calibrationTimerRef.current = window.setInterval(() => {
      setCalibrationRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(calibrationTimerRef.current ?? 0);
          calibrationTimerRef.current = null;
          const samples = calibrationRef.current;
          if (samples.length > 0) {
            const avg =
              samples.reduce((sum, val) => sum + val, 0) / samples.length;
            const resting = Math.round(avg);
            setRestingRate(resting);
            restingRateRef.current = resting;
            setStatus("Connected");
          } else {
            setStatus("Calibration failed");
          }
          setIsCalibrating(false);
          isCalibratingRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [status]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
    }
    return () => disconnect();
  }, [disconnect, enabled]);

  useEffect(() => {
    const stored = localStorage.getItem("lastHeartRateDeviceName");
    if (stored) {
      setLastDeviceName(stored);
    }
  }, []);

  useEffect(() => {
    alertUntilRef.current = alertUntil;
    if (!alertUntil) {
      return;
    }
    const timer = window.setInterval(() => {
      if (Date.now() > alertUntil) {
        setShowBreakAlert(false);
        setAlertUntil(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [alertUntil]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {(isCalibrating || showBreakAlert) && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="pointer-events-auto fixed left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 text-sm text-white shadow-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Heart Rate
            </div>
            {isCalibrating && (
              <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Sit still and relaxed for {calibrationRemaining}s to set your
                resting heart rate.
              </div>
            )}
      {showBreakAlert && (
              <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    Heart rate above baseline. Please take a 15 minute break.
                  </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:border-amber-200"
                onClick={() => {
                  const isAboveResting =
                    restingRateRef.current !== null &&
                    heartRate !== null &&
                    heartRate >= restingRateRef.current + 15;
                  if (isAboveResting) {
                    setDismissWarning(
                      "Let your heart relax or recalibrate your resting rate.",
                    );
                    return;
                  }
                  setShowBreakAlert(false);
                  setAlertUntil(null);
                  alertUntilRef.current = null;
                  setDismissWarning(null);
                }}
                type="button"
              >
                Dismiss
              </button>
            </div>
                </div>
          {dismissWarning && (
            <div className="mt-2 text-[11px] text-amber-200">
              {dismissWarning}
            </div>
          )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed right-4 top-4 z-50 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white shadow-lg backdrop-blur pointer-events-none">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Heart Rate
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="text-lg font-semibold text-emerald-300">
            {heartRate ? `${heartRate} bpm` : "--"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-100 hover:border-emerald-400 hover:text-emerald-200 pointer-events-auto"
              onClick={connect}
              type="button"
            >
              {status === "Connected" ? "Reconnect" : "Connect"}
            </button>
          </div>
        </div>
        <div className="mt-1 text-xs text-zinc-400">{status}</div>
        {!isCalibrating && restingRate !== null && (
          <div className="mt-2 text-xs text-zinc-400">
            Resting baseline: {restingRate} bpm
          </div>
        )}
        {lastDeviceName && (
          <div className="mt-1 text-xs text-zinc-500">
            Last device: {lastDeviceName}
          </div>
        )}
        {!isCalibrating && status === "Connected" && (
          <button
            className="mt-2 w-full rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-100 hover:border-emerald-400 hover:text-emerald-200 pointer-events-auto"
            onClick={startCalibration}
            type="button"
          >
            Recalibrate resting rate
          </button>
        )}
      </div>
    </>
  );
}
