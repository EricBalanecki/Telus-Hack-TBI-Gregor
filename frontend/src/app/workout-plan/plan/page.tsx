"use client";

import Link from "next/link";

export default function WorkoutPlanResultPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your Workout Plan
        </h1>
        <p className="text-base text-zinc-300">
          We will generate a personalized plan here next.
        </p>
        <Link
          className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
          href="/workout-plan"
        >
          Back to survey
        </Link>
      </main>
    </div>
  );
}
