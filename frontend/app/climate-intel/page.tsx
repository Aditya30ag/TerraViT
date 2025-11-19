"use client";
import { NavbarHero } from "@/components/landing/hero-with-video";
import { useState } from "react";
import Climate from "@/components/landing/Climate";
import ChangeDetectSection from "@/components/landing/ChangeDetectSection";

export default function Home() {
  const [email, setEmail] = useState("");
  const handleEmailSubmit = () => {
    console.log("Email submitted:", email);
  };



  return (
    <>
      <NavbarHero
        brandName="TerraViT"
        backgroundImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80"
      />
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
          <header className="space-y-3">
            <div className="relative z-30 mt-[420px] space-y-24 pb-24 w-[1200px] mx-auto">
              <Climate/>
              <ChangeDetectSection/>
            </div>
          </header>
        </div>
      </main>
    </>
  );
}
