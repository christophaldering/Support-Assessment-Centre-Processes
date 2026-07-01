export type SectionKey = "overview" | "requirements" | "target_position" | "exercises" | "observation_sheets" | "mtmm" | "participants" | "documents" | "portal" | "workflow" | "validation" | "activation";

export interface AssessmentRecord {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  processStep?: number;
  clientName?: string | null;
  autoDeleteDays?: number | null;
  sourceAnalysisId?: string | null;
  targetPosition?: string | null;
  workflowConfig?: Record<string, any> | null;
}

export interface ExerciseDocument {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  objectPath: string;
  exerciseId: string | null;
}

export interface ExerciseRecord {
  id: string;
  name: string;
  type: string;
  instructions: string | null;
  duration: number | null;
  sortOrder: number;
  status: string;
  documents: ExerciseDocument[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  visibleTo: string[];
  watermark: boolean;
  exerciseId: string | null;
  uploadedBy: { id: string; name: string } | null;
}

export interface PortalDocRecord {
  id: string;
  assessmentId: string;
  exerciseId: string | null;
  category: string;
  title: string;
  description: string | null;
  objectPath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  releaseStatus: string;
  releasedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface ObservationSheetRecord {
  id: string;
  name: string;
  description: string | null;
  exerciseId: string | null;
  type: string;
  content: any;
  status: string;
  aiGenerated: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  exerciseType: string;
  tags: string[];
  targetLevels: string[];
  languagesAvailable: string[];
  qualityStatus: string;
  metadataJson: any;
  clientName?: string | null;
  projectName?: string | null;
  _count?: { variants: number };
}

export interface MtmmMapping {
  exerciseId: string;
  competencyNodeId: string;
  weight: number;
  exercise: { id: string; name: string };
  competencyNode: { id: string; name: string; description: string | null; sortOrder: number };
}

export interface LinkedAnalysis {
  id: string;
  title: string;
  clientName: string | null;
  projectName: string | null;
  status: string;
  proposal: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SectionProps {
  assessmentId: string;
  workspaceSlug: string;
  assessment: AssessmentRecord | null;
}
