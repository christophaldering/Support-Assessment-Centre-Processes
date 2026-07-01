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

export interface CompetencyNodeLike {
  id: string;
  name: string;
  nodeType: string;
  sortOrder: number;
  description?: string | null;
}

export interface MtmmCompetencyModel {
  id?: string;
  name: string;
  nodes: CompetencyNodeLike[];
}

export interface MtmmRationale {
  exerciseId: string;
  nodeId: string;
  weight: number;
  rationale: string;
}

export type MtmmGrid = Record<string, Record<string, { mapped: boolean; weight: number }>>;

export interface ProposalPerson {
  firstName?: string;
  lastName?: string;
  role?: string;
  name?: string;
}

export interface ProposalCandidate {
  firstName?: string;
  lastName?: string;
  currentRole?: string;
  currentCompany?: string;
  email?: string;
}

export interface ProposalCompetency {
  name: string;
  description?: string;
  selected?: boolean;
}

export interface ProposalModule {
  name: string;
  type?: string;
  description?: string;
  adaptationNotes?: string;
  generationPrompt?: string;
  selected?: boolean;
}

export interface ProposalExercise {
  name?: string;
  title?: string;
  type?: string;
  duration?: string | number | null;
  description?: string;
}

export interface ProposalTimelineItem {
  time?: string;
  start?: string;
  activity?: string;
  label?: string;
  description?: string;
}

export interface AnalysisProposal {
  competencies?: ProposalCompetency[];
  assessmentModules?: ProposalModule[];
  participants?: (ProposalPerson | string)[];
  exercises?: ProposalExercise[];
  timeline?: ProposalTimelineItem[];
  observers?: (ProposalPerson | string)[];
  additionalObservers?: ProposalPerson[];
  candidates?: ProposalCandidate[];
  specificQuestions?: string[];
  successCriteria?: string[];
  company?: string;
  targetRole?: string;
  assessmentDate?: string;
  analysisDate?: string;
  analysisForm?: string;
  assessmentType?: string;
  assessmentDuration?: string;
  startDate?: string;
  context?: string;
  summary?: string;
  leadConsultant?: ProposalPerson;
  secondConsultant?: ProposalPerson;
}

export interface ObservationSheetSection {
  items?: unknown[];
  [key: string]: unknown;
}

export interface ModuleSpec {
  name: string;
  type: string;
  description: string;
  adaptationNotes: string;
  generationPrompt: string;
}

export interface LinkedAnalysis {
  id: string;
  title: string;
  clientName: string | null;
  projectName: string | null;
  status: string;
  proposal: AnalysisProposal | null;
  createdAt: string;
  updatedAt: string;
}

export interface SectionProps {
  assessmentId: string;
  workspaceSlug: string;
  assessment: AssessmentRecord | null;
}
