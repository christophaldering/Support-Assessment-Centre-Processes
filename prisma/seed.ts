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
        email: "admin@aestimamus.de",
        name: "Christoph Aldering",
        passwordHash: adminHash,
        roles: ["ADMIN"],
        workspaceId,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
