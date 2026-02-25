"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type AccessMode = null | "master" | "workspace" | "candidate";
type Lang = "de" | "en";

const t = {
  de: {
    navProcess: "Unser Prozess",
    navExercises: "\u00dcbungsbibliothek",
    navCaseStudies: "Fallstudien",
    navCandidates: "Kandidatenportal",
    navFrameworks: "Frameworks",
    navTour: "Produkt-Tour",
    navLogin: "Anmelden",
    heroBadge: "Diagnostik-Plattform",
    heroTitle1: "Augmented",
    heroTitle2: "Diagnostics.",
    heroSub: "Die Plattform f\u00fcr den kompletten AC-Prozess \u2014 von der Anforderungsanalyse bis zum fertigen Ergebnisbericht. KI-verst\u00e4rkte Diagnostik, rechtskonform, und gebaut auf jahrelanger Durchf\u00fchrungserfahrung.",
    heroCta1: "Plattform entdecken",
    heroCta2: "Direkt anmelden",
    heroAnalysis: "Anforderungsanalyse",
    heroMatching: "\u00dcbungsmatching",
    heroSheets: "Beobachtungsb\u00f6gen",
    heroReport: "Ergebnisbericht",
    heroStatus: "KI-Analyse aktiv \u00b7 5 Kompetenzen erkannt \u00b7 3 \u00dcbungen vorgeschlagen",
    trustDin: "DIN 33430 konform",
    trustDsgvo: "DSGVO-ready",
    trustAiAct: "EU AI Act konform",
    trustServer: "Server in DE (geplant)",
    trustEnterprise: "Enterprise-Grade",
    trustOffline: "Skalierbar",
    trustMultitenant: "Mandantenf\u00e4hig",
    uspBadge: "Augmented Diagnostics",
    uspTitle: "Diagnostische Expertise, verst\u00e4rkt durch KI.",
    uspSub: "Diese Plattform verbindet diagnostisches Fachwissen, Durchf\u00fchrungserfahrung und gewachsene Benchmarks mit modernster KI-Technologie \u2014 zu einem durchg\u00e4ngigen System f\u00fcr den gesamten AC-Prozess.",
    uspPillar1Title: "Expertise im System",
    uspPillar1Desc: "Methodenwissen und diagnostische Erfahrung sind in die Plattform eingebaut \u2014 nicht nur als Feature, sondern als Fundament.",
    uspPillar2Title: "KI-verst\u00e4rkt",
    uspPillar2Desc: "Modernste KI beschleunigt Routineaufgaben, generiert Vorschl\u00e4ge und erm\u00f6glicht Analysen in neuer Tiefe und Geschwindigkeit.",
    uspPillar3Title: "Benchmarks integriert",
    uspPillar3Desc: "Gewachsene Referenzdaten erm\u00f6glichen fundierte Einordnung \u2014 direkt in der Plattform verf\u00fcgbar.",
    uspPillar4Title: "End-to-End",
    uspPillar4Desc: "Ein System von der Anforderungsanalyse bis zum Ergebnisbericht. Kein Medienbruch, kein Copy-Paste zwischen Tools.",
    uspFootnote: "Augmented Diagnostics: KI verst\u00e4rkt die Diagnostik. Die fachliche Verantwortung bleibt beim Menschen.",
    processBadge: "End-to-End",
    processTitle: "Der komplette AC-Prozess \u2014 durchg\u00e4ngig KI-verst\u00e4rkt",
    processSub: "Von der Anforderungsanalyse bis zum fertigen Ergebnisbericht \u2014 ein durchg\u00e4ngiger Prozess ohne Medienbr\u00fcche. KI verst\u00e4rkt jeden Schritt. Die fachliche Steuerung bleibt beim Menschen.",
    processStep1: "Kompetenzmodelle aus Stellenprofilen ableiten oder KI-generieren lassen",
    processStep2: "Bibliothek nutzen, KI-gest\u00fctzt anpassen oder komplett neu generieren",
    processStep3: "Strukturierte Beobachtung, Echtzeit-Kollaboration, digitale Erfassung",
    processStep4: "Konsolidierung, MTMM-Matrix, KI-gest\u00fctzte Hypothesen und Empfehlungen",
    processStep5: "Automatisierte Reports in DOCX, PDF und PowerPoint \u2014 fertig in 30 Minuten",
    processStepTitle1: "Anforderungsanalyse",
    processStepTitle2: "\u00dcbungsdesign",
    processStepTitle3: "Durchf\u00fchrung",
    processStepTitle4: "Auswertung",
    processStepTitle5: "Ergebnisberichte",
    processKi: "KI-gest\u00fctzt",
    processHuman: "Mensch steuert",
    processFootnote: "Kein Copy-Paste zwischen Tools. Kein Medienbruch. Ein System, das von Anfang bis Ende durchdacht ist.",
    exBadge: "Unsere \u00dcbungsbibliothek",
    exTitle: "Vorhandenes nutzen. Anpassen. Oder neu generieren lassen.",
    exSub: "Unser wachsendes Archiv an Assessment-\u00dcbungen \u2014 sofort einsetzbar, KI-gest\u00fctzt anpassbar oder auf Knopfdruck komplett neu generiert.",
    exLib: "Aus der Bibliothek",
    exLibDesc: "Bew\u00e4hrte \u00dcbungen sofort einsetzen. Unser Scoring-Algorithmus pr\u00fcft automatisch die Passung zu den definierten Anforderungen.",
    exLibF1: "Sofort einsetzbar",
    exLibF2: "Automatisches Passung-Scoring",
    exLibF3: "Versioniert & dokumentiert",
    exAdapt: "KI-gest\u00fctzt anpassen",
    exAdaptDesc: "Vorhandene \u00dcbungen kontextspezifisch adaptieren \u2014 Branche, Funktion, Seniori\u00e4tslevel. Die KI schl\u00e4gt Anpassungen vor, wir entscheiden.",
    exAdaptF1: "Branchenspezifische Adaption",
    exAdaptF2: "Schwierigkeitsgrad anpassen",
    exAdaptF3: "CD-konforme Varianten",
    exGen: "Komplett neu generieren",
    exGenDesc: "Die KI erstellt komplette \u00dcbungen auf Basis unserer Anforderungsprofile \u2014 inkl. Bewertungskriterien, Verhaltensankern und Beobachtungsb\u00f6gen.",
    exGenF1: "Auf Basis der Anforderung",
    exGenF2: "Inkl. Bewertungskriterien",
    exGenF3: "Sofort einsatzbereit",
    csBadge: "Game Changer",
    csTitle: "Komplexe Fallstudien in Minuten statt Wochen",
    csSub: "Eine ma\u00dfgeschneiderte Fallstudie braucht normalerweise 2\u20133 Wochen Entwicklungszeit. Mit unserem Case-Studio laden wir vorhandene Unterlagen hoch \u2014 die KI strukturiert sie automatisch in eine fertige Fallstudie mit Datenraum, Aufgabenstellung und Bewertungsschl\u00fcssel.",
    csStep1Title: "Dokument hochladen",
    csStep1Desc: "Gesch\u00e4ftsberichte, Strategiepapiere, Organigramme \u2014 was wir haben",
    csStep2Title: "KI strukturiert",
    csStep2Desc: "Automatische Aufbereitung in Fallstudie mit Datenraum-Dokumenten",
    csStep3Title: "Wir verfeinern",
    csStep3Desc: "Aufgabenstellung, Bewertungsschl\u00fcssel und Schwierigkeitsgrad anpassen",
    csBefore: "2\u20133 Wo.",
    csAfter: "< 1 Std.",
    csLabel: "Entwicklungszeit f\u00fcr eine ma\u00dfgeschneiderte Fallstudie",
    candBadge: "Kandidatenerlebnis",
    candTitle: "Alles an einem Ort \u2014 nahtlos integriert",
    candSub: "Die Teilnehmerkommunikation l\u00e4uft bereits digital. Diese Plattform geht einen Schritt weiter: ein dediziertes Portal pro Assessment, im Kunden-CI, mit zeitgesteuerter Freigabe, integrierter Selbsteinsch\u00e4tzung und Consent Management \u2014 alles in einem System.",
    candBeforeTitle: "Heute: gut, aber fragmentiert",
    candBeforeItems: [
      "Digitale Kandidatenkommunikation \u00fcber separate Plattform",
      "Selbsteinsch\u00e4tzungen und Dokumente in getrennten Systemen",
      "Zeitsteuerung und Freigaben manuell koordiniert",
      "Kein durchg\u00e4ngiges Kunden-CI m\u00f6glich",
      "Consent-Prozesse nicht integriert",
    ],
    candAfterTitle: "Integriert: ein Portal, ein Prozess",
    candAfterItems: [
      "Dediziertes Kandidatenportal pro Assessment",
      "Zeitgesteuerte Dokumentenfreigabe automatisiert",
      "Durchg\u00e4ngig im Corporate Design des Kunden",
      "Selbsteinsch\u00e4tzungen direkt im Prozess integriert",
      "DSGVO-konformes Consent Management mit Versionierung",
    ],
    candFootnote: "Nicht digitaler \u2014 sondern integrierter. Ein System statt vieler Tools.",
    fwBadge: "Frameworks & Beobachtungsb\u00f6gen",
    fwTitle: "Vom Kundenmodell zum fertigen Beobachtungsbogen in 15 Minuten",
    fwSub: "Jeder Kunde hat eigene Kompetenzmodelle. Unsere Plattform \u00fcbersetzt sie in Sekundenschnelle in operationalisierte Verhaltensanker, Bewertungsskalen und fertige Beobachtungsb\u00f6gen \u2014 inkl. MTMM-Matrix-Generierung.",
    fwInput: "Input",
    fwInputLabel: "Kompetenzmodell des Kunden",
    fwProcess: "KI-Verarbeitung",
    fwProcessLabel: "\u00dcbersetzung in Verhaltensanker & Skalen",
    fwOutput: "Output",
    fwOutputLabel: "Fertige Beobachtungsb\u00f6gen + MTMM-Matrix",
    fwFeatures: [
      "Unternehmensspezifische Modelle hochladen oder eingeben",
      "KI generiert Verhaltensanker pro Kompetenz und Skala",
      "Automatische MTMM-Matrix (\u00dcbung x Kompetenz)",
      "Fertige Beobachtungsb\u00f6gen zum sofortigen Einsatz",
      "Oder: KI generiert das komplette Framework von Grund auf",
    ],
    trustSectionTitle: "Augmented \u2014 nicht automatisiert.",
    trustSectionSub: "KI verst\u00e4rkt die Diagnostik, ersetzt sie nicht. Alle KI-Ausgaben sind transparent gekennzeichnet, konfidenzbewertet und vollst\u00e4ndig audit-geloggt. Die fachliche Verantwortung bleibt beim Menschen.",
    trustStat1Before: "2\u20133 Wo.",
    trustStat1After: "< 1 Std.",
    trustStat1Label: "Fallstudien-Entwicklung",
    trustStat2Before: "2 Tage",
    trustStat2After: "15 Min.",
    trustStat2Label: "Beobachtungsb\u00f6gen",
    trustStat3Before: "4 Std.",
    trustStat3After: "30 Min.",
    trustStat3Label: "Ergebnisberichte",
    trustStat4Before: "1 Woche",
    trustStat4After: "2 Std.",
    trustStat4Label: "Kompetenzmodell erstellen",
    trustCard1Title: "Volle Transparenz",
    trustCard1Desc: "Jede KI-Ausgabe ist als solche gekennzeichnet. Konfidenz-Scores zeigen, wie sicher die Empfehlung ist.",
    trustCard2Title: "Rechtskonform",
    trustCard2Desc: "DIN 33430-konform, DSGVO-ready, EU AI Act ber\u00fccksichtigt, Consent Management mit versionierten Vorlagen. Server in Deutschland geplant.",
    trustCard3Title: "Audit-geloggt",
    trustCard3Desc: "Jede KI-Interaktion wird dokumentiert. Nachvollziehbar, reproduzierbar, revisionssicher.",
    aiBadge: "Was andere nicht haben",
    aiTitle: "Unsere Advanced Intelligence Layer",
    aiSub: "Drei KI-Module, die \u00fcber Standard-Auswertung hinausgehen \u2014 diagnostische Werkzeuge, die uns bei der Interpretation und Empfehlung unterst\u00fctzen. Immer als Vorschlag, nie als Urteil.",
    aiPredTitle: "Predictive Success Intelligence",
    aiPredDesc: "Welche F\u00fchrungsrisiken sehen wir, bevor sie eintreten? Analyse in f\u00fcnf Dimensionen: Execution, Stakeholder, Resilienz, Governance und Transformation.",
    aiPredF1: "Szenario-Simulationen",
    aiPredF2: "Konfidenz-Scoring",
    aiPredF3: "Pr\u00e4diktive Erfolgsprofile",
    aiDevTitle: "Development Path Generator",
    aiDevDesc: "Automatisch generierte Entwicklungsvorschl\u00e4ge: 90-Tage-Fokus, 6-Monats-Wachstum, 12-Monats-Positionierung \u2014 direkt aus unseren Ergebnisdaten.",
    aiDevF1: "Coaching-Empfehlungen",
    aiDevF2: "Risikominimierung",
    aiDevF3: "Evidenzbasiert",
    aiHypTitle: "Diagnostic Hypothesis Engine",
    aiHypDesc: "KI formuliert diagnostische Hypothesen mit st\u00fctzender und kontr\u00e4rer Evidenz, alternativen Interpretationen und Validierungsschritten.",
    aiHypF1: "Gegen-Evidenz",
    aiHypF2: "Alternativmodelle",
    aiHypF3: "Validierungsprotokolle",
    compTitle: "Was wir k\u00f6nnen \u2014 und was der Marktstandard bietet",
    compFeature: "Feature",
    compUs: "Unsere Plattform",
    compThem: "Marktstandard",
    compPartial: "Teilweise",
    outlookBadge: "Ausblick",
    outlookTitle: "Was kommt — und was kommen könnte.",
    outlookSub: "KI in der Management-Diagnostik ist ein Feld in voller Entwicklung. Vieles ist technisch bereits machbar — manches davon rechtlich und ethisch noch nicht abschließend geregelt. Wir beobachten, erproben und bauen verantwortungsvoll weiter.",
    outlookDisclaimer: "Hinweis: Alle hier genannten Ausblicke sind technische Möglichkeiten, keine Versprechen. Die tatsächliche Umsetzung hängt von rechtlichen Rahmenbedingungen, ethischen Standards und dem konkreten Nutzen für die diagnostische Praxis ab.",
    outlookItems: [
      { title: "KI-Strukturierungsassistent", desc: "KI hilft Beobachtern in Echtzeit, Beobachtungen zu strukturieren und Kompetenzen zuzuordnen.", status: "in_dev" },
      { title: "Automatische Hypothesenbildung", desc: "KI generiert auf Basis der Beobachtungsdaten diagnostische Hypothesen zur Diskussion in der Beobachterkonferenz.", status: "in_dev" },
      { title: "KI als Co-Beobachter", desc: "KI beobachtet parallel (z.B. via Transkription) und liefert ergänzende Eindrücke als Diskussionsgrundlage.", status: "planned" },
      { title: "Intelligente Debrief-Vorbereitung", desc: "KI bereitet aus allen Datenquellen strukturierte Konferenz-Unterlagen vor — inkl. Auffälligkeiten und offenen Fragen.", status: "planned" },
      { title: "KI-Avatare als Rollenspieler", desc: "Realistische KI-Avatare als Interaktionspartner in Simulationen — konsistent, skalierbar, mit einstellbarem Schwierigkeitsgrad.", status: "vision" },
      { title: "Adaptive Assessment-Verfahren", desc: "Übungen, die sich dynamisch an das Leistungsniveau anpassen — analog zum adaptiven Testen in der Psychometrie.", status: "vision" },
      { title: "KI-generierte Szenarien", desc: "Maßgeschneiderte Business Cases pro Branche, Unternehmen oder Zielposition — jedes Mal einzigartig und aktuell.", status: "planned" },
      { title: "Echtzeit-Feedback in Development-ACs", desc: "Sofortiges, KI-gestütztes Feedback in entwicklungsorientierten Assessment-Formaten.", status: "planned" },
      { title: "Benchmark-Generierung", desc: "KI-gestützte Auswertung und Aufbau eigener Vergleichsdaten — Benchmarks als wahres Gold der Diagnostik.", status: "in_dev" },
      { title: "Digitale Zwillinge von Führungssituationen", desc: "Immersive, KI-gesteuerte Szenarien, die reale Unternehmenskontexte simulieren — für realitätsnahe Diagnostik.", status: "vision" },
      { title: "Longitudinale Entwicklungsprognosen", desc: "KI verfolgt Entwicklung über mehrere Assessments und prognostiziert individuelle Wachstumspfade.", status: "vision" },
      { title: "Vollständig digitales Assessment Center", desc: "Alle Übungen KI-moderiert, remote und asynchron möglich — das Assessment Center der Zukunft.", status: "vision" },
    ],
    outlookStatusInDev: "In Entwicklung",
    outlookStatusPlanned: "Geplant",
    outlookStatusVision: "Vision",
    loginTitle: "Anmelden",
    loginSub: "Zugangsbereich w\u00e4hlen und loslegen.",
    loginMasterTitle: "Master-Administration",
    loginMasterSub: "Plattform-Verwaltung",
    loginMasterDesc: "Zugang zur globalen Modul-\u00dcbersicht und Plattform-Konfiguration",
    loginWorkTitle: "Company-Cockpit",
    loginWorkSub: "Workspace-Zugang",
    loginWorkDesc: "Workspace ausw\u00e4hlen und im Enterprise-Cockpit anmelden",
    loginCandTitle: "Kandidaten-Portal",
    loginCandSub: "Teilnehmer-Zugang",
    loginCandDesc: "Als Kandidat im Assessment-Portal anmelden",
    loginBtn: "Anmelden",
    loginBack: "Zur\u00fcck zur \u00dcbersicht",
    loginPwLabel: "Passwort",
    loginEmailLabel: "E-Mail",
    loginWsLabel: "Workspace",
    loginMasterPh: "Master-Admin Passwort",
    loginWsPh: "Workspace-Name eingeben",
    loginEmailPh: "ihre@email.de",
    loginPwPh: "Passwort",
    loginMasterBtn: "Als Master-Admin anmelden",
    loginWorkBtn: "Im Company-Cockpit anmelden",
    loginCandBtn: "Im Kandidaten-Portal anmelden",
    loginLoading: "Anmelden...",
    loginWrongPw: "Falsches Passwort",
    loginFailed: "Anmeldung fehlgeschlagen",
    loginConnErr: "Verbindungsfehler",
    footerCopy: "\u00a9 Christoph Aldering \u00b7 Private initiative \u2013 for training reasons only \u2013 no data from reality so far!",
    footerSub: "Mandantenf\u00e4hig \u00b7 Enterprise-Grade \u00b7 Made with ambition",
  },
  en: {
    navProcess: "Our Process",
    navExercises: "Exercise Library",
    navCaseStudies: "Case Studies",
    navCandidates: "Candidate Portal",
    navFrameworks: "Frameworks",
    navTour: "Product Tour",
    navLogin: "Sign In",
    heroBadge: "Diagnostics Platform",
    heroTitle1: "Augmented",
    heroTitle2: "Diagnostics.",
    heroSub: "The platform for the entire AC process \u2014 from requirements analysis to the final assessment report. AI-enhanced diagnostics, legally compliant, and built on years of hands-on experience.",
    heroCta1: "Explore the platform",
    heroCta2: "Sign in directly",
    heroAnalysis: "Requirements Analysis",
    heroMatching: "Exercise Matching",
    heroSheets: "Observation Sheets",
    heroReport: "Assessment Report",
    heroStatus: "AI analysis active \u00b7 5 competencies identified \u00b7 3 exercises suggested",
    trustDin: "DIN 33430 compliant",
    trustDsgvo: "GDPR-ready",
    trustAiAct: "EU AI Act compliant",
    trustServer: "Servers in DE (planned)",
    trustEnterprise: "Enterprise-Grade",
    trustOffline: "Scalable",
    trustMultitenant: "Multi-tenant",
    uspBadge: "Augmented Diagnostics",
    uspTitle: "Diagnostic expertise, enhanced by AI.",
    uspSub: "This platform combines diagnostic know-how, hands-on experience and established benchmarks with cutting-edge AI technology \u2014 into one seamless system for the entire AC process.",
    uspPillar1Title: "Expertise Built In",
    uspPillar1Desc: "Methodological knowledge and diagnostic experience are built into the platform \u2014 not just as a feature, but as a foundation.",
    uspPillar2Title: "AI-Enhanced",
    uspPillar2Desc: "State-of-the-art AI accelerates routine tasks, generates suggestions and enables analyses of new depth and speed.",
    uspPillar3Title: "Benchmarks Integrated",
    uspPillar3Desc: "Established reference data enables well-grounded classification \u2014 available directly in the platform.",
    uspPillar4Title: "End-to-End",
    uspPillar4Desc: "One system from requirements analysis to assessment report. No media breaks, no copy-paste between tools.",
    uspFootnote: "Augmented Diagnostics: AI enhances diagnostics. Professional responsibility stays with the people.",
    processBadge: "End-to-End",
    processTitle: "The complete AC process \u2014 AI-enhanced throughout",
    processSub: "From requirements analysis to the finished assessment report \u2014 a seamless process without media breaks. AI enhances every step. Professional control stays with the people.",
    processStep1: "Derive competency models from job profiles or have AI generate them",
    processStep2: "Use library, adapt with AI support or generate entirely new",
    processStep3: "Structured observation, real-time collaboration, digital recording",
    processStep4: "Consolidation, MTMM matrix, AI-supported hypotheses and recommendations",
    processStep5: "Automated reports in DOCX, PDF and PowerPoint \u2014 ready in 30 minutes",
    processStepTitle1: "Requirements Analysis",
    processStepTitle2: "Exercise Design",
    processStepTitle3: "Execution",
    processStepTitle4: "Evaluation",
    processStepTitle5: "Assessment Reports",
    processKi: "AI-supported",
    processHuman: "Human-led",
    processFootnote: "No copy-paste between tools. No media breaks. One system, thought through from start to finish.",
    exBadge: "Our Exercise Library",
    exTitle: "Use existing. Adapt. Or generate new.",
    exSub: "Our growing archive of assessment exercises \u2014 ready to use, AI-adaptable or newly generated at the push of a button.",
    exLib: "From the Library",
    exLibDesc: "Deploy proven exercises immediately. Our scoring algorithm automatically checks the fit against defined requirements.",
    exLibF1: "Ready to use immediately",
    exLibF2: "Automatic fit scoring",
    exLibF3: "Versioned & documented",
    exAdapt: "Adapt with AI",
    exAdaptDesc: "Adapt existing exercises to context \u2014 industry, function, seniority level. AI suggests adaptations, we decide.",
    exAdaptF1: "Industry-specific adaptation",
    exAdaptF2: "Adjust difficulty level",
    exAdaptF3: "CD-compliant variants",
    exGen: "Generate entirely new",
    exGenDesc: "AI creates complete exercises based on our requirements profiles \u2014 incl. assessment criteria, behavioral anchors and observation sheets.",
    exGenF1: "Based on requirements",
    exGenF2: "Incl. assessment criteria",
    exGenF3: "Ready for immediate use",
    csBadge: "Game Changer",
    csTitle: "Complex case studies in minutes instead of weeks",
    csSub: "A tailored case study normally requires 2\u20133 weeks of development time. With our Case Studio, we upload existing documents \u2014 AI automatically structures them into a complete case study with data room, task description and evaluation key.",
    csStep1Title: "Upload document",
    csStep1Desc: "Business reports, strategy papers, org charts \u2014 whatever we have",
    csStep2Title: "AI structures",
    csStep2Desc: "Automatic preparation into case study with data room documents",
    csStep3Title: "We refine",
    csStep3Desc: "Adjust task description, evaluation key and difficulty level",
    csBefore: "2\u20133 wks",
    csAfter: "< 1 hr",
    csLabel: "Development time for a tailored case study",
    candBadge: "Candidate Experience",
    candTitle: "Everything in one place \u2014 seamlessly integrated",
    candSub: "Participant communication is already digital. This platform goes one step further: a dedicated portal per assessment, in client CI, with scheduled release, integrated self-assessment and consent management \u2014 all in one system.",
    candBeforeTitle: "Today: good, but fragmented",
    candBeforeItems: [
      "Digital candidate communication via separate platform",
      "Self-assessments and documents in separate systems",
      "Scheduling and releases manually coordinated",
      "No consistent client CI possible",
      "Consent processes not integrated",
    ],
    candAfterTitle: "Integrated: one portal, one process",
    candAfterItems: [
      "Dedicated candidate portal per assessment",
      "Automated scheduled document release",
      "Consistently in the client\u2019s corporate design",
      "Self-assessments directly integrated in the process",
      "GDPR-compliant consent management with versioning",
    ],
    candFootnote: "Not more digital \u2014 more integrated. One system instead of many tools.",
    fwBadge: "Frameworks & Observation Sheets",
    fwTitle: "From client model to finished observation sheet in 15 minutes",
    fwSub: "Every client has their own competency models. Our platform translates them in seconds into operationalized behavioral anchors, rating scales and finished observation sheets \u2014 incl. MTMM matrix generation.",
    fwInput: "Input",
    fwInputLabel: "Client\u2019s competency model",
    fwProcess: "AI Processing",
    fwProcessLabel: "Translation into behavioral anchors & scales",
    fwOutput: "Output",
    fwOutputLabel: "Finished observation sheets + MTMM matrix",
    fwFeatures: [
      "Upload or input company-specific models",
      "AI generates behavioral anchors per competency and scale",
      "Automatic MTMM matrix (exercise x competency)",
      "Finished observation sheets for immediate use",
      "Or: AI generates the complete framework from scratch",
    ],
    trustSectionTitle: "Augmented \u2014 not automated.",
    trustSectionSub: "AI enhances diagnostics, it doesn\u2019t replace them. All AI outputs are transparently labeled, confidence-scored and fully audit-logged. Professional responsibility stays with the people.",
    trustStat1Before: "2\u20133 wks",
    trustStat1After: "< 1 hr",
    trustStat1Label: "Case study development",
    trustStat2Before: "2 days",
    trustStat2After: "15 min",
    trustStat2Label: "Observation sheets",
    trustStat3Before: "4 hrs",
    trustStat3After: "30 min",
    trustStat3Label: "Assessment reports",
    trustStat4Before: "1 week",
    trustStat4After: "2 hrs",
    trustStat4Label: "Competency model creation",
    trustCard1Title: "Full Transparency",
    trustCard1Desc: "Every AI output is labeled as such. Confidence scores show how certain the recommendation is.",
    trustCard2Title: "Legally Compliant",
    trustCard2Desc: "DIN 33430 compliant, GDPR-ready, EU AI Act considered, consent management with versioned templates. Servers in Germany planned.",
    trustCard3Title: "Audit-logged",
    trustCard3Desc: "Every AI interaction is documented. Traceable, reproducible, audit-proof.",
    aiBadge: "What others don\u2019t have",
    aiTitle: "Our Advanced Intelligence Layer",
    aiSub: "Three AI modules that go beyond standard evaluation \u2014 diagnostic tools that support us in interpretation and recommendation. Always as a suggestion, never as a judgment.",
    aiPredTitle: "Predictive Success Intelligence",
    aiPredDesc: "Which leadership risks do we see before they occur? Analysis across five dimensions: Execution, Stakeholder, Resilience, Governance and Transformation.",
    aiPredF1: "Scenario simulations",
    aiPredF2: "Confidence scoring",
    aiPredF3: "Predictive success profiles",
    aiDevTitle: "Development Path Generator",
    aiDevDesc: "Automatically generated development suggestions: 90-day focus, 6-month growth, 12-month positioning \u2014 directly from our result data.",
    aiDevF1: "Coaching recommendations",
    aiDevF2: "Risk minimization",
    aiDevF3: "Evidence-based",
    aiHypTitle: "Diagnostic Hypothesis Engine",
    aiHypDesc: "AI formulates diagnostic hypotheses with supporting and contrary evidence, alternative interpretations and validation steps.",
    aiHypF1: "Counter-evidence",
    aiHypF2: "Alternative models",
    aiHypF3: "Validation protocols",
    compTitle: "What we can do \u2014 and what the market standard offers",
    compFeature: "Feature",
    compUs: "Our Platform",
    compThem: "Market Standard",
    compPartial: "Partial",
    outlookBadge: "Outlook",
    outlookTitle: "What’s coming — and what could come.",
    outlookSub: "AI in management diagnostics is a rapidly evolving field. Much is already technically feasible — some aspects are not yet fully regulated legally and ethically. We observe, test and continue to build responsibly.",
    outlookDisclaimer: "Note: All items listed here are technical possibilities, not promises. Actual implementation depends on legal frameworks, ethical standards and concrete value for diagnostic practice.",
    outlookItems: [
      { title: "AI Structuring Assistant", desc: "AI helps observers structure observations in real-time and assign competencies.", status: "in_dev" },
      { title: "Automatic Hypothesis Generation", desc: "AI generates diagnostic hypotheses based on observation data for discussion in the observer conference.", status: "in_dev" },
      { title: "AI as Co-Observer", desc: "AI observes in parallel (e.g. via transcription) and provides supplementary impressions as a basis for discussion.", status: "planned" },
      { title: "Intelligent Debrief Preparation", desc: "AI prepares structured conference documents from all data sources — incl. notable patterns and open questions.", status: "planned" },
      { title: "AI Avatars as Role Players", desc: "Realistic AI avatars as interaction partners in simulations — consistent, scalable, with adjustable difficulty.", status: "vision" },
      { title: "Adaptive Assessment Methods", desc: "Exercises that dynamically adapt to performance level — analogous to adaptive testing in psychometrics.", status: "vision" },
      { title: "AI-Generated Scenarios", desc: "Tailored business cases per industry, company or target position — unique and current every time.", status: "planned" },
      { title: "Real-Time Feedback in Development ACs", desc: "Immediate, AI-supported feedback in development-oriented assessment formats.", status: "planned" },
      { title: "Benchmark Generation", desc: "AI-supported evaluation and building of proprietary comparison data — benchmarks as the true gold of diagnostics.", status: "in_dev" },
      { title: "Digital Twins of Leadership Situations", desc: "Immersive, AI-controlled scenarios simulating real business contexts — for realistic diagnostics.", status: "vision" },
      { title: "Longitudinal Development Forecasts", desc: "AI tracks development across multiple assessments and forecasts individual growth paths.", status: "vision" },
      { title: "Fully Digital Assessment Center", desc: "All exercises AI-moderated, remote and asynchronous — the assessment center of the future.", status: "vision" },
    ],
    outlookStatusInDev: "In Development",
    outlookStatusPlanned: "Planned",
    outlookStatusVision: "Vision",
    loginTitle: "Sign In",
    loginSub: "Choose your access area and get started.",
    loginMasterTitle: "Master Administration",
    loginMasterSub: "Platform Management",
    loginMasterDesc: "Access global module overview and platform configuration",
    loginWorkTitle: "Company Cockpit",
    loginWorkSub: "Workspace Access",
    loginWorkDesc: "Select workspace and sign into Enterprise Cockpit",
    loginCandTitle: "Candidate Portal",
    loginCandSub: "Participant Access",
    loginCandDesc: "Sign in as candidate to the assessment portal",
    loginBtn: "Sign In",
    loginBack: "Back to overview",
    loginPwLabel: "Password",
    loginEmailLabel: "Email",
    loginWsLabel: "Workspace",
    loginMasterPh: "Master Admin Password",
    loginWsPh: "Enter workspace name",
    loginEmailPh: "your@email.com",
    loginPwPh: "Password",
    loginMasterBtn: "Sign in as Master Admin",
    loginWorkBtn: "Sign in to Company Cockpit",
    loginCandBtn: "Sign in to Candidate Portal",
    loginLoading: "Signing in...",
    loginWrongPw: "Wrong password",
    loginFailed: "Login failed",
    loginConnErr: "Connection error",
    footerCopy: "\u00a9 Christoph Aldering \u00b7 Private initiative \u2013 for training reasons only \u2013 no data from reality so far!",
    footerSub: "Multi-tenant \u00b7 Enterprise-Grade \u00b7 Made with ambition",
  },
};

