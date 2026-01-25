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
  const [showBreakAlert, setShowBreakAlert] = useState(false);
  const [alertUntil, setAlertUntil] = useState<number | null>(null);
  const deviceRef = useRef<BluetoothDeviceLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const samplesRef = useRef<number[]>([]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    setStatus("Disconnected");
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

          samplesRef.current = [...samplesRef.current.slice(-29), bpm];
          const avg =
            samplesRef.current.reduce((sum, val) => sum + val, 0) /
            samplesRef.current.length;

          const now = Date.now();
          const isSpike = bpm >= 110 && bpm - avg >= 25;
          if (isSpike && (!alertUntil || now > alertUntil)) {
            setAlertUntil(now + 15 * 60 * 1000);
            setShowBreakAlert(true);
          }
        },
        { signal: abortRef.current.signal },
      );
    } catch (error) {
      console.error("Heart rate connection failed", error);
      setStatus("Failed to connect");
    }
  }, [disconnect, enabled]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
    }
    return () => disconnect();
  }, [disconnect, enabled]);

  useEffect(() => {
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
    <div className="fixed right-4 top-4 z-50 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
        Heart Rate
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="text-lg font-semibold text-emerald-300">
          {heartRate ? `${heartRate} bpm` : "--"}
        </div>
        <button
          className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-100 hover:border-emerald-400 hover:text-emerald-200"
          onClick={connect}
          type="button"
        >
          {status === "Connected" ? "Reconnect" : "Connect"}
        </button>
      </div>
      <div className="mt-1 text-xs text-zinc-400">{status}</div>
      {showBreakAlert && (
        <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <div className="flex items-start justify-between gap-3">
            <span>
              Heart rate spike detected. Please take a 15 minute break.
            </span>
            <button
              className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:border-amber-200"
              onClick={() => {
                setShowBreakAlert(false);
                setAlertUntil(null);
              }}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
