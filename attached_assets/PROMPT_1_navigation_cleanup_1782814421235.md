# REPLIT AGENT — DIREKTIVE 1 von 2: Navigation & Struktur-Bereinigung EDS

**Kontext:** Reine UI-/Navigations-Bereinigung der Executive Diagnostics Suite, vorbereitend für einen geplanten Server-Umzug. Ziel: ein aufgeräumtes, eindeutig benanntes, sofort verständliches Tool — ohne Datenmodell- oder API-Logikänderungen. Eine zweite Direktive (Prompt-Bibliothek) folgt separat und setzt auf dem Ergebnis dieser hier auf — daher hier KEINE Schema-Migrationen.

**Arbeitsmodus:** Schritte 1–7 strikt sequenziell. Commit nach jedem Schritt (`nav-cleanup: Schritt N — <Kurz>`). Schritt N+1 erst starten, wenn N fehlerfrei läuft (`npm run dev` startet, betroffene Seiten laden ohne Konsolenfehler). Im Zweifel: entscheide zugunsten von **weniger sichtbaren Punkten und eindeutigeren Begriffen** — frag nur bei den unten markierten Stellen nach.

---

## STRIKTE GRENZEN — NICHT ANFASSEN
- Auth, Cookies, RBAC (`lib/rbac.ts`, `middleware.ts`)
- Prisma-Schema (`prisma/schema.prisma`) — **keine Migrationen in dieser Direktive**
- Alle API-Routen-Logik unter `app/api/**` (Frontend-Aufrufe identisch lassen)
- COMP BDP (`app/comp-bdp/**`) und ABCD-Klon (`app/abcd-bdp/**`) — komplett unberührt
- Candidate Portal (`app/candidate/**`, `app/candidate-access/**`) — unberührt
- **Die Footer-Credit-Zeile** „© Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!" — überall **wortgleich erhalten**, nicht umformulieren, nicht entfernen, nicht ergänzen.
- Business-Logik in `lib/` und `server/`

Würde ein Schritt eine dieser Grenzen berühren → stoppen und melden.

---

## SCHRITT 1 — Feature-Flag-Filterung in ContextPanel aktivieren (Bugfix)
**Befund:** `lib/feature-flags.ts` enthält `MODULE_REGISTRY`, `NAV_MODULE_MAP`, `isModuleReleased()`. Der API-Endpoint `app/api/w/[workspaceSlug]/feature-flags/route.ts` existiert. Aber `components/shell/ContextPanel.tsx` rendert aktuell ALLE Nav-Punkte ungefiltert — das Flag-System ist im aktuellen Shell-Rebuild nicht verdrahtet.

**Auftrag:** In `ContextPanel.tsx` die `featureFlags` des Workspace laden (gleiches Fetch-Pattern wie der bestehende `assessments`-Fetch, Endpoint `/api/w/${workspaceSlug}/feature-flags`). Jeden `NavLink` über `isModuleReleased(moduleKey, featureFlags, isMaster)` filtern (`moduleKey` via `NAV_MODULE_MAP`). Master-Admins sehen weiterhin alles; nicht freigegebene Punkte für Master mit dezentem „Beta"-Badge (reduzierte Opacity + kleiner Text), kein aufwändiges neues UI.

---

## SCHRITT 2 — ContextPanel: 7 → 5 Gruppen
Ersetze die Gruppenstruktur im Body von `ContextPanel.tsx` (nicht `AssessmentContextNav`) durch exakt diese fünf Gruppen, in dieser Reihenfolge:

```
Dashboard (Link, kein Gruppenlabel)
Assessments (Link, kein Gruppenlabel)

GRUPPE "Diagnostik-Aufbau"
  - Anforderungsanalyse        → requirements
  - Kompetenzmanagement        → competencies
  - Beobachtungsbögen          → observation-sheets

GRUPPE "Übungsentwicklung"
  - Modul-Designer             → modules
  - Baustein-Bibliothek        → exercise-library
  - Fallstudie                 → (korrekte Route, siehe Schritt 3)

GRUPPE "Durchführung & Auswertung"
  - Analytics & Berichte       → analytics
  - Berichte (Export)          → reports
  - Gutachten-Generator        → gutachten

GRUPPE "Verwaltung" (CollapsibleGroup, defaultOpen=false außer aktive Route liegt darin)
  - People                     → users
  - Consent-Management         → consents
  - Zugriffsanfragen           → access-requests
  - Corporate Design & Theming → brand-rules (Theme als Unterseite/Tab dort integrieren falls ohne API-Änderung machbar; sonst beide Punkte direkt untereinander)
  - AI-Governance              → ai-governance
  - Advanced Intelligence      → intelligence
  - Audio & Transkription      → audio
```

