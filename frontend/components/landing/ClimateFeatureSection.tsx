"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ClimateFeatureSection() {
  const router = useRouter();

  return (
    <section className="relative w-full py-24 mt-32">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none rounded-2xl"></div>

      <div className="relative max-w-6xl mx-auto px-6 text-center backdrop-blur-xl rounded-2xl p-4">

        {/* Title */}
        <h2 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 drop-shadow-xl">
          TerraViT Climate Intelligence
        </h2>

        <p className="text-lg text-slate-300 max-w-3xl mx-auto">
          Convert raw satellite imagery into actionable environmental insights.  
          Detect heatwaves, vegetation loss, floods, and climate risks — long before they escalate.
        </p>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-10 mt-20">

          {/* Glass Card 1 */}
          <div className="group p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-blue-500/20">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold text-white mb-3">Heatwave Detection</h3>

            <p className="text-slate-300 mb-4">
              Reveal invisible thermal trends and early-stage heat stress indicators.
            </p>
            <span className="text-blue-400 font-medium">
              High-resolution anomaly mapping
            </span>

            {/* Glow Bar */}
            <div className="mt-6 h-1 w-full bg-gradient-to-r from-blue-300 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

          {/* Glass Card 2 */}
          <div className="group p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-green-500/20">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-white mb-3">Vegetation Loss Alerts</h3>

            <p className="text-slate-300 mb-4">
              Identify declining NDVI signals and environmental degradation with precision.
            </p>

            <span className="text-green-400 font-medium">
              Deforestation • Drought Stress
            </span>

            <div className="mt-6 h-1 w-full bg-gradient-to-r from-green-300 to-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

          {/* Glass Card 3 */}
          <div className="group p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-blue-500/20">
            <div className="text-4xl mb-4">🌊</div>
            <h3 className="text-xl font-semibold text-white mb-3">Flood & Water Change</h3>

            <p className="text-slate-300 mb-4">
              Detect rising water bodies and early flood-risk patterns from orbit.
            </p>

            <span className="text-blue-400 font-medium">
              Temporal water body monitoring
            </span>

            <div className="mt-6 h-1 w-full bg-gradient-to-r from-purple-300 to-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/climate-intel")}
          className="mt-16 inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-semibold
                     backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-lg
                     hover:bg-white/20 hover:shadow-blue-500/30 transition duration-300"
        >
          Explore Climate Intelligence
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
