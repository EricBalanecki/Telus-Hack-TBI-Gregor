"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExercisesPage() {
  const visualExercises = [
    {
      id: "level-1-visual-tracking",
      title: "Level 1: Visual Tracking",
      difficulty: "Easy",
      imageLabel: "Visual tracking paths",
      imageSrc: "/exercises/level-1.png",
      href: "/exercises/level-1-visual-tracking",
      parts: [
        "Follow the Dot (horizontal)",
        "Follow the Dot (vertical)",
        "Circle Path",
      ],
      benefits: [
        "Rebuilds eye movement control",
        "Very low cognitive load",
      ],
    },
    {
      id: "level-2-direction-accuracy",
      title: "Level 2: Direction & Accuracy",
      difficulty: "Medium",
      imageLabel: "Direction and accuracy targets",
      href: "/exercises/level-2-direction-accuracy",
      parts: [
        "Random Target Jump",
        "Choose the Highlighted Target",
      ],
      benefits: [
        "Trains quick refocus",
        "Trains attention shifting",
      ],
    },
  ];

  const motorExercises = [
    {
      id: "level-1-motor-control",
      title: "Level 1: Motor Control",
      difficulty: "Easy",
      imageLabel: "Motor control target practice",
      href: "/exercises/motorskills",
      parts: ["Pointer alignment and steady control"],
      benefits: ["Improves hand-eye coordination", "Builds steadiness"],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12 text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Eye Exercises</h1>
        <p className="text-base text-zinc-300">Follow the exercises below.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </Link>
          <Link
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
            href="/exercises/calibration"
          >
            Calibrate eye tracking
          </Link>
        </div>
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Visual Exercises
            </h2>
            <p className="text-sm text-zinc-400">
              Eye tracking and attention-focused activities.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visualExercises.map((exercise) => (
              <Link key={exercise.id} href={exercise.href} className="block">
                <Card className="border-zinc-800 bg-zinc-900/60 transition hover:border-emerald-400/60 hover:bg-zinc-900">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl text-white">
                        {exercise.title}
                      </CardTitle>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          exercise.difficulty === "Medium"
                            ? "bg-orange-400/20 text-orange-200"
                            : exercise.difficulty === "Hard"
                            ? "bg-red-500/20 text-red-200"
                            : "bg-emerald-400/20 text-emerald-200"
                        }`}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative h-32 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50">
                      {exercise.imageSrc ? (
                        <Image
                          src={exercise.imageSrc}
                          alt={exercise.imageLabel}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                          {exercise.imageLabel}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-zinc-200">
                      <p className="font-semibold text-white">Parts</p>
                      <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                        {exercise.parts.map((part) => (
                          <li key={part}>{part}</li>
                        ))}
                      </ul>
                    </div>
                    {exercise.benefits && (
                      <div className="space-y-2 text-sm text-zinc-200">
                        <p className="font-semibold text-white">Benefits</p>
                        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                          {exercise.benefits.map((benefit) => (
                            <li key={benefit}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Motor Control Exercises
            </h2>
            <p className="text-sm text-zinc-400">
              Device-based exercises focused on control and steadiness.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {motorExercises.map((exercise) => (
              <Link key={exercise.id} href={exercise.href} className="block">
                <Card className="border-zinc-800 bg-zinc-900/60 transition hover:border-emerald-400/60 hover:bg-zinc-900">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl text-white">
                        {exercise.title}
                      </CardTitle>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          exercise.difficulty === "Medium"
                            ? "bg-orange-400/20 text-orange-200"
                            : exercise.difficulty === "Hard"
                            ? "bg-red-500/20 text-red-200"
                            : "bg-emerald-400/20 text-emerald-200"
                        }`}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative h-32 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        {exercise.imageLabel}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-200">
                      <p className="font-semibold text-white">Parts</p>
                      <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                        {exercise.parts.map((part) => (
                          <li key={part}>{part}</li>
                        ))}
                      </ul>
                    </div>
                    {exercise.benefits && (
                      <div className="space-y-2 text-sm text-zinc-200">
                        <p className="font-semibold text-white">Benefits</p>
                        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                          {exercise.benefits.map((benefit) => (
                            <li key={benefit}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