const comparisonFeatures = {
  de: [
    { feature: "KI-generierte Kompetenzmodelle", them: false },
    { feature: "Predictive Success Intelligence", them: false },
    { feature: "Hypothesen-Engine mit Gegen-Evidenz", them: false },
    { feature: "KI-adaptierte Fallstudien", them: false },
    { feature: "MTMM-Matrix-Generierung", them: false },
    { feature: "Skalierbare Beobachtung", them: "partial" as const },
    { feature: "Multi-Format Reports (DOCX/PDF/PPTX)", them: "partial" as const },
    { feature: "Kandidatenportal mit Zeitsteuerung", them: false },
    { feature: "Echtzeit-Kollaboration", them: false },
    { feature: "Brand Rule Set Management", them: false },
  ],
  en: [
    { feature: "AI-generated competency models", them: false },
    { feature: "Predictive Success Intelligence", them: false },
    { feature: "Hypothesis engine with counter-evidence", them: false },
    { feature: "AI-adapted case studies", them: false },
    { feature: "MTMM matrix generation", them: false },
    { feature: "Scalable observation", them: "partial" as const },
    { feature: "Multi-format reports (DOCX/PDF/PPTX)", them: "partial" as const },
    { feature: "Candidate portal with scheduling", them: false },
    { feature: "Real-time collaboration", them: false },
    { feature: "Brand rule set management", them: false },
  ],
};

