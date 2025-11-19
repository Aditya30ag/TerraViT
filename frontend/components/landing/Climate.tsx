"use client";
import { NavbarHero } from "@/components/landing/hero-with-video";
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Climate() {

  const [lat, setLat] = useState<string>("28.6139"); // Default: New Delhi
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

  const currentLocationIcon = L.divIcon({
    html:
      '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.45);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    className: "",
  });

  const staticLocationIcon = L.divIcon({
    html:
      '<div style="width:14px;height:14px;border-radius:9999px;background:#6b7280;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.35);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: "",
  });

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

  const mapRef = useRef<LeafletMap | null>(null);

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setLat(clickLat.toFixed(4));
        setLon(clickLng.toFixed(4));
        setSelectedLocation("custom");
      },
    });
    return null;
  };

  useEffect(() => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!Number.isNaN(latNum) && !Number.isNaN(lonNum) && mapRef.current) {
      mapRef.current.setView([latNum, lonNum]);
    }
  }, [lat, lon]);

  const fetchClimateRisk = async () => {
    setIsLoading(true);
    setError("");
    setSummary("");
    setScores(null);

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
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (e) {
      setError("Unable to reach TerraViT backend. Is it running on port 8000?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative mx-auto">
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-2">Climate Risk Snapshot</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Directly from TerraViT: enter a latitude / longitude and get a live climate
            risk score powered by real-time climate data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Preset location
              </label>
              <select
                value={selectedLocation}
                onChange={handleLocationChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATIC_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Latitude
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Longitude
              </label>
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchClimateRisk}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isLoading ? "Fetching..." : "Get Risk Score"}
              </button>
            </div>
          </div>

          <div className="mt-4 h-[480px] w-full overflow-hidden rounded-xl border border-border">
            <MapContainer
              center={[
                parseFloat(lat) || 28.6139,
                parseFloat(lon) || 77.2090,
              ]}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              whenCreated={(map) => {
                mapRef.current = map;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler />

              {/* Dropped pin for the currently selected location */}
              {!Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lon)) && (
                <Marker
                  position={[parseFloat(lat), parseFloat(lon)]}
                  icon={currentLocationIcon}
                />
              )}

              {/* Static preset location markers */}
              {STATIC_LOCATIONS.filter((loc) => loc.lat && loc.lon).map((loc) => (
                <Marker
                  key={loc.id}
                  position={[parseFloat(loc.lat), parseFloat(loc.lon)]}
                  icon={staticLocationIcon}
                  eventHandlers={{
                    click: () => {
                      setLat(loc.lat);
                      setLon(loc.lon);
                      setSelectedLocation(loc.id);
                    },
                  }}
                />
              ))}
            </MapContainer>
          </div>

          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </div>
          )}

          {scores && (
            <>
              <div className="mt-2 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Select statistic to highlight</span>
                <select
                  value={selectedStat}
                  onChange={(e) =>
                    setSelectedStat(e.target.value as typeof selectedStat)
                  }
                  className="w-full md:w-52 rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="overall_risk">Overall risk</option>
                  <option value="heat_risk">Heat</option>
                  <option value="flood_risk">Flood</option>
                  <option value="vegetation_stress">Vegetation stress</option>
                  <option value="air_quality_proxy">Air quality proxy</option>
                </select>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div
                  className={`rounded-md bg-muted p-3 ${
                    selectedStat === "overall_risk" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                <p className="text-muted-foreground">Overall risk</p>
                <p className="text-lg font-semibold">{(scores.overall_risk * 100).toFixed(0)}%</p>
              </div>
                <div
                  className={`rounded-md bg-muted p-3 ${
                    selectedStat === "heat_risk" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                <p className="text-muted-foreground">Heat</p>
                <p className="text-lg font-semibold">{(scores.heat_risk * 100).toFixed(0)}%</p>
              </div>
                <div
                  className={`rounded-md bg-muted p-3 ${
                    selectedStat === "flood_risk" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                <p className="text-muted-foreground">Flood</p>
                <p className="text-lg font-semibold">{(scores.flood_risk * 100).toFixed(0)}%</p>
              </div>
                <div
                  className={`rounded-md bg-muted p-3 ${
                    selectedStat === "vegetation_stress" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                <p className="text-muted-foreground">Vegetation stress</p>
                <p className="text-lg font-semibold">{(scores.vegetation_stress * 100).toFixed(0)}%</p>
              </div>
                <div
                  className={`rounded-md bg-muted p-3 ${
                    selectedStat === "air_quality_proxy" ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                <p className="text-muted-foreground">Air quality proxy</p>
                <p className="text-lg font-semibold">{(scores.air_quality_proxy * 100).toFixed(0)}%</p>
              </div>
              </div>
            </>
          )}

          {summary && (
            <p className="mt-3 text-xs text-muted-foreground">{summary}</p>
          )}
        </section>

        
      </div>
    </>
  );
}
