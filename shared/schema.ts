import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════
// TENANT / WORKSPACE LAYER
// ═══════════════════════════════════════════════════════════

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  adminPasswordHash: text("admin_password_hash").notNull(),
  theme: jsonb("theme").$type<WorkspaceTheme>(),
  dataResidency: text("data_residency").default("EU"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface WorkspaceTheme {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontFamilyHeading: string;
  darkMode?: boolean;
}

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

// ═══════════════════════════════════════════════════════════
// USER / AUTH LAYER (replaces old simple users)
// ═══════════════════════════════════════════════════════════

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const platformUsers = pgTable("platform_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roles: text("roles").array().notNull().default(sql`ARRAY['CANDIDATE']::text[]`),
  status: text("status").notNull().default("active"),
  mustChangePassword: boolean("must_change_password").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlatformUserSchema = createInsertSchema(platformUsers).omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
});
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = typeof platformUsers.$inferSelect;

export const ROLES = ["ADMIN", "MODERATOR", "OBSERVER", "PROJECT_ASSISTANT", "HR_CLIENT", "CANDIDATE"] as const;
export type Role = typeof ROLES[number];

// ═══════════════════════════════════════════════════════════
// COMPETENCY MODEL LAYER
// ═══════════════════════════════════════════════════════════

export const competencyModels = pgTable("competency_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompetencyModelSchema = createInsertSchema(competencyModels).omit({
  id: true,
  createdAt: true,
});
export type InsertCompetencyModel = z.infer<typeof insertCompetencyModelSchema>;
export type CompetencyModel = typeof competencyModels.$inferSelect;

export const competencyNodes = pgTable("competency_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competencyModelId: varchar("competency_model_id").notNull(),
  parentId: varchar("parent_id"),
  nodeType: text("node_type").notNull().default("Competency"),
  title: text("title").notNull(),
  titleDe: text("title_de"),
  description: text("description"),
  anchors: jsonb("anchors").$type<CompetencyAnchor[]>(),
  ordering: integer("ordering").notNull().default(0),
});

export interface CompetencyAnchor {
  level: number;
  text: string;
  textDe?: string;
}

export const insertCompetencyNodeSchema = createInsertSchema(competencyNodes).omit({
  id: true,
});
export type InsertCompetencyNode = z.infer<typeof insertCompetencyNodeSchema>;
export type CompetencyNode = typeof competencyNodes.$inferSelect;

