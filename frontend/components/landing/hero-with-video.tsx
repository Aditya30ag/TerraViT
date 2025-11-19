"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Menu, ChevronDown, Sun, Moon, TestTube } from "lucide-react";
import SplineScene from "../spline-scene";
import { useRouter } from "next/navigation";

interface NavbarHeroProps {
  brandName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  backgroundImage?: string;
  emailPlaceholder?: string;
}

const NavbarHero: React.FC<NavbarHeroProps> = ({
  brandName = "nexus",
  backgroundImage = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const router = useRouter();

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };


  return (
    <main className="absolute inset-0 bg-background overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* --- Navbar --- */}
        <div className="py-2 relative z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="font-bold text-2xl pb-1 text-white cursor-pointer flex-shrink-0"
            >
              {brandName}
            </a>
            <nav className="hidden lg:flex text-muted-foreground font-medium">
              <ul className="flex items-center space-x-2">
                <li>
                  <a
                    href="/about"
                    className="hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg"
                  >
                    About
                  </a>
                </li>
                <li className="relative">
                  <button
                    onClick={() => toggleDropdown("desktop-resources")}
                    className="flex items-center hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg"
                  >
                    Resources
                    <ChevronDown
                      className={`h-4 w-4 ml-1 transition-transform ${
                        openDropdown === "desktop-resources" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openDropdown === "desktop-resources" && (
                    <ul className="absolute top-full left-0 mt-2 p-2 bg-card border border-border shadow-lg rounded-xl z-20 w-48">
                      <li>
                        <a
                          href="#capabilities"
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        >
                          Submenu 1
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        >
                          Submenu 2
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg"
                  >
                    How it works
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <button className="text-foreground hover:text-muted-foreground cursor-pointer py-2 px-4 text-sm capitalize font-medium transition-colors rounded-xl">
                View demo
              </button>
              <button 
                onClick={() => router.push('/test')}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-5 text-sm rounded-xl capitalize font-medium transition-colors flex items-center gap-2 text-black"
              >
                <TestTube className="h-4 w-4" />
                Test Backend
              </button>
              <a
                href="#contact"
                className="bg-foreground hover:bg-muted-foreground text-background py-2.5 px-5 text-sm rounded-xl capitalize font-medium transition-colors flex items-center gap-2"
              >
                Talk to us
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="lg:hidden relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-transparent hover:bg-muted border-none p-2 rounded-xl transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              {isMobileMenuOpen && (
                <ul className="absolute top-full right-0 mt-2 p-2 shadow-lg bg-card border border-border rounded-xl w-56 z-30">
                  <li>
                    <a
                      href="/about"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => toggleDropdown("mobile-resources")}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg"
                    >
                      Resources
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openDropdown === "mobile-resources"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                    {openDropdown === "mobile-resources" && (
                      <ul className="ml-4 mt-1 border-l border-border pl-3">
                        <li>
                          <a
                            href="#capabilities"
                            className="block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
                          >
                            Submenu 1
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
                          >
                            Submenu 2
                          </a>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg"
                    >
                      How it works
                    </a>
                  </li>

                  <li className="border-t border-border mt-2 pt-2 space-y-2">
                    <button 
                      onClick={() => router.push('/test')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                      <TestTube className="h-4 w-4" />
                      Test Backend
                    </button>
                    <a
                      href="#contact"
                      className="block w-full text-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg"
                    >
                      Talk to us
                    </a>
                    <button className="w-full bg-foreground text-background hover:bg-muted-foreground px-3 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 font-medium">
                      View demo
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* --- Media Header --- */}
        <header className="fixed top-0 right-0 w-full aspect-video overflow-hidden">
          <div className="absolute w-full h-full absolute inset-0 bg-black opacity-90"></div>
          <img
            src={backgroundImage}
            alt="Hero background"
            className="w-full h-full absolute inset-0 object-cover"
          />
          <div className="flex-1 absolute top-0 right-82 w-full h-full">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </header>
      </div>
    </main>
  );
};
export { NavbarHero };
