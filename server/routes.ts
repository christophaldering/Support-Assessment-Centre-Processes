import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertAssessmentResponseSchema,
  insertObserverRatingSchema,
  insertSelfAssessmentSchema,
  insertTimedReleaseSchema,
  insertObserverSessionSchema,
  insertAuditLogSchema,
  type WorkspaceTheme,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD = "Christoph";

async function seedAccessCodes() {
  const globalCodes = await storage.getAccessCodesByScope("global");
  if (globalCodes.length === 0) {
    const globalHash = await bcrypt.hash("Christoph", 10);
    await storage.createAccessCode({ scope: "global", customerId: null, codeHash: globalHash, label: "Global Portal Access" });
  }

  const customers = [
    { id: "rewe", label: "REWE Group", defaultCode: "Christoph" },
    { id: "ruv", label: "R+V Versicherung", defaultCode: "Christoph" },
    { id: "materna", label: "Materna SE", defaultCode: "Christoph" },
  ];

  for (const customer of customers) {
    const existing = await storage.getAccessCodesByScope("customer", customer.id);
    if (existing.length === 0) {
      const hash = await bcrypt.hash(customer.defaultCode, 10);
      await storage.createAccessCode({ scope: "customer", customerId: customer.id, codeHash: hash, label: customer.label });
    }
  }
}

