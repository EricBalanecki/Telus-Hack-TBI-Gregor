"use client";

import React, { useEffect, useState } from "react";

type RecordType = {
  date: string;
  exercise: string;
  notes: string;
};

export default function ProgressPage() {
  const [records, setRecords] = useState<RecordType[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch(console.error);
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight">
          Exercise Records
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-base text-zinc-300">
          View your past eye exercise sessions and notes.
        </p>

        {/* Content Card */}
        <div className="w-full max-w-4xl rounded-lg border border-zinc-800 bg-zinc-900 p-6">

          {records.length === 0 ? (
            <p className="text-zinc-400">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">

                <thead>
                  <tr className="border-b text-left border-zinc-700">
                    <th className="px-4 py-2 text-sm font-semibold text-zinc-300">
                      Date
                    </th>
                    <th className="px-4 py-2 text-sm font-semibold text-zinc-300">
                      Exercise
                    </th>
                    <th className="px-4 py-2 text-sm font-semibold text-zinc-300">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((r, idx) => (
                    <tr
                      key={idx}
                      className="border-b text-left border-zinc-800 hover:bg-zinc-800/50 transition"
                    >
                      <td className="px-4 py-2 text-sm text-white">
                        {r.date}
                      </td>
                      <td className="px-4 py-2 text-sm text-white">
                        {r.exercise}
                      </td>
                      <td className="px-4 py-2 text-sm text-zinc-300">
                        {r.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
