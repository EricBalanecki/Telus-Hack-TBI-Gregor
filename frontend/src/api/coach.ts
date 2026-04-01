export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

type CoachResponse = {
  reply?: string;
};

import { withApiBase } from "@/api/base";

const COACH_ENDPOINT = withApiBase("/coach");

export const sendCoachMessage = async (
  messages: CoachMessage[],
): Promise<string> => {
  const response = await fetch(COACH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) {
    throw new Error("Coach request failed");
  }
  const data = (await response.json()) as CoachResponse;
  const reply = data.reply?.trim();
  if (!reply) {
    throw new Error("Empty coach response");
  }
  return reply;
};
