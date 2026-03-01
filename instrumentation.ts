export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { PrismaClient } = await import("@prisma/client");
    const bcrypt = (await import("bcryptjs")).default;

    const prisma = new PrismaClient();

    try {
      const workspace = await prisma.workspace.findUnique({ where: { slug: "main" } });
      if (workspace) {
        const candidateExists = await prisma.user.findFirst({
          where: { email: "kandidat@test.de", workspaceId: workspace.id },
        });
        if (!candidateExists) {
          const candidateHash = await bcrypt.hash("#Sammy2026", 10);
          const firstAssessment = await prisma.assessment.findFirst({
            where: { workspaceId: workspace.id },
            orderBy: { createdAt: "asc" },
          });
          await prisma.user.create({
            data: {
              id: "test-candidate-001",
              email: "kandidat@test.de",
              name: "Dr. Anna Müller",
              passwordHash: candidateHash,
              roles: ["CANDIDATE"],
              workspaceId: workspace.id,
              forcePasswordChange: false,
              status: "active",
              assessmentId: firstAssessment?.id ?? null,
            },
          });
          console.log("[seed] Created test candidate: kandidat@test.de");
        }
      }

      const compExists = await prisma.workspace.findUnique({ where: { slug: "comp" } });
      if (!compExists) {
        const compAdminHash = await bcrypt.hash("#Sammy2026", 10);
        const compWs = await prisma.workspace.create({
          data: {
            slug: "comp",
            name: "COMP",
            status: "active",
            aiEnabled: false,
            adminPasswordHash: compAdminHash,
            dataResidency: "EU",
            theme: {
              create: {
                primaryColor: "#FFD700",
                secondaryColor: "#1a1a1a",
                accentColor: "#FFD700",
                backgroundColor: "#ffffff",
                textColor: "#1a1a1a",
                fontFamily: "Inter",
                fontFamilyHeading: "Playfair Display",
              },
            },
          },
        });
        const demoHash = await bcrypt.hash("demo", 10);
        await prisma.user.create({
          data: {
            email: "demo@demo.de",
            name: "Demo User",
            passwordHash: demoHash,
            roles: ["WORKSPACE_ADMIN"],
            workspaceId: compWs.id,
            forcePasswordChange: false,
            status: "active",
          },
        });
        console.log("[seed] Created comp workspace + demo user");
      } else {
        const demoUser = await prisma.user.findUnique({
          where: { email_workspaceId: { email: "demo@demo.de", workspaceId: compExists.id } },
        });
        if (!demoUser) {
          const demoHash = await bcrypt.hash("demo", 10);
          await prisma.user.create({
            data: {
              email: "demo@demo.de",
              name: "Demo User",
              passwordHash: demoHash,
              roles: ["WORKSPACE_ADMIN"],
              workspaceId: compExists.id,
              forcePasswordChange: false,
              status: "active",
            },
          });
          console.log("[seed] Created demo user in existing comp workspace");
        }
      }

      const abcdExists = await prisma.workspace.findUnique({ where: { slug: "abcd" } });
      if (!abcdExists) {
        const abcdAdminHash = await bcrypt.hash("#Sammy2026", 10);
        const abcdWs = await prisma.workspace.create({
          data: {
            slug: "abcd",
            name: "ABCD",
            status: "active",
            aiEnabled: false,
            adminPasswordHash: abcdAdminHash,
            dataResidency: "EU",
            theme: {
              create: {
                primaryColor: "#0071e3",
                secondaryColor: "#1d1d1f",
                accentColor: "#0071e3",
                backgroundColor: "#f5f5f7",
                textColor: "#1d1d1f",
                fontFamily: "Inter",
                fontFamilyHeading: "SF Pro Display",
              },
            },
          },
        });
        const abcdDemoHash = await bcrypt.hash("demo", 10);
        await prisma.user.create({
          data: {
            email: "demo@demo.de",
            name: "Demo User",
            passwordHash: abcdDemoHash,
            roles: ["WORKSPACE_ADMIN"],
            workspaceId: abcdWs.id,
            forcePasswordChange: false,
            status: "active",
          },
        });
        console.log("[seed] Created abcd workspace + demo user");
      }

      const count = await prisma.workspace.count();
      if (count <= 1) {
        console.log("[seed] No workspaces found, auto-seeding...");

        const adminHash = await bcrypt.hash("#Sammy2026", 10);

        const workspace = await prisma.workspace.create({
          data: {
            slug: "main",
            name: "Executive Diagnostics Suite",
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

        await prisma.user.create({
          data: {
            email: "christoph.aldering@googlemail.com",
            name: "Christoph Aldering",
            passwordHash: adminHash,
            roles: ["ADMIN"],
            workspaceId: workspace.id,
            forcePasswordChange: false,
            status: "active",
          },
        });

        const assessment = await prisma.assessment.create({
          data: {
            name: "Leadership Assessment Q1 2026",
            workspaceId: workspace.id,
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

        const model = await prisma.competencyModel.create({
          data: {
            workspaceId: workspace.id,
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

        await prisma.scaleDefinition.create({
          data: {
            workspaceId: workspace.id,
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

        console.log(`[seed] Auto-seed complete: workspace "${workspace.name}", assessment "${assessment.name}", competency model, scale definition`);
      } else {
        console.log(`[seed] ${count} workspace(s) found, skipping seed.`);
      }
    } catch (err) {
      console.error("[seed] Auto-seed error:", err);
    } finally {
      await prisma.$disconnect();
    }
  }
}
