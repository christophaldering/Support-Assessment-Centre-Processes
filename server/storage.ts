import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  assessmentResponses,
  accessCodes,
  assessmentSessions,
  uploadedExercises,
  type User,
  type InsertUser,
  type AssessmentResponse,
  type InsertAssessmentResponse,
  type AccessCode,
  type InsertAccessCode,
  type AssessmentSession,
  type InsertAssessmentSession,
  type UploadedExercise,
  type InsertUploadedExercise,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAssessmentResponses(caseId: string, sessionId: string): Promise<AssessmentResponse[]>;
  getAllAssessmentResponses(): Promise<AssessmentResponse[]>;
  upsertAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  bulkUpsertAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]>;

  getAccessCodesByScope(scope: string, customerId?: string): Promise<AccessCode[]>;
  getAllAccessCodes(): Promise<AccessCode[]>;
  createAccessCode(code: InsertAccessCode): Promise<AccessCode>;
  deleteAccessCode(id: string): Promise<void>;

  getSession(sessionId: string, caseId: string): Promise<AssessmentSession | undefined>;
  getAllSessions(): Promise<AssessmentSession[]>;
  createSession(session: InsertAssessmentSession): Promise<AssessmentSession>;
  updateSession(id: string, data: Partial<AssessmentSession>): Promise<AssessmentSession>;

  getUploadedExercises(customerId: string): Promise<UploadedExercise[]>;
  getAllUploadedExercises(): Promise<UploadedExercise[]>;
  createUploadedExercise(exercise: InsertUploadedExercise): Promise<UploadedExercise>;
  deleteUploadedExercise(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAssessmentResponses(caseId: string, sessionId: string): Promise<AssessmentResponse[]> {
    return db
      .select()
      .from(assessmentResponses)
      .where(
        and(
          eq(assessmentResponses.caseId, caseId),
          eq(assessmentResponses.sessionId, sessionId)
        )
      );
  }

  async getAllAssessmentResponses(): Promise<AssessmentResponse[]> {
    return db.select().from(assessmentResponses).orderBy(desc(assessmentResponses.updatedAt));
  }

  async upsertAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const existing = await db
      .select()
      .from(assessmentResponses)
      .where(
        and(
          eq(assessmentResponses.caseId, response.caseId),
          eq(assessmentResponses.sessionId, response.sessionId),
          eq(assessmentResponses.phase, response.phase),
          eq(assessmentResponses.questionIndex, response.questionIndex)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(assessmentResponses)
        .set({ answer: response.answer, updatedAt: new Date() })
        .where(eq(assessmentResponses.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(assessmentResponses)
      .values(response)
      .returning();
    return created;
  }

  async bulkUpsertAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]> {
    const results: AssessmentResponse[] = [];
    for (const response of responses) {
      const result = await this.upsertAssessmentResponse(response);
      results.push(result);
    }
    return results;
  }

  async getAccessCodesByScope(scope: string, customerId?: string): Promise<AccessCode[]> {
    if (customerId) {
      return db
        .select()
        .from(accessCodes)
        .where(
          and(
            eq(accessCodes.scope, scope),
            eq(accessCodes.customerId, customerId)
          )
        );
    }
    return db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.scope, scope));
  }

  async getAllAccessCodes(): Promise<AccessCode[]> {
    return db.select().from(accessCodes);
  }

  async createAccessCode(code: InsertAccessCode): Promise<AccessCode> {
    const [created] = await db.insert(accessCodes).values(code).returning();
    return created;
  }

  async deleteAccessCode(id: string): Promise<void> {
    await db.delete(accessCodes).where(eq(accessCodes.id, id));
  }

  async getSession(sessionId: string, caseId: string): Promise<AssessmentSession | undefined> {
    const [session] = await db
      .select()
      .from(assessmentSessions)
      .where(
        and(
          eq(assessmentSessions.sessionId, sessionId),
          eq(assessmentSessions.caseId, caseId)
        )
      );
    return session;
  }

  async getAllSessions(): Promise<AssessmentSession[]> {
    return db.select().from(assessmentSessions).orderBy(desc(assessmentSessions.startedAt));
  }

  async createSession(session: InsertAssessmentSession): Promise<AssessmentSession> {
    const [created] = await db.insert(assessmentSessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, data: Partial<AssessmentSession>): Promise<AssessmentSession> {
    const [updated] = await db
      .update(assessmentSessions)
      .set(data)
      .where(eq(assessmentSessions.id, id))
      .returning();
    return updated;
  }

  async getUploadedExercises(customerId: string): Promise<UploadedExercise[]> {
    return db
      .select()
      .from(uploadedExercises)
      .where(eq(uploadedExercises.customerId, customerId))
      .orderBy(desc(uploadedExercises.createdAt));
  }

  async getAllUploadedExercises(): Promise<UploadedExercise[]> {
    return db.select().from(uploadedExercises).orderBy(desc(uploadedExercises.createdAt));
  }

  async createUploadedExercise(exercise: InsertUploadedExercise): Promise<UploadedExercise> {
    const [created] = await db.insert(uploadedExercises).values(exercise).returning();
    return created;
  }

  async deleteUploadedExercise(id: string): Promise<void> {
    await db.delete(uploadedExercises).where(eq(uploadedExercises.id, id));
  }
}

export const storage = new DatabaseStorage();
