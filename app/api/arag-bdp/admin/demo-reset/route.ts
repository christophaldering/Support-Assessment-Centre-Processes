import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ENV = "demo";

export async function POST() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  await deleteDemo();
  const result = await seedDemo();
  return NextResponse.json({ success: true, ...result });
}

async function deleteDemo() {
  await prisma.bdpTieBreak.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpIndividualNote.deleteMany({ where: { environment: ENV } });
  await prisma.bdpSponsorFlag.deleteMany({ where: { environment: ENV } });
  await prisma.bdpScore.deleteMany({ where: { environment: ENV } });
  await prisma.bdpObserverAssignment.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpSessionTeam.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpTeamParticipant.deleteMany({ where: { team: { environment: ENV } } });
  await prisma.bdpSession.deleteMany({ where: { environment: ENV } });
  await prisma.bdpTeam.deleteMany({ where: { environment: ENV } });
  await prisma.bdpParticipant.deleteMany({ where: { environment: ENV } });
  await prisma.bdpNotification.deleteMany({ where: { environment: ENV } });
  await prisma.bdpUser.deleteMany({ where: { environment: ENV } });
  const demoEntities = await prisma.bdpNameMapping.findMany();
  const demoIds = demoEntities.filter(e => e.entityType.startsWith("demo_") || e.realName.includes("@arag-demo.eu") || e.realName.includes("@participants-demo.eu") || e.realName.includes("@demo.de")).map(e => e.id);
  if (demoIds.length > 0) {
    await prisma.bdpNameMapping.deleteMany({ where: { id: { in: demoIds } } });
  }
}

