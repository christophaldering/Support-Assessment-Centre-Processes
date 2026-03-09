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

      // ── ONE-TIME CLEANUP: Standardize all passwords to #Sammy2024 ──
      const newHash = await bcrypt.hash("#Sammy2024", 10);
      const sampleUser = await prisma.user.findFirst();
      if (sampleUser) {
        const isAlready = await bcrypt.compare("#Sammy2024", sampleUser.passwordHash);
        if (!isAlready) {
          console.log("[cleanup] Updating all passwords to #Sammy2024...");
          await prisma.$executeRawUnsafe(`UPDATE users SET password_hash = '${newHash}'`);
          await prisma.$executeRawUnsafe(`UPDATE workspaces SET admin_password_hash = '${newHash}'`);
          await prisma.$executeRawUnsafe(`UPDATE bdp_users SET password_hash = '${newHash}'`);
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
          const adminHash = await bcrypt.hash("#Sammy2024", 10);
          await prisma.user.create({
            data: {
              email: "christoph.aldering@googlemail.com",
              name: "Christoph Aldering",
              passwordHash: adminHash,
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
          const candidateHash = await bcrypt.hash("#Sammy2024", 10);
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
        const compAdminHash = await bcrypt.hash("#Sammy2024", 10);
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
        const abcdAdminHash = await bcrypt.hash("#Sammy2024", 10);
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

        const adminHash = await bcrypt.hash("#Sammy2024", 10);

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
      }

    } catch (err) {
      console.error("[seed] Auto-seed error:", err);
    } finally {
      await prisma.$disconnect();
    }
  }
}
