import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentResponseSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function seedAccessCodes() {
  const globalCodes = await storage.getAccessCodesByScope("global");
  if (globalCodes.length === 0) {
    const globalHash = await bcrypt.hash("aestimamus2026", 10);
    await storage.createAccessCode({ scope: "global", customerId: null, codeHash: globalHash, label: "Global Portal Access" });
  }

  const customers = [
    { id: "rewe", label: "REWE Group", defaultCode: "rewe-ac2026" },
    { id: "ruv", label: "R+V Versicherung", defaultCode: "ruv-ac2026" },
    { id: "materna", label: "Materna SE", defaultCode: "materna-ac2026" },
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
          return res.json({ success: true });
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

  return httpServer;
}
