"use client";

import ProfileGate from "@/components/ProfileGate";
import FitResult from "@/components/FitResult";
import { Garment } from "@/lib/types";

export default function GarmentFitSection({ garment }: { garment: Garment }) {
  return <ProfileGate>{(profile) => <FitResult garment={garment} profile={profile} />}</ProfileGate>;
}