async function seedDemo() {
  let criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  if (criteria.length === 0) {
    const critNames = [
      "Strategische Kohärenz",
      "Ökonomische Stringenz & Business-Logik",
      "Umsetzungsfähigkeit & Operationalisierung",
      "Kollektive Führungsfähigkeit",
      "Souveränität im Defense / Q&A",
    ];
    for (let i = 0; i < critNames.length; i++) {
      await prisma.bdpCriterion.create({
        data: { id: randomUUID(), name: critNames[i], sortOrder: i, active: true },
      });
    }
    criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  }

  const observerDefs = [
    { code: "D-V1", role: "BOARD", displayName: "Marie Curie (V1)", realName: "Marie Curie", email: "curie@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V2", role: "BOARD", displayName: "Alan Turing (V2)", realName: "Alan Turing", email: "turing@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V3", role: "BOARD", displayName: "Hannah Arendt (V3)", realName: "Hannah Arendt", email: "arendt@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V4", role: "BOARD", displayName: "Ada Lovelace (V4)", realName: "Ada Lovelace", email: "lovelace@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V5", role: "BOARD", displayName: "Nikola Tesla (V5)", realName: "Nikola Tesla", email: "tesla@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V6", role: "BOARD", displayName: "Simone de Beauvoir (V6)", realName: "Simone de Beauvoir", email: "beauvoir@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-MD1", role: "MANAGEMENT_DIAGNOSTICS", displayName: "Virginia Woolf (MD1)", realName: "Virginia Woolf", email: "woolf@arag-demo.eu", isAdmin: true, pw: "Demo", demoLock: false },
    { code: "D-E1", role: "EXPERT", displayName: "Peter Drucker (E1)", realName: "Peter Drucker", email: "drucker@arag-demo.eu", isAdmin: false, pw: "Demo", demoLock: false },
    { code: "D-V7", role: "BOARD", displayName: "Marcus Aurelius (V7)", realName: "Marcus Aurelius", email: "aurelius@demo.de", isAdmin: false, pw: "aurelius", demoLock: true },
  ];

  const users: Record<string, any> = {};
  for (const def of observerDefs) {
    const u = await prisma.bdpUser.create({
      data: {
        id: randomUUID(),
        code: def.code,
        role: def.role,
        displayName: def.displayName,
        isAdmin: def.isAdmin,
        environment: ENV,
        demoLock: def.demoLock,
        username: def.code,
        passwordHash: def.pw,
      },
    });
    users[def.code] = u;
    await prisma.bdpNameMapping.create({ data: { entityType: "observer", entityId: u.id, realName: def.realName } });
    await prisma.bdpNameMapping.create({ data: { entityType: "email", entityId: u.id, realName: def.email } });
  }

  const teamDefs = [
    { code: "D-Team1", displayName: "Amsterdam", city: "Amsterdam" },
    { code: "D-Team2", displayName: "Barcelona", city: "Barcelona" },
    { code: "D-Team3", displayName: "Berlin", city: "Berlin" },
    { code: "D-Team4", displayName: "Kopenhagen", city: "Kopenhagen" },
    { code: "D-Team5", displayName: "Mailand", city: "Mailand" },
    { code: "D-Team6", displayName: "Paris", city: "Paris" },
  ];

  const teamFeedback: Record<number, string> = {
    0: "Das Team Amsterdam überzeugte durch strategische Klarheit und eine strukturierte Herangehensweise. Die Präsentation war prägnant, das Q&A solide – wenngleich Elizabeth Bennet gelegentlich so wirkte, als würde sie den Raum nach einem würdigen Mr. Darcy abscannen statt nach Gegenargumenten.",
    2: "Das Team Berlin überzeugte durch strategische Stringenz. Die Präsentation war präzise, wenngleich im Q&A ein Moment entstand, in dem selbst Sherlock Holmes kurz nach der Logik suchte. Die Zahlenlogik war durchgängig belastbar, die Teamdynamik produktiv.",
    4: "Team Mailand lieferte eine solide Gesamtleistung mit guter Rollenverteilung. Odysseus führte mit ruhiger Hand durch unbekannte Gewässer – ein Ansatz, der an seine legendären Irrfahrten erinnerte, diesmal aber deutlich zielgerichteter ausfiel.",
    5: "Team Paris zeigte kreative Ansätze bei der Strategieentwicklung. Winston Smith brachte eine ungewöhnlich kritische Perspektive ein, die das Team produktiv herausforderte. Gandalf bewies einmal mehr, dass ein weiser Berater den Unterschied machen kann – auch ohne Zauberstab.",
  };

  const teams: any[] = [];
  for (let i = 0; i < teamDefs.length; i++) {
    const def = teamDefs[i];
    const t = await prisma.bdpTeam.create({
      data: {
        id: randomUUID(),
        code: def.code,
        displayName: def.displayName,
        environment: ENV,
        feedback: teamFeedback[i] || null,
      },
    });
    teams.push(t);
    await prisma.bdpNameMapping.create({ data: { entityType: "team", entityId: t.id, realName: def.city } });
  }

  const participantDefs = [
    { code: "D-TN1", realName: "Elizabeth Bennet", email: "bennet@participants-demo.eu" },
    { code: "D-TN2", realName: "Mr. Darcy", email: "darcy@participants-demo.eu" },
    { code: "D-TN3", realName: "Sherlock Holmes", email: "holmes@participants-demo.eu" },
    { code: "D-TN4", realName: "Dr. Watson", email: "watson@participants-demo.eu" },
    { code: "D-TN5", realName: "Anna Karenina", email: "karenina@participants-demo.eu" },
    { code: "D-TN6", realName: "Gregor Samsa", email: "samsa@participants-demo.eu" },
    { code: "D-TN7", realName: "Don Quijote", email: "quijote@participants-demo.eu" },
    { code: "D-TN8", realName: "Sancho Panza", email: "panza@participants-demo.eu" },
    { code: "D-TN9", realName: "Jay Gatsby", email: "gatsby@participants-demo.eu" },
    { code: "D-TN10", realName: "Atticus Finch", email: "finch@participants-demo.eu" },
    { code: "D-TN11", realName: "Hermione Granger", email: "granger@participants-demo.eu" },
    { code: "D-TN12", realName: "Jean Valjean", email: "valjean@participants-demo.eu" },
    { code: "D-TN13", realName: "Cosette Fauchelevent", email: "cosette@participants-demo.eu" },
    { code: "D-TN14", realName: "Odysseus", email: "odysseus@participants-demo.eu" },
    { code: "D-TN15", realName: "Penelope", email: "penelope@participants-demo.eu" },
    { code: "D-TN16", realName: "Hamlet", email: "hamlet@participants-demo.eu" },
    { code: "D-TN17", realName: "Ophelia", email: "ophelia@participants-demo.eu" },
    { code: "D-TN18", realName: "Huckleberry Finn", email: "huck@participants-demo.eu" },
    { code: "D-TN19", realName: "Winston Smith", email: "smith@participants-demo.eu" },
    { code: "D-TN20", realName: "Clarissa Dalloway", email: "dalloway@participants-demo.eu" },
    { code: "D-TN21", realName: "Gandalf", email: "gandalf@participants-demo.eu" },
    { code: "D-TN22", realName: "Holden Caulfield", email: "caulfield@demo.de", demoLock: true, pw: "caulfield" },
  ];

  const participants: any[] = [];
  for (const def of participantDefs) {
    const p = await prisma.bdpParticipant.create({
      data: { id: randomUUID(), code: def.code, displayName: `${def.realName} (${def.code.replace("D-","")})`, environment: ENV },
    });
    participants.push(p);
    await prisma.bdpNameMapping.create({ data: { entityType: "participant", entityId: p.id, realName: def.realName } });
    await prisma.bdpNameMapping.create({ data: { entityType: "email", entityId: p.id, realName: def.email } });
  }

  const teamParticipantMap: Record<number, number[]> = {
    0: [0, 1, 2, 3],
    1: [4, 5, 6],
    2: [7, 8, 9, 10],
    3: [11, 12, 13],
    4: [14, 15, 16, 17],
    5: [18, 19, 20, 21],
  };

  for (const [teamIdx, pIdxs] of Object.entries(teamParticipantMap)) {
    for (const pIdx of pIdxs) {
      await prisma.bdpTeamParticipant.create({
        data: { teamId: teams[Number(teamIdx)].id, participantId: participants[pIdx].id },
      });
    }
  }

  const sessionSummaries = [
    "Session 1 bot einen überzeugenden Auftakt. Amsterdam setzte mit strategischer Klarheit den Maßstab, während Barcelona durch unternehmerische Kreativität überraschte. Im Q&A zeigte Amsterdam die größere Souveränität – Elizabeth Bennet führte mit einer Präzision, die Jane Austen stolz gemacht hätte. Insgesamt ein starkes Feld mit klarer Tendenz zugunsten Amsterdams.",
    "Die zweite Session war das strategische Herzstück des Tages. Berlin und Kopenhagen lieferten sich ein Kopf-an-Kopf-Rennen, das erst im Tie-Break entschieden werden konnte. Beide Teams zeigten exzellente Vorbereitung. Die finale Entscheidung fiel zugunsten Berlins – mit hauchdünnem Vorsprung und nach intensiver Diskussion der Q&A-Performance.",
    "Session 3 rundete den Tag mit einem dynamischen Duell ab. Mailand überzeugte durch operative Tiefe und strukturierte Umsetzungspläne, während Paris mit frischen strategischen Impulsen punktete. Odysseus navigierte sein Team mit beinahe homerischer Weitsicht durch die Untiefen des Business Cases.",
  ];

  const sessions: any[] = [];
  const sessionDefs = [
    { name: "BDP Session 1 — Amsterdam vs Barcelona", teamIdxs: [0, 1] },
    { name: "BDP Session 2 — Berlin vs Kopenhagen", teamIdxs: [2, 3] },
    { name: "BDP Session 3 — Mailand vs Paris", teamIdxs: [4, 5] },
  ];

  for (let i = 0; i < sessionDefs.length; i++) {
    const def = sessionDefs[i];
    const s = await prisma.bdpSession.create({
      data: {
        id: randomUUID(),
        name: def.name,
        state: "RELEASED",
        environment: ENV,
        transparencyMode: "show_per_observer_breakdown",
        summary: sessionSummaries[i],
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
    sessions.push(s);

    for (const ti of def.teamIdxs) {
      await prisma.bdpSessionTeam.create({ data: { sessionId: s.id, teamId: teams[ti].id } });
    }
  }

  const sessionObserverMap: Record<number, string[]> = {
    0: ["D-V1", "D-MD1", "D-E1"],
    1: ["D-V2", "D-MD1", "D-E1"],
    2: ["D-V3", "D-MD1", "D-V7"],
  };

  for (const [si, obsCodes] of Object.entries(sessionObserverMap)) {
    const sIdx = Number(si);
    const teamIdxs = sessionDefs[sIdx].teamIdxs;
    for (const obsCode of obsCodes) {
      await prisma.bdpObserverAssignment.create({
        data: {
          sessionId: sessions[sIdx].id,
          userId: users[obsCode].id,
          canScoreTeamIds: teamIdxs.map(ti => teams[ti].id),
        },
      });
    }
  }

  const sponsorMap: Record<number, { obsCode: string; teamIdx: number }> = {
    0: { obsCode: "D-V1", teamIdx: 0 },
    1: { obsCode: "D-V2", teamIdx: 2 },
    2: { obsCode: "D-V3", teamIdx: 5 },
  };

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionDefs[si].teamIdxs;
    const obsCodes = sessionObserverMap[si];
    for (const obsCode of obsCodes) {
      for (const ti of teamIdxs) {
        const isSponsor = sponsorMap[si]?.obsCode === obsCode && sponsorMap[si]?.teamIdx === ti;
        await prisma.bdpSponsorFlag.create({
          data: {
            observerId: users[obsCode].id,
            teamId: teams[ti].id,
            sessionId: sessions[si].id,
            isSponsor,
            environment: ENV,
          },
        });
      }
    }
  }

  // CHARACTER-BASED SCORE PATTERNS
  // Each array: 5 criteria × 2 teams = [teamA, teamB] per criterion
  // Sum per criterion per observer = 100
  // Marie Curie: strong strategic, strict on sovereignty, analytical
  // Alan Turing: high economic/logic, medium leadership
  // Hannah Arendt: strong leadership, differentiated Q&A, no extremes
  // Virginia Woolf: generous presentation, critical operationalization
  // Peter Drucker: rational, structured distributions
  // Marcus Aurelius: balanced, philosophically calm, no extreme spreads

  const scorePatterns: Record<number, Record<string, number[][]>> = {
    0: {
      "D-V1":  [[68,32],[54,46],[58,42],[52,48],[66,34]],
      "D-MD1": [[56,44],[53,47],[44,56],[58,42],[60,40]],
      "D-E1":  [[58,42],[55,45],[56,44],[52,48],[54,46]],
    },
    2: {
      "D-V3":  [[56,44],[52,48],[54,46],[58,42],[55,45]],
      "D-MD1": [[53,47],[48,52],[44,56],[57,43],[56,44]],
      "D-V7":  [[52,48],[51,49],[50,50],[53,47],[52,48]],
    },
  };

  // Session 2: engineered tie-break scenario
  const s2V2:  number[][] = [[56,44],[62,38],[54,46],[46,54],[52,48]];
  const s2MD1: number[][] = [[52,48],[48,52],[44,56],[56,44],[55,45]];
  const s2E1:  number[][] = [[54,46],[52,48],[54,46],[48,52],[47,53]];

  function sumCol(patterns: number[][], col: number): number {
    return patterns.reduce((s, row) => s + row[col], 0);
  }

  const berlin = sumCol(s2V2, 0) + sumCol(s2MD1, 0) + sumCol(s2E1, 0);
  const kopenh = sumCol(s2V2, 1) + sumCol(s2MD1, 1) + sumCol(s2E1, 1);
  const diff = berlin - kopenh;

  if (diff !== 0) {
    const half = diff / 2;
    s2V2[0][0] -= half;
    s2V2[0][1] += half;
  }

  scorePatterns[1] = {
    "D-V2": s2V2,
    "D-MD1": s2MD1,
    "D-E1": s2E1,
  };

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionDefs[si].teamIdxs;
    const obsCodes = Object.keys(scorePatterns[si]);
    for (const obsCode of obsCodes) {
      const patterns = scorePatterns[si][obsCode];
      for (let ci = 0; ci < criteria.length && ci < patterns.length; ci++) {
        for (let ti = 0; ti < teamIdxs.length; ti++) {
          await prisma.bdpScore.create({
            data: {
              sessionId: sessions[si].id,
              criterionId: criteria[ci].id,
              observerId: users[obsCode].id,
              teamId: teams[teamIdxs[ti]].id,
              points: patterns[ci][ti],
              environment: ENV,
            },
          });
        }
      }
    }
  }

  await prisma.bdpTieBreak.create({
    data: {
      sessionId: sessions[1].id,
      winnerTeamId: teams[2].id,
      decidedById: users["D-V2"].id,
      rationale: "Entscheidung nach inhaltlicher Zuspitzung im Q&A. Berlin überzeugte mit marginal schärferer Argumentationslinie in der Defense-Phase.",
    },
  });

  const notesDefs = [
    { si: 0, pIdx: 0, obsCode: "D-V1", note: "Sehr klare Argumentationslinie mit analytischer Präzision. Führte das Team mit natürlicher Autorität durch die Präsentation. Im Q&A gelegentlich einen Tick zu souverän – ein Hauch mehr Demut hätte die Wirkung noch verstärkt.", general: "Führungspersönlichkeit mit strategischem Weitblick. Sollte im Defense noch gezielter auf Nachfragen eingehen, statt vorauseilend zu antworten.", contribution: 5, presence: 5 },
    { si: 0, pIdx: 1, obsCode: "D-V1", note: "Analytisch stark, bringt fundierte Argumente ein und untermauert diese mit belastbaren Zahlen. Kommunikation könnte pointierter sein – weniger Stolz, mehr Klartext wäre hilfreich.", general: "Solide Leistung mit Potenzial zur strategischen Führung. Sein Auftritt erinnerte bisweilen an einen Mann, der sein Urteil bereits gefällt hat, bevor die Verhandlung begonnen hat.", contribution: 4, presence: 4 },
    { si: 0, pIdx: 2, obsCode: "D-MD1", note: "Exzellente Recherche und Datenaufbereitung – die analytische Tiefe war beeindruckend. Präsentation noch ausbaufähig: Der Vortrag wirkte stellenweise wie ein Beweisprotokoll statt eines Business-Pitches.", general: "Starker Teamplayer mit analytischer Tiefe. Würde von einem etwas weniger deduktiven und mehr narrativen Vortragsstil profitieren.", contribution: 4, presence: 3 },
    { si: 0, pIdx: 3, obsCode: "D-E1", note: "Verlässlicher Unterstützer im Team, der die richtigen Fragen zur richtigen Zeit stellte. Seine ruhige Art stabilisierte die Gruppendynamik. Gelegentlich etwas zu zurückhaltend bei eigenen Impulsen.", general: "Solider Beitrag als Teamstütze. Könnte mit etwas mehr Eigeninitiative seine ohnehin gute Wirkung noch steigern.", contribution: 3, presence: 4 },
    { si: 1, pIdx: 7, obsCode: "D-V2", note: "Hohe Kundenorientierung gepaart mit starker Zahlenlogik. Der Maßnahmenplan war durchdacht, wenngleich die Priorisierung noch schärfer hätte ausfallen können. Seine Präsenz erinnerte an einen Algorithmus in menschlicher Form – effizient, aber mit Wärme.", general: "Überzeugt durch strukturiertes Vorgehen und klare Kommunikation. Ein Kandidat, bei dem man das Gefühl hat, er könnte auch eine Enigma entschlüsseln – nur diesmal heißt sie ‚Marktdynamik'.", contribution: 5, presence: 5 },
    { si: 1, pIdx: 8, obsCode: "D-MD1", note: "Kreative Ansätze in der Strategieentwicklung mit unkonventionellen Perspektiven. Gelegentlich zu detailverliebt – nicht jeder Gedankenstrom muss in voller Länge präsentiert werden.", general: "Bringt frische Perspektiven ein, sollte den Fokus stärker priorisieren. Ihr Stream-of-Consciousness-Stil hat Charme, aber ein Business-Pitch ist keine Bewusstseinsnovelle.", contribution: 4, presence: 4 },
    { si: 1, pIdx: 9, obsCode: "D-E1", note: "Ruhiger, aber wirkungsvoller Beitrag. Brachte ethische Dimensionen in die Strategiediskussion ein, die dem Pitch Tiefe verliehen. Seine moralische Kompassnadel zeigte durchgehend nach Norden.", general: "Ein Kandidat mit Integrität und argumentativer Stärke. Management by Gewissen – in der besten Tradition.", contribution: 4, presence: 4 },
    { si: 1, pIdx: 10, obsCode: "D-V2", note: "Beeindruckende Rechercheleistung und die Fähigkeit, komplexe Sachverhalte verständlich aufzubereiten. Gelegentlich der Eindruck, als wolle sie sämtliche Antworten auf einmal geben – dosierte Brillanz wirkt nachhaltiger.", general: "Herausragende analytische Fähigkeiten. Mit etwas mehr strategischer Geduld könnte sie ihre ohnehin starke Wirkung noch potenzieren.", contribution: 5, presence: 4 },
    { si: 2, pIdx: 14, obsCode: "D-V3", note: "Ruhige, aber bestimmte Führung. Baut Konsens effektiv auf und navigierte das Team mit beinahe homerischer Weitsicht durch die Untiefen des Business Cases. Seine strategische Orientierung war durchweg überzeugend.", general: "Natürliche Autorität gepaart mit diplomatischem Geschick. Ein Kandidat, der beweist, dass man auch ohne Sirenengesang ans Ziel kommen kann.", contribution: 5, presence: 5 },
    { si: 2, pIdx: 15, obsCode: "D-V3", note: "Starker Auftritt im Q&A – konnte kritische Fragen souverän und mit Gelassenheit beantworten. Ihre Argumentation war durchdacht und in sich schlüssig, ohne je an Überzeugungskraft zu verlieren.", general: "Überzeugende Präsenz und argumentative Stärke. Treu und standhaft in der Defense – Qualitäten, die im Business wie in Ithaka gleichermaßen geschätzt werden.", contribution: 4, presence: 5 },
    { si: 2, pIdx: 16, obsCode: "D-MD1", note: "Hamlet zeigte phasenweise brillante Einsichten, rang aber sichtbar mit der Entscheidungsfindung. Die Frage ‚To pitch or not to pitch' schien ihn bisweilen mehr zu beschäftigen als den eigentlichen Business Case.", general: "Analytisch begabt, aber noch auf der Suche nach seinem entschiedenen Führungsstil. Weniger Reflexion, mehr Resolution würde seinem Profil guttun.", contribution: 3, presence: 4 },
    { si: 2, pIdx: 18, obsCode: "D-V7", note: "Eine mit beinahe stoischer Gelassenheit vorgetragene Analyse, die durch innere Ruhe und sachliche Präzision bestach. Keine überflüssigen Worte, keine theatralischen Gesten – das Wesentliche wurde auf das Wesentliche reduziert.", general: "Ein Kandidat, der beweist, dass wahre Überzeugungskraft nicht aus Lautstärke, sondern aus Klarheit entsteht. Sein Beitrag erinnerte daran, dass nicht alles, was glänzt, Gold ist – aber manches, was still leuchtet, sehr wohl.", contribution: 4, presence: 4 },
    { si: 2, pIdx: 19, obsCode: "D-V7", note: "Clarissa Dalloway brachte eine unerwartete Eleganz in die Strategiepräsentation. Ihre Fähigkeit, verschiedene Perspektiven zu integrieren, war bemerkenswert – gelegentlich verlor sie sich jedoch in der Schönheit der Darstellung und vergaß die harte Kennzahl.", general: "Kommunikativ stark mit ausgeprägtem Sinn für das große Ganze. Sollte die Balance zwischen ästhetischer Präsentation und nüchterner Zahlenlogik weiter schärfen.", contribution: 3, presence: 4 },
    { si: 2, pIdx: 21, obsCode: "D-V3", note: "Holden Caulfield überraschte mit erfrischend unkonventionellen Perspektiven. Seine Skepsis gegenüber ‚phoniness' im Business-Kontext war ebenso charmant wie gelegentlich herausfordernd für das Team. Im Kern aber durchaus substanziell.", general: "Ein Querdenker mit Potenzial. Wenn er lernt, seinen gesunden Skeptizismus produktiv einzusetzen statt nur zu dekonstruieren, könnte daraus echte Führungsstärke entstehen.", contribution: 3, presence: 3 },
  ];

  for (const nd of notesDefs) {
    await prisma.bdpIndividualNote.create({
      data: {
        sessionId: sessions[nd.si].id,
        participantId: participants[nd.pIdx].id,
        observerId: users[nd.obsCode].id,
        criterionId: criteria[0]?.id || null,
        note: nd.note,
        generalNote: nd.general,
        contribution: nd.contribution,
        presence: nd.presence,
        environment: ENV,
      },
    });
  }

  for (const crit of criteria) {
    for (const role of ["BOARD", "MANAGEMENT_DIAGNOSTICS", "EXPERT"]) {
      const existing = await prisma.bdpRoleWeight.findFirst({ where: { role, criterionId: crit.id } });
      if (!existing) {
        await prisma.bdpRoleWeight.create({
          data: { role, criterionId: crit.id, weight: 1.0, enabled: false },
        });
      }
    }
  }

  return {
    demoDatasetVersion: "D1.2",
    observers: Object.keys(users).length,
    teams: teams.length,
    participants: participants.length,
    sessions: sessions.length,
    criteria: criteria.length,
  };
}
