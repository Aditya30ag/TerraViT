import React from "react";

const UseCasesSection: React.FC = () => {
  return (
    <section id="use-cases" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Built for teams on the frontlines
          </h2>
          <p className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            From research prototypes to operational climate intelligence.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Public sector
          </p>
          <p className="text-sm text-muted-foreground">
            Early heatwave and flood alerts for cities, disaster response, and resilience
            planning.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Climate & ESG teams
          </p>
          <p className="text-sm text-muted-foreground">
            Monitor physical climate risk, nature loss, and portfolio exposure at asset-level
            resolution.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Science & R&D
          </p>
          <p className="text-sm text-muted-foreground">
            Accelerate Earth system research with pre-trained transformers on geospatial time
            series.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
