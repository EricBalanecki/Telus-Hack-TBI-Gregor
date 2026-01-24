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
    <div className="min-h-screen bg-white p-8 font-sans text-gray-900">

      <div className="bg-gray-50 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Exercise Records</h2>
        {records.length === 0 ? (
          <p className="text-gray-700">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">Exercise</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-4 py-2">{r.date}</td>
                    <td className="border border-gray-300 px-4 py-2">{r.exercise}</td>
                    <td className="border border-gray-300 px-4 py-2">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
