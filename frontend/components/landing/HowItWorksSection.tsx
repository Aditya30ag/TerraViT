import React from "react";

const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] items-start bg-white p-4 rounded-2xl"
    >
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Under the hood
        </h2>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Vision Transformers tuned for planetary-scale time series.
        </p>
        <ul className="mt-2 space-y-2 text-sm md:text-base text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Multi-sensor fusion.</span>
            &nbsp;Ingest multi-spectral, SAR, and thermal imagery across constellations.
          </li>
          <li>
            <span className="font-medium text-foreground">Temporal context.</span>
            &nbsp;Each prediction uses weeks to years of history, not just a single
            snapshot.
          </li>
          <li>
            <span className="font-medium text-foreground">Explainable outputs.</span>
            &nbsp;Attention maps and attribution scores show where the model is looking.
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 md:p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          From raw imagery to insight
        </p>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>Ingest raw geospatial tiles from your data stack or public missions.</li>
          <li>TerraViT runs inference and generates risk scores and change maps.</li>
          <li>Results stream into your notebooks, dashboards, or incident workflows.</li>
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