export const scaleDefinitions = pgTable("scale_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("likert"),
  min: integer("min").notNull().default(1),
  max: integer("max").notNull().default(5),
  labels: jsonb("labels").$type<ScaleLabel[]>(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface ScaleLabel {
  value: number;
  label: string;
  labelDe?: string;
}

export const insertScaleDefinitionSchema = createInsertSchema(scaleDefinitions).omit({
  id: true,
  createdAt: true,
});
export type InsertScaleDefinition = z.infer<typeof insertScaleDefinitionSchema>;
export type ScaleDefinition = typeof scaleDefinitions.$inferSelect;

// ═══════════════════════════════════════════════════════════
// ASSESSMENT LAYER
// ═══════════════════════════════════════════════════════════

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  title: text("title"),
  targetRole: text("target_role"),
  organizationName: text("organization_name"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  language: text("language").notNull().default("DE"),
  location: text("location"),
  seniorityLevel: text("seniority_level"),
  description: text("description"),
  competencyModelId: varchar("competency_model_id"),
  scaleId: varchar("scale_id"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull(),
  type: text("type").notNull().default("CASE_STUDY"),
  title: text("title").notNull(),
  titleDe: text("title_de"),
  instructions: text("instructions"),
  instructionsDe: text("instructions_de"),
  duration: integer("duration"),
  materials: jsonb("materials").$type<ExerciseMaterial[]>(),
  ordering: integer("ordering").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface ExerciseMaterial {
  type: "file" | "link" | "embedded";
  title: string;
  url?: string;
  data?: string;
}

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

export const candidateProfiles = pgTable("candidate_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: text("status").notNull().default("invited"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  briefingConfirmed: boolean("briefing_confirmed").default(false),
});

export const insertCandidateProfileSchema = createInsertSchema(candidateProfiles).omit({
  id: true,
});
export type InsertCandidateProfile = z.infer<typeof insertCandidateProfileSchema>;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;

export const observerAssignments = pgTable("observer_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull(),
  userId: varchar("user_id").notNull(),
  exerciseScope: text("exercise_scope").notNull().default("all"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertObserverAssignmentSchema = createInsertSchema(observerAssignments).omit({
  id: true,
  createdAt: true,
});
export type InsertObserverAssignment = z.infer<typeof insertObserverAssignmentSchema>;
export type ObserverAssignment = typeof observerAssignments.$inferSelect;

export const exerciseCompetencyMappings = pgTable("exercise_competency_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull(),
  competencyNodeId: varchar("competency_node_id").notNull(),
  weight: real("weight").default(1.0),
});

export const insertExerciseCompetencyMappingSchema = createInsertSchema(exerciseCompetencyMappings).omit({
  id: true,
});
export type InsertExerciseCompetencyMapping = z.infer<typeof insertExerciseCompetencyMappingSchema>;
export type ExerciseCompetencyMapping = typeof exerciseCompetencyMappings.$inferSelect;

// ═══════════════════════════════════════════════════════════
// RATINGS / SCORING LAYER
// ═══════════════════════════════════════════════════════════

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  competencyNodeId: varchar("competency_node_id").notNull(),
  observerUserId: varchar("observer_user_id").notNull(),
  candidateUserId: varchar("candidate_user_id").notNull(),
  rawScore: real("raw_score").notNull(),
  scaleId: varchar("scale_id"),
  notes: text("notes"),
  evidenceSituation: text("evidence_situation"),
  evidenceTask: text("evidence_task"),
  evidenceAction: text("evidence_action"),
  evidenceResult: text("evidence_result"),
  version: integer("version").notNull().default(1),
  previousVersionId: varchar("previous_version_id"),
  normalizedScore: real("normalized_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// ═══════════════════════════════════════════════════════════
// AUDIT / CONSENT LAYER
// ═══════════════════════════════════════════════════════════

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id"),
  userId: varchar("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export const consentTemplates = pgTable("consent_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  language: text("language").notNull().default("DE"),
  module: text("module").notNull(),
  title: text("title").notNull(),
  legalText: text("legal_text").notNull(),
  required: boolean("required").default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsentTemplateSchema = createInsertSchema(consentTemplates).omit({
  id: true,
  createdAt: true,
});
export type InsertConsentTemplate = z.infer<typeof insertConsentTemplateSchema>;
export type ConsentTemplate = typeof consentTemplates.$inferSelect;

export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  templateId: varchar("template_id").notNull(),
  templateVersion: integer("template_version").notNull(),
  accepted: boolean("accepted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({
  id: true,
  createdAt: true,
});
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;

// ═══════════════════════════════════════════════════════════
// LEGACY TABLES (kept for backward compatibility)
// ═══════════════════════════════════════════════════════════

export const assessmentResponses = pgTable("assessment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: text("case_id").notNull(),
  sessionId: text("session_id").notNull(),
  phase: text("phase").notNull(),
  questionIndex: integer("question_index").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  updatedAt: true,
});
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;

export const accessCodes = pgTable("access_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scope: text("scope").notNull(),
  customerId: text("customer_id"),
  codeHash: text("code_hash").notNull(),
  label: text("label"),
  participantName: text("participant_name"),
  participantEmail: text("participant_email"),
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
});
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;

export const assessmentSessions = pgTable("assessment_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  customerId: text("customer_id"),
  caseId: text("case_id").notNull(),
  participantName: text("participant_name"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  briefingConfirmed: boolean("briefing_confirmed").default(false),
  status: text("status").notNull().default("active"),
});

export const insertAssessmentSessionSchema = createInsertSchema(assessmentSessions).omit({
  id: true,
  startedAt: true,
});
export type InsertAssessmentSession = z.infer<typeof insertAssessmentSessionSchema>;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;

export const uploadedExercises = pgTable("uploaded_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: text("customer_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("document"),
  fileName: text("file_name"),
  fileData: text("file_data"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUploadedExerciseSchema = createInsertSchema(uploadedExercises).omit({
  id: true,
  createdAt: true,
});
export type InsertUploadedExercise = z.infer<typeof insertUploadedExerciseSchema>;
export type UploadedExercise = typeof uploadedExercises.$inferSelect;

export const observerRatings = pgTable("observer_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  caseId: text("case_id").notNull(),
  observerName: text("observer_name").notNull(),
  competencyKey: text("competency_key").notNull(),
  rating: integer("rating").notNull(),
  notes: text("notes").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertObserverRatingSchema = createInsertSchema(observerRatings).omit({
  id: true,
  updatedAt: true,
});
export type InsertObserverRating = z.infer<typeof insertObserverRatingSchema>;
export type ObserverRating = typeof observerRatings.$inferSelect;

export const selfAssessments = pgTable("self_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  caseId: text("case_id").notNull(),
  competencyKey: text("competency_key").notNull(),
  rating: integer("rating").notNull(),
  reflection: text("reflection").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSelfAssessmentSchema = createInsertSchema(selfAssessments).omit({
  id: true,
  updatedAt: true,
});
export type InsertSelfAssessment = z.infer<typeof insertSelfAssessmentSchema>;
export type SelfAssessment = typeof selfAssessments.$inferSelect;

export const timedReleases = pgTable("timed_releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: text("case_id").notNull(),
  materialKey: text("material_key").notNull(),
  title: text("title").notNull(),
  releaseAt: integer("release_at_minutes"),
  manualRelease: boolean("manual_release").default(false),
  released: boolean("released").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimedReleaseSchema = createInsertSchema(timedReleases).omit({
  id: true,
  createdAt: true,
});
export type InsertTimedRelease = z.infer<typeof insertTimedReleaseSchema>;
export type TimedRelease = typeof timedReleases.$inferSelect;

export const observerSessions = pgTable("observer_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  observerName: text("observer_name").notNull(),
  targetSessionId: text("target_session_id").notNull(),
  caseId: text("case_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertObserverSessionSchema = createInsertSchema(observerSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertObserverSession = z.infer<typeof insertObserverSessionSchema>;
export type ObserverSession = typeof observerSessions.$inferSelect;
