"use client";

import React, { useState, useMemo } from "react";

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
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm mt-10">
      <h2 className="text-2xl font-semibold mb-2">Satellite Change Detective</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Upload two satellite images of the same area at different times. TerraViT
        will compare them and quantify how much has changed.
      </p>

      {/* File Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Before image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-blue-700"
          />
          {beforeFile && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Selected: {beforeFile.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            After image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-blue-700"
          />
          {afterFile && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Selected: {afterFile.name}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <p className="text-[11px] text-muted-foreground max-w-xl">
          Tip: Use cropped satellite images of the same location and resolution for the
          most meaningful comparison.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {isLoading ? "Analyzing..." : "Run Change Detection"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <div className="mt-3 space-y-3 text-xs text-black">

          {/* Change Score */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground mb-1">Change score</p>
            <p className="text-lg font-semibold">
              {(result.change_score * 100).toFixed(1)}%
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {result.summary}
            </p>
          </div>

          {/* HISTOGRAM SUMMARY */}
          {histogram.length > 0 && (
            <div className="rounded-md border border-border p-3 overflow-x-auto">
              <p className="text-[11px] font-medium mb-2 text-black">
                Histogram of per-class probability changes
              </p>
              <table className="min-w-full text-[11px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-1 text-left">Range</th>
                    <th className="px-2 py-1 text-left">Count</th>
                    <th className="px-2 py-1 text-left">Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {histogram.map((count, i) => (
                    <tr key={i} className="odd:bg-background even:bg-muted/30">
                      <td className="px-2 py-1">
                        {bins[i]} → {bins[i + 1]}
                      </td>
                      <td className="px-2 py-1">{count}</td>
                      <td className="px-2 py-1">
                        {((count / total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PER-CLASS TABLE */}
          {result.per_class_change && (
            <div className="rounded-md border border-border p-3 overflow-x-auto">
              <p className="text-[11px] font-medium mb-2 text-black">
                Per-class probability change (after - before)
              </p>
              <table className="min-w-full text-[11px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-1 text-left">Class index</th>
                    <th className="px-2 py-1 text-left">Before</th>
                    <th className="px-2 py-1 text-left">After</th>
                    <th className="px-2 py-1 text-left">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {result.per_class_change.map((delta, idx) => (
                    <tr key={idx} className="odd:bg-background even:bg-muted/30">
                      <td className="px-2 py-1">{idx}</td>
                      <td className="px-2 py-1">
                        {result.class_scores_before?.[idx]?.toFixed(3) ?? "-"}
                      </td>
                      <td className="px-2 py-1">
                        {result.class_scores_after?.[idx]?.toFixed(3) ?? "-"}
                      </td>
                      <td className="px-2 py-1">
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
    </section>
  );
}
