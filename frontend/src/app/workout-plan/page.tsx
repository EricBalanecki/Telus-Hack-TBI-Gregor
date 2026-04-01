"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { createPlan, fetchPlan, PlanInput, PlanItem } from "@/api/plan";
import {
  fetchPlanCompletions,
  savePlanCompletion,
  PlanCompletionMap,
} from "@/api/plan-completions";
import { Progress } from "@/components/ui/progress";

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
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(true);
  const [completions, setCompletions] = useState<PlanCompletionMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSessions = useMemo(() => {
    return (plan ?? []).reduce((sum, item) => {
      const repetitions = Math.max(1, item.days ?? 1);
      return sum + repetitions;
    }, 0);
  }, [plan]);

  const completedSessions = useMemo(() => {
    return Object.values(completions).filter(Boolean).length;
  }, [completions]);

  const progressPercent =
    totalSessions > 0
      ? Math.min(100, Math.round((completedSessions / totalSessions) * 100))
      : 0;

  const buildExerciseLink = (item: PlanItem) => {
    const exercise = item.exercise.toLowerCase();
    let path: string | null = null;

    if (exercise.includes("level 1") && exercise.includes("visual")) {
      path = "/exercises/level-1-visual-tracking";
    } else if (exercise.includes("level 2") && exercise.includes("direction")) {
      path = "/exercises/level-2-direction-accuracy";
    } else if (exercise.includes("motor control")) {
      path = "/exercises/motorskills";
    }

    if (!path) {
      return null;
    }

    const params = new URLSearchParams();
    if (item.dot_size != null) params.set("dotSize", String(item.dot_size));
    if (item.speed != null) params.set("speed", String(item.speed));
    if (item.rest_time != null) params.set("rest", String(item.rest_time));
    if (item.target_size != null)
      params.set("targetSize", String(item.target_size));
    if (item.num_targets != null)
      params.set("targets", String(item.num_targets));
    params.set("from", "workout-plan");

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

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
      className={`rounded-md border px-4 py-2 text-sm transition ${
        selected === option.value
          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
          : "border-zinc-700 text-zinc-300 hover:border-emerald-400/60"
      }`}
      onClick={() => onSelect(option.value)}
    >
      {option.label}
    </button>
  );

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setIsLoadingPlan(true);
        const [planData, completionData] = await Promise.all([
          fetchPlan(),
          fetchPlanCompletions(),
        ]);
        setCompletions(completionData ?? {});
        if (Array.isArray(planData) && planData.length > 0) {
          setPlan(planData);
          setShowSurvey(false);
        } else {
          setPlan(null);
          setShowSurvey(true);
        }
      } catch (error) {
        console.error("Failed to load plan", error);
        setPlanError("Unable to load your workout plan yet.");
        setShowSurvey(true);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    loadPlan();
  }, []);

  const submit = async () => {
    // Build request payload
    const payload: PlanInput = {
      motor_level: motorSkillsLevel[0],
      visual_level: visualTrackingLevel[0],
      dizzy_tracking_movement: dizzyTracking === "yes",
      tired_using_screens: screenFatigue === "yes",
    };

    try {
      setIsSubmitting(true);
      setPlanError(null);
      const exerciseData = await createPlan(payload);
      setPlan(exerciseData);
      setCompletions({});
      setShowSurvey(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      setPlanError("We could not generate a plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {showSurvey ? "Workout Plan Survey" : "Workout Plan"}
            </h1>
            <p className="text-base text-zinc-300">
              {showSurvey
                ? "Answer a few questions so we can personalize your plan."
                : "Review your current plan and adjust anytime."}
            </p>
          </div>
          <Link
            className="rounded-md border border-zinc-600 px-5 py-2 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </Link>
        </div>

        {isLoadingPlan ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-300">
            Loading your workout plan...
          </section>
        ) : showSurvey ? (
          <>
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
                    <span className="text-emerald-200">
                      {motorSkillsLevel[0]}
                    </span>
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
                <p className="text-sm text-zinc-200">
                  How long since your injury?
                </p>
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

            {planError && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {planError}
              </div>
            )}
            <div className="flex justify-end">
              <button
                className="flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={submit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner className="size-4" />}
                {isSubmitting ? "Generating..." : "Submit"}
              </button>
            </div>
          </>
        ) : (
          <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Your Workout Plan
                </h2>
                <p className="text-sm text-zinc-400">
                  Based on your responses, here is your current plan.
                </p>
              </div>
              <button
                className="rounded-md border border-zinc-600 px-4 py-2 text-xs font-semibold text-white hover:border-emerald-400/60 hover:text-emerald-200"
                type="button"
                onClick={() => {
                  setPlan(null);
                  setShowSurvey(true);
                }}
              >
                Re-create workout plan
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Progress: {completedSessions}/{totalSessions} sessions
                </span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="bg-emerald-500/15" />
            </div>

            <div className="space-y-4">
              {(plan ?? []).map((item, index) => {
                const repetitions = Math.max(1, item.days ?? 1);
                const exerciseLink = buildExerciseLink(item);
                const instances = Array.from(
                  { length: repetitions },
                  (_, idx) => {
                    const itemId = `week-${index + 1}-day-${idx + 1}`;
                    return {
                      itemId,
                      label: `Session ${idx + 1}`,
                      completed: completions[itemId] ?? false,
                    };
                  },
                );

                return (
                  <details
                    key={`${item.exercise}-${index}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-200"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white">
                      <span>
                        Week {index + 1}: {item.exercise}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {repetitions} sessions
                      </span>
                    </summary>
                    {item.description && (
                      <p className="mt-2 text-xs text-zinc-400">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
                      {item.dot_size != null && (
                        <span className="rounded-md bg-zinc-800 px-3 py-1">
                          Dot size: {item.dot_size}
                        </span>
                      )}
                      {item.speed != null && (
                        <span className="rounded-md bg-zinc-800 px-3 py-1">
                          Speed: {item.speed}
                        </span>
                      )}
                      {item.rest_time != null && (
                        <span className="rounded-md bg-zinc-800 px-3 py-1">
                          Rest: {item.rest_time}s
                        </span>
                      )}
                      {item.target_size != null && (
                        <span className="rounded-md bg-zinc-800 px-3 py-1">
                          Target size: {item.target_size}
                        </span>
                      )}
                      {item.num_targets != null && (
                        <span className="rounded-md bg-zinc-800 px-3 py-1">
                          Targets: {item.num_targets}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-3">
                      {instances.map((instance) => (
                        <label
                          key={instance.itemId}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                            instance.completed
                              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                              : "border-zinc-800 bg-zinc-900/60 text-zinc-200"
                          }`}
                        >
                          <div>
                            <div
                              className={`text-sm font-semibold ${
                                instance.completed
                                  ? "text-emerald-100"
                                  : "text-white"
                              }`}
                            >
                              {item.exercise}
                            </div>
                            <div
                              className={`text-xs ${
                                instance.completed
                                  ? "text-emerald-200/80"
                                  : "text-zinc-400"
                              }`}
                            >
                              {instance.label}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {exerciseLink && (
                              <Link
                                href={exerciseLink}
                                className="rounded-md border border-emerald-400/60 px-3 py-1 text-xs text-emerald-200 hover:border-emerald-300"
                              >
                                Start
                              </Link>
                            )}
                            <Checkbox
                              checked={instance.completed}
                              onCheckedChange={async (checked) => {
                                const completed = Boolean(checked);
                                setCompletions((prev) => ({
                                  ...prev,
                                  [instance.itemId]: completed,
                                }));
                                try {
                                  await savePlanCompletion({
                                    item_id: instance.itemId,
                                    completed,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Failed to save completion",
                                    error,
                                  );
                                  setCompletions((prev) => ({
                                    ...prev,
                                    [instance.itemId]: !completed,
                                  }));
                                }
                              }}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