export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("de");
  const [activeMode, setActiveMode] = useState<AccessMode>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [wsPassword, setWsPassword] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePassword, setCandidatePassword] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const l = t[lang];

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (res.ok) {
        router.push("/master");
      } else {
        setError(l.loginWrongPw);
      }
    } catch {
      setError(l.loginConnErr);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: wsPassword, workspaceSlug }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
        } else if (workspaceSlug === "arag") {
          router.push("/w/arag");
        } else if (data.user.roles.includes("CANDIDATE")) {
          router.push(`/w/${workspaceSlug}/assessment`);
        } else if (data.user.roles.length === 1 && data.user.roles[0] === "OBSERVER") {
          router.push(`/w/${workspaceSlug}/observer`);
        } else {
          router.push(`/w/${workspaceSlug}/admin`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || l.loginFailed);
      }
    } catch {
      setError(l.loginConnErr);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: candidateEmail, password: candidatePassword, workspaceSlug }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.forcePasswordChange) {
          router.push(`/w/${workspaceSlug}/change-password`);
        } else {
          router.push(`/w/${workspaceSlug}/assessment`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || l.loginFailed);
      }
    } catch {
      setError(l.loginConnErr);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveMode(null);
    setPassword("");
    setEmail("");
    setWsPassword("");
    setCandidateEmail("");
    setCandidatePassword("");
    setError("");
  };

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const processSteps = [
    { num: "01", title: l.processStepTitle1, desc: l.processStep1, ki: true },
    { num: "02", title: l.processStepTitle2, desc: l.processStep2, ki: true },
    { num: "03", title: l.processStepTitle3, desc: l.processStep3, ki: false },
    { num: "04", title: l.processStepTitle4, desc: l.processStep4, ki: true },
    { num: "05", title: l.processStepTitle5, desc: l.processStep5, ki: true },
  ];

  const accessCards = [
    {
      id: "master" as AccessMode,
      title: l.loginMasterTitle,
      subtitle: l.loginMasterSub,
      description: l.loginMasterDesc,
      icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "from-slate-700 to-slate-900",
    },
    {
      id: "workspace" as AccessMode,
      title: l.loginWorkTitle,
      subtitle: l.loginWorkSub,
      description: l.loginWorkDesc,
      icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
      gradient: "from-blue-600 to-blue-800",
    },
    {
      id: "candidate" as AccessMode,
      title: l.loginCandTitle,
      subtitle: l.loginCandSub,
      description: l.loginCandDesc,
      icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
      gradient: "from-amber-600 to-amber-800",
    },
  ];

  const CheckIcon = ({ className = "w-3.5 h-3.5 text-emerald-500 shrink-0" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white pb-12">
      {/* ── STICKY HEADER ── */}
      <header className="bg-brand-navy text-white sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight" data-testid="text-logo">
            Executive Diagnostics Suite
          </span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#prozess" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">{l.navProcess}</a>
            <a href="#uebungen" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">{l.navExercises}</a>
            <a href="#fallstudien" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">{l.navCaseStudies}</a>
            <a href="#kandidaten" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">{l.navCandidates}</a>
            <a href="#frameworks" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">{l.navFrameworks}</a>
            <a href="/tour" className="text-xs font-medium text-brand-blue hover:text-blue-400 transition-colors">{l.navTour}</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="text-xs font-semibold border border-white/20 rounded-full px-3 py-1 hover:bg-white/10 transition-colors"
              data-testid="button-lang-toggle"
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <a
              href="/w/arag"
              className="text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-dark rounded-full px-5 py-1.5 transition-colors"
              data-testid="nav-login"
            >
              {l.navLogin}
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-brand-navy text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-brand-blue/30 rounded-full px-4 py-1.5">
                {l.heroBadge}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] font-serif" data-testid="text-hero-title">
                {l.heroTitle1}
                <br />
                <span className="text-brand-blue">{l.heroTitle2}</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                {l.heroSub}
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <a
                  href="#prozess"
                  className="rounded-lg bg-brand-blue text-white font-semibold px-8 py-3.5 text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/25"
                  data-testid="button-hero-explore"
                >
                  {l.heroCta1}
                </a>
                <a
                  href="/w/arag"
                  className="rounded-lg border border-white/20 text-white font-medium px-8 py-3.5 text-sm hover:bg-white/5 transition-colors"
                  data-testid="button-hero-login"
                >
                  {l.heroCta2}
                </a>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-white/30 ml-2 font-mono">diagnostics.engine</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-400" /></div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">{l.heroAnalysis}</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} /></div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">100%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-400" /></div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">{l.heroMatching}</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: "87%" }} /></div>
                      </div>
                      <span className="text-xs font-mono text-blue-400">87%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-purple-400" /></div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">{l.heroSheets}</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden"><div className="h-full bg-purple-400 rounded-full" style={{ width: "92%" }} /></div>
                      </div>
                      <span className="text-xs font-mono text-purple-400">92%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-amber-400" /></div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">{l.heroReport}</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: "74%" }} /></div>
                      </div>
                      <span className="text-xs font-mono text-amber-400">74%</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {l.heroStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-5 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-40">
            {[l.trustDin, l.trustDsgvo, l.trustAiAct, l.trustServer, l.trustEnterprise, l.trustOffline, l.trustMultitenant].map((item, i) => (
              <span key={i} className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP SECTION ── */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-blue-200 rounded-full px-4 py-1.5 mb-4">
              {l.uspBadge}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif mb-4" data-testid="text-usp-headline">
              {l.uspTitle}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {l.uspSub}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: l.uspPillar1Title, desc: l.uspPillar1Desc, icon: "M11.42 15.17l-5.658 3.163 1.08-6.305L2.5 7.847l6.327-.92L11.42 1.1l2.593 5.827 6.327.92-4.342 4.181 1.08 6.305z", color: "text-brand-navy", bg: "bg-slate-100" },
              { title: l.uspPillar2Title, desc: l.uspPillar2Desc, icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", color: "text-brand-blue", bg: "bg-blue-50" },
              { title: l.uspPillar3Title, desc: l.uspPillar3Desc, icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z", color: "text-brand-navy", bg: "bg-slate-100" },
              { title: l.uspPillar4Title, desc: l.uspPillar4Desc, icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15", color: "text-brand-navy", bg: "bg-slate-100" },
            ].map((pillar) => (
              <div key={pillar.title} className="text-center p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${pillar.bg} ${pillar.color} flex items-center justify-center mx-auto mb-4`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={pillar.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-brand-navy mb-2">{pillar.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 italic max-w-xl mx-auto">{l.uspFootnote}</p>
          </div>
        </div>
      </section>

      {/* ── SEKTION 1: UNSER AC-PROZESS ── */}
      <section id="prozess" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-blue-200 rounded-full px-4 py-1.5 mb-4">
              {l.processBadge}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-process-headline">
              {l.processTitle}
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              {l.processSub}
            </p>
          </div>
          <div className="space-y-0">
            {processSteps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < processSteps.length - 1 && (
                  <div className="absolute left-[27px] top-[56px] bottom-0 w-px bg-slate-200" />
                )}
                <div className="flex gap-6 py-6">
                  <div className="shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm ${step.ki ? "bg-gradient-to-br from-brand-blue to-blue-700" : "bg-gradient-to-br from-slate-500 to-slate-700"}`}>
                      {step.num}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-bold text-brand-navy font-serif">{step.title}</h3>
                      {step.ki ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">{l.processKi}</span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">{l.processHuman}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 italic max-w-xl mx-auto">{l.processFootnote}</p>
          </div>
        </div>
      </section>

      {/* ── SEKTION 2: ÜBUNGSBIBLIOTHEK ── */}
      <section id="uebungen" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600 border border-purple-200 rounded-full px-4 py-1.5 mb-4">{l.exBadge}</div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-exercises-headline">{l.exTitle}</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">{l.exSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { color: "emerald", title: l.exLib, desc: l.exLibDesc, features: [l.exLibF1, l.exLibF2, l.exLibF3], iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
              { color: "blue", title: l.exAdapt, desc: l.exAdaptDesc, features: [l.exAdaptF1, l.exAdaptF2, l.exAdaptF3], iconPath: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" },
              { color: "purple", title: l.exGen, desc: l.exGenDesc, features: [l.exGenF1, l.exGenF2, l.exGenF3], iconPath: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
            ].map((card) => {
              const colorMap: Record<string, { gradient: string; bg: string; text: string; check: string }> = {
                emerald: { gradient: "from-emerald-500 to-emerald-700", bg: "bg-emerald-50", text: "text-emerald-600", check: "text-emerald-500" },
                blue: { gradient: "from-blue-500 to-blue-700", bg: "bg-blue-50", text: "text-blue-600", check: "text-blue-500" },
                purple: { gradient: "from-purple-500 to-purple-700", bg: "bg-purple-50", text: "text-purple-600", check: "text-purple-500" },
              };
              const c = colorMap[card.color]!;
              return (
                <div key={card.title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${c.gradient}`} />
                  <div className="p-7">
                    <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-5`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={card.iconPath} /></svg>
                    </div>
                    <h3 className="text-base font-bold text-brand-navy mb-2 font-serif">{card.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{card.desc}</p>
                    <div className="space-y-2">
                      {card.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                          <CheckIcon className={`w-3.5 h-3.5 ${c.check} shrink-0`} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SEKTION 3: FALLSTUDIEN ── */}
      <section id="fallstudien" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600 border border-amber-200 rounded-full px-4 py-1.5">{l.csBadge}</div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-casestudy-headline">{l.csTitle}</h2>
              <p className="text-slate-500 leading-relaxed">{l.csSub}</p>
              <div className="space-y-4 pt-2">
                {[
                  { title: l.csStep1Title, desc: l.csStep1Desc, icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
                  { title: l.csStep2Title, desc: l.csStep2Desc, icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
                  { title: l.csStep3Title, desc: l.csStep3Desc, icon: "M4.5 12.75l6 6 9-13.5" },
                ].map((s) => (
                  <div key={s.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8">
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold text-amber-600 font-serif">{l.csBefore}</div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1 bg-amber-300" />
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                    <div className="h-px flex-1 bg-amber-300" />
                  </div>
                  <div className="text-6xl font-bold text-emerald-600 font-serif">{l.csAfter}</div>
                  <p className="text-sm text-slate-500">{l.csLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEKTION 4: KANDIDATENPORTAL ── */}
      <section id="kandidaten" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 border border-blue-200 rounded-full px-4 py-1.5 mb-4">{l.candBadge}</div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-candidates-headline">{l.candTitle}</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">{l.candSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-8">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-base font-bold text-slate-600">{l.candBeforeTitle}</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-500">
                {l.candBeforeItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-300">&bull;</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-base font-bold text-emerald-700">{l.candAfterTitle}</h3>
              </div>
              <div className="space-y-3 text-sm text-emerald-700/70">
                {l.candAfterItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckIcon />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 italic">{l.candFootnote}</p>
          </div>
        </div>
      </section>

      {/* ── SEKTION 5: FRAMEWORKS ── */}
      <section id="frameworks" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 space-y-5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-navy text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex-1 bg-white rounded-lg border border-slate-200 px-4 py-2.5">
                    <p className="text-xs text-slate-400 mb-0.5">{l.fwInput}</p>
                    <p className="text-sm font-medium text-brand-navy">{l.fwInputLabel}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center text-xs font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg border border-blue-200 px-4 py-2.5">
                    <p className="text-xs text-blue-400 mb-0.5">{l.fwProcess}</p>
                    <p className="text-sm font-medium text-brand-navy">{l.fwProcessLabel}</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <div className="flex-1 bg-emerald-50 rounded-lg border border-emerald-200 px-4 py-2.5">
                    <p className="text-xs text-emerald-400 mb-0.5">{l.fwOutput}</p>
                    <p className="text-sm font-medium text-brand-navy">{l.fwOutputLabel}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 border border-emerald-200 rounded-full px-4 py-1.5">{l.fwBadge}</div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-frameworks-headline">{l.fwTitle}</h2>
              <p className="text-slate-500 leading-relaxed">{l.fwSub}</p>
              <div className="space-y-3 pt-2">
                {l.fwFeatures.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-4">{l.trustSectionTitle}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">{l.trustSectionSub}</p>
            <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full mt-6" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { before: l.trustStat1Before, after: l.trustStat1After, label: l.trustStat1Label },
              { before: l.trustStat2Before, after: l.trustStat2After, label: l.trustStat2Label },
              { before: l.trustStat3Before, after: l.trustStat3After, label: l.trustStat3Label },
              { before: l.trustStat4Before, after: l.trustStat4After, label: l.trustStat4Label },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="text-xs text-slate-500 line-through mb-1">{stat.before}</div>
                <div className="text-2xl font-bold text-brand-blue mb-1">{stat.after}</div>
                <div className="text-xs text-slate-300">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z", title: l.trustCard1Title, desc: l.trustCard1Desc },
              { icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z", title: l.trustCard2Title, desc: l.trustCard2Desc },
              { icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z", title: l.trustCard3Title, desc: l.trustCard3Desc },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="w-10 h-10 rounded-lg bg-brand-blue/20 text-brand-blue flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVANCED INTELLIGENCE LAYER ── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600 border border-purple-200 rounded-full px-4 py-1.5 mb-4">{l.aiBadge}</div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif">{l.aiTitle}</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">{l.aiSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { gradient: "from-purple-500 to-purple-700", hoverBorder: "hover:border-purple-200", hoverShadow: "hover:shadow-purple-500/5", dot: "bg-purple-400", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941", title: l.aiPredTitle, desc: l.aiPredDesc, features: [l.aiPredF1, l.aiPredF2, l.aiPredF3] },
              { gradient: "from-blue-500 to-blue-700", hoverBorder: "hover:border-blue-200", hoverShadow: "hover:shadow-blue-500/5", dot: "bg-blue-400", icon: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z", title: l.aiDevTitle, desc: l.aiDevDesc, features: [l.aiDevF1, l.aiDevF2, l.aiDevF3] },
              { gradient: "from-emerald-500 to-emerald-700", hoverBorder: "hover:border-emerald-200", hoverShadow: "hover:shadow-emerald-500/5", dot: "bg-emerald-400", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5", title: l.aiHypTitle, desc: l.aiHypDesc, features: [l.aiHypF1, l.aiHypF2, l.aiHypF3] },
            ].map((card) => (
              <div key={card.title} className={`group rounded-2xl border border-slate-200 p-8 ${card.hoverBorder} hover:shadow-xl ${card.hoverShadow} transition-all`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center mb-6`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{card.desc}</p>
                <div className="space-y-2 text-xs text-slate-400">
                  {card.features.map((f) => (
                    <div key={f} className="flex items-center gap-2"><div className={`w-1 h-1 rounded-full ${card.dot}`} />{f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-serif">{l.compTitle}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50">
              <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{l.compFeature}</div>
              <div className="p-4 text-xs font-semibold text-brand-navy uppercase tracking-wider text-center">{l.compUs}</div>
              <div className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">{l.compThem}</div>
            </div>
            {comparisonFeatures[lang].map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-b border-slate-100 last:border-0`}>
                <div className="p-4 text-sm text-slate-700">{row.feature}</div>
                <div className="p-4 flex justify-center"><CheckIcon className="w-5 h-5 text-emerald-500" /></div>
                <div className="p-4 flex justify-center">
                  {row.them === false && (
                    <svg className="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                  {row.them === "partial" && (
                    <span className="text-xs text-amber-500 font-medium">{l.compPartial}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUTLOOK / AUSBLICK ── */}
      <section id="ausblick" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-brand-navy tracking-wider uppercase mb-4">{l.outlookBadge}</span>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-serif">{l.outlookTitle}</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-2xl mx-auto leading-relaxed">{l.outlookSub}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {(l.outlookItems as Array<{title: string; desc: string; status: string}>).map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-brand-navy">{item.title}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    item.status === "in_dev" ? "bg-emerald-100 text-emerald-700" :
                    item.status === "planned" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-200 text-slate-500"
                  }`}>
                    {item.status === "in_dev" ? l.outlookStatusInDev :
                     item.status === "planned" ? l.outlookStatusPlanned :
                     l.outlookStatusVision}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-400 italic max-w-2xl mx-auto leading-relaxed">{l.outlookDisclaimer}</p>
          </div>
        </div>
      </section>

      {/* ── LOGIN SECTION ── */}
      <section id="signin" ref={loginRef} className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-login-headline">{l.loginTitle}</h2>
            <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">{l.loginSub}</p>
          </div>

          {!activeMode && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {accessCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => { setActiveMode(card.id); setError(""); }}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    data-testid={`button-access-${card.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center mb-4`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 font-serif">{card.title}</h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">{card.subtitle}</p>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">{card.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      {l.loginBtn}
                      <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </div>
                  </button>
                ))}
              </div>

              <div className="max-w-4xl mx-auto mt-8">
                <a
                  href="/w/arag"
                  className="group block w-full bg-gradient-to-r from-[#1a1a1a] to-[#333] rounded-2xl border border-[#FFD700]/30 p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 hover:border-[#FFD700]/60"
                  data-testid="button-arag-bdp-entry"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFD700] text-black flex items-center justify-center font-bold text-xl">A</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FFD700] transition-colors">Direkte Anmeldung im Projekt</h3>
                      <p className="text-xs text-white/50 mt-0.5">ARAG Business Development Pitch · Evaluation Tool</p>
                    </div>
                    <svg className="w-5 h-5 text-[#FFD700] transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </div>
                </a>
              </div>
            </>
          )}

          {activeMode && (
            <div className="max-w-sm mx-auto">
              <button onClick={resetForm} className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6 transition" data-testid="button-back">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                {l.loginBack}
              </button>
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                {(() => {
                  const card = accessCards.find((c) => c.id === activeMode)!;
                  return (
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 font-serif">{card.title}</h3>
                        <p className="text-xs text-slate-400">{card.subtitle}</p>
                      </div>
                    </div>
                  );
                })()}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs" data-testid="text-login-error">{error}</div>
                )}

                {activeMode === "master" && (
                  <form onSubmit={handleMasterLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginPwLabel}</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={l.loginMasterPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500" autoFocus data-testid="input-master-password" />
                    <button type="submit" disabled={loading || !password} className="w-full mt-4 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition" data-testid="button-master-login">
                      {loading ? l.loginLoading : l.loginMasterBtn}
                    </button>
                  </form>
                )}

                {activeMode === "workspace" && (
                  <form onSubmit={handleWorkspaceLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginWsLabel}</label>
                    <input type="text" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())} placeholder={l.loginWsPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" autoFocus data-testid="input-workspace-slug" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginEmailLabel}</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.loginEmailPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3" data-testid="input-workspace-email" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginPwLabel}</label>
                    <input type="password" value={wsPassword} onChange={(e) => setWsPassword(e.target.value)} placeholder={l.loginPwPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-testid="input-workspace-password" />
                    <button type="submit" disabled={loading || !workspaceSlug || !email || !wsPassword} className="w-full mt-4 px-4 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition" data-testid="button-workspace-login">
                      {loading ? l.loginLoading : l.loginWorkBtn}
                    </button>
                  </form>
                )}

                {activeMode === "candidate" && (
                  <form onSubmit={handleCandidateLogin}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginWsLabel}</label>
                    <input type="text" value={workspaceSlug} onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())} placeholder={l.loginWsPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3" autoFocus data-testid="input-candidate-workspace" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginEmailLabel}</label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder={l.loginEmailPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3" data-testid="input-candidate-email" />
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l.loginPwLabel}</label>
                    <input type="password" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} placeholder={l.loginPwPh} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500" data-testid="input-candidate-password" />
                    <button type="submit" disabled={loading || !workspaceSlug || !candidateEmail || !candidatePassword} className="w-full mt-4 px-4 py-2.5 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition" data-testid="button-candidate-login">
                      {loading ? l.loginLoading : l.loginCandBtn}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STICKY FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 py-3 bg-slate-50/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500" data-testid="text-footer-copy">{l.footerCopy}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{l.footerSub}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
