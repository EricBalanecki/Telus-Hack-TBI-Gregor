export type PlanCompletionMap = Record<string, boolean>;

export type PlanCompletionUpdate = {
  item_id: string;
  completed: boolean;
};

const PLAN_COMPLETIONS_ENDPOINT = "http://localhost:8000/plan/completions";

export const fetchPlanCompletions = async (): Promise<PlanCompletionMap> => {
  const response = await fetch(PLAN_COMPLETIONS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to load plan completions");
  }
  return (await response.json()) as PlanCompletionMap;
};

export const savePlanCompletion = async (
  payload: PlanCompletionUpdate,
): Promise<PlanCompletionUpdate> => {
  const response = await fetch(PLAN_COMPLETIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to save plan completion");
  }
  return (await response.json()) as PlanCompletionUpdate;
};
