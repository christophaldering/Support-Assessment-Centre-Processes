import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
