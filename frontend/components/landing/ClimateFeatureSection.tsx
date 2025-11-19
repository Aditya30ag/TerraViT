"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function ClimateFeatureSection() {
  const router = useRouter();

  return (
    <section className="w-full py-20 rounded-2xl">
      <div className="max-w-6xl mx-auto px-6 text-center">

        {/* Title */}
        <h2 className="text-4xl font-bold text-white mb-6">
          TerraViT Climate Intelligence
        </h2>
        <p className="text-lg text-gray-100 max-w-3xl mx-auto">
          Convert raw satellite imagery into actionable environmental insights.  
          Detect heatwaves, vegetation loss, floods, and climate risks — long before they escalate.
        </p>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-14">

          {/* Card 1 */}
          <div className="p-8 bg-white shadow-xl rounded-2xl border hover:shadow-2xl transition-all">
            <h3 className="text-xl font-semibold mb-3">🔥 Heatwave Detection</h3>
            <p className="text-gray-600 mb-4">
              Reveal invisible thermal trends and early-stage heat stress indicators.
            </p>
            <span className="text-blue-600 font-medium">High-res anomaly maps</span>
          </div>

          {/* Card 2 */}
          <div className="p-8 bg-white shadow-xl rounded-2xl border hover:shadow-2xl transition-all">
            <h3 className="text-xl font-semibold mb-3">🌱 Vegetation Loss Alerts</h3>
            <p className="text-gray-600 mb-4">
              TerraViT identifies declining NDVI signatures and environmental degradation.
            </p>
            <span className="text-green-600 font-medium">Deforestation • Drought Stress</span>
          </div>

          {/* Card 3 */}
          <div className="p-8 bg-white shadow-xl rounded-2xl border hover:shadow-2xl transition-all">
            <h3 className="text-xl font-semibold mb-3">🌊 Flood & Water Change</h3>
            <p className="text-gray-600 mb-4">
              Detect rising water bodies and early flood-risk patterns from space.
            </p>
            <span className="text-blue-600 font-medium">Temporal water mapping</span>
          </div>

        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/climate-intel")}
          className="mt-14 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg"
        >
          Explore Climate Intelligence
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
