import { useState, useCallback } from "react";

type Lang = "de" | "en";

const translations: Record<string, Record<Lang, string>> = {
  "nav.back_to_portal": { de: "Zurück zum Portal", en: "Back to Portal" },
  "nav.active_module": { de: "Aktives Modul", en: "Active Module" },
  "nav.confidential": { de: "Vertraulich", en: "Confidential" },
  "nav.confidential_msg": { de: "Zugriff auf gesicherte Assessment-Umgebung. Alle Eingaben werden protokolliert.", en: "Accessing secure assessment environment. All inputs are logged." },
  "nav.overview": { de: "Übersicht", en: "Overview" },
  "nav.press": { de: "Presse & Medien", en: "Press & Media" },
  "nav.emails": { de: "Kommunikation", en: "Communications" },
  "nav.briefing": { de: "Strategisches Briefing", en: "Strategic Briefing" },
  "nav.dataroom": { de: "Datenraum", en: "Data Room" },
  "nav.financials": { de: "Finanzdaten", en: "Financial Visualization" },
  "nav.assessment": { de: "Bewertungsbereich", en: "Assessment Workspace" },

  "header.suite": { de: "Aestimamus Suite", en: "Aestimamus Suite" },
  "header.elapsed": { de: "Verstrichene Zeit", en: "Elapsed Time" },
  "header.progress": { de: "Fortschritt", en: "Progress" },

  "timer.remaining": { de: "Verbleibend", en: "Remaining" },
  "timer.elapsed": { de: "Vergangen", en: "Elapsed" },

  "briefing.title": { de: "Strategisches Briefing", en: "Strategic Briefing" },
  "briefing.subtitle": { de: "Vertrauliche Anweisungen für den unabhängigen Gutachter", en: "Confidential Instructions for the Independent Assessor" },
  "briefing.confirm": { de: "Ich bestätige, dass ich die Materialien vollständig gelesen habe und bereit bin, mit der Bewertung fortzufahren.", en: "I confirm that I have fully read the materials and am ready to proceed with the assessment." },
  "briefing.proceed": { de: "Zur Bewertung", en: "Proceed to Assessment" },
  "briefing.confirmed": { de: "Briefing bestätigt", en: "Briefing Confirmed" },

  "assessment.title": { de: "Executive Bewertung", en: "Executive Assessment" },
  "assessment.subtitle": { de: "Formulieren Sie Ihr Urteil zur Situation des Konzerns", en: "Formulate your judgment on the Group's situation" },
  "assessment.saving": { de: "Wird gespeichert...", en: "Saving..." },
  "assessment.unsaved": { de: "Ungespeicherte Änderungen", en: "Unsaved changes" },
  "assessment.saved": { de: "Alles gespeichert", en: "All saved" },
  "assessment.save_draft": { de: "Entwurf speichern", en: "Save Draft" },
  "assessment.finalize": { de: "Bericht abschließen", en: "Finalize Report" },
  "assessment.analysis": { de: "1. Analysephase", en: "1. Analysis Phase" },
  "assessment.conclusions": { de: "2. Strategische Schlussfolgerungen", en: "2. Strategic Conclusions" },
  "assessment.placeholder_analysis": { de: "Geben Sie Ihre Analyse hier ein...", en: "Enter your assessment here..." },
  "assessment.placeholder_conclusion": { de: "Geben Sie Ihre Schlussfolgerung hier ein...", en: "Enter your conclusion here..." },
  "assessment.guidance": { de: "Hinweis:", en: "Guidance:" },
  "assessment.guidance_text": { de: "Konzentrieren Sie sich auf Klarheit der Argumentation und expliziten Umgang mit Zielkonflikten. Ziel ist keine \"umfassende Handlungsempfehlung\", sondern eine klare, Executive-Level Einschätzung unter Unsicherheit.", en: "Focus on clarity of reasoning and explicit handling of trade-offs. The objective is not to propose a \"comprehensive action plan\" but to provide a clear, senior-level assessment under uncertainty." },
  "assessment.next_conclusions": { de: "Weiter: Schlussfolgerungen", en: "Next: Conclusions" },
  "assessment.chars": { de: "Zeichen", en: "characters" },
  "assessment.locked": { de: "Bitte bestätigen Sie zuerst das Briefing, bevor Sie auf die Bewertung zugreifen.", en: "Please confirm the briefing first before accessing the assessment." },
  "assessment.go_briefing": { de: "Zum Briefing", en: "Go to Briefing" },
  "assessment.self_assessment": { de: "3. Selbsteinschätzung", en: "3. Self-Assessment" },
  "assessment.self_assessment_intro": { de: "Bewerten Sie Ihre eigenen Kompetenzen auf einer Skala von 1-5.", en: "Rate your own competencies on a scale of 1-5." },
  "assessment.reflection": { de: "Reflexion (optional)", en: "Reflection (optional)" },

  "landing.title": { de: "Executive Diagnostics Suite", en: "Executive Diagnostics Suite" },
  "landing.subtitle": { de: "Willkommen in der digitalen Assessment-Umgebung von aestimamus. Dieser geschützte Bereich bietet Ihnen Zugang zu den Materialien und Übungen Ihres Executive Assessment Centers.", en: "Welcome to the digital assessment environment of aestimamus. This protected area provides access to the materials and exercises of your Executive Assessment Center." },
  "landing.access_title": { de: "Geschützter Zugang", en: "Protected Access" },
  "landing.access_subtitle": { de: "Nur für autorisierte Teilnehmende", en: "Authorized participants only" },
  "landing.code_label": { de: "Zugangscode", en: "Access Code" },
  "landing.code_placeholder": { de: "Zugangscode eingeben", en: "Enter access code" },
  "landing.submit": { de: "Zugang erhalten", en: "Access Portal" },
  "landing.checking": { de: "Wird überprüft...", en: "Verifying..." },
  "landing.error": { de: "Ungültiger Zugangscode. Bitte versuchen Sie es erneut.", en: "Invalid access code. Please try again." },
  "landing.help": { de: "Sie haben Ihren Zugangscode per E-Mail erhalten. Bei Fragen wenden Sie sich bitte an Ihre Ansprechperson bei aestimamus.", en: "You received your access code by email. For questions, please contact your aestimamus representative." },
  "landing.focus_title": { de: "Fokus auf Executive Diagnostics", en: "Focus on Executive Diagnostics" },
  "landing.focus_text": { de: "Wir stehen für Executive Diagnostics auf höchstem Niveau. Als spezialisierte Boutique-Beratung schaffen wir belastbare Entscheidungsgrundlagen zur Förderung der Führungs- und somit Zukunftsfähigkeit Ihrer Organisation.", en: "We stand for Executive Diagnostics at the highest level. As a specialized boutique consultancy, we create reliable decision-making foundations to promote leadership and future viability of your organization." },
  "landing.pillar1_title": { de: "Exklusivität durch Fokussierung", en: "Exclusivity through Focus" },
  "landing.pillar1_text": { de: "Unsere Spezialisierung auf Executive Diagnostics sichert unabhängige, fundierte Entscheidungen auf Top-Management-Ebene — mit fachlicher Tiefe und relevanter Benchmark-Erfahrung ohne Zielkonflikte.", en: "Our specialization in Executive Diagnostics ensures independent, well-founded decisions at top management level — with professional depth and relevant benchmark experience without conflicts of interest." },
  "landing.pillar2_title": { de: "Partnerschaften auf Augenhöhe", en: "Partnerships at Eye Level" },
  "landing.pillar2_text": { de: "Wir arbeiten nach dem Prinzip One Face to the Customer. Unsere Kunden profitieren von persönlicher Kontinuität in der Betreuung, hoher Servicequalität und maximaler Flexibilität.", en: "We work on the One Face to the Customer principle. Our clients benefit from personal continuity in support, high service quality and maximum flexibility." },
  "landing.pillar3_title": { de: "Verantwortung mit nachhaltiger Wirkung", en: "Responsibility with Lasting Impact" },
  "landing.pillar3_text": { de: "Wir verbinden kurzfristige Lieferfähigkeit mit innovativen Ansätzen und einem expliziten Fokus auf langfristige Wertschöpfung für unsere Kunden.", en: "We combine short-term delivery capability with innovative approaches and an explicit focus on long-term value creation for our clients." },
  "landing.quicklinks_title": { de: "Direktzugang", en: "Quick Access" },
  "landing.link_observer": { de: "Observer-Ansicht", en: "Observer View" },
  "landing.link_observer_desc": { de: "Live-Beobachtung und Kompetenzbewertung von Kandidaten", en: "Live observation and competency rating of candidates" },
  "landing.link_admin": { de: "Administration", en: "Administration" },
  "landing.link_admin_desc": { de: "Dashboard für Ergebnisse, Berichte und Verwaltung", en: "Dashboard for results, reports and management" },

  "platform.title": { de: "Executive Diagnostics Platform", en: "Executive Diagnostics Platform" },
  "platform.hero_title": { de: "Enterprise-Grade Executive Diagnostics", en: "Enterprise-Grade Executive Diagnostics" },
  "platform.hero_subtitle": { de: "Die sichere, mandantenfähige Plattform für Executive Assessment Centers. Kompetenzbasierte Bewertung, KI-gestützte Analyse und umfassende Berichterstattung — alles in einer Lösung.", en: "The secure, multi-tenant platform for Executive Assessment Centers. Competency-based evaluation, AI-powered analysis, and comprehensive reporting — all in one solution." },
  "platform.candidate_login": { de: "Kandidaten-Login", en: "Candidate Login" },
  "platform.master_admin": { de: "Master Admin", en: "Master Admin" },
  "platform.master_password": { de: "Master-Passwort", en: "Master Password" },
  "platform.master_password_placeholder": { de: "Master-Passwort eingeben", en: "Enter master password" },
  "platform.master_error": { de: "Ungültiges Master-Passwort.", en: "Invalid master password." },
  "platform.features_title": { de: "Plattform-Funktionen", en: "Platform Features" },
  "platform.roles_title": { de: "Rollenbasierter Zugang", en: "Role-Based Access" },
  "platform.feature_roles": { de: "Rollenbasierte Portale", en: "Role-Based Portals" },
  "platform.feature_roles_desc": { de: "Getrennte Portale für Admin, Moderator, Observer, Kandidat und HR-Client", en: "Separate portals for Admin, Moderator, Observer, Candidate and HR Client" },
  "platform.feature_ai": { de: "KI-gestützte Analyse", en: "AI-Powered Analysis" },
  "platform.feature_ai_desc": { de: "ChatGPT-artige Assistenz für Bewertung, Transkription und Berichterstellung", en: "ChatGPT-style assistance for evaluation, transcription and reporting" },
  "platform.feature_competency": { de: "Kompetenzmodelle", en: "Competency Frameworks" },
  "platform.feature_competency_desc": { de: "Flexible Kompetenzhierarchien mit konfigurierbaren Skalen und Gewichtungen", en: "Flexible competency hierarchies with configurable scales and weightings" },
  "platform.feature_observer": { de: "Echtzeit-Beobachtung", en: "Real-Time Observation" },
  "platform.feature_observer_desc": { de: "Offline-fähige Observer-Ansicht mit Live-Synchronisation", en: "Offline-capable observer view with live synchronization" },
  "platform.feature_audit": { de: "Audit & Compliance", en: "Audit & Compliance" },
  "platform.feature_audit_desc": { de: "Vollständige Audit-Trails, Versionierung und EU-Datenresidenz", en: "Complete audit trails, versioning and EU data residency" },
  "platform.feature_reports": { de: "Erweiterte Berichte", en: "Advanced Reporting" },
  "platform.feature_reports_desc": { de: "Automatisierte PDF/DOCX-Berichte mit Radar-Charts und Benchmarking", en: "Automated PDF/DOCX reports with radar charts and benchmarking" },
  "platform.footer_credit": { de: "© Christoph Aldering · Private Initiative / Konzept", en: "© Christoph Aldering · Private initiative / concept" },
  "platform.role_admin": { de: "Administrator", en: "Administrator" },
  "platform.role_admin_desc": { de: "Vollständige Systemverwaltung, Workspace-Konfiguration und Benutzerverwaltung", en: "Full system management, workspace configuration and user administration" },
  "platform.role_moderator": { de: "Moderator", en: "Moderator" },
  "platform.role_moderator_desc": { de: "Assessment-Durchführung, Konsolidierung und Berichterstellung", en: "Assessment execution, consolidation and report generation" },
  "platform.role_observer": { de: "Observer", en: "Observer" },
  "platform.role_observer_desc": { de: "Kandidatenbeobachtung, Kompetenzbewertung und Notizen", en: "Candidate observation, competency rating and notes" },
  "platform.role_assistant": { de: "Projektassistenz", en: "Project Assistant" },
  "platform.role_assistant_desc": { de: "Dokumentenverwaltung, Terminplanung und Einladungen", en: "Document management, scheduling and invitations" },
  "platform.role_hr": { de: "HR-Client", en: "HR Client" },
  "platform.role_hr_desc": { de: "Konfigurierter Zugang zu Ergebnissen und Berichten", en: "Configured access to results and reports" },
  "platform.role_candidate": { de: "Kandidat", en: "Candidate" },
  "platform.role_candidate_desc": { de: "Assessment-Dashboard, Übungen und Materialien", en: "Assessment dashboard, exercises and materials" },

  "portal.title": { de: "Kundenbereich", en: "Client Area" },
  "portal.subtitle": { de: "Wählen Sie den Kundenbereich, für den Sie freigeschaltet wurden. Für den Zugang zu den einzelnen Bereichen ist ein separater Zugangscode erforderlich.", en: "Select the client area you have been authorized for. A separate access code is required for each area." },

  "customer.access_title": { de: "Kundenzugang", en: "Client Access" },
  "customer.access_subtitle_prefix": { de: "Geben Sie den Zugangscode für", en: "Enter the access code for" },
  "customer.access_subtitle_suffix": { de: "ein.", en: "." },
  "customer.code_label": { de: "Zugangscode", en: "Access Code" },
  "customer.code_placeholder": { de: "Kundenspezifischen Code eingeben", en: "Enter client-specific code" },
  "customer.submit": { de: "Zugang erhalten", en: "Access Area" },
  "customer.checking": { de: "Wird überprüft...", en: "Verifying..." },
  "customer.error": { de: "Ungültiger Zugangscode für diesen Kundenbereich.", en: "Invalid access code for this client area." },
  "customer.help": { de: "Der kundenspezifische Zugangscode wurde Ihnen separat mitgeteilt.", en: "The client-specific access code was provided to you separately." },
  "customer.exercises_title": { de: "Übungen & Materialien", en: "Exercises & Materials" },
  "customer.exercises_subtitle": { de: "Nachfolgend finden Sie die für Sie vorbereiteten Assessment-Übungen.", en: "Below you will find the assessment exercises prepared for you." },
  "customer.available": { de: "Verfügbar", en: "Available" },
  "customer.coming_soon": { de: "In Vorbereitung", en: "Coming Soon" },
  "customer.duration": { de: "Geschätzte Dauer", en: "Estimated Duration" },
  "customer.launch": { de: "Übung starten", en: "Start Exercise" },
  "customer.locked": { de: "Noch nicht verfügbar", en: "Not yet available" },
  "customer.not_found": { de: "Kundenbereich nicht gefunden", en: "Client area not found" },
  "customer.back": { de: "Zurück zur Übersicht", en: "Back to Overview" },
  "customer.overview": { de: "Kundenübersicht", en: "Client Overview" },

  "workspaces.title": { de: "Workspace-Auswahl", en: "Workspace Selection" },
  "workspaces.subtitle": { de: "Wählen Sie einen Workspace zur Verwaltung", en: "Select a workspace to manage" },
  "workspaces.password": { de: "Workspace-Passwort", en: "Workspace Password" },
  "workspaces.enter": { de: "Workspace betreten", en: "Enter Workspace" },
  "workspaces.error": { de: "Ungültiges Workspace-Passwort.", en: "Invalid workspace password." },
  "workspaces.logout": { de: "Abmelden", en: "Log Out" },

  "login.title": { de: "Anmelden", en: "Sign In" },
  "login.subtitle": { de: "Melden Sie sich in Ihrem Konto an", en: "Sign in to your account" },
  "login.email": { de: "E-Mail-Adresse", en: "Email Address" },
  "login.password": { de: "Passwort", en: "Password" },
  "login.submit": { de: "Anmelden", en: "Sign In" },
  "login.error": { de: "Ungültige Anmeldedaten.", en: "Invalid credentials." },
  "login.change_password_title": { de: "Passwort ändern", en: "Change Password" },
  "login.change_password_subtitle": { de: "Bitte ändern Sie Ihr Passwort bei der ersten Anmeldung.", en: "Please change your password on first login." },
  "login.new_password": { de: "Neues Passwort", en: "New Password" },
  "login.confirm_password": { de: "Passwort bestätigen", en: "Confirm Password" },
  "login.change_submit": { de: "Passwort ändern", en: "Change Password" },
  "login.password_mismatch": { de: "Passwörter stimmen nicht überein.", en: "Passwords do not match." },
  "login.back": { de: "Zurück zur Plattform", en: "Back to platform" },

  "candidate.title": { de: "Meine Assessments", en: "My Assessments" },
  "candidate.welcome": { de: "Willkommen", en: "Welcome" },
  "candidate.no_assessments": { de: "Derzeit sind keine Assessments für Sie geplant.", en: "No assessments are currently scheduled for you." },
  "candidate.start_exercise": { de: "Übung starten", en: "Start Exercise" },
  "candidate.organization": { de: "Organisation", en: "Organization" },
  "candidate.status": { de: "Status", en: "Status" },
  "candidate.language": { de: "Sprache", en: "Language" },
  "candidate.logout": { de: "Abmelden", en: "Log Out" },

  "workspace.assessments": { de: "Assessments", en: "Assessments" },
  "workspace.manage": { de: "Verwalten", en: "Manage" },
  "workspace.info": { de: "Workspace-Info", en: "Workspace Info" },
  "workspace.data_residency": { de: "Datenresidenz", en: "Data Residency" },
  "workspace.quick_links": { de: "Schnellzugriff", en: "Quick Links" },
  "workspace.back": { de: "Zurück", en: "Back" },
  "workspace.no_assessments": { de: "Keine Assessments in diesem Workspace.", en: "No assessments in this workspace." },

  "lang.toggle": { de: "EN", en: "DE" },
  "footer.tagline": { de: "Excellence in Executive Diagnostics", en: "Excellence in Executive Diagnostics" },
};

const STORAGE_KEY = "aestimamus_lang";

function getSavedLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "de") return saved;
  } catch {}
  return "de";
}

let currentLang: Lang = getSavedLang();
let listeners: Array<() => void> = [];

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach(fn => fn());
}

export function toggleLang() {
  setLang(currentLang === "de" ? "en" : "de");
}

export function t(key: string): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[currentLang] || entry["de"] || key;
}

export function useLang(): { lang: Lang; t: (key: string) => string; toggle: () => void } {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick(n => n + 1), []);

  useState(() => {
    listeners.push(forceUpdate);
    return () => {
      listeners = listeners.filter(fn => fn !== forceUpdate);
    };
  });

  return { lang: currentLang, t, toggle: toggleLang };
}
