import React from "react";

const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative w-full"
    >
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none"></div>

      {/* Centered Grid */}
      <div className="relative max-w-6xl mx-auto px-6 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] items-start">

        {/* LEFT GLASS PANEL */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl space-y-6">

          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            Under the hood
          </h2>

          <p className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            Vision Transformers tuned for planetary-scale time series.
          </p>

          <ul className="space-y-4 text-slate-300 text-[15px] leading-relaxed">
            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">•</span>
              <div>
                <span className="text-white font-medium">Multi-sensor fusion.</span>{" "}
                Ingest multi-spectral, SAR, and thermal imagery across constellations.
              </div>
            </li>

            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">•</span>
              <div>
                <span className="text-white font-medium">Temporal context.</span>{" "}
                Each prediction uses weeks to years of historical and seasonal signals.
              </div>
            </li>

            <li className="flex gap-3">
              <span className="text-blue-300 font-bold">•</span>
              <div>
                <span className="text-white font-medium">Explainable outputs.</span>{" "}
                Attention heatmaps and attribution traces reveal model focus areas.
              </div>
            </li>
          </ul>
        </div>

        {/* RIGHT GLASS PANEL */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-5">

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            From raw imagery to insight
          </p>

          <ol className="space-y-4 text-sm text-slate-300 list-decimal list-inside leading-relaxed">

            <li>
              Ingest raw geospatial tiles from your Earth Engine, STAC, or satellite archive.
            </li>

            <li>
              TerraViT performs inference to generate climate risk scores, change maps,  
              and spatiotemporal predictions.
            </li>

            <li>
              Results flow seamlessly into dashboards, Jupyter notebooks, alerts,  
              or automated operations workflows.
            </li>

          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
