export type PlanItem = {
  exercise: string;
  description?: string;
  dot_size?: number | null;
  speed?: number | null;
  rest_time?: number | null;
  target_size?: number | null;
  num_targets?: number | null;
  days?: number | null;
};

export type PlanInput = {
  motor_level: number;
  visual_level: number;
  dizzy_tracking_movement: boolean;
  tired_using_screens: boolean;
};

import { withApiBase } from "@/api/base";

const PLAN_ENDPOINT = withApiBase("/plan");

export const fetchPlan = async (): Promise<PlanItem[]> => {
  const response = await fetch(PLAN_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to load plan");
  }
  return (await response.json()) as PlanItem[];
};

export const createPlan = async (payload: PlanInput): Promise<PlanItem[]> => {
  const response = await fetch(PLAN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create plan");
  }
  return (await response.json()) as PlanItem[];
};
