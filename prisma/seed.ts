import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.workspace.findUnique({ where: { slug: "aestimamus" } });
  if (existing) {
    console.log("Seed: aestimamus workspace already exists, skipping.");
    return;
  }

  const adminHash = await bcrypt.hash("Christoph", 10);

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

  console.log(`Seed: Created workspace "${workspace.name}" (${workspace.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
