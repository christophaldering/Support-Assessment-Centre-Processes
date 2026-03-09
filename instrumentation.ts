export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { PrismaClient } = await import("@prisma/client");
    const bcrypt = (await import("bcryptjs")).default;

    const prisma = new PrismaClient();

    try {
      // ── ONE-TIME CLEANUP: Remove ARAG workspace, aestimamus refs, standardize passwords ──
      const aragWs = await prisma.workspace.findUnique({ where: { slug: "arag" } });
      if (aragWs) {
        console.log("[cleanup] Removing ARAG workspace and all related data...");
        const wsId = aragWs.id;

        // BDP data (workspace='arag')
        const bdpSessionIds = (await prisma.$queryRawUnsafe(`SELECT id FROM bdp_sessions WHERE workspace='arag'`) as any[]).map((s: any) => s.id);
        const bdpTeamIds = (await prisma.$queryRawUnsafe(`SELECT id FROM bdp_teams WHERE workspace='arag'`) as any[]).map((t: any) => t.id);
        const bdpCriterionIds = (await prisma.$queryRawUnsafe(`SELECT id FROM bdp_criteria WHERE workspace='arag'`) as any[]).map((c: any) => c.id);
        const bdpUserIds = (await prisma.$queryRawUnsafe(`SELECT id FROM bdp_users WHERE workspace='arag'`) as any[]).map((u: any) => u.id);

        if (bdpSessionIds.length > 0) {
          const sIds = bdpSessionIds.map((id: string) => `'${id}'`).join(",");
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_scores WHERE session_id IN (${sIds})`);
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_observer_assignments WHERE session_id IN (${sIds})`);
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_sponsor_flags WHERE session_id IN (${sIds})`);
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_individual_notes WHERE session_id IN (${sIds})`);
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_tie_breaks WHERE session_id IN (${sIds})`);
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_session_teams WHERE session_id IN (${sIds})`);
        }
        if (bdpCriterionIds.length > 0) {
          const cIds = bdpCriterionIds.map((id: string) => `'${id}'`).join(",");
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_role_weights WHERE criterion_id IN (${cIds})`);
        }
        if (bdpUserIds.length > 0) {
          const uIds = bdpUserIds.map((id: string) => `'${id}'`).join(",");
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_notifications WHERE user_id IN (${uIds})`);
        }
        if (bdpTeamIds.length > 0) {
          const tIds = bdpTeamIds.map((id: string) => `'${id}'`).join(",");
          await prisma.$executeRawUnsafe(`DELETE FROM bdp_team_participants WHERE team_id IN (${tIds})`);
        }

        for (const tbl of ["bdp_participants","bdp_teams","bdp_sessions","bdp_criteria","bdp_name_mappings","bdp_config","bdp_users"]) {
          await prisma.$executeRawUnsafe(`DELETE FROM ${tbl} WHERE workspace='arag'`);
        }

        // Workspace-level data
        for (const tbl of ["audit_logs","consent_records","consent_templates","audio_recordings","reports","usage_events","access_requests","ai_audit_log","ai_system_settings","workspace_style_guides","brand_rule_sets","exercise_recommendations","predictive_profiles","development_blueprints","diagnostic_hypotheses","observation_sheet_templates","exercise_library_items","case_studies","clients","report_templates","scale_definitions","requirements_analyses"]) {
          try { await prisma.$executeRawUnsafe(`DELETE FROM ${tbl} WHERE workspace_id='${wsId}'`); } catch {}
        }

        const models = await prisma.$queryRawUnsafe(`SELECT id FROM competency_models WHERE workspace_id='${wsId}'`) as any[];
        for (const m of models) {
          try { await prisma.$executeRawUnsafe(`DELETE FROM competency_nodes WHERE model_id='${m.id}'`); } catch {}
          try { await prisma.$executeRawUnsafe(`DELETE FROM weighting_profiles WHERE model_id='${m.id}'`); } catch {}
        }
        await prisma.$executeRawUnsafe(`DELETE FROM competency_models WHERE workspace_id='${wsId}'`);

        const assessments = await prisma.$queryRawUnsafe(`SELECT id FROM assessments WHERE workspace_id='${wsId}'`) as any[];
        for (const a of assessments) {
          for (const sub of ["observer_ratings","consolidated_scores","exercises","exercise_competency_mappings","documents","self_assessments","self_assessment_responses","portal_documents","collaboration_events","shared_observer_notes","presence_sessions","mtmm_snapshots"]) {
            try { await prisma.$executeRawUnsafe(`DELETE FROM ${sub} WHERE assessment_id='${a.id}'`); } catch {}
          }
        }
        await prisma.$executeRawUnsafe(`DELETE FROM assessments WHERE workspace_id='${wsId}'`);

        const userIds = await prisma.$queryRawUnsafe(`SELECT id FROM users WHERE workspace_id='${wsId}'`) as any[];
        for (const u of userIds) {
          await prisma.$executeRawUnsafe(`DELETE FROM password_reset_tokens WHERE user_id='${u.id}'`);
        }
        await prisma.$executeRawUnsafe(`DELETE FROM users WHERE workspace_id='${wsId}'`);
        await prisma.$executeRawUnsafe(`DELETE FROM themes WHERE workspace_id='${wsId}'`);
        await prisma.$executeRawUnsafe(`DELETE FROM workspaces WHERE id='${wsId}'`);
        console.log("[cleanup] ARAG workspace fully removed.");
      }

      // ── ONE-TIME CLEANUP: Rename aestimamus workspace to main ──
      const aestWs = await prisma.workspace.findUnique({ where: { slug: "aestimamus" } });
      if (aestWs) {
        console.log("[cleanup] Renaming aestimamus workspace to main...");
        await prisma.$executeRawUnsafe(`UPDATE workspaces SET slug='main', name='Executive Diagnostics Suite' WHERE slug='aestimamus'`);
        await prisma.$executeRawUnsafe(`DELETE FROM users WHERE email='christoph.aldering@aestimamus.com'`).catch(() => {});
        await prisma.$executeRawUnsafe(`DELETE FROM access_requests WHERE email ILIKE '%aestimamus%'`).catch(() => {});
        await prisma.$executeRawUnsafe(`UPDATE requirements_analyses SET transcript = REPLACE(transcript::text, 'aestimamus', 'Executive Diagnostics Suite') WHERE transcript::text ILIKE '%aestimamus%'`).catch(() => {});
        await prisma.$executeRawUnsafe(`UPDATE brand_rule_sets SET name = REPLACE(name, 'aestimamus', 'Executive Diagnostics Suite') WHERE name ILIKE '%aestimamus%'`).catch(() => {});
        await prisma.$executeRawUnsafe(`UPDATE workspace_style_guides SET title = REPLACE(title, 'aestimamus', 'Executive Diagnostics Suite') WHERE title ILIKE '%aestimamus%'`).catch(() => {});
        await prisma.$executeRawUnsafe(`UPDATE workspace_style_guides SET file_object_path = REPLACE(file_object_path, 'aestimamus', 'main') WHERE file_object_path ILIKE '%aestimamus%'`).catch(() => {});
        await prisma.$executeRawUnsafe(`UPDATE workspace_style_guides SET analysis_json = REPLACE(analysis_json::text, 'aestimamus', 'Executive Diagnostics Suite')::jsonb WHERE analysis_json::text ILIKE '%aestimamus%'`).catch(() => {});
        console.log("[cleanup] aestimamus renamed to main.");
      }

      // ── Pre-compute password hash once for reuse ──
      const stdHash = await bcrypt.hash("#Sammy2024", 10);

      // ── ONE-TIME CLEANUP: Standardize all passwords to #Sammy2024 (skip if already done) ──
      const sampleUser = await prisma.user.findFirst();
      if (sampleUser) {
        const isAlready = await bcrypt.compare("#Sammy2024", sampleUser.passwordHash);
        if (!isAlready) {
          console.log("[cleanup] Updating all passwords to #Sammy2024...");
          await prisma.$executeRawUnsafe(`UPDATE users SET password_hash = '${stdHash}'`);
          await prisma.$executeRawUnsafe(`UPDATE workspaces SET admin_password_hash = '${stdHash}'`);
          await prisma.$executeRawUnsafe(`UPDATE bdp_users SET password_hash = '${stdHash}'`);
          console.log("[cleanup] All passwords updated.");
        }
      }

      // ── ENSURE ADMIN USER EXISTS IN MAIN WORKSPACE ──
      const mainWs = await prisma.workspace.findUnique({ where: { slug: "main" } });
      if (mainWs) {
        const adminUser = await prisma.user.findFirst({
          where: { email: "christoph.aldering@googlemail.com", workspaceId: mainWs.id },
        });
        if (!adminUser) {
          await prisma.user.create({
            data: {
              email: "christoph.aldering@googlemail.com",
              name: "Christoph Aldering",
              passwordHash: stdHash,
              roles: ["ADMIN"],
              workspaceId: mainWs.id,
              forcePasswordChange: false,
              status: "active",
            },
          });
          console.log("[seed] Created admin user christoph.aldering@googlemail.com in main workspace.");
        }
      }
      // ── END CLEANUP ──

      const workspace = await prisma.workspace.findUnique({ where: { slug: "main" } });
      if (workspace) {
        const candidateExists = await prisma.user.findFirst({
          where: { email: "kandidat@test.de", workspaceId: workspace.id },
        });
        if (!candidateExists) {
          const firstAssessment = await prisma.assessment.findFirst({
            where: { workspaceId: workspace.id },
            orderBy: { createdAt: "asc" },
          });
          await prisma.user.create({
            data: {
              id: "test-candidate-001",
              email: "kandidat@test.de",
              name: "Dr. Anna Müller",
              passwordHash: stdHash,
              roles: ["CANDIDATE"],
              workspaceId: workspace.id,
              forcePasswordChange: false,
              status: "active",
              assessmentId: firstAssessment?.id ?? null,
            },
          });
          console.log("[seed] Created test candidate: kandidat@test.de");
        }

        const varexiaCandidateExists = await prisma.user.findFirst({
          where: { email: "candidate@varexia-demo.com", workspaceId: workspace.id },
        });
        if (!varexiaCandidateExists) {
          const firstAssessment = await prisma.assessment.findFirst({
            where: { workspaceId: workspace.id },
            orderBy: { createdAt: "asc" },
          });
          await prisma.user.create({
            data: {
              id: "varexia-candidate-001",
              email: "candidate@varexia-demo.com",
              name: "Sarah Chen",
              passwordHash: "FIRST_ACCESS_NO_PASSWORD",
              roles: ["CANDIDATE"],
              workspaceId: workspace.id,
              forcePasswordChange: false,
              status: "active",
              assessmentId: firstAssessment?.id ?? null,
            },
          });
          console.log("[seed] Created demo candidate: candidate@varexia-demo.com (first-access, no password)");
        }
      }

      const compExists = await prisma.workspace.findUnique({ where: { slug: "comp" } });
      if (!compExists) {
        const compWs = await prisma.workspace.create({
          data: {
            slug: "comp",
            name: "COMP",
            status: "active",
            aiEnabled: false,
            adminPasswordHash: stdHash,
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
        const abcdWs = await prisma.workspace.create({
          data: {
            slug: "abcd",
            name: "ABCD",
            status: "active",
            aiEnabled: false,
            adminPasswordHash: stdHash,
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
        const demoHash2 = await bcrypt.hash("demo", 10);
        await prisma.user.create({
          data: {
            email: "demo@demo.de",
            name: "Demo User",
            passwordHash: demoHash2,
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

        const workspace = await prisma.workspace.create({
          data: {
            slug: "main",
            name: "Executive Diagnostics Suite",
            status: "active",
            adminPasswordHash: stdHash,
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
            passwordHash: stdHash,
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

      // ── SEED PORTAL DEMO CONTENT (runs after all workspaces/assessments exist) ──
      const mainWsForPortal = await prisma.workspace.findUnique({ where: { slug: "main" } });
      if (mainWsForPortal) {
        const mainAssessments = await prisma.assessment.findMany({ where: { workspaceId: mainWsForPortal.id }, include: { portalDocuments: true, selfAssessments: true } });
        for (const a of mainAssessments) {
          if (a.portalDocuments.length === 0) {
            if (!a.workflowConfig) {
              await prisma.assessment.update({ where: { id: a.id }, data: { workflowConfig: { unlockedPhases: ["preparation", "execution", "followup"] }, status: "active" } });
            }
            const exercises = await prisma.exercise.findMany({ where: { assessmentId: a.id } });
            const caseEx = exercises.find((e: any) => e.type === "case_study");
            const simEx = exercises.find((e: any) => ["behavior_simulation", "role_play", "in_tray"].includes(e.type));
            const docs = [
              { assessmentId: a.id, category: "preparation", title: "Willkommen & Ablaufplan", description: "Übersicht über den gesamten Assessment-Ablauf, Zeitplan und organisatorische Hinweise.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 1 },
              { assessmentId: a.id, category: "preparation", title: "Hinweise zur Vorbereitung", description: "Tipps und Empfehlungen zur optimalen Vorbereitung auf das Assessment Center.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 2 },
              { assessmentId: a.id, category: "info", title: "Feedback-Leitfaden", description: "Informationen zum Feedback-Prozess und wie Sie Ihre Ergebnisse interpretieren können.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 5 },
            ];
            if (caseEx) docs.push({ assessmentId: a.id, category: "general", title: `${caseEx.name} — Briefing`, description: "Hintergrundinformationen und Aufgabenstellung.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 3 });
            if (simEx) docs.push({ assessmentId: a.id, category: "general", title: `${simEx.name} — Rollenanweisung`, description: "Ihre Rolle und die Ausgangssituation.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 4 });
            await prisma.portalDocument.createMany({ data: docs });
            console.log(`[seed] Created ${docs.length} portal documents for "${a.name}"`);
          }
          if (a.selfAssessments.length === 0) {
            await prisma.selfAssessment.createMany({
              data: [
                { assessmentId: a.id, title: "Selbsteinschätzung Führungskompetenzen", description: "Bitte schätzen Sie Ihre eigenen Führungskompetenzen ein.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 1, schemaJson: { type: "likert", scale: { min: 1, max: 5, labels: ["Trifft nicht zu", "Trifft wenig zu", "Teils/teils", "Trifft überwiegend zu", "Trifft voll zu"] }, questions: [{ id: "q1", text: "Ich kann eine klare strategische Vision entwickeln und kommunizieren." }, { id: "q2", text: "Ich treffe auch unter Unsicherheit fundierte Entscheidungen." }, { id: "q3", text: "Ich kann Veränderungsprozesse aktiv gestalten." }, { id: "q4", text: "Ich kommuniziere klar und überzeugend." }, { id: "q5", text: "Ich fördere aktiv die Entwicklung meiner Mitarbeiter." }] } },
                { assessmentId: a.id, title: "Persönliche Reflexion", description: "Bitte beantworten Sie die folgenden Fragen in eigenen Worten.", releaseStatus: "released", alwaysAvailable: true, sortOrder: 2, schemaJson: { type: "open", questions: [{ id: "r1", text: "Was war Ihre größte berufliche Herausforderung in den letzten 12 Monaten?" }, { id: "r2", text: "Welche Führungskompetenz möchten Sie am stärksten weiterentwickeln?" }, { id: "r3", text: "Beschreiben Sie eine Situation, in der Sie ein Team durch eine Veränderung geführt haben." }] } },
              ],
            });
            console.log(`[seed] Created 2 self-assessments for "${a.name}"`);
          }
        }
        const adminForPortal = await prisma.user.findFirst({ where: { email: "christoph.aldering@googlemail.com", workspaceId: mainWsForPortal.id } });
        if (adminForPortal && !adminForPortal.assessmentId) {
          const firstAssessment = await prisma.assessment.findFirst({ where: { workspaceId: mainWsForPortal.id }, orderBy: { createdAt: "asc" } });
          if (firstAssessment) {
            await prisma.user.update({ where: { id: adminForPortal.id }, data: { assessmentId: firstAssessment.id } });
            console.log("[seed] Linked admin user to assessment for portal preview.");
          }
        }

        // ── SEED DATA ROOM CATEGORIES + DEMO DOCUMENTS ──
        const existingCategories = await prisma.dataRoomCategory.count({ where: { workspaceId: mainWsForPortal.id } });
        if (existingCategories === 0) {
          const categoryDefs = [
            { slug: "unternehmen-strategie", label: "Unternehmen & Strategie", labelEn: "Company & Strategy", icon: "Building2", color: "#1e40af", sortOrder: 1 },
            { slug: "finanzen-kapitalmarkt", label: "Finanzen & Kapitalmarkt", labelEn: "Finance & Capital Markets", icon: "TrendingUp", color: "#059669", sortOrder: 2 },
            { slug: "retail-operations", label: "Retail & Operations", labelEn: "Retail & Operations", icon: "ShoppingCart", color: "#d97706", sortOrder: 3 },
            { slug: "transformation-investitionen", label: "Transformation & Investitionen", labelEn: "Transformation & Investments", icon: "Rocket", color: "#7c3aed", sortOrder: 4 },
            { slug: "governance-risiko-compliance", label: "Governance, Risiko & Compliance", labelEn: "Governance, Risk & Compliance", icon: "Shield", color: "#dc2626", sortOrder: 5 },
            { slug: "people-kultur-kommunikation", label: "People, Kultur & Kommunikation", labelEn: "People, Culture & Communication", icon: "Users", color: "#0891b2", sortOrder: 6 },
            { slug: "presse-markt-externe-signale", label: "Presse, Markt & externe Signale", labelEn: "Press, Market & External Signals", icon: "Newspaper", color: "#64748b", sortOrder: 7 },
          ];

          const createdCategories: Record<string, string> = {};
          for (const cat of categoryDefs) {
            const created = await prisma.dataRoomCategory.create({
              data: { ...cat, workspaceId: mainWsForPortal.id },
            });
            createdCategories[cat.slug] = created.id;
          }
          console.log(`[seed] Created ${categoryDefs.length} data room categories.`);

          const firstAssessmentForDR = await prisma.assessment.findFirst({ where: { workspaceId: mainWsForPortal.id }, orderBy: { createdAt: "asc" } });
          if (firstAssessmentForDR) {
            const drDocs = [
              {
                slug: "corporate-profile", title: "Corporate Profile — Varexia SE", categoryId: createdCategories["unternehmen-strategie"],
                shortDescription: "Overview of the Varexia Group: structure, scale, market positioning, and dual management model.",
                documentType: "note", readingTime: 4, sortOrder: 1, isImportant: true, isNew: false,
                textSummary: `Varexia SE is a publicly listed European stock corporation (Societas Europaea) with a dual management structure comprising an Executive Board and a Supervisory Board.\n\nThe Group generates approximately €42.0 billion in annual revenue and employs around 284,000 people across Europe. It operates through four distinct business divisions:\n\n• Retail & Consumer Goods — The largest division with €24.5 billion revenue and 190,000 employees. Operates across multiple retail formats with established brand recognition and customer loyalty in key European markets.\n\n• Logistics & Supply Chain — €8.0 billion revenue, 55,000 employees. Provides integrated logistics services including warehousing, transportation, and last-mile delivery.\n\n• Energy & Infrastructure — €6.5 billion revenue, 25,000 employees. Manages long-term energy and infrastructure assets with contracted revenue streams.\n\n• Digital Services & Consulting — €3.0 billion revenue, 15,000 employees. Offers technology consulting, digital transformation, and managed services.\n\nThe company is listed on major European exchanges with a current market capitalisation of approximately €28.7 billion, down from €38.2 billion eighteen months ago. The share price currently stands at €38.40, having declined approximately 18% since December.\n\nVariexia's governance structure follows the German two-tier board model. The Supervisory Board, chaired by Dr. Thomas Berner, provides strategic oversight. The Executive Board, led by CEO Alexandra Rossi, is responsible for operational management.`,
              },
              {
                slug: "organisational-chart", title: "Group Management Team & Organisational Overview", categoryId: createdCategories["unternehmen-strategie"],
                shortDescription: "Key members of the executive team and their divisional responsibilities.",
                documentType: "note", readingTime: 3, sortOrder: 2, isImportant: false, isNew: false,
                textSummary: `Executive Board & Senior Leadership\n\n• Alexandra Rossi — Chief Executive Officer (CEO)\n• Marcus Weber / Michael Turner — Chief Financial Officer (CFO)\n• Isabelle Fournier — Chief Information Officer (CIO)\n• Sarah Jenkins — Head of Human Resources\n• Emily Watson — Head of Investor Relations\n\nDivisional Leadership\n\n• Lars Nielsen — CEO, Logistics & Supply Chain Division\n• Anna Keller — Regional Operations Manager, Retail West\n• Thomas Berger — Head of Logistics, Region West\n• Julia Meier — Finance Business Partner, Retail\n• Claire Dubois — HR Business Partner, Region West\n\nSupervisory Board\n\n• Dr. Thomas Berner / Jean-Marc Lefèvre — Chairman\n\nThe organisation operates with a matrix structure where divisional P&L responsibility intersects with functional oversight (Finance, HR, IT). Regional management teams hold operational accountability but report through both divisional and functional lines.\n\nThe appointment of a new Chief Strategy Officer (CSO) is currently under consideration — a role intended to provide clearer portfolio-level strategic coordination across the four business divisions.`,
              },
              {
                slug: "strategic-mandate", title: "Strategic Review Mandate from the Supervisory Board", categoryId: createdCategories["unternehmen-strategie"],
                shortDescription: "The Chairman's mandate for a comprehensive strategic review, outlining key priorities and expectations.",
                documentType: "note", readingTime: 4, sortOrder: 3, isImportant: true, isNew: false,
                textSummary: `From: Dr. Thomas Berner, Chairman of the Supervisory Board\nDate: February 14, 2026\n\nThe Supervisory Board is requesting a comprehensive strategic review of the Varexia Group. The review should address the following critical issues:\n\n1. Retail & Consumer Goods Profitability\nThe largest division is underperforming on margins despite stable revenue growth. The tension between price leadership and profitability requires resolution.\n\n2. Digital Services & Consulting Viability\nQuestions around whether this unit belongs in the portfolio given talent retention challenges and strategic fit. The 28% attrition rate in key technology roles is eroding the unit's value proposition.\n\n3. Capital Allocation Conflicts Between Divisions\nParticularly between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation needs. The absence of explicit capital allocation thresholds is creating strategic ambiguity.\n\nThe Supervisory Board expects a clear, actionable turnaround strategy that can be presented to the full Board. The analysis should demonstrate strategic depth, financial acumen, and the ability to make difficult trade-offs under uncertainty.\n\nContext: Varexia's market capitalisation has declined from €38.2 billion to €28.7 billion over the past 18 months, reflecting growing investor concern about the Group's strategic direction and operational performance.`,
              },
              {
                slug: "business-unit-overview", title: "Business Unit Performance Summary FY 2025", categoryId: createdCategories["retail-operations"],
                shortDescription: "Comparative overview of all four business divisions: revenue, margins, employees, and key tensions.",
                documentType: "note", readingTime: 5, sortOrder: 4, isImportant: true, isNew: false,
                textSummary: `Varexia SE — Divisional Performance Overview (FY 2025)\n\n1. Retail & Consumer Goods\n• Revenue: €24.5 bn (prior year: €23.82 bn, +2.9%)\n• EBITDA: €1.8 bn (prior year: €1.65 bn, +9.1%)\n• EBITDA Margin: 7.3%\n• Employees: 190,000\n• Key Tension: Price leadership vs. profitability\n\n2. Logistics & Supply Chain\n• Revenue: €8.0 bn (prior year: €7.6 bn, +5.3%)\n• EBITDA: €0.55 bn (prior year: €0.7 bn, -21.4%)\n• EBITDA Margin: 6.9%\n• Employees: 55,000\n• Key Tension: Speed & reliability vs. cost efficiency\n\n3. Energy & Infrastructure\n• Revenue: €6.5 bn (prior year: €6.2 bn, +4.8%)\n• EBITDA: €0.75 bn (stable)\n• EBITDA Margin: 11.5%\n• Employees: 25,000\n• Key Tension: Long-term assets vs. short-term returns\n\n4. Digital Services & Consulting\n• Revenue: €3.0 bn (prior year: €2.7 bn, +11.1%)\n• EBITDA: €0.5 bn (prior year: €0.43 bn, +16.3%)\n• EBITDA Margin: 16.7%\n• Employees: 15,000\n• Key Tension: Scalability vs. people dependency\n\nGroup Totals\n• Revenue: €42.0 bn\n• EBITDA: €3.6 bn\n• Employees: ~284,000`,
              },
              {
                slug: "cfo-financial-briefing", title: "CFO Briefing — Financial Situation & Covenant Risk", categoryId: createdCategories["finanzen-kapitalmarkt"],
                shortDescription: "Confidential CFO briefing on profitability erosion, cash flow pressure, and potential debt covenant breach.",
                documentType: "note", readingTime: 4, sortOrder: 5, isImportant: true, isNew: false,
                confidentialityLabel: "CONFIDENTIAL",
                textSummary: `From: Marcus Weber, CFO\nDate: February 14, 2026\nClassification: CONFIDENTIAL\n\nRevenue has remained stable at €42.0 billion, but profitability is eroding. Group EBIT stands at €1.4 billion, which represents a concerning decline in margins across several business units.\n\nFree cash flow is barely covering our dividend commitments and essential capital expenditure. The tension between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation capacity is becoming unsustainable.\n\nCovenant Risk:\nMost critically, we are approaching a potential debt covenant breach. Our total debt stands at €11.4 billion in bonds plus €9.6 billion in bank loans. The covenant ratios are tightening, and without corrective action, we risk triggering breach clauses within the next 12–18 months.\n\nRequired Actions:\nWe need a strategy that:\n• Releases cash\n• Improves profitability\n• Creates a sustainable capital structure\n\nAny portfolio decisions must account for the covenant implications.`,
              },
              {
                slug: "northbridge-credit-assessment", title: "External Credit Assessment — Northbridge Capital Research", categoryId: createdCategories["finanzen-kapitalmarkt"],
                shortDescription: "Independent credit analysis highlighting cash conversion weakness, leverage concerns, and portfolio opacity.",
                documentType: "note", readingTime: 4, sortOrder: 6, isImportant: false, isNew: true,
                textSummary: `Source: Northbridge Capital Research\n\nKey Financial Indicators:\n• EBITDA: €3.600 bn\n• Operating cash flow: €1.602 bn\n• Cash conversion (OCF / EBITDA): 45.5%\n• Net CAPEX incl. leases: -€2.328 bn\n• Free cash flow: -€0.73 bn\n• Net debt / EBITDA: 3.3x\n\nObservations:\n1. Reported EBITDA stability masks a structurally weak cash conversion profile.\n2. Over the past fiscal year, working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.\n3. From an external perspective, the Group's portfolio composition remains challenging to assess.\n\nCritical Question:\nHow resilient is the current investment trajectory should free cash flow remain negative for another investment cycle?\n\nConclusion:\nNorthbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritisation, the current trajectory may limit strategic optionality.`,
              },
              {
                slug: "liquidity-stabilisation-plan", title: "Proposed Liquidity Stabilisation & Capital Allocation Measures", categoryId: createdCategories["finanzen-kapitalmarkt"],
                shortDescription: "CFO proposal for sequenced measures: liquidity stabilisation, balance sheet resilience, and strategic ring-fencing.",
                documentType: "note", readingTime: 4, sortOrder: 7, isImportant: false, isNew: false,
                textSummary: `From: Michael Turner, Chief Financial Officer\nTo: Members of the Supervisory Board\nDate: January 27, 2026\n\nThe Group remains operationally sound. At the same time, we are experiencing short-term liquidity pressure combined with an elevated leverage profile.\n\nManagement proposes a sequenced set of measures:\n\nPhase 1 — Immediate Liquidity Stabilisation\n• Tighter working capital controls\n• Postponement of non-critical capital expenditure (~€0.6 bn)\n• Securing additional short-term credit lines\n\nPhase 2 — Balance Sheet Resilience\n• Selective asset disposals in the range of €0.8–1.2 bn\n• Lease renegotiations where feasible\n• Increased dividend flexibility\n• Target: Move net debt/EBITDA towards ~3.0x\n\nPhase 3 — Strategic Ring-Fencing\n• Key growth and digital projects ring-fenced\n• Clear stop-go criteria applied\n• KPI monitoring enhanced\n\nThis approach does not eliminate trade-offs. It does, however, make them explicit, manageable and transparent for all stakeholders.`,
              },
              {
                slug: "digital-talent-crisis", title: "Talent Retention Crisis — Digital Services Division", categoryId: createdCategories["transformation-investitionen"],
                shortDescription: "HR alert on 28% attrition in Digital Services, with analysis of root causes and strategic implications.",
                documentType: "note", readingTime: 3, sortOrder: 8, isImportant: false, isNew: true,
                textSummary: `From: Sarah Jenkins, Head of HR\nDate: February 14, 2026\n\nUrgent people issue in the Digital Services & Consulting division.\n\nCurrent Situation:\nWe are experiencing 28% attrition in key technology roles over the past 12 months. Exit interviews consistently cite the same reasons: Varexia is perceived as too bureaucratic, and employees lack the equity upside they could get at startups or pure-play tech companies.\n\nFinancial Impact:\nThe division's margin of 16.7% looks healthy on paper, but it is trending downward due to the premium salaries we must pay to attract and retain top talent.\n\nStrategic Options:\na) Fundamentally fix the governance and incentive structure for Digital Services — potentially including a carve-out with equity participation — or\nb) Make the difficult decision to wind down or divest the unit before the talent drain destroys its value entirely.\n\nAssessment:\nThis is not a cyclical problem. It is structural. The conglomerate model is inherently disadvantaged in competing for top technology talent against purpose-built technology companies with equity-based compensation models.`,
              },
              {
                slug: "logistics-investment-request", title: "Logistics Automation — Investment Case & CAPEX Request", categoryId: createdCategories["transformation-investitionen"],
                shortDescription: "Logistics division CEO's urgent request to protect automation CAPEX amid Group-wide freeze discussions.",
                documentType: "note", readingTime: 3, sortOrder: 9, isImportant: false, isNew: false,
                textSummary: `From: Lars Nielsen, CEO Logistics Division\nDate: February 14, 2026\n\nRegarding the rumours of a CAPEX freeze across the Group:\n\nIf our logistics automation investment is cut, we will see an estimated 15% rise in cost per case within 12 months. Our competitors are actively automating their supply chains, and we cannot afford to fall further behind.\n\nCurrently, 40% of our operations remain semi-manual. The tension between Speed and Cost is breaking us — we are being asked to deliver faster and more reliably while simultaneously cutting costs. This is not sustainable without investment in automation and digital infrastructure.\n\nKey Data Points:\n• 40% of operations semi-manual\n• Competitors actively automating\n• 15% cost increase projected if investment deferred\n• Service level (OTIF) at risk of decline\n• Revenue: €8.0 bn, EBITDA declining from €0.7 bn to €0.55 bn year-over-year`,
              },
              {
                slug: "delivery-disruption-incident", title: "Operational Incident — Hub Failure & Delivery Prioritisation", categoryId: createdCategories["retail-operations"],
                shortDescription: "Real-time email chain revealing cross-functional conflict during a logistics hub failure affecting retail promotions.",
                documentType: "note", readingTime: 4, sortOrder: 10, isImportant: false, isNew: false,
                textSummary: `Email Thread: Delivery Prioritisation — February 2026\n\n--- Message 1 ---\nFrom: Anna Keller, Regional Operations Manager Retail West\nDate: January 17, 2026\n\nDue to the hub failure in Dortmund, around 30% of our planned transport capacity will not be available for the next two days. The following are critical for retail:\n• The ongoing weekend promotion in the Cologne/Düsseldorf metropolitan areas\n• Several key accounts with confirmed delivery windows\n\nI need a clear statement today as to which stores we can prioritise.\n\n--- Message 2 ---\nFrom: Julia Meier, Finance BP Retail\nDate: January 17, 2026\n\nFor reference:\n• Option A: approx. €180,000 in additional costs, risk of negative margins\n• Option B: approx. €90,000 in additional costs, lower individual risks\n\nFrom a financial perspective, there is no approved exception for unplanned additional costs of this magnitude.\n\n--- Analysis ---\nThis incident illustrates the recurring tension between operational responsiveness and financial control. Decision authority is unclear, cost accountability is fragmented, and regional management is left to make trade-off decisions without explicit mandate or escalation framework.`,
              },
              {
                slug: "berenberg-downgrade", title: "Analyst Downgrade — Berenberg Research Note", categoryId: createdCategories["presse-markt-externe-signale"],
                shortDescription: "Berenberg downgrades Varexia from Buy to Hold, citing capital allocation concerns and rising net debt.",
                documentType: "note", readingTime: 4, sortOrder: 11, isImportant: false, isNew: true,
                textSummary: `Source: Financial Times Markets | February 2026\n\nBerenberg has downgraded Varexia SE from 'Buy' to 'Hold', citing growing concerns over the conglomerate's capital allocation framework and rising net debt levels. The target price was lowered from €52 to €41.\n\nLead analyst Katharina Voß wrote: "Varexia continues to deliver acceptable operating performance, but the gap between reported earnings and actual cash generation is widening. We see limited catalysts for a re-rating until management provides greater transparency on portfolio priorities and covenant headroom."\n\nThe downgrade follows a series of meetings with institutional investors, many of whom expressed frustration with the company's unwillingness to explicitly rank its four business divisions by strategic priority.\n\nVariexia's shares fell 3.2% on the day of the downgrade, closing at €37.10. The stock has underperformed the STOXX Europe 600 by approximately 22% over the past twelve months.`,
              },
              {
                slug: "activist-investor-pressure", title: "Board Tensions & Activist Investor Activity — Press Summary", categoryId: createdCategories["presse-markt-externe-signale"],
                shortDescription: "Handelsblatt analysis of governance pressures at European conglomerates, with specific focus on Varexia.",
                documentType: "note", readingTime: 5, sortOrder: 12, isImportant: false, isNew: false,
                textSummary: `Source: Handelsblatt | February 2026\n\nA growing number of European conglomerates are facing pressure to simplify their portfolios and sharpen strategic focus, as activist investors and long-only shareholders alike demand greater accountability from boards.\n\nAmong the companies under scrutiny is Varexia SE, the €42 billion revenue group whose business spans retail, logistics, energy infrastructure, and digital consulting.\n\n"The classic European conglomerate model is being tested," says Prof. Dr. Heinrich Meier, chair of corporate governance at WHU. "Boards that cannot articulate a clear portfolio logic will face increasing pressure."\n\nWithin Varexia, sources close to the Supervisory Board suggest that tensions have emerged between members who favour a more conservative financial stance and those who support continued investment in growth initiatives.\n\n"The question is not whether Varexia has good businesses," a senior banker commented. "The question is whether they are better together or apart."`,
              },
              {
                slug: "hr-pulse-survey", title: "Leadership & Ownership Pulse Survey 2025 — Results", categoryId: createdCategories["people-kultur-kommunikation"],
                shortDescription: "Internal survey results revealing structural tensions between responsibility, authority, and incentive alignment.",
                documentType: "note", readingTime: 5, sortOrder: 13, isImportant: true, isNew: false,
                textSummary: `Leadership & Ownership Pulse Survey 2025\n\nSurvey Parameters:\n• Participants invited: 320\n• Response rate: 68%\n• Scale: 1 (strongly disagree) to 5 (strongly agree)\n\nCategory 1: Role Clarity & Ownership\n• "I have sufficient decision authority to fulfil my responsibilities." — 2.4\n• "Accountability and decision rights are aligned in my role." — 2.1\n• "When priorities conflict, it is clear who decides." — 2.3\n\nCategory 2: Targets & Incentives\n• "My targets encourage collaboration across functions." — 2.0\n• "I am rewarded for end-to-end outcomes, not just local optimisation." — 1.9\n• "I sometimes act against my own targets to do what I believe is right." — 3.2\n\nCategory 3: Pressure & Sustainability\n• "My workload is sustainable over the next 12 months." — 2.2\n• "I have enough capacity to focus on improvement, not just firefighting." — 1.8\n\nCategory 4: Trust & Leadership\n• "I trust senior management to consider local realities." — 2.6\n• "I see a clear and consistent direction for the organisation." — 2.7\n\nHR Commentary:\nThe data indicates a structural tension between responsibility, authority and incentives. This is not a motivation issue. It is a leadership system issue.`,
              },
              {
                slug: "workforce-pressure-alert", title: "HR Alert — Sustained Workforce Pressure in Operations", categoryId: createdCategories["people-kultur-kommunikation"],
                shortDescription: "HR Business Partner warning on overtime, sick leave, and compliance risks in logistics and retail operations.",
                documentType: "note", readingTime: 3, sortOrder: 14, isImportant: false, isNew: false,
                textSummary: `From: Claire Dubois, HR Business Partner Region West\nDate: January 19, 2026\n\nIn the course of ongoing promotional and special transport operations, we are observing a sustained high workload in the logistics and retail operating units.\n\nParticularly noticeable are:\n• Repeated overtime over several weeks\n• Increasing sick leave in individual shifts\n• Growing informal arrangements between teams to maintain service levels\n• Delayed onboarding of temporary staff due to administrative bottlenecks\n\nSeveral team leaders have informally communicated that they feel caught between operational expectations and workforce well-being obligations.\n\nRecommendation:\nA structured review of staffing adequacy and workload distribution should be initiated before the next peak period. The current approach of relying on individual discretion and informal flexibility is not sustainable as a permanent operating model.`,
              },
              {
                slug: "supervisory-board-response", title: "Supervisory Board Response — Priorities & Thresholds", categoryId: createdCategories["governance-risiko-compliance"],
                shortDescription: "Supervisory Board Chairman's response requesting explicit thresholds, communication strategy, and strategic triage criteria.",
                documentType: "note", readingTime: 4, sortOrder: 15, isImportant: false, isNew: false,
                textSummary: `From: Jean-Marc Lefèvre, Chair of the Supervisory Board\nTo: Michael Turner (CFO)\nDate: January 18, 2026\n\nThank you for the outline of the proposed measures in response to the recent cashflow developments. The Supervisory Board appreciates the clarity of the analysis.\n\nAt the same time, several members remain concerned that the current approach may underestimate the speed at which external perceptions can change.\n\nThe Supervisory Board asks the Executive Board to further elaborate:\n\n• which concrete thresholds would trigger a shift towards a more defensive stance;\n• how the proposed measures will be communicated consistently to lenders, rating agencies and internal stakeholders;\n• and which strategic initiatives would be reconsidered first should the stress scenario persist.\n\nThe tone of the discussion reflects not mistrust, but the heightened responsibility felt by the Supervisory Board in the current environment.`,
              },
              {
                slug: "strategic-swot-analysis", title: "Strategic SWOT Analysis — Varexia Group", categoryId: createdCategories["unternehmen-strategie"],
                shortDescription: "Comprehensive SWOT analysis identifying strengths, weaknesses, opportunities, and threats across the portfolio.",
                documentType: "note", readingTime: 5, sortOrder: 16, isImportant: false, isNew: false,
                textSummary: `Varexia SE — Strategic SWOT Analysis\n\nSTRENGTHS\n• Diversified revenue base across four complementary business segments with €42 bn total revenue\n• Strong market positions in European retail with established brand recognition\n• Energy & Infrastructure division generating attractive 11.5% EBITDA margins\n• Digital Services unit achieving 16.7% margins\n• Experienced management team with deep operational expertise\n\nWEAKNESSES\n• Free cash flow generation significantly below reported earnings\n• Net debt/EBITDA at 3.3x with risk of covenant breach within 12–18 months\n• 28% attrition rate in Digital Services key technology roles\n• Lack of explicit capital allocation framework\n• 40% of logistics operations remain semi-manual\n\nOPPORTUNITIES\n• Selective portfolio restructuring could unlock estimated 15–20% conglomerate discount\n• Digital Services carve-out with equity participation could address talent retention\n• Logistics automation investment could reduce cost per case by 15%\n• Energy transition investments aligned with EU regulatory tailwinds\n\nTHREATS\n• Covenant breach within 12–18 months if cash flow trajectory does not improve\n• Activist investor intervention forcing reactive portfolio decisions\n• Continued talent drain in Digital Services destroying unit value\n• Consumer confidence deterioration compressing Retail margins`,
              },
              {
                slug: "executive-summary-strategic-review", title: "Executive Summary — Strategic Review Context", categoryId: createdCategories["unternehmen-strategie"],
                shortDescription: "High-level executive summary framing the core strategic challenge: not operational failure, but strategic ambiguity.",
                documentType: "note", readingTime: 4, sortOrder: 17, isImportant: true, isNew: false,
                textSummary: `Varexia SE — Executive Summary for Strategic Review\n\nVariexia SE is a publicly listed European conglomerate generating €42 billion in revenue across four business divisions. While operating performance remains broadly stable, the Group faces a convergence of strategic, financial, and organisational pressures.\n\nThe Core Challenge:\nThe core challenge is not operational failure but strategic ambiguity: the absence of explicit portfolio prioritisation, unclear capital allocation thresholds, and a governance model that manages tensions implicitly rather than resolving them.\n\nConsequences:\n• A widening gap between reported earnings and cash generation\n• Growing investor scepticism (share price down 25% in 18 months)\n• Internal organisational strain (survey scores averaging 2.0–2.7)\n• Emerging covenant risk (net debt/EBITDA at 3.3x)\n\nThe Supervisory Board has commissioned a comprehensive strategic review to develop actionable recommendations:\n\n1. Portfolio Coherence — Which businesses belong together, and under what conditions?\n2. Financial Resilience — How to restore sustainable cash generation?\n3. Leadership System Effectiveness — How to align accountability, decision authority, and incentive structures?\n\nThe new Chief Strategy Officer will be expected to lead this review and present a coherent strategic framework.`,
              },
              {
                slug: "stress-scenario-analysis", title: "Financial Stress Scenario — Downside Analysis", categoryId: createdCategories["governance-risiko-compliance"],
                shortDescription: "Stress test modelling the financial impact of EBITDA compression, working capital squeeze, and CAPEX commitments.",
                documentType: "note", readingTime: 4, sortOrder: 18, isImportant: false, isNew: false,
                textSummary: `Varexia SE — Financial Stress Scenario Analysis\n\nScenario Assumptions:\nThis stress test models the impact of a moderate deterioration across key financial parameters over a 12-month horizon.\n\nImpact Items:\n• EBITDA margin compression (-50 bps across Group): -€210 million\n• Working capital absorption: -€180 million\n• Committed CAPEX obligations (non-deferrable): -€320 million\n• Lease payment obligations (fixed): -€280 million\n• Dividend commitment (current policy): -€150 million\n\nCumulative Cash Impact: approximately -€1.14 billion additional pressure\n\nImplications:\n• Net debt/EBITDA would exceed 3.5x under stress, likely triggering covenant discussions\n• Free cash flow would remain deeply negative\n• Rating agencies would likely place the Group on negative watch\n\nMitigating Actions Available:\n• Accelerated asset disposals (€0.8–1.2 bn potential)\n• CAPEX prioritisation (deferral of ~€0.6 bn non-critical items)\n• Working capital programme (potential release of €0.3–0.5 bn)\n• Dividend reduction or suspension\n\nManagement Assessment:\nThe stress scenario is not considered the base case, but the margin for error has narrowed significantly.`,
              },
              {
                slug: "leadership-workshop-summary", title: "Executive Leadership Workshop — One-Page Summary", categoryId: createdCategories["people-kultur-kommunikation"],
                shortDescription: "Half-day workshop summary identifying structural tensions, implicit non-decisions, and the need for enterprise-level leadership realignment.",
                documentType: "note", readingTime: 5, sortOrder: 19, isImportant: false, isNew: false,
                textSummary: `Internal Leadership Workshop — Executive One-Page Summary\nDate: January 7, 2026\nParticipants: Executive Board, Business Unit Heads, Regional CEOs\n\n1. Situation Assessment\n• Operating performance remains robust across business units\n• Cash flow and efficiency targets are increasingly binding\n• Target conflicts are managed implicitly rather than resolved explicitly\n\n2. Key Structural Tensions\n• Market responsiveness vs. efficiency and cost discipline\n• Flexibility at the front line vs. system stability and standardisation\n• Accountability for results vs. limited decision authority\n\n3. Current Organisational Response\n• Increased reliance on managerial discretion and informal decisions\n• Sustained overtime and personal commitment in critical roles\n• Selective rule-bending to protect customer and revenue outcomes\n\n4. Emerging Risks\n• Gradual erosion of leadership clarity and credibility\n• Rising frustration and cynicism in experienced management layers\n• Growing dependence on informal workarounds\n\n5. Core Insight\n• The challenge is neither operational nor purely financial\n• It is a leadership and steering issue at enterprise level\n• Non-decision has become an implicit decision with material risk\n• Explicit prioritisation is required to restore system coherence`,
              },
            ];

            for (const doc of drDocs) {
              await prisma.portalDocument.create({
                data: {
                  assessmentId: firstAssessmentForDR.id,
                  workspaceId: mainWsForPortal.id,
                  slug: doc.slug,
                  title: doc.title,
                  categoryId: doc.categoryId,
                  category: "data-room",
                  shortDescription: doc.shortDescription,
                  documentType: doc.documentType,
                  readingTime: doc.readingTime,
                  sortOrder: doc.sortOrder,
                  isImportant: doc.isImportant,
                  isNew: doc.isNew,
                  textSummary: doc.textSummary,
                  confidentialityLabel: (doc as any).confidentialityLabel || null,
                  releaseStatus: "released",
                  alwaysAvailable: true,
                  tags: [],
                },
              });
            }
            console.log(`[seed] Created ${drDocs.length} data room demo documents for Varexia case study.`);
          }
        } else {
          console.log(`[seed] Data room categories already exist (${existingCategories}), skipping data room seed.`);
        }
      }

    } catch (err) {
      console.error("[seed] Auto-seed error:", err);
    } finally {
      await prisma.$disconnect();
    }
  }
}
