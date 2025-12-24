"use client";

import React, { useState } from "react";

export default function MarkDiffByOutline({
  beforeSrc,
  afterSrc,
  heatmapSrc,
  vegetationSrc,
  floodSrc,
  vegetationOutlineSrc,
  floodOutlineSrc,
}: {
  beforeSrc: string;
  afterSrc: string;
  heatmapSrc?: string;
  vegetationSrc?: string;
  floodSrc?: string;
  vegetationOutlineSrc?: string;
  floodOutlineSrc?: string;
}) {
  const [showHeat, setShowHeat] = useState(true);
  const [showVeg, setShowVeg] = useState(true);
  const [showFlood, setShowFlood] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [baseImage, setBaseImage] = useState<"after" | "before">("after");
  const [showVegOutline, setShowVegOutline] = useState(false);
  const [showWaterOutline, setShowWaterOutline] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-white/10 p-3">
        {/* Thumbnails for original images */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setBaseImage("before")}
            className={`w-1/2 rounded-md overflow-hidden border ${baseImage === "before" ? "border-blue-400" : "border-white/10"}`}
            title="Use Before image as base"
          >
            <div className="text-xs p-1 text-slate-300 bg-white/3 text-center">Before</div>
            <div className="w-full" style={{ height: 120 }}>
              <img src={beforeSrc} alt="Before" className="w-full h-full object-contain" />
            </div>
          </button>

          <button
            onClick={() => setBaseImage("after")}
            className={`w-1/2 rounded-md overflow-hidden border ${baseImage === "after" ? "border-blue-400" : "border-white/10"}`}
            title="Use After image as base"
          >
            <div className="text-xs p-1 text-slate-300 bg-white/3 text-center">After</div>
            <div className="w-full" style={{ height: 120 }}>
              <img src={afterSrc} alt="After" className="w-full h-full object-contain" />
            </div>
          </button>
        </div>

        <div className="relative w-full border border-white/5 rounded-md overflow-hidden" style={{ paddingTop: "56%" }}>
          {/* Base image (selectable) */}
          <img src={baseImage === "after" ? afterSrc : beforeSrc} alt="Base" className="absolute inset-0 w-full h-full object-contain" style={{ top: 0, left: 0 }} />

          {/* heatmap overlay */}
          {heatmapSrc && showHeat && (
            <img
              src={heatmapSrc}
              alt="Heatmap"
              className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
              style={{ opacity, top: 0, left: 0 }}
            />
          )}

          {/* vegetation mask (fill or outline) */}
          {vegetationSrc && showVeg && !showVegOutline && (
            <img src={vegetationSrc} alt="Vegetation" className="absolute inset-0 w-full h-full object-contain" style={{ top: 0, left: 0 }} />
          )}
          {/* vegetation outline */}
          {vegetationOutlineSrc && showVeg && showVegOutline && (
            <img src={vegetationOutlineSrc} alt="Vegetation Outline" className="absolute inset-0 w-full h-full object-contain" style={{ top: 0, left: 0 }} />
          )}

          {/* flood mask (fill or outline) */}
          {floodSrc && showFlood && !showWaterOutline && (
            <img src={floodSrc} alt="Flood" className="absolute inset-0 w-full h-full object-contain" style={{ top: 0, left: 0 }} />
          )}
          {/* flood outline */}
          {floodOutlineSrc && showFlood && showWaterOutline && (
            <img src={floodOutlineSrc} alt="Flood Outline" className="absolute inset-0 w-full h-full object-contain" style={{ top: 0, left: 0 }} />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Overlay Controls</p>
            <p className="text-xs text-slate-400">Toggle heatmap and masks, adjust opacity.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
            <span className="text-sm">Heatmap</span>
          </label>

          <div className="inline-flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showVeg} onChange={(e) => setShowVeg(e.target.checked)} />
              <span className="text-sm">Vegetation Loss</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showVegOutline} onChange={(e) => setShowVegOutline(e.target.checked)} />
              <span className="text-xs text-slate-400">Show Outline</span>
            </label>
          </div>

          <div className="inline-flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showFlood} onChange={(e) => setShowFlood(e.target.checked)} />
              <span className="text-sm">Flood / Water Increase</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showWaterOutline} onChange={(e) => setShowWaterOutline(e.target.checked)} />
              <span className="text-xs text-slate-400">Show Outline</span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Heatmap Opacity: {Math.round(opacity * 100)}%</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
          {beforeSrc && (
            <a href={beforeSrc} download="before.png" className="px-3 py-2 bg-slate-700 text-white rounded-md text-sm">Download Before</a>
          )}
          {afterSrc && (
            <a href={afterSrc} download="after.png" className="px-3 py-2 bg-slate-700 text-white rounded-md text-sm">Download After</a>
          )}
          {heatmapSrc && (
            <a href={heatmapSrc} download="heatmap.png" className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Download Heatmap</a>
          )}

          {vegetationSrc && (
            <a href={vegetationSrc} download="vegetation_mask.png" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Download Vegetation Mask</a>
          )}
          {vegetationOutlineSrc && (
            <a href={vegetationOutlineSrc} download="vegetation_outline.png" className="px-3 py-2 bg-green-700 text-white rounded-md text-sm">Download Vegetation Outline</a>
          )}

          {floodSrc && (
            <a href={floodSrc} download="flood_mask.png" className="px-3 py-2 bg-cyan-600 text-white rounded-md text-sm">Download Flood Mask</a>
          )}
          {floodOutlineSrc && (
            <a href={floodOutlineSrc} download="flood_outline.png" className="px-3 py-2 bg-cyan-700 text-white rounded-md text-sm">Download Flood Outline</a>
          )}
        </div>

        <div className="text-xs text-slate-400">
          <p>Notes:</p>
          <ul className="list-disc pl-4">
            <li>Heatmap shows magnitude of per-patch model feature change (prototype).</li>
            <li>Vegetation/flood masks are heuristic proxies (RGB-based). They are useful for quick inspection but not a substitute for trained semantic models.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
