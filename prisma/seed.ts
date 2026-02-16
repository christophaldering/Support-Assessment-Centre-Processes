import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Christoph", 10);

  const existing = await prisma.workspace.findUnique({ where: { slug: "aestimamus" } });
  let workspaceId: string;

  if (existing) {
    workspaceId = existing.id;
    console.log("Seed: aestimamus workspace already exists, skipping workspace creation.");
  } else {
    const workspace = await prisma.workspace.create({
      data: {
        slug: "aestimamus",
        name: "aestimamus",
        status: "active",
        adminPasswordHash: adminHash,
        dataResidency: "EU",
        theme: {
          create: {
            primaryColor: "hsl(14, 48%, 44%)",
            secondaryColor: "#1a1a1a",
            accentColor: "hsl(14, 48%, 44%)",
            backgroundColor: "#ffffff",
            textColor: "#1a1a1a",
            fontFamily: "Inter",
            fontFamilyHeading: "Playfair Display",
          },
        },
      },
    });
    workspaceId = workspace.id;
    console.log(`Seed: Created workspace "${workspace.name}" (${workspace.id})`);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email_workspaceId: { email: "admin@aestimamus.de", workspaceId } },
  });

  if (!existingAdmin) {
    const user = await prisma.user.create({
      data: {
        email: "christoph.aldering@aestimamus.com",
        name: "Christoph Aldering",
        passwordHash: adminHash,
        roles: ["ADMIN"],
        workspaceId,
        forcePasswordChange: true,
        status: "active",
      },
    });
    console.log(`Seed: Created admin user "${user.email}" (${user.id})`);
  } else {
    console.log("Seed: Admin user already exists, skipping.");
  }

  const existingAssessment = await prisma.assessment.findFirst({
    where: { workspaceId, name: "Leadership Assessment Q1 2026" },
  });

  if (!existingAssessment) {
    const assessment = await prisma.assessment.create({
      data: {
        name: "Leadership Assessment Q1 2026",
        workspaceId,
        status: "draft",
        description: "Umfassendes Leadership Assessment für Führungskräfte der oberen Ebene.",
        location: "Frankfurt am Main",
        startDate: new Date("2026-03-15"),
        endDate: new Date("2026-03-16"),
        exercises: {
          create: [
            { name: "Strategische Präsentation", type: "presentation", instructions: "Bereiten Sie eine 15-minütige Präsentation zur strategischen Ausrichtung vor.", duration: 15, sortOrder: 1 },
            { name: "Strukturiertes Interview", type: "interview", instructions: "Kompetenzbasiertes Interview zu Führungserfahrungen.", duration: 45, sortOrder: 2 },
            { name: "Gruppendiskussion Marktanalyse", type: "group_discussion", instructions: "Diskutieren Sie in der Gruppe über aktuelle Markttrends.", duration: 30, sortOrder: 3 },
            { name: "Fallstudie Restrukturierung", type: "case_study", instructions: "Analysieren Sie den Fall und erarbeiten Sie einen Restrukturierungsplan.", duration: 60, sortOrder: 4 },
          ],
        },
      },
    });
    console.log(`Seed: Created assessment "${assessment.name}" with 4 exercises (${assessment.id})`);
  } else {
    const exerciseCount = await prisma.exercise.count({ where: { assessmentId: existingAssessment.id } });
    if (exerciseCount === 0) {
      await prisma.exercise.createMany({
        data: [
          { assessmentId: existingAssessment.id, name: "Strategische Präsentation", type: "presentation", instructions: "Bereiten Sie eine 15-minütige Präsentation zur strategischen Ausrichtung vor.", duration: 15, sortOrder: 1 },
          { assessmentId: existingAssessment.id, name: "Strukturiertes Interview", type: "interview", instructions: "Kompetenzbasiertes Interview zu Führungserfahrungen.", duration: 45, sortOrder: 2 },
          { assessmentId: existingAssessment.id, name: "Gruppendiskussion Marktanalyse", type: "group_discussion", instructions: "Diskutieren Sie in der Gruppe über aktuelle Markttrends.", duration: 30, sortOrder: 3 },
          { assessmentId: existingAssessment.id, name: "Fallstudie Restrukturierung", type: "case_study", instructions: "Analysieren Sie den Fall und erarbeiten Sie einen Restrukturierungsplan.", duration: 60, sortOrder: 4 },
        ],
      });
      console.log("Seed: Added 4 exercises to existing assessment.");
    }
    if (!existingAssessment.description) {
      await prisma.assessment.update({
        where: { id: existingAssessment.id },
        data: {
          description: "Umfassendes Leadership Assessment für Führungskräfte der oberen Ebene.",
          location: "Frankfurt am Main",
          startDate: new Date("2026-03-15"),
          endDate: new Date("2026-03-16"),
        },
      });
      console.log("Seed: Updated existing assessment with details.");
    }
    console.log("Seed: Assessment already exists, skipping creation.");
  }

  const existingModel = await prisma.competencyModel.findFirst({
    where: { workspaceId, name: "Leadership-Kompetenzmodell" },
  });

  if (!existingModel) {
    const model = await prisma.competencyModel.create({
      data: {
        workspaceId,
        name: "Leadership-Kompetenzmodell",
        description: "Kompetenzmodell für die Bewertung von Führungskräften auf oberer Managementebene.",
        version: 1,
        status: "active",
        nodes: {
          create: [
            { name: "Strategische Führung", nodeType: "domain", description: "Fähigkeit zur strategischen Steuerung und Visionsentwicklung.", sortOrder: 1 },
            { name: "Kommunikation", nodeType: "domain", description: "Effektive Kommunikation auf allen Ebenen.", sortOrder: 2 },
            { name: "Entscheidungsfähigkeit", nodeType: "domain", description: "Fundierte Entscheidungen unter Unsicherheit treffen.", sortOrder: 3 },
          ],
        },
      },
      include: { nodes: true },
    });

    const strategicNode = model.nodes.find((n) => n.name === "Strategische Führung");
    const commNode = model.nodes.find((n) => n.name === "Kommunikation");

    if (strategicNode) {
      await prisma.competencyNode.createMany({
        data: [
          { competencyModelId: model.id, parentId: strategicNode.id, name: "Visionsentwicklung", nodeType: "competency", description: "Entwicklung und Kommunikation einer klaren Unternehmensvision.", sortOrder: 1 },
          { competencyModelId: model.id, parentId: strategicNode.id, name: "Strategische Planung", nodeType: "competency", description: "Langfristige Planungsfähigkeit und Zielorientierung.", sortOrder: 2 },
          { competencyModelId: model.id, parentId: strategicNode.id, name: "Change Management", nodeType: "competency", description: "Veränderungsprozesse erfolgreich gestalten und begleiten.", sortOrder: 3 },
        ],
      });
    }

    if (commNode) {
      await prisma.competencyNode.createMany({
        data: [
          { competencyModelId: model.id, parentId: commNode.id, name: "Präsentationskompetenz", nodeType: "competency", description: "Überzeugend präsentieren und Inhalte strukturiert vermitteln.", sortOrder: 1 },
          { competencyModelId: model.id, parentId: commNode.id, name: "Aktives Zuhören", nodeType: "competency", description: "Empathisches Zuhören und Verständnis signalisieren.", sortOrder: 2 },
        ],
      });
    }

    await prisma.weightingProfile.create({
      data: {
        competencyModelId: model.id,
        name: "Standard-Gewichtung Führungskraft",
        targetRole: "CEO/Geschäftsführer",
        version: 1,
        weights: model.nodes.map((n) => ({ nodeId: n.id, weight: n.name === "Strategische Führung" ? 0.5 : n.name === "Kommunikation" ? 0.3 : 0.2 })),
        status: "active",
      },
    });

    console.log(`Seed: Created competency model "${model.name}" with ${model.nodes.length} domains + sub-nodes and weighting profile`);
  } else {
    console.log("Seed: Competency model already exists, skipping.");
  }

  const existingScale = await prisma.scaleDefinition.findFirst({
    where: { workspaceId, name: "5-Punkt Likert-Skala" },
  });

  if (!existingScale) {
    await prisma.scaleDefinition.create({
      data: {
        workspaceId,
        name: "5-Punkt Likert-Skala",
        type: "likert",
        minValue: 1,
        maxValue: 5,
        points: [
          { value: 1, label: "Deutlich unter Erwartung", anchor: "Zeigt keine Ansätze der Kompetenz." },
          { value: 2, label: "Unter Erwartung", anchor: "Zeigt vereinzelte Ansätze, jedoch nicht konsistent." },
          { value: 3, label: "Entspricht Erwartung", anchor: "Zeigt die Kompetenz in den meisten Situationen." },
          { value: 4, label: "Über Erwartung", anchor: "Zeigt die Kompetenz konsistent und auf hohem Niveau." },
          { value: 5, label: "Deutlich über Erwartung", anchor: "Herausragende Demonstration der Kompetenz." },
        ],
        status: "active",
      },
    });
    console.log("Seed: Created 5-point Likert scale.");
  } else {
    console.log("Seed: Scale definition already exists, skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
