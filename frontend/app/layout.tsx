import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TerraViT | Vision Transformer for Earth's Climate Intelligence",
    template: "%s | TerraViT",
  },
  description:
    "TerraViT is an AI-powered Earth Observation and climate intelligence platform combining satellite Vision Transformers with real-time planetary data to detect land-cover change, assess environmental hazards, and stream early-warning alerts.",
  keywords: [
    "TerraViT",
    "Vision Transformer",
    "Climate Intelligence",
    "Satellite Imagery",
    "Change Detection",
    "Earth Observation",
    "Remote Sensing",
    "Environmental Monitoring",
    "Flood Detection",
    "Deforestation Tracking",
    "SatViT",
    "AI",
  ],
  authors: [{ name: "Aditya Agarwal" }],
  creator: "Aditya Agarwal",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TerraViT",
    title: "TerraViT - Vision Transformer for Earth's Climate Intelligence",
    description:
      "Detect land-cover change, monitor vegetation health, and stream early-warning climate alerts using Vision Transformers and satellite imagery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TerraViT - Vision Transformer for Earth's Climate Intelligence",
    description:
      "AI-powered satellite intelligence and real-time climate risk monitoring with Vision Transformers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
