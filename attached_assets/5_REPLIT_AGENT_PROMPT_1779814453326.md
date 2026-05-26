# Replit-Agenten-Prompt — ConVia Datenraum: geschützter Zugang + Tracking

> **So nutzt du diese Datei:** Kopiere den gesamten Block unterhalb der Linie
> in den Replit-Agenten deines Projekts. Lade vorher die vier Bausteindateien
> (`1_schema_additions.prisma`, `2_tracking_snippet.html`, `3_server_routes.ts`,
> `4_evaluation_page.tsx`) sowie `ConVia_Datenraum.html` ins Projekt hoch, damit
> der Agent sie als Vorlage hat. Der Agent sieht deinen echten Code und kann die
> markierten `>>> ANPASSEN <<<`-Stellen korrekt verdrahten — das kann ich von
> außen nicht, weil ich dein Prisma-Schema und deine Auth-Helfer nicht sehe.

---

## Aufgabe

Integriere einen passwortlosen, tokenisierten Zugang ("Magic Link") zu einem
statischen Datenraum (`ConVia_Datenraum.html`) in dieses bestehende Next.js +
Prisma Projekt, inklusive serverseitigem Verhaltens-Tracking und einer
Auswerte-Ansicht. Nutze die vier hochgeladenen Vorlagedateien als Grundlage und
passe alle mit `>>> ANPASSEN <<<` markierten Stellen an die TATSÄCHLICHE
Struktur dieses Projekts an.

## Anforderungen (vom Auftraggeber bestätigt)

1. **Magic Link:** Ein Kandidat erhält einen Link `…/dr/<token>`. Klick genügt —
   keine manuelle Passworteingabe. Der Token authentifiziert automatisch und
   setzt ein HTTP-only Session-Cookie (nach dem Vorbild des bereits
   existierenden `candidate_portal_session`).
2. **Festes Enddatum:** Jeder Link hat ein `expiresAt`. Danach wird er
   serverseitig abgelehnt (HTTP 410 + freundliche Sperrseite), egal wer klickt.
3. **Mehrfachnutzung:** Links sind bis zum Enddatum beliebig oft nutzbar
   (`multiUse=true`). Einmal-Links bleiben als Option erhalten.
4. **Adress-Verschleierung:** Der Token ist zufällig/nicht ratbar. Liefere die
   HTML serverseitig aus und injiziere den Token als `window.__DR_TOKEN`, damit
   er NICHT in der sichtbaren URL stehen muss (der Pfad `/dr/<token>` kann nach
   erfolgreicher Cookie-Setzung serverseitig auf eine neutrale URL wie
   `/dr/view` umgeschrieben werden — siehe Schritt 6).
5. **Volles Tracking:** geöffnete Dokumente + Zeitstempel, Suchbegriffe,
   Verweildauer & Reihenfolge, Notizen, Markierungen. Die HTML hat dafür bereits
   ein internes `log()`-System; das Tracking-Snippet hängt sich nur an.
6. **Auswertung:** Eine Admin-Seite pro Kandidat mit Timeline, Dokument-Ranking
   nach Verweildauer, Suchbegriffen und Notizen.

## Konkrete Schritte

1. **Prisma:** Füge die zwei Modelle aus `1_schema_additions.prisma`
   (`DataRoomAccessLink`, `DataRoomEvent`) ins Schema ein. Gleiche das
   `workspace`-Feld und etwaige Relationen an das im Projekt verwendete
   Multi-Tenant-Muster an (vgl. `BdpUser.workspace`, `bdpWorkspaceFilter`).
   Erzeuge die Migration und wende sie an.

2. **HTML ablegen:** Lege `ConVia_Datenraum.html` an einem nicht-öffentlichen
   Ort ab (NICHT unter `public/`), z.B. `private/convia/`. Füge das komplette
   `<script>` aus `2_tracking_snippet.html` direkt vor `</body>` der HTML ein.

