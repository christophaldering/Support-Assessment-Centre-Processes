"use strict";(()=>{var e={};e.id=118,e.ids=[118],e.modules={53524:e=>{e.exports=require("@prisma/client")},84770:e=>{e.exports=require("crypto")},92048:e=>{e.exports=require("fs")},55315:e=>{e.exports=require("path")},79063:e=>{e.exports=require("pdfkit")},17872:(e,t,a)=>{async function i(){{let{PrismaClient:e}=await Promise.resolve().then(a.t.bind(a,53524,23)),t=(await a.e(372).then(a.bind(a,30372))).default,i=new e;try{let e=await i.workspace.findUnique({where:{slug:"arag"}});if(e){console.log("[cleanup] Removing ARAG workspace and all related data...");let t=e.id,a=(await i.$queryRawUnsafe("SELECT id FROM bdp_sessions WHERE workspace='arag'")).map(e=>e.id),n=(await i.$queryRawUnsafe("SELECT id FROM bdp_teams WHERE workspace='arag'")).map(e=>e.id),r=(await i.$queryRawUnsafe("SELECT id FROM bdp_criteria WHERE workspace='arag'")).map(e=>e.id),s=(await i.$queryRawUnsafe("SELECT id FROM bdp_users WHERE workspace='arag'")).map(e=>e.id);if(a.length>0){let e=a.map(e=>`'${e}'`).join(",");await i.$executeRawUnsafe(`DELETE FROM bdp_scores WHERE session_id IN (${e})`),await i.$executeRawUnsafe(`DELETE FROM bdp_observer_assignments WHERE session_id IN (${e})`),await i.$executeRawUnsafe(`DELETE FROM bdp_sponsor_flags WHERE session_id IN (${e})`),await i.$executeRawUnsafe(`DELETE FROM bdp_individual_notes WHERE session_id IN (${e})`),await i.$executeRawUnsafe(`DELETE FROM bdp_tie_breaks WHERE session_id IN (${e})`),await i.$executeRawUnsafe(`DELETE FROM bdp_session_teams WHERE session_id IN (${e})`)}if(r.length>0){let e=r.map(e=>`'${e}'`).join(",");await i.$executeRawUnsafe(`DELETE FROM bdp_role_weights WHERE criterion_id IN (${e})`)}if(s.length>0){let e=s.map(e=>`'${e}'`).join(",");await i.$executeRawUnsafe(`DELETE FROM bdp_notifications WHERE user_id IN (${e})`)}if(n.length>0){let e=n.map(e=>`'${e}'`).join(",");await i.$executeRawUnsafe(`DELETE FROM bdp_team_participants WHERE team_id IN (${e})`)}for(let e of["bdp_participants","bdp_teams","bdp_sessions","bdp_criteria","bdp_name_mappings","bdp_config","bdp_users"])await i.$executeRawUnsafe(`DELETE FROM ${e} WHERE workspace='arag'`);for(let e of["audit_logs","consent_records","consent_templates","audio_recordings","reports","usage_events","access_requests","ai_audit_log","ai_system_settings","workspace_style_guides","brand_rule_sets","exercise_recommendations","predictive_profiles","development_blueprints","diagnostic_hypotheses","observation_sheet_templates","exercise_library_items","case_studies","clients","report_templates","scale_definitions","requirements_analyses"])try{await i.$executeRawUnsafe(`DELETE FROM ${e} WHERE workspace_id='${t}'`)}catch{}for(let e of(await i.$queryRawUnsafe(`SELECT id FROM competency_models WHERE workspace_id='${t}'`))){try{await i.$executeRawUnsafe(`DELETE FROM competency_nodes WHERE model_id='${e.id}'`)}catch{}try{await i.$executeRawUnsafe(`DELETE FROM weighting_profiles WHERE model_id='${e.id}'`)}catch{}}for(let e of(await i.$executeRawUnsafe(`DELETE FROM competency_models WHERE workspace_id='${t}'`),await i.$queryRawUnsafe(`SELECT id FROM assessments WHERE workspace_id='${t}'`)))for(let t of["observer_ratings","consolidated_scores","exercises","exercise_competency_mappings","documents","self_assessments","self_assessment_responses","portal_documents","collaboration_events","shared_observer_notes","presence_sessions","mtmm_snapshots"])try{await i.$executeRawUnsafe(`DELETE FROM ${t} WHERE assessment_id='${e.id}'`)}catch{}for(let e of(await i.$executeRawUnsafe(`DELETE FROM assessments WHERE workspace_id='${t}'`),await i.$queryRawUnsafe(`SELECT id FROM users WHERE workspace_id='${t}'`)))await i.$executeRawUnsafe(`DELETE FROM password_reset_tokens WHERE user_id='${e.id}'`);await i.$executeRawUnsafe(`DELETE FROM users WHERE workspace_id='${t}'`),await i.$executeRawUnsafe(`DELETE FROM themes WHERE workspace_id='${t}'`),await i.$executeRawUnsafe(`DELETE FROM workspaces WHERE id='${t}'`),console.log("[cleanup] ARAG workspace fully removed.")}await i.workspace.findUnique({where:{slug:"aestimamus"}})&&(console.log("[cleanup] Renaming aestimamus workspace to main..."),await i.$executeRawUnsafe("UPDATE workspaces SET slug='main', name='Executive Diagnostics Suite' WHERE slug='aestimamus'"),await i.$executeRawUnsafe("DELETE FROM users WHERE email='christoph.aldering@aestimamus.com'").catch(()=>{}),await i.$executeRawUnsafe("DELETE FROM access_requests WHERE email ILIKE '%aestimamus%'").catch(()=>{}),await i.$executeRawUnsafe("UPDATE requirements_analyses SET transcript = REPLACE(transcript::text, 'aestimamus', 'Executive Diagnostics Suite') WHERE transcript::text ILIKE '%aestimamus%'").catch(()=>{}),await i.$executeRawUnsafe("UPDATE brand_rule_sets SET name = REPLACE(name, 'aestimamus', 'Executive Diagnostics Suite') WHERE name ILIKE '%aestimamus%'").catch(()=>{}),await i.$executeRawUnsafe("UPDATE workspace_style_guides SET title = REPLACE(title, 'aestimamus', 'Executive Diagnostics Suite') WHERE title ILIKE '%aestimamus%'").catch(()=>{}),await i.$executeRawUnsafe("UPDATE workspace_style_guides SET file_object_path = REPLACE(file_object_path, 'aestimamus', 'main') WHERE file_object_path ILIKE '%aestimamus%'").catch(()=>{}),await i.$executeRawUnsafe("UPDATE workspace_style_guides SET analysis_json = REPLACE(analysis_json::text, 'aestimamus', 'Executive Diagnostics Suite')::jsonb WHERE analysis_json::text ILIKE '%aestimamus%'").catch(()=>{}),console.log("[cleanup] aestimamus renamed to main."));let n=await t.hash("#Sammy2024",10),r=await i.user.findFirst();r&&!await t.compare("#Sammy2024",r.passwordHash)&&(console.log("[cleanup] Updating all passwords to #Sammy2024..."),await i.$executeRawUnsafe(`UPDATE users SET password_hash = '${n}'`),await i.$executeRawUnsafe(`UPDATE workspaces SET admin_password_hash = '${n}'`),await i.$executeRawUnsafe(`UPDATE bdp_users SET password_hash = '${n}'`),console.log("[cleanup] All passwords updated."));let s=await i.workspace.findUnique({where:{slug:"main"}});s&&!await i.user.findFirst({where:{email:"christoph.aldering@googlemail.com",workspaceId:s.id}})&&(await i.user.create({data:{email:"christoph.aldering@googlemail.com",name:"Christoph Aldering",passwordHash:n,roles:["ADMIN"],workspaceId:s.id,forcePasswordChange:!1,status:"active"}}),console.log("[seed] Created admin user christoph.aldering@googlemail.com in main workspace."));let o=await i.workspace.findUnique({where:{slug:"main"}});if(o){if(!await i.user.findFirst({where:{email:"kandidat@test.de",workspaceId:o.id}})){let e=await i.assessment.findFirst({where:{workspaceId:o.id},orderBy:{createdAt:"asc"}});await i.user.create({data:{id:"test-candidate-001",email:"kandidat@test.de",name:"Dr. Anna M\xfcller",passwordHash:n,roles:["CANDIDATE"],workspaceId:o.id,forcePasswordChange:!1,status:"active",assessmentId:e?.id??null}}),console.log("[seed] Created test candidate: kandidat@test.de")}if(!await i.user.findFirst({where:{email:"candidate@varexia-demo.com",workspaceId:o.id}})){let e=await i.assessment.findFirst({where:{workspaceId:o.id},orderBy:{createdAt:"asc"}});await i.user.create({data:{id:"varexia-candidate-001",email:"candidate@varexia-demo.com",name:"Sarah Chen",passwordHash:"FIRST_ACCESS_NO_PASSWORD",roles:["CANDIDATE"],workspaceId:o.id,forcePasswordChange:!1,status:"active",assessmentId:e?.id??null}}),console.log("[seed] Created demo candidate: candidate@varexia-demo.com (first-access, no password)")}}let l=await i.workspace.findUnique({where:{slug:"comp"}});if(l){if(!await i.user.findUnique({where:{email_workspaceId:{email:"demo@demo.de",workspaceId:l.id}}})){let e=await t.hash("demo",10);await i.user.create({data:{email:"demo@demo.de",name:"Demo User",passwordHash:e,roles:["WORKSPACE_ADMIN"],workspaceId:l.id,forcePasswordChange:!1,status:"active"}}),console.log("[seed] Created demo user in existing comp workspace")}}else{let e=await i.workspace.create({data:{slug:"comp",name:"COMP",status:"active",aiEnabled:!1,adminPasswordHash:n,dataResidency:"EU",theme:{create:{primaryColor:"#FFD700",secondaryColor:"#1a1a1a",accentColor:"#FFD700",backgroundColor:"#ffffff",textColor:"#1a1a1a",fontFamily:"Inter",fontFamilyHeading:"Playfair Display"}}}}),a=await t.hash("demo",10);await i.user.create({data:{email:"demo@demo.de",name:"Demo User",passwordHash:a,roles:["WORKSPACE_ADMIN"],workspaceId:e.id,forcePasswordChange:!1,status:"active"}}),console.log("[seed] Created comp workspace + demo user")}if(!await i.workspace.findUnique({where:{slug:"abcd"}})){let e=await i.workspace.create({data:{slug:"abcd",name:"ABCD",status:"active",aiEnabled:!1,adminPasswordHash:n,dataResidency:"EU",theme:{create:{primaryColor:"#0071e3",secondaryColor:"#1d1d1f",accentColor:"#0071e3",backgroundColor:"#f5f5f7",textColor:"#1d1d1f",fontFamily:"Inter",fontFamilyHeading:"SF Pro Display"}}}}),a=await t.hash("demo",10);await i.user.create({data:{email:"demo@demo.de",name:"Demo User",passwordHash:a,roles:["WORKSPACE_ADMIN"],workspaceId:e.id,forcePasswordChange:!1,status:"active"}}),console.log("[seed] Created abcd workspace + demo user")}let c=await i.workspace.count();if(c<=1){console.log("[seed] No workspaces found, auto-seeding...");let e=await i.workspace.create({data:{slug:"main",name:"Executive Diagnostics Suite",status:"active",adminPasswordHash:n,dataResidency:"EU",theme:{create:{primaryColor:"hsl(14, 48%, 44%)",secondaryColor:"#1a1a1a",accentColor:"hsl(14, 48%, 44%)",backgroundColor:"#ffffff",textColor:"#1a1a1a",fontFamily:"Inter",fontFamilyHeading:"Playfair Display"}}}});await i.user.create({data:{email:"christoph.aldering@googlemail.com",name:"Christoph Aldering",passwordHash:n,roles:["ADMIN"],workspaceId:e.id,forcePasswordChange:!1,status:"active"}});let t=await i.assessment.create({data:{name:"Leadership Assessment Q1 2026",workspaceId:e.id,status:"draft",description:"Umfassendes Leadership Assessment f\xfcr F\xfchrungskr\xe4fte der oberen Ebene.",location:"Frankfurt am Main",startDate:new Date("2026-03-15"),endDate:new Date("2026-03-16"),exercises:{create:[{name:"Strategische Pr\xe4sentation",type:"presentation",instructions:"Bereiten Sie eine 15-min\xfctige Pr\xe4sentation zur strategischen Ausrichtung vor.",duration:15,sortOrder:1},{name:"Strukturiertes Interview",type:"interview",instructions:"Kompetenzbasiertes Interview zu F\xfchrungserfahrungen.",duration:45,sortOrder:2},{name:"Gruppendiskussion Marktanalyse",type:"group_discussion",instructions:"Diskutieren Sie in der Gruppe \xfcber aktuelle Markttrends.",duration:30,sortOrder:3},{name:"Fallstudie Restrukturierung",type:"case_study",instructions:"Analysieren Sie den Fall und erarbeiten Sie einen Restrukturierungsplan.",duration:60,sortOrder:4}]}}}),a=await i.competencyModel.create({data:{workspaceId:e.id,name:"Leadership-Kompetenzmodell",description:"Kompetenzmodell f\xfcr die Bewertung von F\xfchrungskr\xe4ften auf oberer Managementebene.",version:1,status:"active",nodes:{create:[{name:"Strategische F\xfchrung",nodeType:"domain",description:"F\xe4higkeit zur strategischen Steuerung und Visionsentwicklung.",sortOrder:1},{name:"Kommunikation",nodeType:"domain",description:"Effektive Kommunikation auf allen Ebenen.",sortOrder:2},{name:"Entscheidungsf\xe4higkeit",nodeType:"domain",description:"Fundierte Entscheidungen unter Unsicherheit treffen.",sortOrder:3}]}},include:{nodes:!0}}),r=a.nodes.find(e=>"Strategische F\xfchrung"===e.name),s=a.nodes.find(e=>"Kommunikation"===e.name);r&&await i.competencyNode.createMany({data:[{competencyModelId:a.id,parentId:r.id,name:"Visionsentwicklung",nodeType:"competency",description:"Entwicklung und Kommunikation einer klaren Unternehmensvision.",sortOrder:1},{competencyModelId:a.id,parentId:r.id,name:"Strategische Planung",nodeType:"competency",description:"Langfristige Planungsf\xe4higkeit und Zielorientierung.",sortOrder:2},{competencyModelId:a.id,parentId:r.id,name:"Change Management",nodeType:"competency",description:"Ver\xe4nderungsprozesse erfolgreich gestalten und begleiten.",sortOrder:3}]}),s&&await i.competencyNode.createMany({data:[{competencyModelId:a.id,parentId:s.id,name:"Pr\xe4sentationskompetenz",nodeType:"competency",description:"\xdcberzeugend pr\xe4sentieren und Inhalte strukturiert vermitteln.",sortOrder:1},{competencyModelId:a.id,parentId:s.id,name:"Aktives Zuh\xf6ren",nodeType:"competency",description:"Empathisches Zuh\xf6ren und Verst\xe4ndnis signalisieren.",sortOrder:2}]}),await i.weightingProfile.create({data:{competencyModelId:a.id,name:"Standard-Gewichtung F\xfchrungskraft",targetRole:"CEO/Gesch\xe4ftsf\xfchrer",version:1,weights:a.nodes.map(e=>({nodeId:e.id,weight:"Strategische F\xfchrung"===e.name?.5:"Kommunikation"===e.name?.3:.2})),status:"active"}}),await i.scaleDefinition.create({data:{workspaceId:e.id,name:"5-Punkt Likert-Skala",type:"likert",minValue:1,maxValue:5,points:[{value:1,label:"Deutlich unter Erwartung",anchor:"Zeigt keine Ans\xe4tze der Kompetenz."},{value:2,label:"Unter Erwartung",anchor:"Zeigt vereinzelte Ans\xe4tze, jedoch nicht konsistent."},{value:3,label:"Entspricht Erwartung",anchor:"Zeigt die Kompetenz in den meisten Situationen."},{value:4,label:"\xdcber Erwartung",anchor:"Zeigt die Kompetenz konsistent und auf hohem Niveau."},{value:5,label:"Deutlich \xfcber Erwartung",anchor:"Herausragende Demonstration der Kompetenz."}],status:"active"}}),console.log(`[seed] Auto-seed complete: workspace "${e.name}", assessment "${t.name}", competency model, scale definition`)}else console.log(`[seed] ${c} workspace(s) found, skipping seed.`);let d=await i.workspace.findUnique({where:{slug:"main"}});if(d){for(let e of(await i.assessment.findMany({where:{workspaceId:d.id},include:{portalDocuments:!0,selfAssessments:!0}}))){if(0===e.portalDocuments.length){e.workflowConfig||await i.assessment.update({where:{id:e.id},data:{workflowConfig:{unlockedPhases:["preparation","execution","followup"]},status:"active"}});let t=await i.exercise.findMany({where:{assessmentId:e.id}}),a=t.find(e=>"case_study"===e.type),n=t.find(e=>["behavior_simulation","role_play","in_tray"].includes(e.type)),r=[{assessmentId:e.id,category:"preparation",title:"Willkommen & Ablaufplan",description:"\xdcbersicht \xfcber den gesamten Assessment-Ablauf, Zeitplan und organisatorische Hinweise.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:1},{assessmentId:e.id,category:"preparation",title:"Hinweise zur Vorbereitung",description:"Tipps und Empfehlungen zur optimalen Vorbereitung auf das Assessment Center.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:2},{assessmentId:e.id,category:"info",title:"Feedback-Leitfaden",description:"Informationen zum Feedback-Prozess und wie Sie Ihre Ergebnisse interpretieren k\xf6nnen.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:5}];a&&r.push({assessmentId:e.id,category:"general",title:`${a.name} — Briefing`,description:"Hintergrundinformationen und Aufgabenstellung.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:3}),n&&r.push({assessmentId:e.id,category:"general",title:`${n.name} — Rollenanweisung`,description:"Ihre Rolle und die Ausgangssituation.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:4}),await i.portalDocument.createMany({data:r}),console.log(`[seed] Created ${r.length} portal documents for "${e.name}"`)}0===e.selfAssessments.length&&(await i.selfAssessment.createMany({data:[{assessmentId:e.id,title:"Selbsteinsch\xe4tzung F\xfchrungskompetenzen",description:"Bitte sch\xe4tzen Sie Ihre eigenen F\xfchrungskompetenzen ein.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:1,schemaJson:{type:"likert",scale:{min:1,max:5,labels:["Trifft nicht zu","Trifft wenig zu","Teils/teils","Trifft \xfcberwiegend zu","Trifft voll zu"]},questions:[{id:"q1",text:"Ich kann eine klare strategische Vision entwickeln und kommunizieren."},{id:"q2",text:"Ich treffe auch unter Unsicherheit fundierte Entscheidungen."},{id:"q3",text:"Ich kann Ver\xe4nderungsprozesse aktiv gestalten."},{id:"q4",text:"Ich kommuniziere klar und \xfcberzeugend."},{id:"q5",text:"Ich f\xf6rdere aktiv die Entwicklung meiner Mitarbeiter."}]}},{assessmentId:e.id,title:"Pers\xf6nliche Reflexion",description:"Bitte beantworten Sie die folgenden Fragen in eigenen Worten.",releaseStatus:"released",alwaysAvailable:!0,sortOrder:2,schemaJson:{type:"open",questions:[{id:"r1",text:"Was war Ihre gr\xf6\xdfte berufliche Herausforderung in den letzten 12 Monaten?"},{id:"r2",text:"Welche F\xfchrungskompetenz m\xf6chten Sie am st\xe4rksten weiterentwickeln?"},{id:"r3",text:"Beschreiben Sie eine Situation, in der Sie ein Team durch eine Ver\xe4nderung gef\xfchrt haben."}]}}]}),console.log(`[seed] Created 2 self-assessments for "${e.name}"`))}let e=await i.user.findFirst({where:{email:"christoph.aldering@googlemail.com",workspaceId:d.id}});if(e&&!e.assessmentId){let t=await i.assessment.findFirst({where:{workspaceId:d.id},orderBy:{createdAt:"asc"}});t&&(await i.user.update({where:{id:e.id},data:{assessmentId:t.id}}),console.log("[seed] Linked admin user to assessment for portal preview."))}let t=await i.dataRoomCategory.count({where:{workspaceId:d.id}});if(0===t){let e=[{slug:"unternehmen-strategie",label:"Unternehmen & Strategie",labelEn:"Company & Strategy",icon:"Building2",color:"#1e40af",sortOrder:1},{slug:"finanzen-kapitalmarkt",label:"Finanzen & Kapitalmarkt",labelEn:"Finance & Capital Markets",icon:"TrendingUp",color:"#059669",sortOrder:2},{slug:"retail-operations",label:"Retail & Operations",labelEn:"Retail & Operations",icon:"ShoppingCart",color:"#d97706",sortOrder:3},{slug:"transformation-investitionen",label:"Transformation & Investitionen",labelEn:"Transformation & Investments",icon:"Rocket",color:"#7c3aed",sortOrder:4},{slug:"governance-risiko-compliance",label:"Governance, Risiko & Compliance",labelEn:"Governance, Risk & Compliance",icon:"Shield",color:"#dc2626",sortOrder:5},{slug:"people-kultur-kommunikation",label:"People, Kultur & Kommunikation",labelEn:"People, Culture & Communication",icon:"Users",color:"#0891b2",sortOrder:6},{slug:"presse-markt-externe-signale",label:"Presse, Markt & externe Signale",labelEn:"Press, Market & External Signals",icon:"Newspaper",color:"#64748b",sortOrder:7}],t={};for(let a of e){let e=await i.dataRoomCategory.create({data:{...a,workspaceId:d.id}});t[a.slug]=e.id}console.log(`[seed] Created ${e.length} data room categories.`);let a=await i.assessment.findFirst({where:{workspaceId:d.id},orderBy:{createdAt:"asc"}});if(a){let e=[{slug:"corporate-profile",title:"Corporate Profile — Varexia SE",categoryId:t["unternehmen-strategie"],shortDescription:"Overview of the Varexia Group: structure, scale, market positioning, and dual management model.",documentType:"note",readingTime:4,sortOrder:1,isImportant:!0,isNew:!1,textSummary:`Varexia SE is a publicly listed European stock corporation (Societas Europaea) with a dual management structure comprising an Executive Board and a Supervisory Board.

The Group generates approximately €42.0 billion in annual revenue and employs around 284,000 people across Europe. It operates through four distinct business divisions:

• Retail & Consumer Goods — The largest division with €24.5 billion revenue and 190,000 employees. Operates across multiple retail formats with established brand recognition and customer loyalty in key European markets.

• Logistics & Supply Chain — €8.0 billion revenue, 55,000 employees. Provides integrated logistics services including warehousing, transportation, and last-mile delivery.

• Energy & Infrastructure — €6.5 billion revenue, 25,000 employees. Manages long-term energy and infrastructure assets with contracted revenue streams.

• Digital Services & Consulting — €3.0 billion revenue, 15,000 employees. Offers technology consulting, digital transformation, and managed services.

The company is listed on major European exchanges with a current market capitalisation of approximately €28.7 billion, down from €38.2 billion eighteen months ago. The share price currently stands at €38.40, having declined approximately 18% since December.

Variexia's governance structure follows the German two-tier board model. The Supervisory Board, chaired by Dr. Thomas Berner, provides strategic oversight. The Executive Board, led by CEO Alexandra Rossi, is responsible for operational management.`},{slug:"organisational-chart",title:"Group Management Team & Organisational Overview",categoryId:t["unternehmen-strategie"],shortDescription:"Key members of the executive team and their divisional responsibilities.",documentType:"note",readingTime:3,sortOrder:2,isImportant:!1,isNew:!1,textSummary:`Executive Board & Senior Leadership

• Alexandra Rossi — Chief Executive Officer (CEO)
• Marcus Weber / Michael Turner — Chief Financial Officer (CFO)
• Isabelle Fournier — Chief Information Officer (CIO)
• Sarah Jenkins — Head of Human Resources
• Emily Watson — Head of Investor Relations

Divisional Leadership

• Lars Nielsen — CEO, Logistics & Supply Chain Division
• Anna Keller — Regional Operations Manager, Retail West
• Thomas Berger — Head of Logistics, Region West
• Julia Meier — Finance Business Partner, Retail
• Claire Dubois — HR Business Partner, Region West

Supervisory Board

• Dr. Thomas Berner / Jean-Marc Lef\xe8vre — Chairman

The organisation operates with a matrix structure where divisional P&L responsibility intersects with functional oversight (Finance, HR, IT). Regional management teams hold operational accountability but report through both divisional and functional lines.

The appointment of a new Chief Strategy Officer (CSO) is currently under consideration — a role intended to provide clearer portfolio-level strategic coordination across the four business divisions.`},{slug:"strategic-mandate",title:"Strategic Review Mandate from the Supervisory Board",categoryId:t["unternehmen-strategie"],shortDescription:"The Chairman's mandate for a comprehensive strategic review, outlining key priorities and expectations.",documentType:"note",readingTime:4,sortOrder:3,isImportant:!0,isNew:!1,textSummary:`From: Dr. Thomas Berner, Chairman of the Supervisory Board
Date: February 14, 2026

The Supervisory Board is requesting a comprehensive strategic review of the Varexia Group. The review should address the following critical issues:

1. Retail & Consumer Goods Profitability
The largest division is underperforming on margins despite stable revenue growth. The tension between price leadership and profitability requires resolution.

2. Digital Services & Consulting Viability
Questions around whether this unit belongs in the portfolio given talent retention challenges and strategic fit. The 28% attrition rate in key technology roles is eroding the unit's value proposition.

3. Capital Allocation Conflicts Between Divisions
Particularly between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation needs. The absence of explicit capital allocation thresholds is creating strategic ambiguity.

The Supervisory Board expects a clear, actionable turnaround strategy that can be presented to the full Board. The analysis should demonstrate strategic depth, financial acumen, and the ability to make difficult trade-offs under uncertainty.

Context: Varexia's market capitalisation has declined from €38.2 billion to €28.7 billion over the past 18 months, reflecting growing investor concern about the Group's strategic direction and operational performance.`},{slug:"business-unit-overview",title:"Business Unit Performance Summary FY 2025",categoryId:t["retail-operations"],shortDescription:"Comparative overview of all four business divisions: revenue, margins, employees, and key tensions.",documentType:"note",readingTime:5,sortOrder:4,isImportant:!0,isNew:!1,textSummary:`Varexia SE — Divisional Performance Overview (FY 2025)

1. Retail & Consumer Goods
• Revenue: €24.5 bn (prior year: €23.82 bn, +2.9%)
• EBITDA: €1.8 bn (prior year: €1.65 bn, +9.1%)
• EBITDA Margin: 7.3%
• Employees: 190,000
• Key Tension: Price leadership vs. profitability

2. Logistics & Supply Chain
• Revenue: €8.0 bn (prior year: €7.6 bn, +5.3%)
• EBITDA: €0.55 bn (prior year: €0.7 bn, -21.4%)
• EBITDA Margin: 6.9%
• Employees: 55,000
• Key Tension: Speed & reliability vs. cost efficiency

3. Energy & Infrastructure
• Revenue: €6.5 bn (prior year: €6.2 bn, +4.8%)
• EBITDA: €0.75 bn (stable)
• EBITDA Margin: 11.5%
• Employees: 25,000
• Key Tension: Long-term assets vs. short-term returns

4. Digital Services & Consulting
• Revenue: €3.0 bn (prior year: €2.7 bn, +11.1%)
• EBITDA: €0.5 bn (prior year: €0.43 bn, +16.3%)
• EBITDA Margin: 16.7%
• Employees: 15,000
• Key Tension: Scalability vs. people dependency

Group Totals
• Revenue: €42.0 bn
• EBITDA: €3.6 bn
• Employees: ~284,000`},{slug:"cfo-financial-briefing",title:"CFO Briefing — Financial Situation & Covenant Risk",categoryId:t["finanzen-kapitalmarkt"],shortDescription:"Confidential CFO briefing on profitability erosion, cash flow pressure, and potential debt covenant breach.",documentType:"note",readingTime:4,sortOrder:5,isImportant:!0,isNew:!1,confidentialityLabel:"CONFIDENTIAL",textSummary:`From: Marcus Weber, CFO
Date: February 14, 2026
Classification: CONFIDENTIAL

Revenue has remained stable at €42.0 billion, but profitability is eroding. Group EBIT stands at €1.4 billion, which represents a concerning decline in margins across several business units.

Free cash flow is barely covering our dividend commitments and essential capital expenditure. The tension between Energy & Infrastructure's long-term CAPEX requirements and Retail's cash generation capacity is becoming unsustainable.

Covenant Risk:
Most critically, we are approaching a potential debt covenant breach. Our total debt stands at €11.4 billion in bonds plus €9.6 billion in bank loans. The covenant ratios are tightening, and without corrective action, we risk triggering breach clauses within the next 12–18 months.

Required Actions:
We need a strategy that:
• Releases cash
• Improves profitability
• Creates a sustainable capital structure

Any portfolio decisions must account for the covenant implications.`},{slug:"northbridge-credit-assessment",title:"External Credit Assessment — Northbridge Capital Research",categoryId:t["finanzen-kapitalmarkt"],shortDescription:"Independent credit analysis highlighting cash conversion weakness, leverage concerns, and portfolio opacity.",documentType:"note",readingTime:4,sortOrder:6,isImportant:!1,isNew:!0,textSummary:`Source: Northbridge Capital Research

Key Financial Indicators:
• EBITDA: €3.600 bn
• Operating cash flow: €1.602 bn
• Cash conversion (OCF / EBITDA): 45.5%
• Net CAPEX incl. leases: -€2.328 bn
• Free cash flow: -€0.73 bn
• Net debt / EBITDA: 3.3x

Observations:
1. Reported EBITDA stability masks a structurally weak cash conversion profile.
2. Over the past fiscal year, working capital absorption and front-loaded investment activity have materially constrained internally generated liquidity.
3. From an external perspective, the Group's portfolio composition remains challenging to assess.

Critical Question:
How resilient is the current investment trajectory should free cash flow remain negative for another investment cycle?

Conclusion:
Northbridge Capital Research views the Group as strategically well positioned but financially constrained. Without clearer prioritisation, the current trajectory may limit strategic optionality.`},{slug:"liquidity-stabilisation-plan",title:"Proposed Liquidity Stabilisation & Capital Allocation Measures",categoryId:t["finanzen-kapitalmarkt"],shortDescription:"CFO proposal for sequenced measures: liquidity stabilisation, balance sheet resilience, and strategic ring-fencing.",documentType:"note",readingTime:4,sortOrder:7,isImportant:!1,isNew:!1,textSummary:`From: Michael Turner, Chief Financial Officer
To: Members of the Supervisory Board
Date: January 27, 2026

The Group remains operationally sound. At the same time, we are experiencing short-term liquidity pressure combined with an elevated leverage profile.

Management proposes a sequenced set of measures:

Phase 1 — Immediate Liquidity Stabilisation
• Tighter working capital controls
• Postponement of non-critical capital expenditure (~€0.6 bn)
• Securing additional short-term credit lines

Phase 2 — Balance Sheet Resilience
• Selective asset disposals in the range of €0.8–1.2 bn
• Lease renegotiations where feasible
• Increased dividend flexibility
• Target: Move net debt/EBITDA towards ~3.0x

Phase 3 — Strategic Ring-Fencing
• Key growth and digital projects ring-fenced
• Clear stop-go criteria applied
• KPI monitoring enhanced

This approach does not eliminate trade-offs. It does, however, make them explicit, manageable and transparent for all stakeholders.`},{slug:"digital-talent-crisis",title:"Talent Retention Crisis — Digital Services Division",categoryId:t["transformation-investitionen"],shortDescription:"HR alert on 28% attrition in Digital Services, with analysis of root causes and strategic implications.",documentType:"note",readingTime:3,sortOrder:8,isImportant:!1,isNew:!0,textSummary:`From: Sarah Jenkins, Head of HR
Date: February 14, 2026

Urgent people issue in the Digital Services & Consulting division.

Current Situation:
We are experiencing 28% attrition in key technology roles over the past 12 months. Exit interviews consistently cite the same reasons: Varexia is perceived as too bureaucratic, and employees lack the equity upside they could get at startups or pure-play tech companies.

Financial Impact:
The division's margin of 16.7% looks healthy on paper, but it is trending downward due to the premium salaries we must pay to attract and retain top talent.

Strategic Options:
a) Fundamentally fix the governance and incentive structure for Digital Services — potentially including a carve-out with equity participation — or
b) Make the difficult decision to wind down or divest the unit before the talent drain destroys its value entirely.

Assessment:
This is not a cyclical problem. It is structural. The conglomerate model is inherently disadvantaged in competing for top technology talent against purpose-built technology companies with equity-based compensation models.`},{slug:"logistics-investment-request",title:"Logistics Automation — Investment Case & CAPEX Request",categoryId:t["transformation-investitionen"],shortDescription:"Logistics division CEO's urgent request to protect automation CAPEX amid Group-wide freeze discussions.",documentType:"note",readingTime:3,sortOrder:9,isImportant:!1,isNew:!1,textSummary:`From: Lars Nielsen, CEO Logistics Division
Date: February 14, 2026

Regarding the rumours of a CAPEX freeze across the Group:

If our logistics automation investment is cut, we will see an estimated 15% rise in cost per case within 12 months. Our competitors are actively automating their supply chains, and we cannot afford to fall further behind.

Currently, 40% of our operations remain semi-manual. The tension between Speed and Cost is breaking us — we are being asked to deliver faster and more reliably while simultaneously cutting costs. This is not sustainable without investment in automation and digital infrastructure.

Key Data Points:
• 40% of operations semi-manual
• Competitors actively automating
• 15% cost increase projected if investment deferred
• Service level (OTIF) at risk of decline
• Revenue: €8.0 bn, EBITDA declining from €0.7 bn to €0.55 bn year-over-year`},{slug:"delivery-disruption-incident",title:"Operational Incident — Hub Failure & Delivery Prioritisation",categoryId:t["retail-operations"],shortDescription:"Real-time email chain revealing cross-functional conflict during a logistics hub failure affecting retail promotions.",documentType:"note",readingTime:4,sortOrder:10,isImportant:!1,isNew:!1,textSummary:`Email Thread: Delivery Prioritisation — February 2026

--- Message 1 ---
From: Anna Keller, Regional Operations Manager Retail West
Date: January 17, 2026

Due to the hub failure in Dortmund, around 30% of our planned transport capacity will not be available for the next two days. The following are critical for retail:
• The ongoing weekend promotion in the Cologne/D\xfcsseldorf metropolitan areas
• Several key accounts with confirmed delivery windows

I need a clear statement today as to which stores we can prioritise.

--- Message 2 ---
From: Julia Meier, Finance BP Retail
Date: January 17, 2026

For reference:
• Option A: approx. €180,000 in additional costs, risk of negative margins
• Option B: approx. €90,000 in additional costs, lower individual risks

From a financial perspective, there is no approved exception for unplanned additional costs of this magnitude.

--- Analysis ---
This incident illustrates the recurring tension between operational responsiveness and financial control. Decision authority is unclear, cost accountability is fragmented, and regional management is left to make trade-off decisions without explicit mandate or escalation framework.`},{slug:"berenberg-downgrade",title:"Analyst Downgrade — Berenberg Research Note",categoryId:t["presse-markt-externe-signale"],shortDescription:"Berenberg downgrades Varexia from Buy to Hold, citing capital allocation concerns and rising net debt.",documentType:"note",readingTime:4,sortOrder:11,isImportant:!1,isNew:!0,textSummary:`Source: Financial Times Markets | February 2026

Berenberg has downgraded Varexia SE from 'Buy' to 'Hold', citing growing concerns over the conglomerate's capital allocation framework and rising net debt levels. The target price was lowered from €52 to €41.

Lead analyst Katharina Vo\xdf wrote: "Varexia continues to deliver acceptable operating performance, but the gap between reported earnings and actual cash generation is widening. We see limited catalysts for a re-rating until management provides greater transparency on portfolio priorities and covenant headroom."

The downgrade follows a series of meetings with institutional investors, many of whom expressed frustration with the company's unwillingness to explicitly rank its four business divisions by strategic priority.

Variexia's shares fell 3.2% on the day of the downgrade, closing at €37.10. The stock has underperformed the STOXX Europe 600 by approximately 22% over the past twelve months.`},{slug:"activist-investor-pressure",title:"Board Tensions & Activist Investor Activity — Press Summary",categoryId:t["presse-markt-externe-signale"],shortDescription:"Handelsblatt analysis of governance pressures at European conglomerates, with specific focus on Varexia.",documentType:"note",readingTime:5,sortOrder:12,isImportant:!1,isNew:!1,textSummary:`Source: Handelsblatt | February 2026

A growing number of European conglomerates are facing pressure to simplify their portfolios and sharpen strategic focus, as activist investors and long-only shareholders alike demand greater accountability from boards.

Among the companies under scrutiny is Varexia SE, the €42 billion revenue group whose business spans retail, logistics, energy infrastructure, and digital consulting.

"The classic European conglomerate model is being tested," says Prof. Dr. Heinrich Meier, chair of corporate governance at WHU. "Boards that cannot articulate a clear portfolio logic will face increasing pressure."

Within Varexia, sources close to the Supervisory Board suggest that tensions have emerged between members who favour a more conservative financial stance and those who support continued investment in growth initiatives.

"The question is not whether Varexia has good businesses," a senior banker commented. "The question is whether they are better together or apart."`},{slug:"hr-pulse-survey",title:"Leadership & Ownership Pulse Survey 2025 — Results",categoryId:t["people-kultur-kommunikation"],shortDescription:"Internal survey results revealing structural tensions between responsibility, authority, and incentive alignment.",documentType:"note",readingTime:5,sortOrder:13,isImportant:!0,isNew:!1,textSummary:`Leadership & Ownership Pulse Survey 2025

Survey Parameters:
• Participants invited: 320
• Response rate: 68%
• Scale: 1 (strongly disagree) to 5 (strongly agree)

Category 1: Role Clarity & Ownership
• "I have sufficient decision authority to fulfil my responsibilities." — 2.4
• "Accountability and decision rights are aligned in my role." — 2.1
• "When priorities conflict, it is clear who decides." — 2.3

Category 2: Targets & Incentives
• "My targets encourage collaboration across functions." — 2.0
• "I am rewarded for end-to-end outcomes, not just local optimisation." — 1.9
• "I sometimes act against my own targets to do what I believe is right." — 3.2

Category 3: Pressure & Sustainability
• "My workload is sustainable over the next 12 months." — 2.2
• "I have enough capacity to focus on improvement, not just firefighting." — 1.8

Category 4: Trust & Leadership
• "I trust senior management to consider local realities." — 2.6
• "I see a clear and consistent direction for the organisation." — 2.7

HR Commentary:
The data indicates a structural tension between responsibility, authority and incentives. This is not a motivation issue. It is a leadership system issue.`},{slug:"workforce-pressure-alert",title:"HR Alert — Sustained Workforce Pressure in Operations",categoryId:t["people-kultur-kommunikation"],shortDescription:"HR Business Partner warning on overtime, sick leave, and compliance risks in logistics and retail operations.",documentType:"note",readingTime:3,sortOrder:14,isImportant:!1,isNew:!1,textSummary:`From: Claire Dubois, HR Business Partner Region West
Date: January 19, 2026

In the course of ongoing promotional and special transport operations, we are observing a sustained high workload in the logistics and retail operating units.

Particularly noticeable are:
• Repeated overtime over several weeks
• Increasing sick leave in individual shifts
• Growing informal arrangements between teams to maintain service levels
• Delayed onboarding of temporary staff due to administrative bottlenecks

Several team leaders have informally communicated that they feel caught between operational expectations and workforce well-being obligations.

Recommendation:
A structured review of staffing adequacy and workload distribution should be initiated before the next peak period. The current approach of relying on individual discretion and informal flexibility is not sustainable as a permanent operating model.`},{slug:"supervisory-board-response",title:"Supervisory Board Response — Priorities & Thresholds",categoryId:t["governance-risiko-compliance"],shortDescription:"Supervisory Board Chairman's response requesting explicit thresholds, communication strategy, and strategic triage criteria.",documentType:"note",readingTime:4,sortOrder:15,isImportant:!1,isNew:!1,textSummary:`From: Jean-Marc Lef\xe8vre, Chair of the Supervisory Board
To: Michael Turner (CFO)
Date: January 18, 2026

Thank you for the outline of the proposed measures in response to the recent cashflow developments. The Supervisory Board appreciates the clarity of the analysis.

At the same time, several members remain concerned that the current approach may underestimate the speed at which external perceptions can change.

The Supervisory Board asks the Executive Board to further elaborate:

• which concrete thresholds would trigger a shift towards a more defensive stance;
• how the proposed measures will be communicated consistently to lenders, rating agencies and internal stakeholders;
• and which strategic initiatives would be reconsidered first should the stress scenario persist.

The tone of the discussion reflects not mistrust, but the heightened responsibility felt by the Supervisory Board in the current environment.`},{slug:"strategic-swot-analysis",title:"Strategic SWOT Analysis — Varexia Group",categoryId:t["unternehmen-strategie"],shortDescription:"Comprehensive SWOT analysis identifying strengths, weaknesses, opportunities, and threats across the portfolio.",documentType:"note",readingTime:5,sortOrder:16,isImportant:!1,isNew:!1,textSummary:`Varexia SE — Strategic SWOT Analysis

STRENGTHS
• Diversified revenue base across four complementary business segments with €42 bn total revenue
• Strong market positions in European retail with established brand recognition
• Energy & Infrastructure division generating attractive 11.5% EBITDA margins
• Digital Services unit achieving 16.7% margins
• Experienced management team with deep operational expertise

WEAKNESSES
• Free cash flow generation significantly below reported earnings
• Net debt/EBITDA at 3.3x with risk of covenant breach within 12–18 months
• 28% attrition rate in Digital Services key technology roles
• Lack of explicit capital allocation framework
• 40% of logistics operations remain semi-manual

OPPORTUNITIES
• Selective portfolio restructuring could unlock estimated 15–20% conglomerate discount
• Digital Services carve-out with equity participation could address talent retention
• Logistics automation investment could reduce cost per case by 15%
• Energy transition investments aligned with EU regulatory tailwinds

THREATS
• Covenant breach within 12–18 months if cash flow trajectory does not improve
• Activist investor intervention forcing reactive portfolio decisions
• Continued talent drain in Digital Services destroying unit value
• Consumer confidence deterioration compressing Retail margins`},{slug:"executive-summary-strategic-review",title:"Executive Summary — Strategic Review Context",categoryId:t["unternehmen-strategie"],shortDescription:"High-level executive summary framing the core strategic challenge: not operational failure, but strategic ambiguity.",documentType:"note",readingTime:4,sortOrder:17,isImportant:!0,isNew:!1,textSummary:`Varexia SE — Executive Summary for Strategic Review

Variexia SE is a publicly listed European conglomerate generating €42 billion in revenue across four business divisions. While operating performance remains broadly stable, the Group faces a convergence of strategic, financial, and organisational pressures.

The Core Challenge:
The core challenge is not operational failure but strategic ambiguity: the absence of explicit portfolio prioritisation, unclear capital allocation thresholds, and a governance model that manages tensions implicitly rather than resolving them.

Consequences:
• A widening gap between reported earnings and cash generation
• Growing investor scepticism (share price down 25% in 18 months)
• Internal organisational strain (survey scores averaging 2.0–2.7)
• Emerging covenant risk (net debt/EBITDA at 3.3x)

The Supervisory Board has commissioned a comprehensive strategic review to develop actionable recommendations:

1. Portfolio Coherence — Which businesses belong together, and under what conditions?
2. Financial Resilience — How to restore sustainable cash generation?
3. Leadership System Effectiveness — How to align accountability, decision authority, and incentive structures?

The new Chief Strategy Officer will be expected to lead this review and present a coherent strategic framework.`},{slug:"stress-scenario-analysis",title:"Financial Stress Scenario — Downside Analysis",categoryId:t["governance-risiko-compliance"],shortDescription:"Stress test modelling the financial impact of EBITDA compression, working capital squeeze, and CAPEX commitments.",documentType:"note",readingTime:4,sortOrder:18,isImportant:!1,isNew:!1,textSummary:`Varexia SE — Financial Stress Scenario Analysis

Scenario Assumptions:
This stress test models the impact of a moderate deterioration across key financial parameters over a 12-month horizon.

Impact Items:
• EBITDA margin compression (-50 bps across Group): -€210 million
• Working capital absorption: -€180 million
• Committed CAPEX obligations (non-deferrable): -€320 million
• Lease payment obligations (fixed): -€280 million
• Dividend commitment (current policy): -€150 million

Cumulative Cash Impact: approximately -€1.14 billion additional pressure

Implications:
• Net debt/EBITDA would exceed 3.5x under stress, likely triggering covenant discussions
• Free cash flow would remain deeply negative
• Rating agencies would likely place the Group on negative watch

Mitigating Actions Available:
• Accelerated asset disposals (€0.8–1.2 bn potential)
• CAPEX prioritisation (deferral of ~€0.6 bn non-critical items)
• Working capital programme (potential release of €0.3–0.5 bn)
• Dividend reduction or suspension

Management Assessment:
The stress scenario is not considered the base case, but the margin for error has narrowed significantly.`},{slug:"leadership-workshop-summary",title:"Executive Leadership Workshop — One-Page Summary",categoryId:t["people-kultur-kommunikation"],shortDescription:"Half-day workshop summary identifying structural tensions, implicit non-decisions, and the need for enterprise-level leadership realignment.",documentType:"note",readingTime:5,sortOrder:19,isImportant:!1,isNew:!1,textSummary:`Internal Leadership Workshop — Executive One-Page Summary
Date: January 7, 2026
Participants: Executive Board, Business Unit Heads, Regional CEOs

1. Situation Assessment
• Operating performance remains robust across business units
• Cash flow and efficiency targets are increasingly binding
• Target conflicts are managed implicitly rather than resolved explicitly

2. Key Structural Tensions
• Market responsiveness vs. efficiency and cost discipline
• Flexibility at the front line vs. system stability and standardisation
• Accountability for results vs. limited decision authority

3. Current Organisational Response
• Increased reliance on managerial discretion and informal decisions
• Sustained overtime and personal commitment in critical roles
• Selective rule-bending to protect customer and revenue outcomes

4. Emerging Risks
• Gradual erosion of leadership clarity and credibility
• Rising frustration and cynicism in experienced management layers
• Growing dependence on informal workarounds

5. Core Insight
• The challenge is neither operational nor purely financial
• It is a leadership and steering issue at enterprise level
• Non-decision has become an implicit decision with material risk
• Explicit prioritisation is required to restore system coherence`}];for(let t of e)await i.portalDocument.create({data:{assessmentId:a.id,workspaceId:d.id,slug:t.slug,title:t.title,categoryId:t.categoryId,category:"data-room",shortDescription:t.shortDescription,documentType:t.documentType,readingTime:t.readingTime,sortOrder:t.sortOrder,isImportant:t.isImportant,isNew:t.isNew,textSummary:t.textSummary,confidentialityLabel:t.confidentialityLabel||null,releaseStatus:"released",alwaysAvailable:!0,tags:[]}});console.log(`[seed] Created ${e.length} data room demo documents for Varexia case study.`)}}else console.log(`[seed] Data room categories already exist (${t}), skipping data room seed.`);let n=await i.portalDocument.findMany({where:{workspaceId:d.id,category:"data-room",objectPath:null,textSummary:{not:null}},include:{dataRoomCategory:!0}});if(n.length>0){console.log(`[seed] Generating PDFs for ${n.length} data room documents without files...`);try{let{generatePdfBuffer:e}=await a.e(3716).then(a.bind(a,73716)),{uploadToObjectStorage:t}=await a.e(6083).then(a.bind(a,76083)),r=await Promise.resolve().then(a.t.bind(a,55315,23)),s=await Promise.resolve().then(a.t.bind(a,92048,23)),o=[r.join(process.cwd(),"assets","varexia-logo.png"),r.join(__dirname,"assets","varexia-logo.png"),r.join(__dirname,"..","assets","varexia-logo.png")].find(e=>s.existsSync(e))||null,l=0;for(let a of n)try{let n=await e({title:a.title,shortDescription:a.shortDescription,textSummary:a.textSummary,documentType:a.documentType,confidentialityLabel:a.confidentialityLabel,categoryLabel:a.dataRoomCategory?.label||null,categoryColor:a.dataRoomCategory?.color||null},o),r=`.private/portal/${a.assessmentId}/dataroom_${a.slug}.pdf`;await t(r,n,"application/pdf"),await i.portalDocument.update({where:{id:a.id},data:{objectPath:r,fileName:`${a.slug}.pdf`,fileSize:n.length,mimeType:"application/pdf",downloadAllowed:!0}}),l++,console.log(`[seed] PDF: "${a.title}" (${(n.length/1024).toFixed(0)} KB)`)}catch(e){console.error(`[seed] PDF failed for "${a.title}":`,e)}console.log(`[seed] PDF generation complete: ${l}/${n.length} succeeded.`)}catch(e){console.error("[seed] PDF generation skipped (module load error):",e)}}}}catch(e){console.error("[seed] Auto-seed error:",e)}finally{await i.$disconnect()}}}a.r(t),a.d(t,{register:()=>i})}};var t=require("./webpack-runtime.js");t.C(e);var a=t(t.s=17872);module.exports=a})();