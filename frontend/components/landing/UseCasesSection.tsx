import React from "react";

const UseCasesSection: React.FC = () => {
  return (
    <section id="use-cases" className="relative w-full py-24 mt-32 space-y-16">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-blue-500/10 to-transparent blur-2xl pointer-events-none"></div>

      {/* Title Box */}
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            Built for teams on the frontlines
          </h2>

          <p className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
            From research prototypes to operational climate intelligence.
          </p>
        </div>
      </div>

      {/* Use Case Grid */}
      <div className="relative max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3">

        {/* Card 1 */}
        <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-blue-500/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Public sector
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            Early heatwave and flood alerts for cities, emergency response,  
            and long-horizon climate resilience planning.
          </p>

          {/* Glow Bar */}
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-blue-300 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        </div>

        {/* Card 2 */}
        <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-green-500/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Climate & ESG teams
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            Monitor physical climate risks, biodiversity loss,  
            and asset-level exposure across portfolios.
          </p>

          <div className="mt-6 h-1 w-full bg-gradient-to-r from-green-300 to-blue-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        </div>

        {/* Card 3 */}
        <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-purple-500/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Science & R&D
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            Accelerate Earth system research using pre-trained  
            vision transformers designed for geospatial time series.
          </p>

          <div className="mt-6 h-1 w-full bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        </div>

      </div>
    </section>
  );
};

export default UseCasesSection;
