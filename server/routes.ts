import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertAssessmentResponseSchema,
  insertObserverRatingSchema,
  insertSelfAssessmentSchema,
  insertTimedReleaseSchema,
  insertObserverSessionSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD = "aestimamus-admin-2026";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await seedAccessCodes();

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

  return httpServer;
}
