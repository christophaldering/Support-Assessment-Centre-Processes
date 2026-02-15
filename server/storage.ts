import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  assessmentResponses,
  accessCodes,
  type User,
  type InsertUser,
  type AssessmentResponse,
  type InsertAssessmentResponse,
  type AccessCode,
  type InsertAccessCode,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAssessmentResponses(caseId: string, sessionId: string): Promise<AssessmentResponse[]>;
  upsertAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  bulkUpsertAssessmentResponses(responses: InsertAssessmentResponse[]): Promise<AssessmentResponse[]>;

  getAccessCodesByScope(scope: string, customerId?: string): Promise<AccessCode[]>;
  createAccessCode(code: InsertAccessCode): Promise<AccessCode>;
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

  async createAccessCode(code: InsertAccessCode): Promise<AccessCode> {
    const [created] = await db.insert(accessCodes).values(code).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
