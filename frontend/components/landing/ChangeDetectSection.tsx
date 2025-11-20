"use client";

import React, { useState, useMemo } from "react";
import ChangeLineChart from "@/components/landing/ChangeLineChart";

const API_BASE_URL = "http://localhost:8000";

// Histogram bin edges
const bins = [-1, -0.5, -0.2, 0, 0.2, 0.5, 1];

export default function ChangeDetectSection() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{
    change_score: number;
    class_scores_before?: number[];
    class_scores_after?: number[];
    per_class_change?: number[];
    dominant_change_class_index?: number | null;
    summary: string;
  } | null>(null);

  const handleSubmit = async () => {
    setError("");
    setResult(null);

    if (!beforeFile || !afterFile) {
      setError("Please upload both before and after images.");
      return;
    }

    const formData = new FormData();
    formData.append("before", beforeFile);
    formData.append("after", afterFile);

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/change/detect`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setError(errData.detail || "Change detection failed.");
        return;
      }

      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError("Unable to reach TerraViT backend. Is it running on port 8000?");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // HISTOGRAM COMPUTATION
  // -----------------------------
  const histogram = useMemo(() => {
    if (!result?.per_class_change) return [];

    const h = Array(bins.length - 1).fill(0);

    for (const v of result.per_class_change) {
      for (let i = 0; i < bins.length - 1; i++) {
        if (v >= bins[i] && v < bins[i + 1]) {
          h[i]++;
          break;
        }
      }
    }

    return h;
  }, [result?.per_class_change]);

  const total = result?.per_class_change?.length ?? 0;

  return (
    <section className="relative mt-20">
      {/* 🔵 Ambient Glowing Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-2xl"></div>

      {/* MAIN GLASS WRAPPER */}
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">

        {/* TITLE */}
        <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
          Satellite Change Detection
        </h2>

        <p className="text-slate-300 text-sm max-w-2xl mb-8">
          Upload two satellite images of the same region from different times.
          TerraViT will quantify the environmental and land-use changes.
        </p>

        {/* ---------------- FILE INPUTS ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">

          {/* BEFORE IMAGE */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <label className="text-xs text-slate-300 mb-2 block">Before Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-200 file:rounded-lg file:border-0 file:bg-blue-600
                         file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-blue-700 cursor-pointer"
            />

            {beforeFile && (
              <p className="mt-2 text-[11px] text-slate-400">Selected: {beforeFile.name}</p>
            )}
          </div>

          {/* AFTER IMAGE */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <label className="text-xs text-slate-300 mb-2 block">After Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-200 file:rounded-lg file:border-0 file:bg-blue-600
                         file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-blue-700 cursor-pointer"
            />

            {afterFile && (
              <p className="mt-2 text-[11px] text-slate-400">Selected: {afterFile.name}</p>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-[11px] text-slate-400">
            Tip: Better results come from same-location, same-resolution images.
          </p>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg
                      hover:bg-blue-700 transition disabled:bg-blue-400 backdrop-blur-lg"
          >
            {isLoading ? "Analyzing..." : "Run Change Detection"}
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 backdrop-blur-lg bg-red-500/20 border border-red-400/30 text-red-200 p-3 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* =====================================================
                        ANALYSIS RESULTS (GLASS UI)
        ===================================================== */}
        {result && (
          <div className="mt-10 space-y-8">

            {/* CHANGE SCORE PANEL */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <p className="text-slate-300 text-sm mb-1">Change Score</p>

              <p className="text-4xl font-bold text-white mb-2">
                {(result.change_score * 100).toFixed(1)}%
              </p>

              <p className="text-[12px] text-slate-400">{result.summary}</p>
            </div>

            {/* LINE CHART (GLASS) */}
            {result.class_scores_before &&
              result.class_scores_after &&
              result.per_class_change && (
                <ChangeLineChart
                  before={result.class_scores_before}
                  after={result.class_scores_after}
                  delta={result.per_class_change}
                />
              )}

            {/* HISTOGRAM TABLE */}
            {histogram.length > 0 && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl overflow-x-auto">
                <p className="text-sm font-semibold text-white mb-3">
                  Histogram of Class Probability Changes
                </p>

                <table className="text-[11px] w-full text-white">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="p-2 text-left">Range</th>
                      <th className="p-2 text-left">Count</th>
                      <th className="p-2 text-left">Percent</th>
                    </tr>
                  </thead>

                  <tbody>
                    {histogram.map((count, i) => (
                      <tr key={i} className="odd:bg-white/5 even:bg-white/10">
                        <td className="p-2">{bins[i]} → {bins[i + 1]}</td>
                        <td className="p-2">{count}</td>
                        <td className="p-2">{((count / total) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PER-CLASS TABLE */}
            {result.per_class_change && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl overflow-x-auto">
                <p className="text-sm font-semibold text-white mb-3">
                  Per-Class Probability Change
                </p>

                <table className="text-[11px] w-full text-white">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="p-2">Class</th>
                      <th className="p-2">Before</th>
                      <th className="p-2">After</th>
                      <th className="p-2">Δ Change</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.per_class_change.map((delta, idx) => (
                      <tr key={idx} className="odd:bg-white/5 even:bg-white/10">
                        <td className="p-2">{idx}</td>
                        <td className="p-2">
                          {result.class_scores_before?.[idx]?.toFixed(3) ?? "-"}
                        </td>
                        <td className="p-2">
                          {result.class_scores_after?.[idx]?.toFixed(3) ?? "-"}
                        </td>
                        <td className="p-2">
                          {typeof delta === "number" ? delta.toFixed(3) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
}
