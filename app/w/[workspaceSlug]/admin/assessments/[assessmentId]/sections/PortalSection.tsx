"use client";

import PortalManagementSection from "../PortalManagementSection";
import { ExerciseRecord } from "./types";

interface PortalSectionProps {
  workspaceSlug: string;
  assessmentId: string;
  exercises: ExerciseRecord[];
}

export default function PortalSection({ workspaceSlug, assessmentId, exercises }: PortalSectionProps) {
  return (
    <PortalManagementSection
      workspaceSlug={workspaceSlug}
      assessmentId={assessmentId}
      exercises={exercises}
    />
  );
}
