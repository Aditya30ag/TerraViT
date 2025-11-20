import React from "react";

const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="relative w-full">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none"></div>

      {/* Section Wrapper */}
      <div className="relative max-w-6xl mx-auto px-6 space-y-14">

        {/* Header Glass Panel */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            What TerraViT sees
          </h2>

          <p className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            High-resolution views into Earth's hidden climate signals.
          </p>
        </div>

        {/* Capability Cards */}
        <div className="grid gap-8 md:grid-cols-4">

          {/* Card 1 */}
          <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:bg-white/10 hover:shadow-blue-500/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Heat & urban stress
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Map heat islands, energy demand,  
              and nighttime heat retention at neighborhood scale.
            </p>

            <div className="mt-5 h-1 w-full bg-gradient-to-r from-orange-300 to-red-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

          {/* Card 2 */}
          <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:bg-white/10 hover:shadow-green-500/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Vegetation & drought
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Track canopy loss, crop stress,  
              and ecosystem health with multi-spectral indicators.
            </p>

            <div className="mt-5 h-1 w-full bg-gradient-to-r from-green-300 to-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

          {/* Card 3 */}
          <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:bg-white/10 hover:shadow-blue-400/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Floods & water risk
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Detect flood extent, shoreline shifts,  
              and riverine risk in near-real time.
            </p>

            <div className="mt-5 h-1 w-full bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

          {/* Card 4 */}
          <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:bg-white/10 hover:shadow-purple-400/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Air & pollution plumes
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Fuse satellite imagery with emission datasets  
              to pinpoint air quality hotspots.
            </p>

            <div className="mt-5 h-1 w-full bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