Live-Assessments-Liste am Ende bleibt unverändert. Diese Gruppierung greift NACH der Flag-Filterung aus Schritt 1.

---

## SCHRITT 3 — Data-Room-Namenskollision auflösen (UI-Ebene)
**Befund:** Zwei unabhängige Features teilen umgangssprachlich „Data Room":
1. **Fallstudien-Funktion** (Portal-Inhalt, Modelle `DataRoomCategory`/`PortalDocument`), Admin-UI unter `app/w/[workspaceSlug]/admin/data-room/page.tsx`, in `ContextPanel.tsx` fälschlich „Fallstudie Varexia". Die `TopBar.tsx`-Breadcrumb-Map kennt zusätzlich `case-study-dataroom` → „Fallstudie-Verwaltung". **Kläre, welche Route die tatsächlich funktionierende Admin-UI bedient** und verlinke korrekt.
2. **Externes Datenraum-Tracking-Tool** (`DataRoomAccessLink`/`DataRoomEvent`, Routen `/dr`, `/dr/setup`) — eigenständiges Tracking-Werkzeug für extern gehostete Due-Diligence-Datenräume (Link-Generierung, Live-Sessions, `drTrackOpen`/`drTrackLeave`-Hooks). Inhaltlich getrennt von der AC-Suite.

**Auftrag:**
1. Nav-Punkt der Fallstudien-Funktion eindeutig **„Fallstudie"** benennen (nicht „Varexia" — das ist nur der Demo-Mandant) und korrekt verlinken.
2. Gruppe „Datenräume" (`/dr`, `/dr/setup`) vollständig aus dem regulären `ContextPanel.tsx` entfernen.
3. Neuen, **ausschließlich für `isMaster === true` sichtbaren** Bereich „Sonderfunktionen" schaffen: in `IconRail.tsx` einen Rail-Eintrag ergänzen (gleiches `isMaster`-Pattern wie der bestehende `platform`-Eintrag), passendes Icon im Stil der vorhandenen Icon-Komponenten, Ziel `/dr`. Bei aktiver `/dr`-Route zeigt `ContextPanel.tsx` eine eigene Mini-Navigation („Zugriffslinks" `/dr`, „Konfiguration" `/dr/setup`), analog zum bestehenden `AssessmentContextNav`-Pattern.
4. Keine Daten, Routenpfade oder API-Endpunkte löschen/umbenennen — nur Sichtbarkeit/Position.

---

## SCHRITT 4 — Begriffskonsistenz (nur sichtbarer UI-Text)
In `components/shell/*.tsx` und den Admin-Seiten-Headern (`app/w/[workspaceSlug]/admin/**/page.tsx`) „Data Room"/„Datenraum" im Kontext der Fallstudien-Funktion durch „Fallstudie" ersetzen. „Datenraum" bleibt reserviert für den Sonderfunktionen-Bereich aus Schritt 3. **Code-interne Bezeichner (Variablen, Funktionen, Prisma-Modelle, Dateinamen) NICHT anfassen** — kein Refactoring. Footer-Credit-Zeile (siehe Grenzen) unverändert lassen.

---

## SCHRITT 5 — TopBar-Breadcrumb-Map synchronisieren
`labels`-Map in `components/shell/TopBar.tsx` mit den Routen/Labels aus Schritt 2+3 in Einklang bringen (insb. `data-room`/`case-study-dataroom`-Widerspruch auflösen, `/dr` als „Datenraum-Tracking" o. ä. ergänzen). Keine doppelten/widersprüchlichen Einträge.

---

## SCHRITT 6 — Konsistenzprüfung (als Master-Admin)
Alle Routen aus Schritt 2 durchklicken: kein 404, Aktiv-Hervorhebung korrekt, „Verwaltung" klappt bei aktiver Unterseite auf, „Sonderfunktionen" für eine Nicht-Master-Rolle (z. B. `WORKSPACE_ADMIN`) unsichtbar.

---

## SCHRITT 7 — Abschluss-Commit
Liste geänderter Dateien + einzeilige Zusammenfassung pro Schritt. Offene Punkte (z. B. unklare Fallstudien-Route) explizit vermerken.

---

## Bei Mehrdeutigkeit
Im Zweifel: weniger Punkte, eindeutigere Begriffe. Existiert die Fallstudien-Admin-Route nur unvollständig → keine neue UI bauen, vorläufig zur passendsten existierenden Seite verlinken und im Abschluss-Commit als offenen Punkt vermerken.

---

*© Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!*
*Direktive 1/2: Claude Opus 4.8, Juni 2026*
