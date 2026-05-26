/**
 * Demo-Daten für den Haupt-Workspace (main)
 * Fiktive Personen und Unternehmen — "Meridian AG"
 *
 * Idempotent: kann mehrfach ausgeführt werden ohne Duplikate.
 * Runner: npx tsx prisma/demo-seed.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDemoData() {
  const workspace = await prisma.workspace.findUnique({ where: { slug: "main" } });
  if (!workspace) {
    console.log("Demo-Seed: main workspace not found, skipping.");
    return;
  }
  const wid = workspace.id;

  // ── 1. Passwort-Hash ──────────────────────────────────────────────────────
  const pwHash = await bcrypt.hash("#Sammy2024", 10);

  // ── 2. Beobachter anlegen ────────────────────────────────────────────────
  const observerDefs = [
    { email: "sandra.koch@meridian-demo.de",   name: "Sandra Koch" },
    { email: "thomas.bremer@meridian-demo.de", name: "Thomas Bremer" },
  ];

  const observers: { id: string }[] = [];
  for (const o of observerDefs) {
    const existing = await prisma.user.findUnique({
      where: { email_workspaceId: { email: o.email, workspaceId: wid } },
    });
    if (existing) {
      observers.push({ id: existing.id });
    } else {
      const u = await prisma.user.create({
        data: {
          email: o.email,
          name: o.name,
          passwordHash: pwHash,
          roles: ["OBSERVER"],
          workspaceId: wid,
          status: "active",
          observerType: "external",
        },
      });
      observers.push({ id: u.id });
      console.log(`Demo-Seed: Beobachter "${u.name}" angelegt`);
    }
  }

  // ── 3. Kandidaten anlegen ────────────────────────────────────────────────
  const candidateDefs = [
    { email: "elena.brandt@meridian-demo.de",     name: "Dr. Elena Brandt" },
    { email: "felix.kurz@meridian-demo.de",        name: "Felix Kurz" },
    { email: "sophia.mertens@meridian-demo.de",    name: "Sophia Mertens" },
    { email: "jonas.weber@meridian-demo.de",       name: "Jonas Weber" },
    { email: "laura.hoffmann@meridian-demo.de",   name: "Laura Hoffmann" },
    { email: "maximilian.stern@meridian-demo.de", name: "Maximilian Stern" },
  ];

  const candidates: { id: string; name: string }[] = [];
  for (const c of candidateDefs) {
    const existing = await prisma.user.findUnique({
      where: { email_workspaceId: { email: c.email, workspaceId: wid } },
    });
    if (existing) {
      candidates.push({ id: existing.id, name: existing.name });
    } else {
      const u = await prisma.user.create({
        data: {
          email: c.email,
          name: c.name,
          passwordHash: pwHash,
          roles: ["CANDIDATE"],
          workspaceId: wid,
          status: "active",
        },
      });
      candidates.push({ id: u.id, name: u.name });
      console.log(`Demo-Seed: Kandidat "${u.name}" angelegt`);
    }
  }

  // ── 4. Kompetenz-Nodes holen ─────────────────────────────────────────────
  // Nutzt das "Leadership-Kompetenzmodell" das der Haupt-Seed anlegt
  const compModel = await prisma.competencyModel.findFirst({
    where: { workspaceId: wid, name: "Leadership-Kompetenzmodell" },
    include: { nodes: true },
  });

  const leafNodes = compModel?.nodes.filter((n) => n.nodeType === "competency") ?? [];

  // ── 5. Assessment 1: abgeschlossen (Meridian AG — Executive Selection) ───
  const completed = await prisma.assessment.findFirst({
    where: { workspaceId: wid, name: "Executive Selection — Meridian AG" },
    include: { exercises: true },
  });

  let completedId: string;
  let completedExercises: { id: string }[];

  if (completed) {
    completedId = completed.id;
    completedExercises = completed.exercises;
    console.log("Demo-Seed: Assessment 'Executive Selection' bereits vorhanden");
  } else {
    const a = await prisma.assessment.create({
      data: {
        name: "Executive Selection — Meridian AG",
        workspaceId: wid,
        clientName: "Meridian AG",
        status: "completed",
        description: "Abgeschlossenes Executive-Assessment zur Besetzung der Bereichsleitungsebene.",
        location: "Düsseldorf",
        targetPosition: "Bereichsleiter Operations",
        startDate: new Date("2026-03-10"),
        endDate: new Date("2026-03-11"),
        candidates: {
          connect: candidates.slice(0, 4).map((c) => ({ id: c.id })),
        },
        exercises: {
          create: [
            { name: "Strategisches Interview", type: "interview", duration: 45, sortOrder: 1 },
            { name: "Strategiepräsentation", type: "presentation", duration: 20, sortOrder: 2 },
            { name: "Fallstudie Restrukturierung", type: "case_study", duration: 60, sortOrder: 3 },
            { name: "Mitarbeitergespräch (Rolle)", type: "role_play", duration: 30, sortOrder: 4 },
          ],
        },
      },
      include: { exercises: true },
    });
    completedId = a.id;
    completedExercises = a.exercises;
    console.log(`Demo-Seed: Assessment "${a.name}" (abgeschlossen) angelegt`);
  }

  // Kandidaten dem abgeschlossenen Assessment zuordnen (idempotent via connect)
  await prisma.assessment.update({
    where: { id: completedId },
    data: { candidates: { connect: candidates.slice(0, 4).map((c) => ({ id: c.id })) } },
  });

  // ── 6. Observer-Ratings für abgeschlossenes Assessment ───────────────────
  if (leafNodes.length > 0 && completedExercises.length > 0) {
    const ratingValues: Record<string, number[]> = {
      [candidates[0].id]: [4, 5, 4, 3, 4],
      [candidates[1].id]: [3, 3, 4, 4, 3],
      [candidates[2].id]: [5, 4, 5, 4, 5],
      [candidates[3].id]: [3, 4, 3, 3, 3],
    };

    for (const exercise of completedExercises.slice(0, 3)) {
      for (const candidateId of candidates.slice(0, 4).map((c) => c.id)) {
        for (const observer of observers) {
          for (let ni = 0; ni < Math.min(leafNodes.length, 5); ni++) {
            const node = leafNodes[ni];
            const vals = ratingValues[candidateId] ?? [3, 3, 3, 3, 3];
            const base = vals[ni] ?? 3;
            const jitter = (observer.id === observers[1]?.id ? 0.5 : 0);
            const rating = Math.min(5, base + jitter);

            const existing = await prisma.observerRating.findUnique({
              where: {
                assessmentId_exerciseId_competencyNodeId_candidateId_observerId: {
                  assessmentId: completedId,
                  exerciseId: exercise.id,
                  competencyNodeId: node.id,
                  candidateId,
                  observerId: observer.id,
                },
              },
            });

            if (!existing) {
              await prisma.observerRating.create({
                data: {
                  assessmentId: completedId,
                  exerciseId: exercise.id,
                  competencyNodeId: node.id,
                  candidateId,
                  observerId: observer.id,
                  rating,
                  status: "submitted",
                  syncedAt: new Date("2026-03-11T17:00:00Z"),
                },
              });
            }
          }
        }
      }
    }
    console.log("Demo-Seed: Observer-Ratings angelegt");
  }

  // ── 7. Konsolidierte Scores ──────────────────────────────────────────────
  if (leafNodes.length > 0) {
    const consolidatedVals: Record<string, number[]> = {
      [candidates[0].id]: [4.0, 4.75, 4.0, 3.25, 4.0],
      [candidates[1].id]: [3.0, 3.25, 4.0, 4.0, 3.25],
      [candidates[2].id]: [5.0, 4.25, 5.0, 4.0, 4.75],
      [candidates[3].id]: [3.25, 3.75, 3.25, 3.0, 3.25],
    };

    for (const candidateId of candidates.slice(0, 4).map((c) => c.id)) {
      for (let ni = 0; ni < Math.min(leafNodes.length, 5); ni++) {
        const node = leafNodes[ni];
        const vals = consolidatedVals[candidateId] ?? [3.5, 3.5, 3.5, 3.5, 3.5];
        const val = vals[ni] ?? 3.5;

        const existing = await prisma.consolidatedScore.findFirst({
          where: {
            assessmentId: completedId,
            candidateId,
            competencyNodeId: node.id,
            exerciseId: null,
          },
        });

        if (!existing) {
          await prisma.consolidatedScore.create({
            data: {
              assessmentId: completedId,
              candidateId,
              competencyNodeId: node.id,
              exerciseId: null,
              consolidatedValue: val,
              normalizedValue: (val - 1) / 4,
              method: "mean",
              raterCount: 2,
              version: 1,
            },
          });
        }
      }
    }
    console.log("Demo-Seed: Konsolidierte Scores angelegt");
  }

  // ── 8. Assessment 2: aktiv ────────────────────────────────────────────────
  const activeExists = await prisma.assessment.findFirst({
    where: { workspaceId: wid, name: "Leadership Development AC — Meridian AG" },
  });

  let activeId2: string;
  if (!activeExists) {
    const a = await prisma.assessment.create({
      data: {
        name: "Leadership Development AC — Meridian AG",
        workspaceId: wid,
        clientName: "Meridian AG",
        status: "active",
        description: "Laufendes Development Center für aufstrebende Führungskräfte.",
        location: "Frankfurt am Main",
        targetPosition: "Senior Manager / Director",
        startDate: new Date("2026-05-20"),
        endDate: new Date("2026-05-21"),
        candidates: {
          connect: candidates.slice(4, 6).map((c) => ({ id: c.id })),
        },
        exercises: {
          create: [
            { name: "Kompetenzinterview", type: "interview", duration: 50, sortOrder: 1 },
            { name: "Postkorbübung", type: "in_tray", duration: 45, sortOrder: 2 },
            { name: "Feedback-Rollenspiel", type: "role_play", duration: 30, sortOrder: 3 },
          ],
        },
      },
    });
    activeId2 = a.id;
    console.log(`Demo-Seed: Assessment "${a.name}" (aktiv) angelegt`);
  } else {
    activeId2 = activeExists.id;
    console.log("Demo-Seed: Assessment 'Leadership Development AC' bereits vorhanden");
  }

  // ── 8b. Assessment 4: zweites aktives Assessment ──────────────────────────
  const active2Exists = await prisma.assessment.findFirst({
    where: { workspaceId: wid, name: "Potenzialanalyse Vertrieb — Meridian AG" },
  });

  if (!active2Exists) {
    const a = await prisma.assessment.create({
      data: {
        name: "Potenzialanalyse Vertrieb — Meridian AG",
        workspaceId: wid,
        clientName: "Meridian AG",
        status: "active",
        description: "Laufende Potenzialanalyse für die Besetzung des Vertriebsteams.",
        location: "Hamburg",
        targetPosition: "Sales Manager DACH",
        startDate: new Date("2026-06-02"),
        endDate: new Date("2026-06-03"),
        candidates: {
          connect: [candidates[2], candidates[5]].map((c) => ({ id: c.id })),
        },
        exercises: {
          create: [
            { name: "Verkaufsgespräch (Rolle)", type: "role_play", duration: 25, sortOrder: 1 },
            { name: "Strategisches Interview Vertrieb", type: "interview", duration: 45, sortOrder: 2 },
          ],
        },
      },
    });
    console.log(`Demo-Seed: Assessment "${a.name}" (aktiv 2) angelegt`);
  } else {
    console.log("Demo-Seed: Assessment 'Potenzialanalyse Vertrieb' bereits vorhanden");
  }

  // ── 9. Assessment 3: Vorbereitung ─────────────────────────────────────────
  const prepExists = await prisma.assessment.findFirst({
    where: { workspaceId: wid, name: "Nachwuchsführung Q3 2026 — Meridian AG" },
  });

  if (!prepExists) {
    const a = await prisma.assessment.create({
      data: {
        name: "Nachwuchsführung Q3 2026 — Meridian AG",
        workspaceId: wid,
        clientName: "Meridian AG",
        status: "preparation",
        description: "Geplantes AC für Nachwuchsführungskräfte im dritten Quartal 2026.",
        location: "Berlin",
        targetPosition: "Teamleitung / Gruppenleitung",
        startDate: new Date("2026-09-15"),
        endDate: new Date("2026-09-16"),
        exercises: {
          create: [
            { name: "Eignungsinterview", type: "interview", duration: 45, sortOrder: 1 },
            { name: "Gruppenübung Teamkonflikt", type: "group_discussion", duration: 40, sortOrder: 2 },
          ],
        },
      },
    });
    console.log(`Demo-Seed: Assessment "${a.name}" (Vorbereitung) angelegt`);
  } else {
    console.log("Demo-Seed: Assessment 'Nachwuchsführung Q3 2026' bereits vorhanden");
  }

  // ── 10. Übungsbibliothek ───────────────────────────────────────────────────
  const libraryItems = [
    {
      title: "Strategisches Interview — Führungskräfte",
      exerciseType: "interview",
      tags: ["interview", "strategie", "führung", "senior"],
      targetLevels: ["senior_manager", "director", "vp"],
      description: "Kompetenzbasiertes Interview mit Fokus auf strategische Führung und Entscheidungsfähigkeit. Enthält Leitfaden, Einstiegsfragen und Bewertungsrubrik.",
    },
    {
      title: "Präsentationsaufgabe: Geschäftsstrategie",
      exerciseType: "presentation",
      tags: ["präsentation", "strategie", "kommunikation"],
      targetLevels: ["manager", "senior_manager", "director"],
      description: "Kandidaten entwickeln und präsentieren eine Geschäftsstrategie für ein fiktives Unternehmen. 20 Min. Vorbereitung, 15 Min. Präsentation, 10 Min. Q&A.",
    },
    {
      title: "Fallstudie: Marktexpansion international",
      exerciseType: "case_study",
      tags: ["fallstudie", "markt", "international", "analytik"],
      targetLevels: ["director", "vp", "c_level"],
      description: "Analyse eines fiktiven Unternehmenseintritts in drei neue Märkte. Entscheidungsdruckübung mit unvollständigen Informationen.",
    },
    {
      title: "Mitarbeitergespräch: Konfliktsituation",
      exerciseType: "role_play",
      tags: ["rollenspiel", "konflikt", "führung", "feedback"],
      targetLevels: ["manager", "senior_manager"],
      description: "Rollenspiel mit Teamleiter-Szenario: schwieriges Feedback-Gespräch mit einem leistungsschwachen Mitarbeiter. Inkl. Rollenkarte für Beobachter.",
    },
    {
      title: "Postkorbübung: Krisenmanagement",
      exerciseType: "in_tray",
      tags: ["postkorb", "krise", "priorisierung", "entscheidung"],
      targetLevels: ["manager", "senior_manager", "director"],
      description: "Klassische Postkorbübung mit 18 E-Mails, Memos und Anfragen in einem fiktiven Krisenkontext (Lieferkettenausfall). Zeitlimit: 45 Minuten.",
    },
  ];

  for (const item of libraryItems) {
    const existing = await prisma.exerciseLibraryItem.findFirst({
      where: { workspaceId: wid, title: item.title },
    });
    if (!existing) {
      await prisma.exerciseLibraryItem.create({
        data: {
          workspaceId: wid,
          title: item.title,
          description: item.description,
          exerciseType: item.exerciseType,
          tags: item.tags,
          targetLevels: item.targetLevels,
          languagesAvailable: ["DE"],
          scope: "general",
          qualityStatus: "approved",
        },
      });
      console.log(`Demo-Seed: Bibliotheks-Baustein "${item.title}" angelegt`);
    }
  }

  // ── 11. Anforderungsanalyse + Verknüpfung zum Assessment ─────────────────
  const adminUser = await prisma.user.findUnique({
    where: { email_workspaceId: { email: "christoph.aldering@googlemail.com", workspaceId: wid } },
  });
  const creatorId = adminUser?.id ?? observers[0]?.id ?? "system";

  const reqExists = await prisma.requirementsAnalysis.findFirst({
    where: { workspaceId: wid, title: "Anforderungsprofil: Bereichsleiter Operations — Meridian AG" },
  });

  let reqId: string;
  if (!reqExists) {
    const req = await prisma.requirementsAnalysis.create({
      data: {
        workspaceId: wid,
        title: "Anforderungsprofil: Bereichsleiter Operations — Meridian AG",
        clientName: "Meridian AG",
        projectName: "Executive Selection Q1 2026",
        mode: "auto",
        status: "completed",
        inputType: "text",
        appliedAssessmentId: completedId,
        transcript: `Wir suchen eine erfahrene Führungspersönlichkeit für die Position des Bereichsleiters Operations.
Die Person verantwortet eine Abteilung mit 120 Mitarbeitenden und berichtet direkt an den COO.

Anforderungen:
- 10+ Jahre Berufserfahrung in vergleichbarer Position
- Nachweisliche Führungserfolge in Transformationsprojekten
- Ausgeprägte analytische Fähigkeiten und Entscheidungsstärke
- Exzellente Kommunikation auf Vorstandsebene
- Internationalerfahrung wünschenswert

Schlüsselkompetenzen: Strategische Führung, Change Management, Kommunikation, Entscheidungsfähigkeit`,
        proposal: {
          competencies: [
            { name: "Strategische Führung", weight: 0.35, rationale: "Verantwortung für strategische Ausrichtung der Abteilung" },
            { name: "Change Management", weight: 0.25, rationale: "Transformationsprojekte sind Kernanforderung" },
            { name: "Kommunikation", weight: 0.20, rationale: "Schnittstelle zu Vorstand und Stakeholdern" },
            { name: "Entscheidungsfähigkeit", weight: 0.20, rationale: "Schnelle Entscheidungen unter Unsicherheit erforderlich" },
          ],
          recommendedAssessmentDesign: "Executive Assessment Center, 2 Tage, 4–6 Kandidaten",
        },
        consentGiven: true,
        consentTimestamp: new Date("2026-02-01T09:00:00Z"),
        consentUserId: creatorId,
        createdById: creatorId,
      },
    });
    reqId = req.id;
    // Link the assessment back to this requirements analysis
    await prisma.assessment.update({
      where: { id: completedId },
      data: { sourceAnalysisId: reqId },
    });
    console.log("Demo-Seed: Anforderungsanalyse angelegt und mit Assessment verknüpft");
  } else {
    reqId = reqExists.id;
    // Ensure bidirectional link even if analysis already existed
    const completedAssessment = await prisma.assessment.findUnique({ where: { id: completedId } });
    if (!completedAssessment?.sourceAnalysisId) {
      await prisma.assessment.update({
        where: { id: completedId },
        data: { sourceAnalysisId: reqId },
      });
    }
    console.log("Demo-Seed: Anforderungsanalyse bereits vorhanden");
  }

  // ── 12. ExerciseCompetencyMappings für abgeschlossenes Assessment ─────────
  if (leafNodes.length > 0 && completedExercises.length > 0) {
    // Create snapshot first (or reuse existing)
    let snapshot = await prisma.mtmmSnapshot.findFirst({
      where: { assessmentId: completedId },
    });
    if (!snapshot) {
      snapshot = await prisma.mtmmSnapshot.create({
        data: {
          assessmentId: completedId,
          version: 1,
          label: "Demo-Konsolidierung",
          status: "locked",
          lockedAt: new Date("2026-03-11T18:00:00Z"),
          lockedReason: "Automatisch gesperrt nach Bewertungsabgabe",
        },
      });
      console.log("Demo-Seed: MTMM-Snapshot angelegt");
    }

    // Map each exercise to the most relevant competency nodes
    const exerciseNodeMap: Record<number, number[]> = {
      0: [0, 1, 2],   // Strategisches Interview → Visionsentwicklung, Strategische Planung, Change Mgmt
      1: [3, 4],       // Strategiepräsentation → Präsentation, Aktives Zuhören
      2: [1, 2, 0],   // Fallstudie → Strategische Planung, Change Mgmt, Vision
      3: [3, 4],       // Rollenspiel → Kommunikationskompetenzen
    };

    for (let ei = 0; ei < Math.min(completedExercises.length, 4); ei++) {
      const exercise = completedExercises[ei];
      const nodeIndices = exerciseNodeMap[ei] ?? [0];
      for (const ni of nodeIndices) {
        if (ni >= leafNodes.length) continue;
        const node = leafNodes[ni];
        const existing = await prisma.exerciseCompetencyMapping.findUnique({
          where: {
            exerciseId_competencyNodeId_snapshotId: {
              exerciseId: exercise.id,
              competencyNodeId: node.id,
              snapshotId: snapshot.id,
            },
          },
        });
        if (!existing) {
          await prisma.exerciseCompetencyMapping.create({
            data: {
              exerciseId: exercise.id,
              competencyNodeId: node.id,
              snapshotId: snapshot.id,
              weight: 1.0,
            },
          });
        }
      }
    }
    console.log("Demo-Seed: ExerciseCompetencyMappings angelegt");
  }

  console.log("Demo-Seed: Fertig ✓");
}

// ── Standalone-Ausführung ────────────────────────────────────────────────────
const isMain = process.argv[1]?.endsWith("demo-seed.ts") ||
               process.argv[1]?.endsWith("demo-seed.js");

if (isMain) {
  seedDemoData()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}
