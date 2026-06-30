# REPLIT AGENT — DIREKTIVE 2 von 2: Prompt-Bibliothek (eigene KI-Prompts für Gutachten & Fallstudien)

**Kontext:** Die EDS generiert Gutachten/Entwicklungsempfehlungen und Fallstudien über fest im Code verdrahtete System-Prompts. Diese Direktive macht diese Prompts pro Workspace **sichtbar, editierbar und überschreibbar**, mit Rückfall auf den jeweiligen Standard-Prompt. Christoph kann so seine eigenen bewährten Prompts hinterlegen, ohne Code anzufassen. Demo-Relevanz: Dies ist genau das Artefakt, das „Übungs-Prompting" und „Berichts-Prompting" zusammenführt.

**Voraussetzung:** Direktive 1 (Navigations-Bereinigung) ist abgeschlossen und läuft. Diese Direktive nutzt die dort entstandene 5-Gruppen-Struktur.

**Arbeitsmodus:** Schritte 1–8 strikt sequenziell, Commit nach jedem Schritt (`prompt-lib: Schritt N — <Kurz>`). Schritt N+1 erst bei fehlerfreiem N. Diese Direktive enthält **genau eine, rein additive Schema-Migration** (neue Tabelle, keine Änderung bestehender Tabellen/Spalten/Daten) — das ist die sicherste Migrationsart und darf ausgeführt werden.

---

## STRIKTE GRENZEN — NICHT ANFASSEN
- Auth, Cookies, RBAC, `middleware.ts`
- **Bestehende** Prisma-Modelle, -Spalten, -Daten (nur EIN neues Modell additiv hinzufügen)
- COMP BDP / ABCD / Candidate Portal
- Die fachliche Generierungs-/Parsing-Logik der betroffenen Routen (nur die Stelle ändern, an der der System-Prompt gesetzt wird)
- Footer-Credit-Zeile — wortgleich erhalten
- **Erfinde keine Prompt-Inhalte.** Die Standard-Prompts werden 1:1 wortgleich aus dem bestehenden Code übernommen. Eigene Prompts pflegt Christoph später selbst über die UI ein.

---

## SCHRITT 1 — Additives Prisma-Modell `PromptTemplate`
Füge in `prisma/schema.prisma` hinzu (nur dieses Modell, plus die Relation-Zeile in `Workspace`):

```prisma
model PromptTemplate {
  id           String   @id @default(cuid())
  workspaceId  String   @map("workspace_id")
  slotKey      String   @map("slot_key")        // entspricht taskName, z.B. "generate_report"
  body         String   @db.Text                // der angepasste System-Prompt
  active       Boolean  @default(true)
  updatedBy    String?  @map("updated_by")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, slotKey])
  @@index([workspaceId])
  @@map("prompt_templates")
}
```
In `Workspace` ergänzen: `promptTemplates PromptTemplate[]`.
Danach `npx prisma generate` und Schema anwenden (`npx prisma db push`). Verifiziere, dass keine bestehende Tabelle verändert wurde (nur `CREATE TABLE prompt_templates`).

---

## SCHRITT 2 — Zentrale Registry `lib/prompt-library.ts`
Erstelle eine Registry analog zum bestehenden `MODULE_REGISTRY`-Pattern aus `lib/feature-flags.ts`. Sie ist die **einzige Quelle der Wahrheit** für Standard-Prompts.

Definiere genau diese vier Slots. Übernimm die `default`-Texte **wortgleich** aus dem aktuellen Code:
- `generate_report` — Label „Gutachten / Entwicklungsempfehlungen". Default = der inline `systemPrompt`-String in `app/api/w/[workspaceSlug]/assessments/[assessmentId]/reports/route.ts` (beginnt „Du bist ein erfahrener Executive-Assessment-Berater…").
- `generate_case_study` — Label „Fallstudie generieren". Default = `CASE_STUDY_SYSTEM_PROMPT` aus `app/api/w/[workspaceSlug]/case-studies/generate/route.ts`.
- `plan_case_study` — Label „Fallstudie planen (Struktur)". Default = `PLAN_SYSTEM_PROMPT` aus `app/api/w/[workspaceSlug]/case-studies/plan/route.ts`.
- `parse_uploaded_case_study` — Label „Hochgeladene Fallstudie auswerten". Default = `UPLOAD_PARSE_PROMPT` aus `case-studies/generate/route.ts`.

Struktur je Slot: `{ key, label, description, defaultPrompt }`. Exportiere `PROMPT_SLOTS` (Array oder Record) und einen Typ `PromptSlotKey`.

---

## SCHRITT 3 — Resolver-Helfer
In `lib/prompt-library.ts` (oder `lib/prompt-resolver.ts`):
```ts
export async function resolveSystemPrompt(
  workspaceId: string,
  slotKey: PromptSlotKey,
  fallback: string
): Promise<string>
```
Logik: `PromptTemplate` für `(workspaceId, slotKey, active:true)` suchen; gefunden → `body` zurückgeben, sonst `fallback`. Bei DB-Fehler defensiv den `fallback` zurückgeben (Generierung darf nie wegen der Prompt-Bibliothek brechen).

