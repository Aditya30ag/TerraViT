"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ChangeLineChart({ before, after, delta }: {
  before: number[];
  after: number[];
  delta: number[];
}) {
  const data = before.map((b, i) => ({
    index: i,
    before: b,
    after: after[i],
    delta: delta[i],
  }));

  return (
    <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mt-6">
      {/* Glow BG */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <h3 className="relative text-lg font-semibold text-white mb-4 z-10">
        Change Trend (Before vs After)
      </h3>

      <div className="relative h-72 w-full z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="index" stroke="#aaa" tick={{ fill: "#cbd5e1" }} />
            <YAxis stroke="#aaa" tick={{ fill: "#cbd5e1" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px",
                color: "#fff",
                backdropFilter: "blur(8px)",
              }}
            />
            <Legend />

            <Line
              type="monotone"
              dataKey="before"
              name="Before"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

            <Line
              type="monotone"
              dataKey="after"
              name="After"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

            <Line
              type="monotone"
              dataKey="delta"
              name="Change"
              stroke="#f472b6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
