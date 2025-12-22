"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NavbarHero } from "@/components/landing/hero-with-video";
const ClimateMap = dynamic(() => import("@/components/landing/ClimateMap"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface Alert {
  id: string;
  lat: number;
  lon: number;
  alert_type: string;
  score: number;
  source: string;
  timestamp: string;
  metadata?: any;
}

function prettyTime(iso?: string) {
  try {
    return new Date(iso || "").toLocaleString();
  } catch {
    return iso;
  }
}

function AlertFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let es: EventSource | null = null;
    let reconnectDelay = 2000; // ms
    let reconnectTimer: number | undefined;

    const buildUrl = (path: string) => {
      // Prefer to avoid mixed-content errors: if running on https and API_BASE uses http, try same-origin first
      let url = `${API_BASE}${path}`;
      if (typeof window !== "undefined" && window.location.protocol === "https:") {
        if (url.startsWith("http:") && !url.startsWith(window.location.origin)) {
          url = `${window.location.origin}${path}`;
        }
      }
      return url;
    };

    const fetchInitial = async () => {
      try {
        const res = await fetch(buildUrl("/alerts"));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        setAlerts(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch alerts:", err);
        if (!mounted) return;
        setError(`Failed to fetch alerts from ${buildUrl("/alerts")} — ${err?.message ?? err}`);
      }
    };

    const scheduleReconnect = () => {
      reconnectTimer = window.setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 60000);
        connect();
      }, reconnectDelay);
    };

    const connect = () => {
      try {
        const url = buildUrl("/alerts/stream");
        es = new EventSource(url);

        es.onmessage = (e) => {
          try {
            const obj = JSON.parse(e.data) as Alert;
            setAlerts((s) => [obj, ...s].slice(0, 200));
            setError(null);
          } catch (err) {
            // ignore malformed messages
          }
        };

        es.onerror = (ev) => {
          console.error("EventSource error", ev);
          setError(`Lost connection to alerts stream (${url}). Reconnecting...`);
          try {
            es?.close();
          } catch {}
          es = null;
          scheduleReconnect();
        };
      } catch (err) {
        console.error("Could not open EventSource", err);
        setError("Could not open live alerts stream.");
        scheduleReconnect();
      }
    };

    fetchInitial().then(() => connect());

    return () => {
      mounted = false;
      try {
        es?.close();
      } catch {}
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {error && <div className="text-sm text-amber-300">{error}</div>}
      {!error && alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No alerts yet — subscribe to a location or simulate one.</p>
      ) : (
        alerts.map((a) => (
          <div key={a.id} className="group backdrop-blur-md bg-white/3 border border-white/10 rounded-2xl p-4 shadow-lg mb-3 hover:bg-white/6 transition">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-white">
                  <span className="inline-block mr-2 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-400 to-purple-300 text-black">
                    {a.alert_type.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-200">— {(a.score * 100).toFixed(0)}%</span>
                </div>
                <div className="text-xs text-slate-300">{a.source}</div>
                <div className="text-xs text-slate-300">{a.lat.toFixed(4)}, {a.lon.toFixed(4)}</div>
              </div>
              <div className="text-xs text-slate-300">{prettyTime(a.timestamp)}</div>
            </div>
            <div className="mt-2 text-xs">
              <a href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lon}#map=12/${a.lat}/${a.lon}`} target="_blank" rel="noreferrer" className="underline text-blue-300">Open on map</a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MonitorControls() {
  const [lat, setLat] = useState<string>("28.6139");
  const [lon, setLon] = useState<string>("77.2090");
  const [threshold, setThreshold] = useState<string>("0.7");
  const [type, setType] = useState<string>("flood");
  const [score, setScore] = useState<string>("0.9");
  const [msg, setMsg] = useState<string>("");

  const [selectedLocation, setSelectedLocation] = useState<string>("custom");
  const STATIC_LOCATIONS = [
    { id: "custom", name: "Custom (manual input)", lat: "", lon: "" },
    { id: "delhi", name: "New Delhi, India", lat: "28.6139", lon: "77.2090" },
    { id: "mumbai", name: "Mumbai, India", lat: "19.0760", lon: "72.8777" },
    { id: "bengaluru", name: "Bengaluru, India", lat: "12.9716", lon: "77.5946" },
    { id: "london", name: "London, UK", lat: "51.5074", lon: "-0.1278" },
    { id: "newyork", name: "New York, USA", lat: "40.7128", lon: "-74.0060" },
  ];

  const handleSelectedLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value);
    const match = STATIC_LOCATIONS.find((loc) => loc.id === value);
    if (match && match.lat && match.lon) {
      setLat(match.lat);
      setLon(match.lon);
    }
  };

  async function register() {
    try {
      const res = await fetch(`${API_BASE}/alerts/register_location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon), alert_threshold: parseFloat(threshold) }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const d = await res.json();
      setMsg(`Registered id ${d.id}`);
    } catch (err: any) {
      console.error("Register failed", err);
      setMsg(`Register failed: ${err?.message ?? err}`);
    }
  }

  async function simulate() {
    try {
      const res = await fetch(`${API_BASE}/alerts/simulate?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&alert_type=${encodeURIComponent(type)}&score=${encodeURIComponent(score)}`, {
        method: "POST",
      });
      if (res.ok) {
        const d = await res.json();
        setMsg(`Simulated alert ${d.id}`);
      } else if (res.status === 204) {
        setMsg(`No alert created (below threshold).`);
      } else {
        setMsg(`Simulation failed (${res.status})`);
      }
    } catch (err: any) {
      console.error("Simulation failed", err);
      setMsg(`Simulation failed: ${err?.message ?? err}`);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-slate-300">Latitude</label>
      <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <label className="block text-xs text-slate-300">Longitude</label>
      <input value={lon} onChange={(e) => setLon(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <label className="block text-xs text-slate-300">Alert threshold (0–1)</label>
      <input value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <div className="flex gap-2">
        <button onClick={register} className="rounded-md px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-black font-semibold shadow-md">Subscribe</button>
        <button onClick={simulate} className="rounded-md px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold shadow-md">Simulate</button>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-slate-300 mb-1">Preset location / pick on map</label>
        <select value={selectedLocation} onChange={handleSelectedLocationChange} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3">
          {STATIC_LOCATIONS.map((loc) => (
            <option key={loc.id} value={loc.id} className="text-black">{loc.name}</option>
          ))}
        </select>

        <div className="h-48 rounded-md overflow-hidden border border-white/10">
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
      </div>

      <hr className="border-white/6" />
      <div>
        <label className="block text-xs text-slate-300">Simulate type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="flood">Flood</option>
          <option value="fire">Fire</option>
        </select>
        <label className="block text-xs text-slate-300">Simulate score (0–1)</label>
        <input value={score} onChange={(e) => setScore(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/3 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      {msg && <div className="text-sm text-slate-300">{msg}</div>}
    </div>
  );
}


export default function Home() {

  return (
    <>
      <NavbarHero
        brandName="TerraViT"
        backgroundImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80"
      />
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-46 space-y-12">
          <div className="relative z-30 space-y-24 pb-24 w-[1200px] mx-auto">
            <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300">
              Real-time Monitoring & Alerts 🚨
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/6 via-purple-500/6 to-transparent blur-3xl" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h2 className="text-xl font-semibold mb-2">Live Alerts Feed</h2>
                  <AlertFeed />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/6 via-purple-500/6 to-transparent blur-3xl" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h2 className="text-xl font-semibold mb-2">Monitor / Simulate</h2>
                  <MonitorControls />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
