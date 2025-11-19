"use client";

import { NavbarHero } from "@/components/landing/hero-with-video";

export default function AboutPage() {
  return (
    <>
      <NavbarHero
        brandName="TerraViT"
        backgroundImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80"
      />
      <main className="relative z-30 mt-[420px] pb-24 w-[1200px] mx-auto text-white">
        <section className="space-y-6">
          <h1 className="text-4xl font-bold">About TerraViT</h1>
          <p className="text-lg text-gray-100 max-w-3xl">
            TerraViT is a climate intelligence platform that transforms raw satellite
            imagery into actionable environmental insights. It helps detect
            heatwaves, vegetation loss, floods, and other climate risks early so
            governments, researchers, and industries can respond before crises
            escalate.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold">ACM Bennett University Project</h2>
          <p className="text-gray-100 max-w-3xl">
            This project is proudly developed and represented by the ACM Student
            Chapter at Bennett University. It showcases how AI, remote sensing,
            and modern web technologies can be combined to build practical tools
            for climate risk assessment and environmental monitoring.
          </p>
          <p className="text-gray-100 max-w-3xl">
            The goal of TerraViT is to empower students, researchers, and
            organizations with transparent, data-driven climate intelligence that
            can support sustainable decision making.
          </p>
        </section>
      </main>
    </>
  );
}
