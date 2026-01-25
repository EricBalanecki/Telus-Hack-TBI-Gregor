"use client";

import Link from "next/link";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

type Option = {
  label: string;
  value: string;
};

const ageRanges: Option[] = [
  { label: "Under 18", value: "under-18" },
  { label: "18–30", value: "18-30" },
  { label: "30–50", value: "30-50" },
  { label: "50+", value: "50-plus" },
];

const affectedSide: Option[] = [
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Both", value: "both" },
  { label: "Not sure", value: "unknown" },
];

const yesNo: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const symptomOptions = [
  { label: "Dizziness", value: "dizziness" },
  { label: "Headaches", value: "headaches" },
  { label: "Visual problems", value: "visual-problems" },
  { label: "Fatigue", value: "fatigue" },
  { label: "Hand weakness", value: "hand-weakness" },
  { label: "Balance issues", value: "balance-issues" },
  { label: "Trouble concentrating", value: "trouble-concentrating" },
];

const injuryTimeline: Option[] = [
  { label: "< 1 month", value: "under-1-month" },
  { label: "1–6 months", value: "1-6-months" },
  { label: "6+ months", value: "6-plus-months" },
];

const focusDurations: Option[] = [
  { label: "5 minutes", value: "5-min" },
  { label: "10 minutes", value: "10-min" },
  { label: "20+ minutes", value: "20-plus-min" },
];

export default function WorkoutPlanPage() {
  const [visualTrackingLevel, setVisualTrackingLevel] = useState([5]);
  const [motorSkillsLevel, setMotorSkillsLevel] = useState([5]);

  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [hasTherapist, setHasTherapist] = useState<string | null>(null);

  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
  const [injuryTime, setInjuryTime] = useState<string | null>(null);

  const [dizzyTracking, setDizzyTracking] = useState<string | null>(null);
  const [wearsGlasses, setWearsGlasses] = useState<string | null>(null);
  const [doubleVision, setDoubleVision] = useState<string | null>(null);

  const [focusTime, setFocusTime] = useState<string | null>(null);
  const [screenFatigue, setScreenFatigue] = useState<string | null>(null);

  const toggleSymptom = (value: string, checked: boolean) => {
    setSymptoms((prev) => ({ ...prev, [value]: checked }));
  };

  const optionButton = (
    option: Option,
    selected: string | null,
    onSelect: (value: string) => void,
  ) => (
    <button
      key={option.value}
      type="button"
      className={`rounded-full border px-4 py-2 text-sm transition ${
        selected === option.value
          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
          : "border-zinc-700 text-zinc-300 hover:border-emerald-400/60"
      }`}
      onClick={() => onSelect(option.value)}
    >
      {option.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Workout Plan Survey
            </h1>
            <p className="text-base text-zinc-300">
              Answer a few questions so we can personalize your plan.
            </p>
          </div>
          <Link
            className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </Link>
        </div>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">
              Visual & Motor Levels
            </h2>
            <p className="text-sm text-zinc-400">
              Rate your current comfort level from 1–10.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-zinc-200">
                <span>Visual tracking</span>
                <span className="text-emerald-200">
                  {visualTrackingLevel[0]}
                </span>
              </div>
              <Slider
                className="mt-2"
                min={1}
                max={10}
                step={1}
                value={visualTrackingLevel}
                onValueChange={setVisualTrackingLevel}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm text-zinc-200">
                <span>Motor skills</span>
                <span className="text-emerald-200">{motorSkillsLevel[0]}</span>
              </div>
              <Slider
                className="mt-2"
                min={1}
                max={10}
                step={1}
                value={motorSkillsLevel}
                onValueChange={setMotorSkillsLevel}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              1. Basic Profile
            </h2>
            <p className="text-sm text-zinc-400">
              Helps tune difficulty and choose symmetric vs one-sided tasks.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">Age range</p>
              <div className="flex flex-wrap gap-2">
                {ageRanges.map((option) =>
                  optionButton(option, ageRange, setAgeRange),
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Which side is more affected?
              </p>
              <div className="flex flex-wrap gap-2">
                {affectedSide.map((option) =>
                  optionButton(option, side, setSide),
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Working with a therapist or doctor?
              </p>
              <div className="flex flex-wrap gap-2">
                {yesNo.map((option) =>
                  optionButton(option, hasTherapist, setHasTherapist),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              2. Injury & Symptoms
            </h2>
            <p className="text-sm text-zinc-400">
              Helps avoid tasks that could be uncomfortable.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {symptomOptions.map((symptom) => (
              <label
                key={symptom.value}
                className="flex items-center gap-3 text-sm text-zinc-200"
              >
                <Checkbox
                  checked={!!symptoms[symptom.value]}
                  onCheckedChange={(checked) =>
                    toggleSymptom(symptom.value, Boolean(checked))
                  }
                />
                {symptom.label}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-zinc-200">How long since your injury?</p>
            <div className="flex flex-wrap gap-2">
              {injuryTimeline.map((option) =>
                optionButton(option, injuryTime, setInjuryTime),
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              3. Vision & Eye Comfort
            </h2>
            <p className="text-sm text-zinc-400">
              Important for eye tracking comfort.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Do you get dizzy when tracking moving objects?
              </p>
              <div className="flex flex-wrap gap-2">
                {yesNo.map((option) =>
                  optionButton(option, dizzyTracking, setDizzyTracking),
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Do you wear glasses or contacts?
              </p>
              <div className="flex flex-wrap gap-2">
                {yesNo.map((option) =>
                  optionButton(option, wearsGlasses, setWearsGlasses),
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Do you have double vision?
              </p>
              <div className="flex flex-wrap gap-2">
                {yesNo.map((option) =>
                  optionButton(option, doubleVision, setDoubleVision),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              5. Fatigue & Endurance
            </h2>
            <p className="text-sm text-zinc-400">
              Helps control session length and breaks.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                How long can you focus before needing a break?
              </p>
              <div className="flex flex-wrap gap-2">
                {focusDurations.map((option) =>
                  optionButton(option, focusTime, setFocusTime),
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-200">
                Do you get tired quickly when using screens?
              </p>
              <div className="flex flex-wrap gap-2">
                {yesNo.map((option) =>
                  optionButton(option, screenFatigue, setScreenFatigue),
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Link
            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-black"
            href="/workout-plan/plan"
          >
            Submit
          </Link>
        </div>
      </main>
    </div>
  );
}
