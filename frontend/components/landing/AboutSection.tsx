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
        <p className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          TerraViT turns raw satellite pixels into early warnings for a warming planet.
        </p>
        <p className="text-base md:text-lg text-white leading-relaxed">
          Built on Vision Transformers tuned for multi-spectral, multi-temporal Earth data,
          TerraViT continuously scans the globe to surface stress signals in vegetation,
          water, heat, and air quality weeks or months before they translate into human
          impact.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
