"use client";

export default function InsightSection() {
  return (
    <section className="relative">
      {/* Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent blur-3xl" />

      {/* Glass Card */}
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">
        <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300">
          Satellite Insights
        </h2>

        <p className="text-slate-300 text-lg max-w-3xl">
          TerraViT delivers high-precision environmental analysis using advanced AI.
          Explore real-time insights across ecosystems, vegetation, and global landscapes.
        </p>

        {/* Cards Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassItem
            title="Deforestation Monitoring"
            description="Track forest loss with multi-temporal satellite analysis."
          />

          <GlassItem
            title="Urban Expansion"
            description="Measure city growth using spectral and spatial patterns."
          />

          <GlassItem
            title="Vegetation Health"
            description="NDVI, EVI and spectral insight for environmental health."
          />
        </div>
      </div>
    </section>
  );
}

function GlassItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 
                    shadow-lg transition-all duration-300 hover:bg-white/10 hover:border-white/20
                    hover:shadow-blue-500/20">
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{description}</p>

      {/* Glow Hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 
                      mt-3 h-1 w-full bg-gradient-to-r from-blue-400 to-purple-300 rounded-full" />
    </div>
  );
}
