import React from "react";

const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start"
    >
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Climate intelligence, reimagined
        </h2>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          TerraViT turns raw satellite pixels into early warnings for a warming planet.
        </p>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Built on Vision Transformers tuned for multi-spectral, multi-temporal Earth data,
          TerraViT continuously scans the globe to surface stress signals in vegetation,
          water, heat, and air qualityweeks or months before they translate into human
          impact.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 md:p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Trusted by
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Research labs</p>
            <p>Planetary-scale climate modeling, resilient cities, and adaptation.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Sustainability teams</p>
            <p>ESG, nature risk, and climate disclosures grounded in geospatial truth.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
