"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExercisesPage() {
  const [activeTab, setActiveTab] = useState<"visual" | "motor">("visual");
  const visualExercises: Array<{
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    imageLabel: string;
    imageSrc?: string;
    href?: string;
    parts: string[];
    benefits?: string[];
  }> = [
    {
      id: "level-1-visual-tracking",
      title: "Level 1: Visual Tracking",
      difficulty: "Easy",
      imageLabel: "Visual tracking paths",
      imageSrc: "/exercises/one.png",
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
      imageSrc: "/exercises/two.png",
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
    {
      id: "level-3-distractors-control",
      title: "Level 3: Distractors & Control",
      difficulty: "Medium",
      imageLabel: "Focus with moving distractors",
      imageSrc: "/exercises/level-3.png",
      parts: [
        "Follow the Red Dot",
        "Stay on Target",
      ],
      benefits: [
        "Improves stability and focus",
        "Trains selective attention",
      ],
    },
    {
      id: "level-4-eye-reaction",
      title: "Level 4: Eye + Reaction",
      difficulty: "Hard",
      imageLabel: "Reaction speed and gaze triggers",
      parts: [
        "Look to Trigger",
        "Gaze Simon Says",
      ],
      benefits: [
        "Improves reaction speed",
        "Builds motor planning",
      ],
    },
    {
      id: "level-5-eye-thinking",
      title: "Level 5: Eye + Thinking",
      difficulty: "Hard",
      imageLabel: "Cognitive + gaze integration",
      parts: [
        "Look at the Correct Answer",
        "Color or Shape Rule",
      ],
      benefits: [
        "Strengthens decision making",
        "Trains inhibition and control",
      ],
    },
    {
      id: "level-6-functional-advanced",
      title: "Level 6: Functional (Advanced)",
      difficulty: "Hard",
      imageLabel: "Functional scanning and reading",
      parts: [
        "Visual Search",
        "Reading-Style Tracking",
      ],
      benefits: [
        "Improves scanning and sequencing",
        "Supports reading rehab",
      ],
    },
  ];

  const motorExercises = [
    {
      id: "level-1-motor-control",
      title: "Level 1: Motor Control",
      difficulty: "Easy",
      imageLabel: "Motor control target practice",
      imageSrc: "/exercises/lasersc.png",
      href: "/exercises/motorskills",
      parts: ["Pointer alignment and steady control"],
      benefits: ["Improves hand-eye coordination", "Builds steadiness"],
    },
  ];

  return (
    <div className="min-h-screen text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-14 text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Eye Exercises</h1>
        <p className="text-base text-zinc-300">Follow the exercises below.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-md border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </Link>
          <Link
            className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-black"
            href="/exercises/calibration"
          >
            Calibrate eye tracking
          </Link>
        </div>
        <section className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "visual"
                    ? "bg-emerald-500 text-black"
                    : "border border-zinc-700 text-zinc-200 hover:border-emerald-400/60"
                }`}
                type="button"
                onClick={() => setActiveTab("visual")}
              >
                Visual Exercises
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "motor"
                    ? "bg-emerald-500 text-black"
                    : "border border-zinc-700 text-zinc-200 hover:border-emerald-400/60"
                }`}
                type="button"
                onClick={() => setActiveTab("motor")}
              >
                Motor Control Exercises
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {activeTab === "visual"
                ? "Eye tracking and attention-focused activities."
                : "Device-based exercises focused on control and steadiness."}
            </p>
          </div>
          {activeTab === "visual" ? (
            <div className="grid gap-6 md:grid-cols-3">
              {visualExercises.map((exercise) => {
                const card = (
                  <Card
                    className={`border-zinc-800 bg-zinc-900/60 transition ${
                      exercise.href
                        ? "hover:border-emerald-400/60 hover:bg-zinc-900"
                        : "opacity-80"
                    }`}
                  >
                    <CardHeader className="min-h-[88px]">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-xl text-white">
                          {exercise.title}
                        </CardTitle>
                        <span
                          className={`rounded-md px-3 py-1 text-xs font-semibold ${
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
                      <div className="relative h-36 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/50">
                        {exercise.imageSrc ? (
                        <Image
                          src={exercise.imageSrc}
                          alt={exercise.imageLabel}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-top"
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
                );

                if (!exercise.href) {
                  return (
                    <div key={exercise.id} className="block">
                      {card}
                    </div>
                  );
                }

                return (
                  <Link key={exercise.id} href={exercise.href} className="block">
                    {card}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {motorExercises.map((exercise) => (
                <Link key={exercise.id} href={exercise.href} className="block">
                  <Card className="border-zinc-800 bg-zinc-900/60 transition hover:border-emerald-400/60 hover:bg-zinc-900">
                    <CardHeader className="min-h-[88px]">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-xl text-white">
                          {exercise.title}
                        </CardTitle>
                        <span
                          className={`rounded-md px-3 py-1 text-xs font-semibold ${
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
                      <div className="relative h-36 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/50">
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        {exercise.imageSrc ? (
                        <Image
                          src={exercise.imageSrc}
                          alt={exercise.imageLabel}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-top"
                        />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                            {exercise.imageLabel}
                          </div>
                        )}
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
          )}
        </section>
      </main>
    </div>
  );
}
