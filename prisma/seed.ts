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
      },
    });
    console.log(`Seed: Created assessment "${assessment.name}" (${assessment.id})`);
  } else {
    console.log("Seed: Assessment already exists, skipping.");
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
