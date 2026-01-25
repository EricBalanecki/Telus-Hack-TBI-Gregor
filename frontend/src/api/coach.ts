export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

type CoachResponse = {
  reply?: string;
};

const COACH_ENDPOINT = "http://localhost:8000/coach";

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
