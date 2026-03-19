"use strict";(()=>{var e={};e.id=5885,e.ids=[5885],e.modules={53524:e=>{e.exports=require("@prisma/client")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},44565:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>b,patchFetch:()=>x,requestAsyncStorage:()=>f,routeModule:()=>p,serverHooks:()=>S,staticGenerationAsyncStorage:()=>k});var i={};n.r(i),n.d(i,{POST:()=>h});var r=n(49303),a=n(88716),s=n(60670),o=n(87070),l=n(9487),u=n(70446),c=n(28309),d=n(52325);let m=`Du bist ein kreativer Experte f\xfcr Executive Assessment Center und erstellst au\xdfergew\xf6hnlich realistische, detaillierte und phantasievolle Fallstudien f\xfcr die F\xfchrungskr\xe4ftediagnostik.

Erstelle eine vollst\xe4ndige Fallstudie im folgenden JSON-Format. Die Fallstudie muss kreativ, plausibel, komplex und f\xfcr Executive Assessments geeignet sein.

Das JSON muss EXAKT diese Struktur haben:

{
  "data": {
    "id": "<eindeutige-id>",
    "name": "<Unternehmensname>",
    "description": "<Kurzbeschreibung des Unternehmens>",
    "metrics": [
      { "label": "<KPI-Name>", "value": "<Wert mit Einheit>", "trend": "<up|down|stable|down-significant>" }
    ],
    "businessUnits": [
      {
        "id": "<id>",
        "name": "<Name der Gesch\xe4ftseinheit>",
        "revenue": <Umsatz in Mrd>,
        "ebitda": <EBITDA in Mrd>,
        "margin": <Marge in %>,
        "employees": <Mitarbeiterzahl>,
        "tension": "<Kernspannung/Dilemma>",
        "kpis": ["<KPI1>", "<KPI2>", "<KPI3>"],
        "financials": { "revenue": <>, "ebitda": <>, "margin": <>, "employees": <> },
        "yoy": { "revenue": <Vorjahr>, "ebitda": <Vorjahr>, "deltaRevenue": <Differenz>, "deltaEbitda": <Differenz> }
      }
    ],
    "emails": [
      {
        "id": "<id>",
        "from": "<Name, Rolle>",
        "to": "<Empf\xe4nger Name, Rolle>",
        "subject": "<Betreff>",
        "date": "<Datum>",
        "read": <true|false>,
        "important": <true|false>,
        "category": "<internal|external>",
        "content": "<VOLLST\xc4NDIGE E-Mail mit Anrede, Hauptteil, Gru\xdfformel und Signatur>"
      }
    ],
    "protocols": [
      {
        "id": "<id>",
        "title": "<Titel des Protokolls>",
        "date": "<Datum>",
        "location": "<Ort>",
        "participants": "<Teilnehmer>",
        "content": "<Vollst\xe4ndiger Protokolltext>"
      }
    ],
    "newsArticles": [
      {
        "id": "<id>",
        "headline": "<\xdcberschrift>",
        "subtitle": "<Untertitel>",
        "source": "<Medienquelle>",
        "date": "<Datum>",
        "content": "<Vollst\xe4ndiger Artikeltext>"
      }
    ],
    "detailedBalanceSheet": {
      "assets": {
        "nonCurrent": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "current": [{ "item": "<Position>", "value": <Wert in Mio> }]
      },
      "equityLiabilities": {
        "equity": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "nonCurrentLiabilities": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "currentLiabilities": [{ "item": "<Position>", "value": <Wert in Mio> }]
      }
    },
    "balanceSheet": [
      { "name": "<Kategorie>", "value": <Wert in Mrd>, "type": "<asset|liability>" }
    ],
    "organigramm": [
      { "name": "<Name>", "role": "<Funktion/Position>", "department": "<Abteilung/Bereich>", "reportsTo": "<Name des Vorgesetzten oder null>" }
    ],
    "strategicAnalysis": {
      "executiveSummary": "<Zusammenfassende strategische Bewertung der Ausgangslage, 3-4 S\xe4tze>",
      "swot": {
        "strengths": ["<St\xe4rke 1>", "<St\xe4rke 2>", "<St\xe4rke 3>", "<St\xe4rke 4>"],
        "weaknesses": ["<Schw\xe4che 1>", "<Schw\xe4che 2>", "<Schw\xe4che 3>", "<Schw\xe4che 4>"],
        "opportunities": ["<Chance 1>", "<Chance 2>", "<Chance 3>"],
        "threats": ["<Risiko 1>", "<Risiko 2>", "<Risiko 3>"]
      },
      "solutionApproaches": {
        "strategic": [
          { "title": "<Strategischer Ansatz 1>", "description": "<Beschreibung>" },
          { "title": "<Strategischer Ansatz 2>", "description": "<Beschreibung>" }
        ],
        "bscPerspectives": {
          "financial": ["<Finanzma\xdfnahme 1>", "<Finanzma\xdfnahme 2>"],
          "customer": ["<Kundenma\xdfnahme 1>", "<Kundenma\xdfnahme 2>"],
          "processes": ["<Prozessma\xdfnahme 1>", "<Prozessma\xdfnahme 2>"],
          "learningGrowth": ["<Lern-/Entwicklungsma\xdfnahme 1>", "<Lern-/Entwicklungsma\xdfnahme 2>"]
        },
        "quickwins": [
          { "title": "<Quickwin 1>", "impact": "<hoch|mittel|niedrig>", "effort": "<gering|mittel|hoch>" },
          { "title": "<Quickwin 2>", "impact": "<hoch|mittel|niedrig>", "effort": "<gering|mittel|hoch>" }
        ]
      }
    }
  },
  "briefing": {
    "role": "<Rollenbeschreibung des Kandidaten im konkreten Unternehmenskontext>",
    "situation": "<Situationsbeschreibung spezifisch f\xfcr dieses Unternehmen>",
    "tasks": ["<Aufgabe 1>", "<Aufgabe 2>", "<Aufgabe 3>", "<Aufgabe 4>"],
    "analysisQuestions": ["<Frage 1>", "<Frage 2>", "<Frage 3>", "<Frage 4>"],
    "conclusionQuestions": ["<Frage 1>", "<Frage 2>", "<Frage 3>", "<Frage 4>"],
    "timeMinutes": <Bearbeitungszeit>,
    "presentationMinutes": 15
  },
  "questions": {
    "analysis": ["<Analysefrage 1>", "<Analysefrage 2>", "<Analysefrage 3>", "<Analysefrage 4>"],
    "conclusions": ["<Schlussfolgerungsfrage 1>", "<Schlussfolgerungsfrage 2>", "<Schlussfolgerungsfrage 3>", "<Schlussfolgerungsfrage 4>"]
  }
}

KREATIVIT\xc4T & PHANTASIE:
- Erfinde originelle, aber plausible Unternehmensszenarien mit lebendigen Details
- Jede Person soll einen eigenen Kommunikationsstil haben (formell vs. direkt, diplomatisch vs. konfrontativ)
- Baue subtile Spannungen, versteckte Agenden und politische Dynamiken ein
- Verwende kreative, aber realistische Firmennamen und Markennamen
- Erz\xe4hle eine zusammenh\xe4ngende Geschichte durch die verschiedenen Dokumente

E-MAIL-FORMATIERUNG (KRITISCH WICHTIG):
Jede E-Mail MUSS wie eine echte gesch\xe4ftliche E-Mail aussehen:
1. Anrede: z.B. "Dear Dr. Schmidt," oder "Lieber Herr M\xfcller," oder "Hi Team,"
2. Hauptteil: Strukturierter Inhalt mit Abs\xe4tzen, ggf. Aufz\xe4hlungen oder einger\xfcckten Abschnitten, konkreten Zahlen und Fakten
3. Gru\xdfformel: z.B. "Best regards," oder "Mit freundlichen Gr\xfc\xdfen,"
4. SIGNATUR-BLOCK (PFLICHT): Jede E-Mail MUSS eine professionelle Signatur enthalten:
   - Vollst\xe4ndiger Name
   - Position/Funktion
   - Abteilung/Bereich
   - E-Mail-Adresse (fiktiv aber plausibel, z.B. m.schmidt@firmenname.com)
   - Telefonnummer (fiktiv, z.B. +49 69 1234-5678)
   - Optional: Firmen-Disclaimer ("Diese E-Mail ist vertraulich...")

Jede E-Mail MUSS das Feld "category" enthalten: "internal" f\xfcr firmeninterne Kommunikation, "external" f\xfcr externe Kommunikation (Kunden, Lieferanten, Berater, Presse).
Jede E-Mail MUSS das Feld "to" enthalten mit dem Empf\xe4nger.

ANPASSUNG AN UNTERNEHMENSGR\xd6SSE UND LEVEL:
- Gro\xdfkonzern (>10.000 MA): Vorstand, Aufsichtsrat, Betriebsrat, komplexe Matrix-Organisation, mehrere Gesch\xe4ftseinheiten, internationale Dimension
- Mittelstand (1.000-10.000 MA): Gesch\xe4ftsf\xfchrung statt Vorstand, ggf. Beirat statt Aufsichtsrat, Betriebsrat m\xf6glich aber nicht zwingend, flachere Hierarchien
- KMU (100-1.000 MA): Gesch\xe4ftsf\xfchrer/Inhaber, KEIN Vorstand, KEIN Aufsichtsrat, Betriebsrat nur wenn > 200 MA, weniger formelle Strukturen, pers\xf6nlichere Kommunikation
- Startup/Scale-up (<100 MA): Gr\xfcnder/CEO, KEIN Vorstand, KEIN Aufsichtsrat, KEIN Betriebsrat, flache Hierarchien, informelle Kommunikation, Du-Kultur m\xf6glich, agile Strukturen

Die Sprache und der Ton der E-Mails m\xfcssen zum Unternehmenstyp passen:
- Konzern: Formell, politisch korrekt, oft diplomatisch umschrieben
- Mittelstand: Professionell aber direkter, weniger B\xfcrokratie
- KMU: Direkt, pers\xf6nlich, pragmatisch
- Startup: Informell, schnell, manchmal emotional, oft englische Begriffe gemischt

Wichtige Regeln:
- Gesch\xe4ftseinheiten: Gro\xdfkonzern 3-5, Mittelstand 2-4, KMU 1-3, Startup 1-2
- Erstelle die EXAKTE Anzahl an E-Mails, Protokollen und Nachrichtenartikeln, die der Benutzer angibt. Wenn 30 Vorg\xe4nge gew\xfcnscht sind, erstelle MINDESTENS 30 Dokumente!
- Detaillierte Bilanz mit mindestens 8-10 Positionen pro Kategorie
- Spannungsfelder und Dilemmata zwischen den Gesch\xe4ftseinheiten
- Realistische Finanzkennzahlen die zueinander passen (Ums\xe4tze in Mrd bei Konzernen, in Mio bei KMU/Startup)
- 4 Analysefragen und 4 Schlussfolgerungsfragen
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10 bei Konzernen, 5-8 bei KMU), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Eine detaillierte strategische Analyse (SWOT, BSC-Perspektiven, Quickwins) basierend auf dem Fallstudien-Szenario
- Die Sprache aller Inhalte richtet sich nach der vom Benutzer gew\xe4hlten Sprache
- Antworte AUSSCHLIESSLICH mit validem JSON, kein zus\xe4tzlicher Text

Wenn ein Referenzdatum (Stichtag) angegeben ist, M\xdcSSEN alle Datumsangaben, Gesch\xe4ftsjahre, E-Mail-Daten und Finanzkennzahlen konsistent zu diesem Stichtag sein. Das Referenzdatum ist der "heutige Tag" in der Fallstudie. Alle E-Mails sollten Daten innerhalb der letzten 1-3 Monate vor dem Stichtag haben. Finanzberichte sollten das Gesch\xe4ftsjahr vor dem Stichtag abdecken.`,g=`Du bist ein Experte f\xfcr Executive Assessment Center. Dir wird der Textinhalt eines hochgeladenen Dokuments gegeben, das eine Fallstudie f\xfcr ein Assessment Center enth\xe4lt.

Analysiere den Text und extrahiere/transformiere ihn in das standardisierte Fallstudien-Format. Wenn Informationen fehlen, erg\xe4nze sie intelligent und realistisch basierend auf dem Kontext.

${m.split("Wichtige Regeln:")[0]}

Wichtige Regeln:
- Behalte alle vorhandenen Informationen aus dem Originaldokument bei
- Erg\xe4nze fehlende Felder intelligent (z.B. Bilanzdaten wenn nur Umsatz gegeben)
- Erstelle realistische E-Mails basierend auf den im Dokument beschriebenen Szenarien, jede E-Mail mit vollst\xe4ndiger Anrede, Hauptteil, Gru\xdfformel und Signaturblock (Name, Funktion, E-Mail, Telefon)
- Jede E-Mail MUSS die Felder "category" ("internal" oder "external") und "to" enthalten
- Passe Finanzdaten an, wenn sie unvollst\xe4ndig sind
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Antworte AUSSCHLIESSLICH mit validem JSON`;async function h(e,{params:t}){let n=(0,u.cw)(),i=(0,u.vz)();if(!i&&(!n||n.workspaceSlug!==t.workspaceSlug))return o.NextResponse.json({error:"Unauthorized"},{status:401});if(n&&!i&&!(0,c.Fs)(n.roles,"exerciselibrary.manage"))return o.NextResponse.json({error:"Forbidden"},{status:403});if((0,d.C6)("case_study_generation")){let e=(0,d._f)("case_study_generation");return o.NextResponse.json(e.body,{status:e.status})}let r=await l._.workspace.findUnique({where:{slug:t.workspaceSlug}});if(!r)return o.NextResponse.json({error:"Workspace not found"},{status:404});try{let{mode:i,params:a,isOverarchingScenario:s}=await e.json();if("generate"===i){let{industry:e,companySize:i,strategicSituation:u,financialScenario:c,keyTensions:g,targetLevel:h,difficulty:p,language:f,referenceDate:k,documentPlan:S,candidateTime:b,documentCount:x}=a||{};if(!e||!u)return o.NextResponse.json({error:"Branche und strategische Situation sind erforderlich"},{status:400});let A="";if(S&&Array.isArray(S.documents)){let e=S.documents.filter(e=>!1!==e.selected),t=e.filter(e=>"email"===e.category),n=e.filter(e=>"protocol"===e.category),i=e.filter(e=>"news"===e.category),r=e.filter(e=>!["email","protocol","news"].includes(e.category));A=`

Der Benutzer hat folgende Dokumente ausgew\xe4hlt. Erstelle die Fallstudie mit GENAU diesen Dokumenten:
Unternehmensname: ${S.companyName||"Bitte w\xe4hlen"}
${t.length>0?`
E-Mails (${t.length}):
${t.map(e=>`- "${e.title}" von ${e.author}: ${e.description}`).join("\n")}`:""}
${n.length>0?`
Protokolle (${n.length}):
${n.map(e=>`- "${e.title}" von ${e.author}: ${e.description}`).join("\n")}`:""}
${i.length>0?`
Nachrichtenartikel (${i.length}):
${i.map(e=>`- "${e.title}": ${e.description}`).join("\n")}`:""}
${r.length>0?`
Weitere Dokumente (${r.length}):
${r.map(e=>`- [${e.category}] "${e.title}": ${e.description}`).join("\n")}`:""}`}let E=`Erstelle eine Fallstudie mit folgenden Parametern:

Branche: ${e}
Unternehmensgr\xf6\xdfe: ${i||"Gro\xdfkonzern"}
Strategische Situation: ${u}
Finanzielles Szenario: ${c||"Herausfordernd"}
Kernspannungen: ${g||"Nicht spezifiziert"}
Zielgruppe/Level: ${h||"SE-Level/Vorstand"}
Schwierigkeitsgrad: ${p||"Hoch"}
Sprache der Inhalte: ${f||"Englisch"}
Bearbeitungszeit f\xfcr den Kandidaten: ${b||60} Minuten
Anzahl der zu erstellenden Vorg\xe4nge: ${x||15} (E-Mails, Protokolle, Nachrichtenartikel, etc. zusammen)${k?`
Referenzdatum (Stichtag): ${k}`:""}${A}`,w=`/api/w/${t.workspaceSlug}/case-studies/generate`,y=await (0,d.LP)({taskName:"generate_case_study",featureName:"case_study_generation",input:E,route:w,options:{systemPrompt:m,responseFormat:"json",maxTokens:16384}});if("aiDisabled"in y){let e=(0,d._f)("case_study_generation");return o.NextResponse.json(e.body,{status:e.status})}let N=y.data;if((()=>{let e=N.data||N,t=parseInt(x)||15;return(e.emails?.length||0)+(e.protocols?.length||0)+(e.newsArticles?.length||0)<.7*t||!e.organigramm?.length||!N.briefing&&!e.briefing||!N.questions||!e.detailedBalanceSheet})()){console.log("First response may be incomplete, requesting continuation with missing sections...");try{let e=N.data||N,t=(e.emails||[]).map(e=>e.id||e.subject).filter(Boolean),n=(e.protocols||[]).map(e=>e.id||e.title).filter(Boolean),i=(e.newsArticles||[]).map(e=>e.id||e.headline).filter(Boolean),r=`Bereits vorhanden: ${e.emails?.length||0} E-Mails (IDs: ${t.join(", ")}), ${e.protocols?.length||0} Protokolle (IDs: ${n.join(", ")}), ${e.newsArticles?.length||0} Nachrichtenartikel (IDs: ${i.join(", ")}), organigramm: ${e.organigramm?.length?"ja":"nein"}, briefing: ${N.briefing||e.briefing?"ja":"nein"}, questions: ${N.questions?"ja":"nein"}, detailedBalanceSheet: ${e.detailedBalanceSheet?"ja":"nein"}`,a=parseInt(x)||15,s=Math.max(0,Math.round(.7*a)-(e.emails?.length||0)),o=Math.max(0,Math.round(.15*a)-(e.protocols?.length||0)),l=Math.max(0,Math.round(.15*a)-(e.newsArticles?.length||0)),u=`${r}

Erstelle ein JSON-Objekt mit den FEHLENDEN Abschnitten:
- ${s} weitere E-Mails (NICHT diese IDs wiederholen: ${t.join(", ")})
- ${o} weitere Protokolle
- ${l} weitere Nachrichtenartikel
${e.organigramm?.length?"":"- organigramm (mindestens 8 Personen)"}
${N.briefing||e.briefing?"":"- briefing"}
${N.questions?"":"- questions"}
${e.detailedBalanceSheet?"":"- detailedBalanceSheet"}

Antworte NUR mit validem JSON.`,c=await (0,d.LP)({taskName:"continue_generation",featureName:"case_study_generation",input:`${E}

${u}`,route:w,options:{systemPrompt:m,responseFormat:"json",maxTokens:16384}});if(!("aiDisabled"in c)){let t=c.data,n=t.data||t,i=(e,t)=>{let n=new Set(e.map(e=>e.id)),i=new Set(e.map(e=>e.subject||e.title||e.headline));return t.filter(e=>!n.has(e.id)&&!i.has(e.subject||e.title||e.headline))};n.emails?.length&&(e.emails=[...e.emails||[],...i(e.emails||[],n.emails)]),n.protocols?.length&&(e.protocols=[...e.protocols||[],...i(e.protocols||[],n.protocols)]),n.newsArticles?.length&&(e.newsArticles=[...e.newsArticles||[],...i(e.newsArticles||[],n.newsArticles)]),n.organigramm?.length&&!e.organigramm?.length&&(e.organigramm=n.organigramm),n.detailedBalanceSheet&&!e.detailedBalanceSheet&&(e.detailedBalanceSheet=n.detailedBalanceSheet),n.balanceSheet?.length&&!e.balanceSheet?.length&&(e.balanceSheet=n.balanceSheet),n.businessUnits?.length&&!e.businessUnits?.length&&(e.businessUnits=n.businessUnits),n.metrics?.length&&!e.metrics?.length&&(e.metrics=n.metrics),(t.briefing||n.briefing)&&!N.briefing&&!e.briefing&&(N.briefing=t.briefing||n.briefing),t.questions&&!N.questions&&(N.questions=t.questions),console.log(`Merged continuation: total emails=${e.emails?.length}, protocols=${e.protocols?.length}, news=${e.newsArticles?.length}`)}}catch(e){console.log("Continuation merge failed, using available content:",e)}}let I=N.data||N;N.briefing&&!I.briefing&&(I.briefing=N.briefing),N.organigramm&&!I.organigramm&&(I.organigramm=N.organigramm);let v=N.questions||null,_=I.name||`${e}-Unternehmen`,M=await l._.caseStudy.create({data:{workspaceId:r.id,title:`Fallstudie: ${_}`,subtitle:u,companyName:_,description:I.description||u,type:u.toLowerCase().includes("turnaround")?"turnaround":"strategy",difficulty:p||"high",dataJson:I,questionsJson:v,sourceType:"ai_generated",aiGenerated:!0,status:"draft",referenceDate:k||null,isOverarchingScenario:!0===s,createdById:n?.userId||null}});return o.NextResponse.json(M,{status:201})}if("upload_parse"===i){let{textContent:e,fileName:i}=a||{};if(!e)return o.NextResponse.json({error:"Textinhalt ist erforderlich"},{status:400});let u=await (0,d.LP)({taskName:"parse_uploaded_case_study",featureName:"case_study_generation",input:`Dokument: ${i||"Fallstudie"}

Inhalt:
${e}`,route:`/api/w/${t.workspaceSlug}/case-studies/generate`,options:{systemPrompt:g,responseFormat:"json",maxTokens:16384}});if("aiDisabled"in u){let e=(0,d._f)("case_study_generation");return o.NextResponse.json(e.body,{status:e.status})}let c=u.data,m=c.data||c;c.briefing&&!m.briefing&&(m.briefing=c.briefing),c.organigramm&&!m.organigramm&&(m.organigramm=c.organigramm);let h=c.questions||null,p=m.name||"Unbekanntes Unternehmen",f=await l._.caseStudy.create({data:{workspaceId:r.id,title:`Fallstudie: ${p}`,subtitle:i||null,companyName:p,description:m.description||null,type:"strategy",difficulty:"high",dataJson:m,questionsJson:h,sourceType:"upload",sourceFileName:i||null,aiGenerated:!0,status:"draft",isOverarchingScenario:!0===s,createdById:n?.userId||null}});return o.NextResponse.json(f,{status:201})}return o.NextResponse.json({error:"Ung\xfcltiger Modus. Verwende 'generate' oder 'upload_parse'"},{status:400})}catch(e){return console.error("Error generating case study:",e),o.NextResponse.json({error:"Fehler bei der KI-Generierung"},{status:500})}}let p=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/w/[workspaceSlug]/case-studies/generate/route",pathname:"/api/w/[workspaceSlug]/case-studies/generate",filename:"route",bundlePath:"app/api/w/[workspaceSlug]/case-studies/generate/route"},resolvedPagePath:"/home/runner/workspace/app/api/w/[workspaceSlug]/case-studies/generate/route.ts",nextConfigOutput:"standalone",userland:i}),{requestAsyncStorage:f,staticGenerationAsyncStorage:k,serverHooks:S}=p,b="/api/w/[workspaceSlug]/case-studies/generate/route";function x(){return(0,s.patchFetch)({serverHooks:S,staticGenerationAsyncStorage:k})}},9487:(e,t,n)=>{n.d(t,{_:()=>r});var i=n(53524);let r=globalThis.prisma??new i.PrismaClient},28309:(e,t,n)=>{n.d(t,{Fs:()=>l,_N:()=>u});let i=["workspace.manage","users.create","users.read","users.update","users.delete","users.import","assessments.create","assessments.read","assessments.update","assessments.delete","assessments.assign_candidates","candidates.create","candidates.read","candidates.update","reports.read","reports.create","competencies.manage","requirements.manage","audit.read","theme.manage","exerciselibrary.upload","exerciselibrary.manage","brandrules.manage","requirements.match_exercises","advanced_intelligence.view","advanced_intelligence.generate","advanced_intelligence.export"],r=["assessments.read","assessments.update","candidates.create","candidates.read","candidates.update","users.read","exerciselibrary.upload","exerciselibrary.manage"],a=["assessments.read","candidates.read","reports.read","advanced_intelligence.view"],s={MASTER_ADMIN:[...i,"cross_workspace.access"],WORKSPACE_ADMIN:i,ADMIN:i,MODERATOR:["assessments.create","assessments.read","assessments.update","assessments.assign_candidates","candidates.create","candidates.read","candidates.update","reports.read","reports.create","requirements.manage","users.read","exerciselibrary.manage","requirements.match_exercises","advanced_intelligence.view","advanced_intelligence.generate"],OBSERVER:["assessments.read","candidates.read","reports.read"],PROJECT_OFFICE:r,PROJECT_ASSISTANT:r,CLIENT:a,HR_CLIENT:a,CANDIDATE:["candidate.own_assessment"]};function o(e){let t=new Set;for(let n of e){let e=s[n];if(e)for(let n of e)t.add(n)}return t}function l(e,t){return o(e).has(t)}function u(e,t){let n=o(e);return t.some(e=>n.has(e))}["MASTER_ADMIN","WORKSPACE_ADMIN","ADMIN","MODERATOR","OBSERVER","PROJECT_OFFICE","PROJECT_ASSISTANT","CLIENT","HR_CLIENT","CANDIDATE"].filter(e=>"CANDIDATE"!==e),["MASTER_ADMIN","WORKSPACE_ADMIN","MODERATOR","OBSERVER","PROJECT_OFFICE","CLIENT","CANDIDATE"].filter(e=>"CANDIDATE"!==e)},70446:(e,t,n)=>{n.d(t,{ER:()=>u,FY:()=>h,P:()=>m,Sm:()=>p,Ub:()=>d,aU:()=>g,cw:()=>f,dX:()=>k,vz:()=>c});var i=n(71615);let r="edp_master_auth",a="edp_workspace_auth",s="edp_user_session",o="authenticated",l="true"===process.env.DEV_BYPASS_AUTH&&!1;function u(){(0,i.cookies)().set(r,o,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function c(){return!!l||i.cookies().get(r)?.value===o}function d(){(0,i.cookies)().delete(r)}function m(e){(0,i.cookies)().set(a,e,{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function g(){return l?"main":i.cookies().get(a)?.value??null}function h(){(0,i.cookies)().delete(a)}function p(e){(0,i.cookies)().set(s,JSON.stringify(e),{httpOnly:!0,sameSite:"lax",path:"/",maxAge:14400})}function f(){let e=i.cookies().get(s)?.value;if(e)try{return JSON.parse(e)}catch{return null}return l?{userId:"dev-bypass-user",workspaceSlug:"main",roles:["ADMIN"]}:null}function k(){(0,i.cookies)().delete(s)}},52325:(e,t,n)=>{n.d(t,{_f:()=>u,LP:()=>g,C6:()=>o,KR:()=>h});var i=n(30088);class r{constructor(){this.key="openai",this.name="OpenAI",this.region="US/Global",this.client=new i.ZP({apiKey:process.env.AI_INTEGRATIONS_OPENAI_API_KEY,baseURL:process.env.AI_INTEGRATIONS_OPENAI_BASE_URL})}isAvailable(){return!!process.env.AI_INTEGRATIONS_OPENAI_API_KEY}getClient(){return this.client}async chat(e){let t=e.options?.model||"gpt-4o",n=[];e.options?.systemPrompt&&n.push({role:"system",content:e.options.systemPrompt}),n.push({role:"user",content:e.input});let i=await this.client.chat.completions.create({model:t,messages:n,temperature:e.options?.temperature??.7,max_tokens:e.options?.maxTokens??4096});return{data:i.choices[0].message.content,provider:this.key,model:t,usage:i.usage?{promptTokens:i.usage.prompt_tokens,completionTokens:i.usage.completion_tokens,totalTokens:i.usage.total_tokens}:void 0}}async generateStructured(e){let t;let n=e.options?.model||"gpt-4o",i=`Du bist ein Experte f\xfcr Executive Assessment Center und Kompetenzdiagnostik.
Antworte ausschlie\xdflich im angegebenen JSON-Schema-Format.
${e.options?.context?`
Kontext: ${JSON.stringify(e.options.context)}`:""}`,r=e.schema?`${e.input}

Antworte im folgenden JSON-Schema:
${JSON.stringify(e.schema,null,2)}`:e.input,a=await this.client.chat.completions.create({model:n,messages:[{role:"system",content:e.options?.systemPrompt||i},{role:"user",content:r}],temperature:e.options?.temperature??.5,max_tokens:e.options?.maxTokens??8192,response_format:{type:"json_object"}}),s=a.choices[0];try{t=JSON.parse(s.message.content||"{}")}catch{t=s.message.content}return{data:t,provider:this.key,model:n,usage:a.usage?{promptTokens:a.usage.prompt_tokens,completionTokens:a.usage.completion_tokens,totalTokens:a.usage.total_tokens}:void 0}}async transcribeAudio(e,t,n){let i=new File([e],t,{type:"audio/wav"});return(await this.client.audio.transcriptions.create({file:i,model:n||"gpt-4o-mini-transcribe",response_format:"json"})).text}}class a{isAvailable(){return!1}async chat(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="neuland",this.name="Neuland AI",this.region="EU (DSGVO)"}}class s{isAvailable(){return!1}async chat(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}async generateStructured(e){throw Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.")}constructor(){this.key="azure_eu",this.name="Azure OpenAI EU",this.region="EU (Azure)"}}function o(e){return"true"===process.env.AI_DISABLED||(process.env.AI_FEATURES_DISABLED||"").split(",").map(e=>e.trim()).filter(Boolean).includes(e)}function l(e){return{aiDisabled:!0,content:null}}function u(e){return{status:503,body:{error:"AI temporarily disabled",feature:e}}}let c={openai:new r,neuland:new a,azure_eu:new s};function d(){let e=process.env.ACTIVE_LLM_PROVIDER||"openai",t=c[e];if(!t)return console.warn(`[LLM] Unknown provider "${e}", falling back to openai`),c.openai;if(!t.isAvailable()){console.warn(`[LLM] Provider "${e}" is not available, falling back to openai`);let t=c.openai;if(!t.isAvailable())throw Error("No LLM provider is available. Check AI_INTEGRATIONS_OPENAI_API_KEY.");return t}return t}function m(e,t,n,i,r,a,s){let o={timestamp:new Date().toISOString(),provider:e,feature:t,task:n,route:i,durationMs:r,success:a,...s?{error:s}:{}};return a?console.log(`[LLM] ✓ ${e}/${t} (${n}) [${i}] ${r}ms`):console.error(`[LLM] ✗ ${e}/${t} (${n}) [${i}] ${r}ms — ${s}`),o}async function g(e){let{taskName:t,featureName:n,route:i="unknown"}=e;if(o(n))return console.log(`[LLM] BLOCKED: ${n} (${t}) [${i}] — AI disabled`),l(n);let r=d(),a=Date.now();try{let s;return s=e.schema||e.options?.responseFormat==="json"?await r.generateStructured(e):await r.chat(e),m(r.key,n,t,i,Date.now()-a,!0),s}catch(o){let e=Date.now()-a,s=o instanceof Error?o.message:String(o);throw m(r.key,n,t,i,e,!1,s),o}}async function h(e,t,n){let i=n?.featureName||"audio_transcription",r=n?.route||"unknown";if(o(i))return console.log(`[LLM] BLOCKED: ${i} (transcribe) [${r}] — AI disabled`),l(i);let a=d();if("openai"!==a.key)throw Error("Audio transcription is only supported by the OpenAI provider.");let s=Date.now();try{let o=await a.transcribeAudio(e,t,n?.model);return m(a.key,i,"transcribe",r,Date.now()-s,!0),o}catch(n){let e=Date.now()-s,t=n instanceof Error?n.message:String(n);throw m(a.key,i,"transcribe",r,e,!1,t),n}}}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),i=t.X(0,[9276,1615,5972,88],()=>n(44565));module.exports=i})();