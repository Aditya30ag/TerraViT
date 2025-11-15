"use client";

import React from "react";
import Spline from "@splinetool/react-spline";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

const SplineScene: React.FC<SplineSceneProps> = ({ scene, className }) => {
  return <Spline scene={scene} className={className} />;
};

export default SplineScene;
