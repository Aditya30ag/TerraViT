"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const ClimateMap = dynamic(() => import("./ClimateMap"), { ssr: false });

export default function Climate() {
  const [lat, setLat] = useState<string>("28.6139");
  const [lon, setLon] = useState<string>("77.2090");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("");

  const [scores, setScores] = useState<{
    heat_risk: number;
    flood_risk: number;
    vegetation_stress: number;
    air_quality_proxy: number;
    overall_risk: number;
  } | null>(null);

  const [history, setHistory] = useState<
    | {
        year: number;
        scores: {
          heat_risk: number;
          flood_risk: number;
          vegetation_stress: number;
          air_quality_proxy: number;
          overall_risk: number;
        };
      }[]
    | null
  >(null);

  const [selectedLocation, setSelectedLocation] = useState<string>("custom");
  const [selectedStat, setSelectedStat] = useState<
    | "overall_risk"
    | "heat_risk"
    | "flood_risk"
    | "vegetation_stress"
    | "air_quality_proxy"
  >("overall_risk");

  const STATIC_LOCATIONS = [
    { id: "custom", name: "Custom (manual input)", lat: "", lon: "" },
    { id: "delhi", name: "New Delhi, India", lat: "28.6139", lon: "77.2090" },
    { id: "mumbai", name: "Mumbai, India", lat: "19.0760", lon: "72.8777" },
    { id: "bengaluru", name: "Bengaluru, India", lat: "12.9716", lon: "77.5946" },
    { id: "london", name: "London, UK", lat: "51.5074", lon: "-0.1278" },
    { id: "newyork", name: "New York, USA", lat: "40.7128", lon: "-74.0060" },
  ];

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value);
    const match = STATIC_LOCATIONS.find((loc) => loc.id === value);
    if (match && match.lat && match.lon) {
      setLat(match.lat);
      setLon(match.lon);
    }
  };

  const API_BASE_URL = "http://localhost:8000";

  const fetchClimateRisk = async () => {
    setIsLoading(true);
    setError("");
    setSummary("");
    setScores(null);
    setHistory(null);

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      setError("Please enter valid numeric latitude and longitude.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/risk/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latNum, lon: lonNum }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Failed to fetch climate risk.");
        return;
      }

      const data = await response.json();
      setSummary(data.summary);
      setScores(data.scores);

      // Fetch 10-year history
      try {
        const historyResp = await fetch(`${API_BASE_URL}/risk/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: latNum, lon: lonNum }),
        });

        if (historyResp.ok) {
          const historyData = await historyResp.json();
          if (Array.isArray(historyData.years)) {
            setHistory(historyData.years);
          }
        }
      } catch {}
    } catch {
      setError("Unable to reach TerraViT backend. Is it running on port 8000?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mx-auto mt-20">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none"></div>

      {/* MAIN GLASS CONTAINER */}
      <section className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl text-white">

        <h2 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
          Climate Risk Snapshot
        </h2>

        <p className="text-slate-300 text-sm mb-6">
          Enter latitude & longitude to generate an AI-driven climate risk score.
        </p>

        {/* ---------------- INPUTS IN GLASS CARDS ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* Location Selector */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-slate-300 mb-1">Preset Location</label>

            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full bg-white/10 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            >
              {STATIC_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-black">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Latitude */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-slate-300 mb-1">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full bg-white/10 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Longitude */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-slate-300 mb-1">Longitude</label>
            <input
              type="text"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full bg-white/10 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Fetch Button */}
          <div className="flex items-end">
            <button
              onClick={fetchClimateRisk}
              disabled={isLoading}
              className="w-full backdrop-blur-lg bg-blue-600/80 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm shadow-lg transition disabled:bg-blue-400"
            >
              {isLoading ? "Fetching..." : "Get Risk Score"}
            </button>
          </div>

        </div>

        {/* ---------------- MAP SECTION (GLASS FRAME) ---------------- */}
        <div className="relative h-[480px] w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <ClimateMap
            lat={lat}
            lon={lon}
            setLat={setLat}
            setLon={setLon}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            STATIC_LOCATIONS={STATIC_LOCATIONS}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 backdrop-blur-lg bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* ---------------- SCORES ---------------- */}
        {scores && (
          <>
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <span className="text-slate-300 text-xs">Highlight statistic:</span>

              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value as any)}
                className="w-full md:w-56 bg-white/10 border border-white/10 text-white rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400"
              >
                <option value="overall_risk">Overall risk</option>
                <option value="heat_risk">Heat</option>
                <option value="flood_risk">Flood</option>
                <option value="vegetation_stress">Vegetation stress</option>
                <option value="air_quality_proxy">Air quality proxy</option>
              </select>
            </div>

            {/* Metric Cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(scores).map(([key, value]) => (
                <div
                  key={key}
                  className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 transition shadow-lg ${
                    selectedStat === key ? "ring-2 ring-blue-400 shadow-blue-500/20" : ""
                  }`}
                >
                  <p className="text-slate-300 capitalize text-xs">{key.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-bold">{(value * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SUMMARY */}
        {summary && (
          <p className="mt-5 text-xs text-slate-300 backdrop-blur-sm bg-white/5 border border-white/10 p-4 rounded-xl">
            {summary}
          </p>
        )}

        {/* ---------------- HISTORY TABLE (GLASS) ---------------- */}
        {history && history.length > 0 && (
          <div className="mt-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold mb-3 text-white">
              Last 10 years – Climate Risk Model
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-white">
                <thead className="bg-white/10 text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Year</th>
                    <th className="px-3 py-2 text-left">Overall</th>
                    <th className="px-3 py-2 text-left">Heat</th>
                    <th className="px-3 py-2 text-left">Flood</th>
                    <th className="px-3 py-2 text-left">Vegetation</th>
                    <th className="px-3 py-2 text-left">Air Quality</th>
                  </tr>
                </thead>

                <tbody>
                  {history
                    .slice()
                    .sort((a, b) => a.year - b.year)
                    .map((entry) => (
                      <tr
                        key={entry.year}
                        className="odd:bg-white/5 even:bg-white/10"
                      >
                        <td className="px-3 py-2">{entry.year}</td>
                        <td className="px-3 py-2">{(entry.scores.overall_risk * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2">{(entry.scores.heat_risk * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2">{(entry.scores.flood_risk * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2">{(entry.scores.vegetation_stress * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2">{(entry.scores.air_quality_proxy * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
