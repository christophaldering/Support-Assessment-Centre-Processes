import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentResponseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
