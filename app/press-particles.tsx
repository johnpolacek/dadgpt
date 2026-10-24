"use client";

import { useEffect } from "react";
import { attachPressParticles } from "@/lib/particles";

export default function PressParticles() {
  useEffect(() => attachPressParticles(), []);
  return null;
}
