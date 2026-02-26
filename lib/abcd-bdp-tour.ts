export interface TourStep {
  id: string;
  title: string;
  body: string;
  targetTestId?: string;
  route?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface TourConfig {
  role: string;
  isAdmin: boolean;
  environment: string;
}

const adminSteps: TourStep[] = [
  {
    id: "admin-welcome",
    title: "Willkommen im ARAG BDP",
    body: "Diese Tour zeigt Ihnen die wichtigsten Funktionen des Bewertungs- und Diagnostik-Tools. Sie sind als Administrator angemeldet – Sie haben vollen Zugriff.",
    placement: "center",
  },
  {
    id: "admin-nav-home",
    title: "Dashboard",
    body: "Ihr Einstiegspunkt: Hier sehen Sie eine Übersicht aller Sessions, Teams und den aktuellen Status auf einen Blick.",
    targetTestId: "bdp-tab-home",
    placement: "top",
  },
  {
    id: "admin-nav-sessions",
    title: "Sessions verwalten",
    body: "Sessions durchlaufen den Lifecycle DRAFT → OPEN → CLOSED → RELEASED. Erst nach RELEASED werden Ergebnisse sichtbar.",
    targetTestId: "bdp-tab-sessions",
    placement: "top",
  },
  {
    id: "admin-nav-bewertung",
    title: "Bewertung",
    body: "Hier vergeben Beobachter ihre Punkte. Pro Kriterium werden exakt 100 Punkte auf die Teams verteilt. Die Summe muss immer 100 ergeben – kein Punkt mehr, kein Punkt weniger.",
    targetTestId: "bdp-tab-bewertung",
    placement: "top",
  },
  {
    id: "admin-console",
    title: "Admin-Konsole",
    body: "Ihr Kommandozentrum: Sessions anlegen, Teams und Teilnehmer pflegen, Beobachter zuordnen, Kriterien konfigurieren. Alles an einem Ort.",
    targetTestId: "bdp-menu-admin",
    placement: "bottom",
  },
  {
    id: "admin-tiebreak",
    title: "Tie-Break & Ergebnisse",
    body: "Bei Punktegleichstand entscheidet der Tie-Break. Die Differenz wird halbiert und dem Gewinner zugeschlagen. Mathematisch sauber, sportlich fair.",
    placement: "center",
  },
  {
    id: "admin-export",
    title: "Exporte",
    body: "CSV, JSON oder Druckansicht – anonym oder mit Klarnamen. Ergebnisse lassen sich erst nach RELEASE exportieren.",
    targetTestId: "bdp-side-exports",
    placement: "bottom",
  },
  {
    id: "admin-sponsor",
    title: "Sponsor-Flag",
    body: "Beobachter können sich als Sponsor eines Teams kennzeichnen. Das dient der Transparenz – auf die Siegerlogik hat es keinen Einfluss.",
    placement: "center",
  },
  {
    id: "admin-notes",
    title: "Individual Notes",
    body: "Beobachter können pro Teilnehmer qualitative Notizen erfassen. Diese sind Zusatzinformationen und fließen nicht in die Punktwertung ein.",
    placement: "center",
  },
  {
    id: "admin-demo-hint",
    title: "DEMO vs. LIVE",
    body: "Im DEMO-Modus können Sie alles ausprobieren, ohne echte Daten zu beeinflussen. Scores sind auch in geschlossenen Sessions editierbar. Perfekt zum Kennenlernen.",
    placement: "center",
  },
];

const observerSteps: TourStep[] = [
  {
    id: "obs-welcome",
    title: "Willkommen, Beobachter!",
    body: "Sie sind als Beobachter angemeldet. Ihre Aufgabe: Teams in den zugewiesenen Sessions bewerten. Diese Tour erklärt Ihnen den Ablauf.",
    placement: "center",
  },
  {
    id: "obs-nav-home",
    title: "Ihr Dashboard",
    body: "Auf der Startseite sehen Sie Ihre zugewiesenen Sessions und den aktuellen Status.",
    targetTestId: "bdp-tab-home",
    placement: "top",
  },
  {
    id: "obs-sessions",
    title: "Sessions",
    body: "Hier finden Sie alle Sessions. Nur offene Sessions (Status OPEN) können bewertet werden.",
    targetTestId: "bdp-tab-sessions",
    placement: "top",
  },
  {
    id: "obs-bewertung",
    title: "Bewertung abgeben",
    body: "Pro Kriterium verteilen Sie genau 100 Punkte auf die Teams der Session. Die Summe muss exakt 100 ergeben. Schieben Sie die Regler, bis die Verteilung stimmt.",
    targetTestId: "bdp-tab-bewertung",
    placement: "top",
  },
  {
    id: "obs-sponsor",
    title: "Sponsor-Kennzeichnung",
    body: "Falls Sie ein Team besonders betreuen, markieren Sie sich als Sponsor. Das ist rein informativ und beeinflusst die Ergebnisse nicht.",
    placement: "center",
  },
  {
    id: "obs-notes",
    title: "Individuelle Notizen",
    body: "Zu jedem Teilnehmer können Sie qualitative Beobachtungen festhalten – Beitrag, Präsenz und freie Notizen. Diese ergänzen die Punktbewertung.",
    placement: "center",
  },
  {
    id: "obs-save",
    title: "Bewertung speichern",
    body: "Vergessen Sie nicht, Ihre Bewertung abzugeben! Die Punkte werden erst nach dem Speichern übernommen.",
    placement: "center",
  },
  {
    id: "obs-demo-hint",
    title: "Hinweis zum Modus",
    body: "Im DEMO-Modus können Sie frei experimentieren. In LIVE sind geschlossene Sessions nicht mehr editierbar.",
    placement: "center",
  },
];

const participantSteps: TourStep[] = [
  {
    id: "tn-welcome",
    title: "Willkommen!",
    body: "Sie sind als Teilnehmer registriert. Hier sehen Sie Ihre Sessions und Ergebnisse, sobald diese abgeschlossen sind.",
    placement: "center",
  },
  {
    id: "tn-nav-home",
    title: "Ihr Dashboard",
    body: "Die Startseite zeigt Ihnen eine Übersicht über Ihre zugeordneten Sessions.",
    targetTestId: "bdp-tab-home",
    placement: "top",
  },
  {
    id: "tn-sessions",
    title: "Sessions",
    body: "Hier sehen Sie die Sessions, denen Sie als Teilnehmer zugeordnet sind, und deren aktuellen Status.",
    targetTestId: "bdp-tab-sessions",
    placement: "top",
  },
  {
    id: "tn-results",
    title: "Ergebnisse",
    body: "Nach Abschluss durch den Administrator können Sie die Auswertung einsehen.",
    placement: "center",
  },
  {
    id: "tn-profile",
    title: "Ihr Profil",
    body: "Unter Profil können Sie Ihre persönlichen Einstellungen anpassen.",
    targetTestId: "link-profile",
    placement: "bottom",
  },
  {
    id: "tn-demo-hint",
    title: "DEMO-Modus",
    body: "Im DEMO-Modus sind Beispieldaten geladen. In LIVE sehen Sie Ihre echten Ergebnisse.",
    placement: "center",
  },
];

export function getTourSteps(config: TourConfig): TourStep[] {
  const { role, isAdmin } = config;

  if (isAdmin) return adminSteps;

  const r = role?.toUpperCase() || "";
  if (r.includes("TEILNEHMER") || r.includes("PARTICIPANT") || r.includes("CANDIDATE")) {
    return participantSteps;
  }

  return observerSteps;
}