---

## SCHRITT 4 — Vier Call-Sites verdrahten (verhaltensneutral)
An den vier Stellen den hartkodierten `systemPrompt` durch den Resolver ersetzen. Beispiel (Report-Route):
```ts
systemPrompt: await resolveSystemPrompt(workspace.id, "generate_report", PROMPT_SLOTS.generate_report.defaultPrompt),
```
Für die Case-Study-Routen analog mit den jeweiligen Slot-Keys; die bisherigen Modul-Konstanten (`CASE_STUDY_SYSTEM_PROMPT` etc.) durch den Registry-Default ersetzen bzw. die Konstante = Registry-Default setzen.
**Kritisch:** Ohne hinterlegten Custom-Prompt muss das Verhalten 100 % identisch zum Ist-Zustand sein (Resolver liefert dann den verbatim übernommenen Default). Nach diesem Schritt: je einmal Gutachten- und Fallstudien-Generierung testen → Output muss wie vorher funktionieren.

---

## SCHRITT 5 — CRUD-API
Neue Route `app/api/w/[workspaceSlug]/prompt-templates/route.ts` (+ ggf. `[slotKey]/route.ts`), abgesichert wie die übrigen Admin-APIs (Workspace-Scope, Admin/Master-Rolle):
- `GET` → Liste aller Slots aus `PROMPT_SLOTS`, je Slot: `defaultPrompt`, etwaiger Custom-`body`, Flag `isCustomized`.
- `PUT` (slotKey, body) → upsert `PromptTemplate` für `(workspaceId, slotKey)`.
- `DELETE` (slotKey) → Custom-Eintrag löschen = Reset auf Standard.
Optional Audit über das vorhandene `AiAuditLog`-Modell (action `prompt_template_updated`), falls ohne Mehraufwand möglich.

---

## SCHRITT 6 — UI „Prompt-Bibliothek"
Neue Seite `app/w/[workspaceSlug]/admin/prompt-library/page.tsx`, eingehängt in die **Gruppe „Verwaltung"** des `ContextPanel.tsx` (aus Direktive 1), Label „KI-Prompts", nur für Admin/Master sichtbar. Inhalt:
- Liste der vier Slots als Karten (Label + Kurzbeschreibung + Status-Badge „Standard" / „Angepasst").
- Pro Slot: aufklappbarer Editor (Textarea, monospace, ausreichend hoch) mit dem aktuell wirksamen Prompt; Buttons „Speichern", „Auf Standard zurücksetzen", sowie ein einklappbarer Read-only-Block „Standard anzeigen" zum Vergleich.
- Speicherzustand klar rückmelden (gespeichert / Fehler). Visueller Stil konsistent mit den übrigen Admin-Seiten (Terrakotta-Akzent, Satoshi).

**Kontextueller Zugang (demo-stark):** Auf der Gutachten-Generator-Seite (`app/w/[workspaceSlug]/admin/gutachten/page.tsx`) und der Case-Studio-/Fallstudien-Generierungsseite je einen dezenten Link/Button „Prompt anpassen" ergänzen, der zur Prompt-Bibliothek mit vorausgewähltem passendem Slot führt (z. B. `?slot=generate_report`). Die Seite öffnet den entsprechenden Editor direkt.

---

## SCHRITT 7 — Leerzustand & eigene Prompts
Im Auslieferungszustand ist **kein** Custom-Prompt hinterlegt → alle Slots zeigen „Standard", Generierung verhält sich wie bisher. Christoph hinterlegt seine eigenen bewährten Prompts ausschließlich über die UI. **Keine Prompt-Inhalte vorbefüllen oder erfinden.** Ein kurzer Hinweistext auf der Seite erklärt: „Eigenen Prompt eintragen überschreibt den Standard für diesen Workspace; Zurücksetzen stellt den Standard wieder her."

---

## SCHRITT 8 — Verifikation & Abschluss-Commit
- Migration sauber (nur neue Tabelle).
- Beide Generierungen funktionieren ohne Custom-Prompt unverändert.
- Mit hinterlegtem Test-Custom-Prompt wird dieser nachweislich verwendet (kurzer End-to-End-Test), Reset stellt Standard wieder her.
- „KI-Prompts" erscheint unter Verwaltung, kontextuelle „Prompt anpassen"-Links funktionieren.
- Abschluss-Commit mit Dateiliste + Schritt-Zusammenfassung.

---

## Bei Mehrdeutigkeit
Im Zweifel: die Generierung niemals durch die Prompt-Bibliothek gefährden (Resolver fällt immer sicher auf den Default zurück). Lieber ein Slot weniger exponiert als ein instabiler Generierungspfad.

---

*© Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!*
*Direktive 2/2: Claude Opus 4.8, Juni 2026*
