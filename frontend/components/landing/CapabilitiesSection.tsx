import React from "react";

const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="space-y-6 bg-white p-4 rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            What TerraViT sees
          </h2>
          <p className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            High-resolution views into Earth's hidden climate signals.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Heat & urban stress
          </p>
          <p className="text-sm text-muted-foreground">
            Map heat islands, energy demand, and nighttime heat retention at the neighborhood
            level.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Vegetation & drought
          </p>
          <p className="text-sm text-muted-foreground">
            Track canopy loss, crop stress, and ecosystem health with multi-spectral change
            maps.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Floods & water risk
          </p>
          <p className="text-sm text-muted-foreground">
            Detect flood extent, shoreline change, and riverine risk in near real time.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Air & pollution plumes
          </p>
          <p className="text-sm text-muted-foreground">
            Combine satellite imagery with emissions inventories to monitor air quality
            hotspots.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
