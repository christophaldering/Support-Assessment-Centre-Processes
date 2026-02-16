import { eq, and, desc, arrayContains } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  assessmentResponses,
  accessCodes,
  assessmentSessions,
  uploadedExercises,
  observerRatings,
  selfAssessments,
  timedReleases,
  observerSessions,
  workspaces,
  platformUsers,
  competencyModels,
  competencyNodes,
  scaleDefinitions,
  assessments,
  exercises,
  candidateProfiles,
  observerAssignments,
  exerciseCompetencyMappings,
  ratings,
  auditLogs,
  consentTemplates,
  consentRecords,
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
  type ObserverRating,
  type InsertObserverRating,
  type SelfAssessment,
  type InsertSelfAssessment,
  type TimedRelease,
  type InsertTimedRelease,
  type ObserverSession,
  type InsertObserverSession,
  type Workspace,
  type InsertWorkspace,
  type PlatformUser,
  type InsertPlatformUser,
  type CompetencyModel,
  type InsertCompetencyModel,
  type CompetencyNode,
  type InsertCompetencyNode,
  type ScaleDefinition,
  type InsertScaleDefinition,
  type Assessment,
  type InsertAssessment,
  type Exercise,
  type InsertExercise,
  type CandidateProfile,
  type InsertCandidateProfile,
  type ObserverAssignment,
  type InsertObserverAssignment,
  type ExerciseCompetencyMapping,
  type InsertExerciseCompetencyMapping,
  type Rating,
  type InsertRating,
  type AuditLog,
  type InsertAuditLog,
  type ConsentTemplate,
  type InsertConsentTemplate,
  type ConsentRecord,
  type InsertConsentRecord,
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

  getObserverRatings(sessionId: string, caseId: string): Promise<ObserverRating[]>;
  getAllObserverRatings(): Promise<ObserverRating[]>;
  upsertObserverRating(rating: InsertObserverRating): Promise<ObserverRating>;
  getObserverRatingsByCase(caseId: string): Promise<ObserverRating[]>;

  getSelfAssessments(sessionId: string, caseId: string): Promise<SelfAssessment[]>;
  upsertSelfAssessment(sa: InsertSelfAssessment): Promise<SelfAssessment>;
  getAllSelfAssessments(): Promise<SelfAssessment[]>;

  getTimedReleases(caseId: string): Promise<TimedRelease[]>;
  createTimedRelease(tr: InsertTimedRelease): Promise<TimedRelease>;
  updateTimedRelease(id: string, data: Partial<TimedRelease>): Promise<TimedRelease>;
  deleteTimedRelease(id: string): Promise<void>;

  getObserverSession(observerName: string, targetSessionId: string, caseId: string): Promise<ObserverSession | undefined>;
  createObserverSession(os: InsertObserverSession): Promise<ObserverSession>;
  getAllObserverSessions(): Promise<ObserverSession[]>;

  getWorkspaces(): Promise<Workspace[]>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(ws: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace>;

  getPlatformUser(id: string): Promise<PlatformUser | undefined>;
  getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined>;
  getPlatformUsersByWorkspace(workspaceId: string): Promise<PlatformUser[]>;
  getPlatformUsersByRole(workspaceId: string, role: string): Promise<PlatformUser[]>;
  createPlatformUser(user: InsertPlatformUser): Promise<PlatformUser>;
  updatePlatformUser(id: string, data: Partial<PlatformUser>): Promise<PlatformUser>;

  getCompetencyModels(workspaceId: string): Promise<CompetencyModel[]>;
  getCompetencyModel(id: string): Promise<CompetencyModel | undefined>;
  createCompetencyModel(model: InsertCompetencyModel): Promise<CompetencyModel>;

  getCompetencyNodes(modelId: string): Promise<CompetencyNode[]>;
  createCompetencyNode(node: InsertCompetencyNode): Promise<CompetencyNode>;

  getScaleDefinitions(workspaceId: string): Promise<ScaleDefinition[]>;
  createScaleDefinition(scale: InsertScaleDefinition): Promise<ScaleDefinition>;

  getAssessmentsByWorkspace(workspaceId: string): Promise<Assessment[]>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  createAssessmentRecord(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessmentRecord(id: string, data: Partial<Assessment>): Promise<Assessment>;

  getExercisesByAssessment(assessmentId: string): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | undefined>;
  createExerciseRecord(exercise: InsertExercise): Promise<Exercise>;

  getCandidateProfiles(assessmentId: string): Promise<CandidateProfile[]>;
  getCandidateProfileByUser(assessmentId: string, userId: string): Promise<CandidateProfile | undefined>;
  getCandidateProfilesByUserId(userId: string): Promise<CandidateProfile[]>;
  createCandidateProfile(profile: InsertCandidateProfile): Promise<CandidateProfile>;
  updateCandidateProfile(id: string, data: Partial<CandidateProfile>): Promise<CandidateProfile>;

  getObserverAssignments(assessmentId: string): Promise<ObserverAssignment[]>;
  createObserverAssignment(assignment: InsertObserverAssignment): Promise<ObserverAssignment>;

  getRatingsByAssessment(assessmentId: string): Promise<Rating[]>;
  getRatingsByObserver(assessmentId: string, observerUserId: string): Promise<Rating[]>;
  getRatingsByCandidate(assessmentId: string, candidateUserId: string): Promise<Rating[]>;
  createRatingRecord(rating: InsertRating): Promise<Rating>;
  upsertRatingRecord(rating: InsertRating): Promise<Rating>;

  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(workspaceId: string, limit?: number): Promise<AuditLog[]>;

  getConsentTemplates(workspaceId: string): Promise<ConsentTemplate[]>;
  createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate>;
  getConsentRecords(userId: string): Promise<ConsentRecord[]>;
  createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord>;

  getExerciseCompetencyMappings(exerciseId: string): Promise<ExerciseCompetencyMapping[]>;
  createExerciseCompetencyMapping(mapping: InsertExerciseCompetencyMapping): Promise<ExerciseCompetencyMapping>;
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

  async getObserverRatings(sessionId: string, caseId: string): Promise<ObserverRating[]> {
    return db
      .select()
      .from(observerRatings)
      .where(
        and(
          eq(observerRatings.sessionId, sessionId),
          eq(observerRatings.caseId, caseId)
        )
      );
  }

  async getAllObserverRatings(): Promise<ObserverRating[]> {
    return db.select().from(observerRatings).orderBy(desc(observerRatings.updatedAt));
  }

  async upsertObserverRating(rating: InsertObserverRating): Promise<ObserverRating> {
    const existing = await db
      .select()
      .from(observerRatings)
      .where(
        and(
          eq(observerRatings.sessionId, rating.sessionId),
          eq(observerRatings.caseId, rating.caseId),
          eq(observerRatings.observerName, rating.observerName),
          eq(observerRatings.competencyKey, rating.competencyKey)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(observerRatings)
        .set({ rating: rating.rating, notes: rating.notes, updatedAt: new Date() })
        .where(eq(observerRatings.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(observerRatings)
      .values(rating)
      .returning();
    return created;
  }

  async getObserverRatingsByCase(caseId: string): Promise<ObserverRating[]> {
    return db
      .select()
      .from(observerRatings)
      .where(eq(observerRatings.caseId, caseId))
      .orderBy(desc(observerRatings.updatedAt));
  }

  async getSelfAssessments(sessionId: string, caseId: string): Promise<SelfAssessment[]> {
    return db
      .select()
      .from(selfAssessments)
      .where(
        and(
          eq(selfAssessments.sessionId, sessionId),
          eq(selfAssessments.caseId, caseId)
        )
      );
  }

  async upsertSelfAssessment(sa: InsertSelfAssessment): Promise<SelfAssessment> {
    const existing = await db
      .select()
      .from(selfAssessments)
      .where(
        and(
          eq(selfAssessments.sessionId, sa.sessionId),
          eq(selfAssessments.caseId, sa.caseId),
          eq(selfAssessments.competencyKey, sa.competencyKey)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(selfAssessments)
        .set({ rating: sa.rating, reflection: sa.reflection, updatedAt: new Date() })
        .where(eq(selfAssessments.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(selfAssessments)
      .values(sa)
      .returning();
    return created;
  }

  async getAllSelfAssessments(): Promise<SelfAssessment[]> {
    return db.select().from(selfAssessments).orderBy(desc(selfAssessments.updatedAt));
  }

  async getTimedReleases(caseId: string): Promise<TimedRelease[]> {
    return db
      .select()
      .from(timedReleases)
      .where(eq(timedReleases.caseId, caseId));
  }

  async createTimedRelease(tr: InsertTimedRelease): Promise<TimedRelease> {
    const [created] = await db.insert(timedReleases).values(tr).returning();
    return created;
  }

  async updateTimedRelease(id: string, data: Partial<TimedRelease>): Promise<TimedRelease> {
    const [updated] = await db
      .update(timedReleases)
      .set(data)
      .where(eq(timedReleases.id, id))
      .returning();
    return updated;
  }

  async deleteTimedRelease(id: string): Promise<void> {
    await db.delete(timedReleases).where(eq(timedReleases.id, id));
  }

  async getObserverSession(observerName: string, targetSessionId: string, caseId: string): Promise<ObserverSession | undefined> {
    const [session] = await db
      .select()
      .from(observerSessions)
      .where(
        and(
          eq(observerSessions.observerName, observerName),
          eq(observerSessions.targetSessionId, targetSessionId),
          eq(observerSessions.caseId, caseId)
        )
      );
    return session;
  }

  async createObserverSession(os: InsertObserverSession): Promise<ObserverSession> {
    const [created] = await db.insert(observerSessions).values(os).returning();
    return created;
  }

  async getAllObserverSessions(): Promise<ObserverSession[]> {
    return db.select().from(observerSessions).orderBy(desc(observerSessions.createdAt));
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return db.select().from(workspaces);
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug));
    return ws;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return ws;
  }

  async createWorkspace(ws: InsertWorkspace): Promise<Workspace> {
    const [created] = await db.insert(workspaces).values(ws).returning();
    return created;
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const [updated] = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
    return updated;
  }

  async getPlatformUser(id: string): Promise<PlatformUser | undefined> {
    const [user] = await db.select().from(platformUsers).where(eq(platformUsers.id, id));
    return user;
  }

  async getPlatformUserByEmail(email: string): Promise<PlatformUser | undefined> {
    const [user] = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
    return user;
  }

  async getPlatformUsersByWorkspace(workspaceId: string): Promise<PlatformUser[]> {
    return db.select().from(platformUsers).where(eq(platformUsers.workspaceId, workspaceId));
  }

  async getPlatformUsersByRole(workspaceId: string, role: string): Promise<PlatformUser[]> {
    return db
      .select()
      .from(platformUsers)
      .where(
        and(
          eq(platformUsers.workspaceId, workspaceId),
          arrayContains(platformUsers.roles, [role])
        )
      );
  }

  async createPlatformUser(user: InsertPlatformUser): Promise<PlatformUser> {
    const [created] = await db.insert(platformUsers).values(user).returning();
    return created;
  }

  async updatePlatformUser(id: string, data: Partial<PlatformUser>): Promise<PlatformUser> {
    const [updated] = await db.update(platformUsers).set(data).where(eq(platformUsers.id, id)).returning();
    return updated;
  }

  async getCompetencyModels(workspaceId: string): Promise<CompetencyModel[]> {
    return db.select().from(competencyModels).where(eq(competencyModels.workspaceId, workspaceId));
  }

  async getCompetencyModel(id: string): Promise<CompetencyModel | undefined> {
    const [model] = await db.select().from(competencyModels).where(eq(competencyModels.id, id));
    return model;
  }

  async createCompetencyModel(model: InsertCompetencyModel): Promise<CompetencyModel> {
    const [created] = await db.insert(competencyModels).values(model).returning();
    return created;
  }

  async getCompetencyNodes(modelId: string): Promise<CompetencyNode[]> {
    return db
      .select()
      .from(competencyNodes)
      .where(eq(competencyNodes.competencyModelId, modelId))
      .orderBy(competencyNodes.ordering);
  }

  async createCompetencyNode(node: InsertCompetencyNode): Promise<CompetencyNode> {
    const [created] = await db.insert(competencyNodes).values(node).returning();
    return created;
  }

  async getScaleDefinitions(workspaceId: string): Promise<ScaleDefinition[]> {
    return db.select().from(scaleDefinitions).where(eq(scaleDefinitions.workspaceId, workspaceId));
  }

  async createScaleDefinition(scale: InsertScaleDefinition): Promise<ScaleDefinition> {
    const [created] = await db.insert(scaleDefinitions).values(scale).returning();
    return created;
  }

  async getAssessmentsByWorkspace(workspaceId: string): Promise<Assessment[]> {
    return db
      .select()
      .from(assessments)
      .where(eq(assessments.workspaceId, workspaceId))
      .orderBy(desc(assessments.createdAt));
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async createAssessmentRecord(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async updateAssessmentRecord(id: string, data: Partial<Assessment>): Promise<Assessment> {
    const [updated] = await db.update(assessments).set(data).where(eq(assessments.id, id)).returning();
    return updated;
  }

  async getExercisesByAssessment(assessmentId: string): Promise<Exercise[]> {
    return db
      .select()
      .from(exercises)
      .where(eq(exercises.assessmentId, assessmentId))
      .orderBy(exercises.ordering);
  }

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExerciseRecord(exercise: InsertExercise): Promise<Exercise> {
    const [created] = await db.insert(exercises).values(exercise).returning();
    return created;
  }

  async getCandidateProfiles(assessmentId: string): Promise<CandidateProfile[]> {
    return db.select().from(candidateProfiles).where(eq(candidateProfiles.assessmentId, assessmentId));
  }

  async getCandidateProfileByUser(assessmentId: string, userId: string): Promise<CandidateProfile | undefined> {
    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(
        and(
          eq(candidateProfiles.assessmentId, assessmentId),
          eq(candidateProfiles.userId, userId)
        )
      );
    return profile;
  }

  async getCandidateProfilesByUserId(userId: string): Promise<CandidateProfile[]> {
    return db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId));
  }

  async createCandidateProfile(profile: InsertCandidateProfile): Promise<CandidateProfile> {
    const [created] = await db.insert(candidateProfiles).values(profile).returning();
    return created;
  }

  async updateCandidateProfile(id: string, data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const [updated] = await db.update(candidateProfiles).set(data).where(eq(candidateProfiles.id, id)).returning();
    return updated;
  }

  async getObserverAssignments(assessmentId: string): Promise<ObserverAssignment[]> {
    return db.select().from(observerAssignments).where(eq(observerAssignments.assessmentId, assessmentId));
  }

  async createObserverAssignment(assignment: InsertObserverAssignment): Promise<ObserverAssignment> {
    const [created] = await db.insert(observerAssignments).values(assignment).returning();
    return created;
  }

  async getRatingsByAssessment(assessmentId: string): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.assessmentId, assessmentId));
  }

  async getRatingsByObserver(assessmentId: string, observerUserId: string): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.assessmentId, assessmentId),
          eq(ratings.observerUserId, observerUserId)
        )
      );
  }

  async getRatingsByCandidate(assessmentId: string, candidateUserId: string): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.assessmentId, assessmentId),
          eq(ratings.candidateUserId, candidateUserId)
        )
      );
  }

  async createRatingRecord(rating: InsertRating): Promise<Rating> {
    const [created] = await db.insert(ratings).values(rating).returning();
    return created;
  }

  async upsertRatingRecord(rating: InsertRating): Promise<Rating> {
    const existing = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.assessmentId, rating.assessmentId),
          eq(ratings.exerciseId, rating.exerciseId),
          eq(ratings.competencyNodeId, rating.competencyNodeId),
          eq(ratings.observerUserId, rating.observerUserId),
          eq(ratings.candidateUserId, rating.candidateUserId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(ratings)
        .set({
          rawScore: rating.rawScore,
          scaleId: rating.scaleId,
          notes: rating.notes,
          evidenceSituation: rating.evidenceSituation,
          evidenceTask: rating.evidenceTask,
          evidenceAction: rating.evidenceAction,
          evidenceResult: rating.evidenceResult,
          normalizedScore: rating.normalizedScore,
          version: (existing[0].version ?? 1) + 1,
          previousVersionId: existing[0].id,
        })
        .where(eq(ratings.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(ratings).values(rating).returning();
    return created;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(workspaceId: string, limit: number = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, workspaceId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getConsentTemplates(workspaceId: string): Promise<ConsentTemplate[]> {
    return db.select().from(consentTemplates).where(eq(consentTemplates.workspaceId, workspaceId));
  }

  async createConsentTemplate(template: InsertConsentTemplate): Promise<ConsentTemplate> {
    const [created] = await db.insert(consentTemplates).values(template).returning();
    return created;
  }

  async getConsentRecords(userId: string): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).where(eq(consentRecords.userId, userId));
  }

  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    const [created] = await db.insert(consentRecords).values(record).returning();
    return created;
  }

  async getExerciseCompetencyMappings(exerciseId: string): Promise<ExerciseCompetencyMapping[]> {
    return db.select().from(exerciseCompetencyMappings).where(eq(exerciseCompetencyMappings.exerciseId, exerciseId));
  }

  async createExerciseCompetencyMapping(mapping: InsertExerciseCompetencyMapping): Promise<ExerciseCompetencyMapping> {
    const [created] = await db.insert(exerciseCompetencyMappings).values(mapping).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