3. **Routen:** Erstelle aus `3_server_routes.ts` die drei Dateien:
   - `lib/dr/tokens.ts`
   - `app/dr/[token]/route.ts` (Einlösung)
   - `app/api/dr/track/route.ts` (Event-Empfang)
   - `app/api/w/[workspaceSlug]/admin/dr/links/route.ts` (Link-Verwaltung)
   Ersetze den Prisma-Import durch den echten Client-Import dieses Projekts.
   Ersetze die Cookie-Logik durch das echte Session-Cookie-Muster.

4. **RBAC:** Schütze die Admin-Routen (`/api/.../admin/dr/...`) und die
   Auswerte-Seite mit der vorhandenen Rollenprüfung (nur MASTER_ADMIN /
   WORKSPACE_ADMIN / ADMIN). Die öffentlichen Routen `/dr/[token]` und
   `/api/dr/track` bleiben absichtlich ohne RBAC — sie validieren über den Token.

5. **Auswerte-Seite:** Lege `4_evaluation_page.tsx` als
   `app/w/[workspaceSlug]/admin/dr/[linkId]/page.tsx` an. Erstelle den
   zugehörigen Events-Endpunkt `app/api/w/[workspaceSlug]/admin/dr/links/[linkId]/events/route.ts`,
   der `link`-Metadaten + zugehörige `DataRoomEvent[]` (chronologisch) liefert,
   RBAC-geschützt. Verdrahte die Listen-Ansicht der Links mit Erstell-Formular
   (Label, E-Mail, Enddatum) und Kopier-Button für die fertige URL.

6. **Optional — saubere URL:** Nach erfolgreicher Token-Einlösung in
   `app/dr/[token]/route.ts` das Cookie setzen und per `NextResponse.redirect`
   auf `/dr/view` umleiten; eine zweite Route `app/dr/view/route.ts` liest den
   Token aus dem Cookie und liefert die HTML aus. Dadurch verschwindet der Token
   aus der Adressleiste nach dem ersten Aufruf.

## Akzeptanzkriterien

- Aufruf eines gültigen `/dr/<token>` öffnet den Datenraum ohne Login-Eingabe.
- Nach `expiresAt` erscheint die Sperrseite (HTTP 410).
- Während der Nutzung erscheinen in `DataRoomEvent` Einträge für open/leave/
  search/note_save/flag (per `npx prisma studio` prüfbar).
- Die Auswerte-Seite zeigt Timeline, Dokument-Ranking, Suchbegriffe, Notizen.
- Keine Tracking-Daten ohne gültigen Token; abgelaufene Tokens werden auch beim
  Event-Empfang (`/api/dr/track`) mit 403 abgelehnt.
- Admin-Routen sind ohne passende Rolle nicht erreichbar.

## Wichtige Hinweise

- Ändere KEINE bestehende Funktion in `ConVia_Datenraum.html` — das Snippet
  umhüllt `log`, `openDoc`, `quickSearch`, `saveNote`, `startSession`,
  `openFinish` nur.
- **Technische Besonderheit:** In der HTML ist die Session-Variable per `let S`
  deklariert und liegt damit NICHT auf `window`. Das Snippet greift Details
  daher über die umhüllten Funktionen ab (Suchbegriff aus `quickSearch(q)`,
  Verweildauer über eigene Eintritts-Zeitmessung in `openDoc`), nicht über
  `window.S`. Bitte diesen Ansatz beibehalten; nicht auf `window.S` umbauen.
- Halte dich an die vorhandenen Konventionen des Projekts (Prisma-Client-Pfad,
  Auth-Helfer, Workspace-Filter, Token/Env-Handling).
- Datenschutz: Da echte Verhaltensdaten erfasst werden, prüfe, ob ein
  Einwilligungshinweis im Startscreen der HTML nötig ist (das Projekt hat bereits
  ein Consent-System — ggf. anbinden).
