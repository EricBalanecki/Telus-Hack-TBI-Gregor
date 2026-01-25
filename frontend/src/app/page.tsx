import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Webgazer Home</h1>
        <p className="max-w-xl text-base text-zinc-300">
          Choose an activity to get started. Eye tracking now lives on the
          exercises page.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/progress"
          >
            Session History
          </Link>
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/motorskills"
          >
            Motor Control Exercises
          </Link>
          <Link
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
            href="/exercises"
          >
            Eye exercises
          </Link>
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/calibration"
          >
            Calibration
          </Link>
        </div>
      </main>
    </div>
  );
}
