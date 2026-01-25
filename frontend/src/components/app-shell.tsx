"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppNavbar from "@/components/app-navbar";
import SpaceField from "@/components/space-field";
import HeartRateOverlay from "@/components/heart-rate-overlay";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showNavbar = !pathname.startsWith("/exercises/");
  const isCalibration = pathname === "/exercises/calibration";

  return (
    <div
      className={`min-h-screen text-white overflow-x-hidden ${
        showNavbar ? "bg-[#0a0a0f]" : "bg-zinc-950"
      }`}
    >
      {showNavbar && (
        <>
          <SpaceField />
          <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#0a0a0f]/30 via-transparent to-[#0a0a0f]/60" />
          <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(10,10,15,0.4)_70%)]" />
        </>
      )}
      {showNavbar && <AppNavbar />}
      <main
        className={`relative ${isCalibration ? "z-[1000]" : "z-10"} ${
          showNavbar ? "pt-20" : ""
        }`}
      >
        {children}
      </main>
      <HeartRateOverlay />
    </div>
  );
}
