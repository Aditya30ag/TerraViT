"use client";
import { NavbarHero } from "@/components/landing/hero-with-video";
import AboutSection from "@/components/landing/AboutSection";
import CapabilitiesSection from "@/components/landing/CapabilitiesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import ContactSection from "@/components/landing/ContactSection";
import { useState } from "react";
import Climate from "@/components/landing/Climate";

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
      <div className="relative z-30 mt-[420px] space-y-24 pb-24 w-[1200px] mx-auto">
        <Climate/>
      </div>
    </>
  );
}