async function seedPlatformData() {
  const existing = await storage.getWorkspaceBySlug("aestimamus");
  if (existing) return;

  const adminPasswordHash = await bcrypt.hash("Christoph", 10);

  const workspace = await storage.createWorkspace({
    name: "aestimamus",
    slug: "aestimamus",
    adminPasswordHash,
    theme: {
      primaryColor: "hsl(14, 48%, 44%)",
      secondaryColor: "#1a1a1a",
      accentColor: "hsl(14, 48%, 44%)",
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      fontFamily: "Inter",
      fontFamilyHeading: "Playfair Display",
    } as WorkspaceTheme,
    status: "active",
  });

  const passwordHash = await bcrypt.hash("Christoph", 10);

  const platformUserDefs = [
    { email: "admin@aestimamus.de", firstName: "Christoph", lastName: "Aldering", roles: ["ADMIN"] },
    { email: "moderator@aestimamus.de", firstName: "Max", lastName: "Moderator", roles: ["MODERATOR"] },
    { email: "observer@aestimamus.de", firstName: "Lisa", lastName: "Observer", roles: ["OBSERVER"] },
    { email: "candidate@aestimamus.de", firstName: "Thomas", lastName: "Kandidat", roles: ["CANDIDATE"] },
    { email: "hr@aestimamus.de", firstName: "Sarah", lastName: "HR-Partnerin", roles: ["HR_CLIENT"] },
  ];

  const createdUsers: Record<string, any> = {};
  for (const def of platformUserDefs) {
    const user = await storage.createPlatformUser({
      workspaceId: workspace.id,
      email: def.email,
      passwordHash,
      firstName: def.firstName,
      lastName: def.lastName,
      roles: def.roles,
      mustChangePassword: false,
      status: "active",
    });
    createdUsers[def.email] = user;
  }

  const competencyModel = await storage.createCompetencyModel({
    workspaceId: workspace.id,
    name: "Executive Assessment Kompetenzmodell",
    description: "Competency model for executive assessment based on Varexia SE case study",
    version: 1,
    status: "active",
  });

  const competencyDefs = [
    {
      title: "Strategic Thinking",
      titleDe: "Strategisches Denken",
      description: "Ability to analyze complex situations, identify patterns, and develop coherent strategic perspectives",
      ordering: 0,
      anchors: [
        { level: 1, text: "Focuses on isolated facts without connecting them to broader patterns" },
        { level: 2, text: "Identifies some connections but lacks a coherent overall perspective" },
        { level: 3, text: "Develops a structured view with clear priorities and logical reasoning" },
        { level: 4, text: "Integrates multiple perspectives into a nuanced, evidence-based strategic assessment" },
        { level: 5, text: "Exceptional ability to navigate ambiguity and synthesize complex, conflicting information into actionable insight" },
      ],
    },
    {
      title: "Financial Acumen",
      titleDe: "Finanzielle Kompetenz",
      description: "Understanding of financial data, cash flow dynamics, and capital allocation trade-offs",
      ordering: 1,
      anchors: [
        { level: 1, text: "Limited understanding of financial indicators and their implications" },
        { level: 2, text: "Reads financial data but struggles with implications and trade-offs" },
        { level: 3, text: "Solid grasp of financial dynamics and their strategic implications" },
        { level: 4, text: "Deep understanding of financial interdependencies and capital allocation" },
        { level: 5, text: "Expert-level financial reasoning with sophisticated scenario thinking" },
      ],
    },
    {
      title: "Stakeholder Management",
      titleDe: "Stakeholder Management",
      description: "Ability to navigate diverse stakeholder interests and manage competing expectations",
      ordering: 2,
      anchors: [
        { level: 1, text: "Ignores or oversimplifies stakeholder dynamics" },
        { level: 2, text: "Acknowledges stakeholders but does not address competing interests" },
        { level: 3, text: "Balances key stakeholder perspectives with clear reasoning" },
        { level: 4, text: "Proactively addresses stakeholder tensions and proposes realistic alignment strategies" },
        { level: 5, text: "Masterfully navigates complex stakeholder landscapes with political sensitivity and strategic empathy" },
      ],
    },
    {
      title: "Decision Quality",
      titleDe: "Entscheidungsqualität",
      description: "Quality of judgment under uncertainty, willingness to make explicit trade-offs",
      ordering: 3,
      anchors: [
        { level: 1, text: "Avoids decisions or makes choices without clear rationale" },
        { level: 2, text: "Makes decisions but does not address trade-offs explicitly" },
        { level: 3, text: "Makes well-reasoned decisions with explicit trade-off acknowledgment" },
        { level: 4, text: "Demonstrates strong judgment under uncertainty with clear prioritization logic" },
        { level: 5, text: "Exceptional decision-making that embraces complexity and makes courageous, well-substantiated choices" },
      ],
    },
    {
      title: "Communication & Presence",
      titleDe: "Kommunikation & Präsenz",
      description: "Clarity, structure, and persuasiveness of communication",
      ordering: 4,
      anchors: [
        { level: 1, text: "Unclear or disorganized communication" },
        { level: 2, text: "Communicates key points but lacks structure or persuasiveness" },
        { level: 3, text: "Clear, structured communication with appropriate executive-level tone" },
        { level: 4, text: "Highly compelling and well-structured argumentation that engages the audience" },
        { level: 5, text: "Outstanding executive presence with masterful ability to frame complex issues accessibly" },
      ],
    },
    {
      title: "Leadership Impact",
      titleDe: "Leadership Impact",
      description: "Ability to inspire confidence, take ownership, and drive organizational clarity",
      ordering: 5,
      anchors: [
        { level: 1, text: "Passive or hesitant in taking ownership of the situation" },
        { level: 2, text: "Shows some initiative but lacks conviction or follow-through" },
        { level: 3, text: "Takes clear ownership and demonstrates credible leadership stance" },
        { level: 4, text: "Inspires confidence through decisive action and thoughtful organizational perspective" },
        { level: 5, text: "Demonstrates transformational leadership potential with vision, courage, and authentic impact" },
      ],
    },
  ];

  const createdNodes: any[] = [];
  for (const def of competencyDefs) {
    const node = await storage.createCompetencyNode({
      competencyModelId: competencyModel.id,
      nodeType: "Competency",
      title: def.title,
      titleDe: def.titleDe,
      description: def.description,
      anchors: def.anchors,
      ordering: def.ordering,
    });
    createdNodes.push(node);
  }

  const scale = await storage.createScaleDefinition({
    workspaceId: workspace.id,
    name: "Likert 1-5",
    type: "likert",
    min: 1,
    max: 5,
    labels: [
      { value: 1, label: "Grundlegend" },
      { value: 2, label: "Entwickelnd" },
      { value: 3, label: "Kompetent" },
      { value: 4, label: "Fortgeschritten" },
      { value: 5, label: "Exzellent" },
    ],
    version: 1,
  });

  const assessment = await storage.createAssessmentRecord({
    workspaceId: workspace.id,
    title: "Varexia SE Executive Assessment",
    targetRole: "Executive Board Member",
    organizationName: "Varexia SE",
    language: "DE",
    competencyModelId: competencyModel.id,
    scaleId: scale.id,
    status: "active",
  });

  const exercise = await storage.createExerciseRecord({
    assessmentId: assessment.id,
    type: "CASE_STUDY",
    title: "Varexia SE Fallstudie",
    titleDe: "Varexia SE Fallstudie",
    duration: 90,
    ordering: 0,
    status: "active",
  });

  for (const node of createdNodes) {
    await storage.createExerciseCompetencyMapping({
      exerciseId: exercise.id,
      competencyNodeId: node.id,
      weight: 1.0,
    });
  }

  const candidateUser = createdUsers["candidate@aestimamus.de"];
  await storage.createCandidateProfile({
    assessmentId: assessment.id,
    userId: candidateUser.id,
    status: "invited",
    briefingConfirmed: false,
  });

  const observerUser = createdUsers["observer@aestimamus.de"];
  await storage.createObserverAssignment({
    assessmentId: assessment.id,
    userId: observerUser.id,
    exerciseScope: "all",
  });

  console.log("Platform data seeded successfully for workspace:", workspace.slug);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await seedAccessCodes();
  await seedPlatformData();

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const schema = z.object({
        scope: z.enum(["global", "customer"]),
        customerId: z.string().optional(),
        code: z.string().min(1),
      });
      const { scope, customerId, code } = schema.parse(req.body);

      const codes = await storage.getAccessCodesByScope(scope, customerId);
      if (codes.length === 0) {
        return res.status(401).json({ success: false, message: "Kein Zugangscode konfiguriert." });
      }

      for (const accessCode of codes) {
        const match = await bcrypt.compare(code, accessCode.codeHash);
        if (match) {
          return res.json({ success: true, participantName: accessCode.participantName || null });
        }
      }

      return res.status(401).json({ success: false, message: "Ungültiger Zugangscode." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Ungültige Anfrage." });
      }
      console.error("Error verifying access code:", error);
      res.status(500).json({ success: false, message: "Interner Fehler." });
    }
  });

  app.post("/api/auth/admin", async (req, res) => {
    try {
      const { password } = z.object({ password: z.string() }).parse(req.body);
      if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
      }
      return res.status(401).json({ success: false, message: "Ungültiges Admin-Passwort." });
    } catch {
      return res.status(400).json({ success: false });
    }
  });

  app.get("/api/assessments/:caseId/:sessionId", async (req, res) => {
    try {
      const { caseId, sessionId } = req.params;
      const responses = await storage.getAssessmentResponses(caseId, sessionId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching assessment responses:", error);
      res.status(500).json({ message: "Failed to fetch assessment responses" });
    }
  });

  app.post("/api/assessments/save", async (req, res) => {
    try {
      const parsed = insertAssessmentResponseSchema.parse(req.body);
      const result = await storage.upsertAssessmentResponse(parsed);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error saving assessment response:", error);
      res.status(500).json({ message: "Failed to save assessment response" });
    }
  });

  app.post("/api/assessments/save-all", async (req, res) => {
    try {
      const bodySchema = z.array(insertAssessmentResponseSchema);
      const parsed = bodySchema.parse(req.body);
      const results = await storage.bulkUpsertAssessmentResponses(parsed);
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error bulk saving assessment responses:", error);
      res.status(500).json({ message: "Failed to save assessment responses" });
    }
  });

  app.get("/api/admin/responses", async (_req, res) => {
    try {
      const responses = await storage.getAllAssessmentResponses();
      res.json(responses);
    } catch (error) {
      console.error("Error fetching all responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.get("/api/admin/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/admin/access-codes", async (_req, res) => {
    try {
      const codes = await storage.getAllAccessCodes();
      const safe = codes.map(c => ({ ...c, codeHash: undefined }));
      res.json(safe);
    } catch (error) {
      console.error("Error fetching access codes:", error);
      res.status(500).json({ message: "Failed to fetch access codes" });
    }
  });

  app.post("/api/admin/access-codes", async (req, res) => {
    try {
      const schema = z.object({
        scope: z.string(),
        customerId: z.string().optional(),
        code: z.string().min(1),
        label: z.string().optional(),
        participantName: z.string().optional(),
        participantEmail: z.string().optional(),
      });
      const { code, ...rest } = schema.parse(req.body);
      const codeHash = await bcrypt.hash(code, 10);
      const created = await storage.createAccessCode({ ...rest, codeHash });
      res.json({ ...created, codeHash: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request" });
      }
      console.error("Error creating access code:", error);
      res.status(500).json({ message: "Failed to create access code" });
    }
  });

  app.delete("/api/admin/access-codes/:id", async (req, res) => {
    try {
      await storage.deleteAccessCode(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting access code:", error);
      res.status(500).json({ message: "Failed to delete access code" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.string(),
        customerId: z.string().optional(),
        caseId: z.string(),
        participantName: z.string().optional(),
      });
      const parsed = schema.parse(req.body);
      const existing = await storage.getSession(parsed.sessionId, parsed.caseId);
      if (existing) {
        return res.json(existing);
      }
      const session = await storage.createSession({ ...parsed, status: "active", briefingConfirmed: false });
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:sessionId/:caseId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId, req.params.caseId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const updated = await storage.updateSession(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.get("/api/exercises/:customerId", async (req, res) => {
    try {
      const exercises = await storage.getUploadedExercises(req.params.customerId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.get("/api/admin/exercises", async (_req, res) => {
    try {
      const exercises = await storage.getAllUploadedExercises();
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.post("/api/admin/exercises", async (req, res) => {
    try {
      const schema = z.object({
        customerId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        type: z.string().default("document"),
        fileName: z.string().optional(),
        fileData: z.string().optional(),
        status: z.string().default("active"),
      });
      const parsed = schema.parse(req.body);
      const exercise = await storage.createUploadedExercise(parsed);
      res.json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(500).json({ message: "Failed to create exercise" });
    }
  });

  app.delete("/api/admin/exercises/:id", async (req, res) => {
    try {
      await storage.deleteUploadedExercise(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  // Observer Ratings
  app.post("/api/observer/ratings", async (req, res) => {
    try {
      const parsed = insertObserverRatingSchema.parse(req.body);
      const result = await storage.upsertObserverRating(parsed);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error upserting observer rating:", error);
      res.status(500).json({ message: "Failed to save observer rating" });
    }
  });

  app.get("/api/observer/ratings/:sessionId/:caseId", async (req, res) => {
    try {
      const ratings = await storage.getObserverRatings(req.params.sessionId, req.params.caseId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching observer ratings:", error);
      res.status(500).json({ message: "Failed to fetch observer ratings" });
    }
  });

  app.get("/api/observer/session/:sessionId/:caseId", async (req, res) => {
    try {
      const { sessionId, caseId } = req.params;
      const session = await storage.getSession(sessionId, caseId);
      const responses = await storage.getAssessmentResponses(caseId, sessionId);
      res.json({ session: session || null, responses });
    } catch (error) {
      console.error("Error fetching observer session data:", error);
      res.status(500).json({ message: "Failed to fetch observer session data" });
    }
  });

  app.post("/api/observer/sessions", async (req, res) => {
    try {
      const parsed = insertObserverSessionSchema.parse(req.body);
      const existing = await storage.getObserverSession(parsed.observerName, parsed.targetSessionId, parsed.caseId);
      if (existing) {
        return res.json(existing);
      }
      const created = await storage.createObserverSession(parsed);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error creating observer session:", error);
      res.status(500).json({ message: "Failed to create observer session" });
    }
  });

  // Self Assessments
  app.post("/api/self-assessment", async (req, res) => {
    try {
      const parsed = insertSelfAssessmentSchema.parse(req.body);
      const result = await storage.upsertSelfAssessment(parsed);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error upserting self assessment:", error);
      res.status(500).json({ message: "Failed to save self assessment" });
    }
  });

  app.get("/api/self-assessment/:sessionId/:caseId", async (req, res) => {
    try {
      const assessments = await storage.getSelfAssessments(req.params.sessionId, req.params.caseId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching self assessments:", error);
      res.status(500).json({ message: "Failed to fetch self assessments" });
    }
  });

  // Timed Releases (admin)
  app.get("/api/admin/timed-releases/:caseId", async (req, res) => {
    try {
      const releases = await storage.getTimedReleases(req.params.caseId);
      res.json(releases);
    } catch (error) {
      console.error("Error fetching timed releases:", error);
      res.status(500).json({ message: "Failed to fetch timed releases" });
    }
  });

  app.post("/api/admin/timed-releases", async (req, res) => {
    try {
      const parsed = insertTimedReleaseSchema.parse(req.body);
      const created = await storage.createTimedRelease(parsed);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error creating timed release:", error);
      res.status(500).json({ message: "Failed to create timed release" });
    }
  });

  app.patch("/api/admin/timed-releases/:id", async (req, res) => {
    try {
      const updated = await storage.updateTimedRelease(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating timed release:", error);
      res.status(500).json({ message: "Failed to update timed release" });
    }
  });

  app.delete("/api/admin/timed-releases/:id", async (req, res) => {
    try {
      await storage.deleteTimedRelease(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timed release:", error);
      res.status(500).json({ message: "Failed to delete timed release" });
    }
  });

  // Candidate timed release check (only released=true)
  app.get("/api/timed-releases/:caseId", async (req, res) => {
    try {
      const allReleases = await storage.getTimedReleases(req.params.caseId);
      const released = allReleases.filter(r => r.released === true);
      res.json(released);
    } catch (error) {
      console.error("Error fetching released timed releases:", error);
      res.status(500).json({ message: "Failed to fetch timed releases" });
    }
  });

  // Admin comparison data
  app.get("/api/admin/observer-ratings/:caseId", async (req, res) => {
    try {
      const ratings = await storage.getObserverRatingsByCase(req.params.caseId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching observer ratings by case:", error);
      res.status(500).json({ message: "Failed to fetch observer ratings" });
    }
  });

  app.get("/api/admin/self-assessments", async (_req, res) => {
    try {
      const assessments = await storage.getAllSelfAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching all self assessments:", error);
      res.status(500).json({ message: "Failed to fetch self assessments" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // PLATFORM ROUTES (Blueprint Architecture)
  // ═══════════════════════════════════════════════════════════

  app.post("/api/platform/auth/master", async (req, res) => {
    try {
      const { password } = z.object({ password: z.string() }).parse(req.body);
      if (password === "Christoph") {
        return res.json({ success: true });
      }
      return res.status(401).json({ success: false, message: "Invalid master password." });
    } catch {
      return res.status(400).json({ success: false });
    }
  });

  app.get("/api/platform/workspaces", async (_req, res) => {
    try {
      const allWorkspaces = await storage.getWorkspaces();
      const safe = allWorkspaces.map(ws => ({ ...ws, adminPasswordHash: undefined }));
      res.json(safe);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/platform/auth/workspace", async (req, res) => {
    try {
      const { workspaceId, password } = z.object({ workspaceId: z.string(), password: z.string() }).parse(req.body);
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(401).json({ success: false, message: "Workspace not found." });
      }
      const match = await bcrypt.compare(password, workspace.adminPasswordHash);
      if (match) {
        return res.json({ success: true, workspace: { ...workspace, adminPasswordHash: undefined } });
      }
      return res.status(401).json({ success: false, message: "Invalid workspace password." });
    } catch {
      return res.status(400).json({ success: false });
    }
  });

  app.post("/api/platform/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(req.body);
      const user = await storage.getPlatformUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }
      await storage.updatePlatformUser(user.id, { lastLoginAt: new Date() });
      let workspaceSlug = "aestimamus";
      if (user.workspaceId) {
        const ws = await storage.getWorkspace(user.workspaceId);
        if (ws) workspaceSlug = ws.slug;
      }
      return res.json({
        success: true,
        user: { ...user, passwordHash: undefined, workspaceSlug },
        mustChangePassword: user.mustChangePassword,
      });
    } catch {
      return res.status(400).json({ success: false });
    }
  });

  app.post("/api/platform/auth/change-password", async (req, res) => {
    try {
      const { userId, newPassword } = z.object({ userId: z.string(), newPassword: z.string() }).parse(req.body);
      const newHash = await bcrypt.hash(newPassword, 10);
      await storage.updatePlatformUser(userId, { passwordHash: newHash, mustChangePassword: false });
      return res.json({ success: true });
    } catch {
      return res.status(400).json({ success: false });
    }
  });

  app.get("/api/platform/workspaces/:slug", async (req, res) => {
    try {
      const workspace = await storage.getWorkspaceBySlug(req.params.slug);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      res.json({ ...workspace, adminPasswordHash: undefined });
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.get("/api/platform/workspaces/:workspaceId/users", async (req, res) => {
    try {
      const users = await storage.getPlatformUsersByWorkspace(req.params.workspaceId);
      const safe = users.map(u => ({ ...u, passwordHash: undefined }));
      res.json(safe);
    } catch (error) {
      console.error("Error fetching workspace users:", error);
      res.status(500).json({ message: "Failed to fetch workspace users" });
    }
  });

  app.get("/api/platform/assessments/:workspaceId", async (req, res) => {
    try {
      const assessmentList = await storage.getAssessmentsByWorkspace(req.params.workspaceId);
      res.json(assessmentList);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/platform/assessment/:assessmentId", async (req, res) => {
    try {
      const assessment = await storage.getAssessmentById(req.params.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      const exerciseList = await storage.getExercisesByAssessment(assessment.id);
      const candidates = await storage.getCandidateProfiles(assessment.id);
      const observers = await storage.getObserverAssignments(assessment.id);
      res.json({ assessment, exercises: exerciseList, candidateProfiles: candidates, observerAssignments: observers });
    } catch (error) {
      console.error("Error fetching assessment details:", error);
      res.status(500).json({ message: "Failed to fetch assessment details" });
    }
  });

  app.get("/api/platform/competency-model/:modelId", async (req, res) => {
    try {
      const model = await storage.getCompetencyModel(req.params.modelId);
      if (!model) {
        return res.status(404).json({ message: "Competency model not found" });
      }
      const nodes = await storage.getCompetencyNodes(model.id);
      res.json({ model, nodes });
    } catch (error) {
      console.error("Error fetching competency model:", error);
      res.status(500).json({ message: "Failed to fetch competency model" });
    }
  });

  app.get("/api/platform/candidate/:userId/assessments", async (req, res) => {
    try {
      const profiles = await storage.getCandidateProfilesByUserId(req.params.userId);
      const results = [];
      for (const profile of profiles) {
        const assessment = await storage.getAssessmentById(profile.assessmentId);
        results.push({ ...profile, assessment });
      }
      res.json(results);
    } catch (error) {
      console.error("Error fetching candidate assessments:", error);
      res.status(500).json({ message: "Failed to fetch candidate assessments" });
    }
  });

  app.post("/api/platform/audit", async (req, res) => {
    try {
      const parsed = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(parsed);
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error("Error creating audit log:", error);
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  app.get("/api/platform/audit/:workspaceId", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(req.params.workspaceId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  return httpServer;
}
