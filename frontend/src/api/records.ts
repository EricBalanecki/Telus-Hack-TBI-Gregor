export type RecordEntry = {
  date: string;
  exercise: string;
  score: number;
  notes: string;
};

import { withApiBase } from "@/api/base";

const RECORDS_ENDPOINT = withApiBase("/records");

export const fetchRecords = async (): Promise<RecordEntry[]> => {
  const response = await fetch(RECORDS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to fetch records");
  }
  return (await response.json()) as RecordEntry[];
};

export const createRecord = async (record: RecordEntry) => {
  const response = await fetch(RECORDS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error("Failed to save record");
  }
  return (await response.json()) as RecordEntry;
};

export const getLatestScore = async (exercise: string) => {
  const records = await fetchRecords();
  const matching = records.filter((record) => record.exercise === exercise);
  if (matching.length === 0) {
    return null;
  }
  const latest = matching.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return latest.score;
};
