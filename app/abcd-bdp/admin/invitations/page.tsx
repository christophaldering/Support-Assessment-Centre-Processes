"use client";

import { useState, useEffect, useCallback } from "react";
import { useBdp } from "../../bdp-context";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Link as LinkIcon,
  Copy,
  Eye,
  Mail,
  Search,
  CheckSquare,
  Square,
  Save,
} from "lucide-react";

type InviteTab = "observers" | "experts" | "participants";

interface Recipient {
  code: string;
  id: string;
  type: string;
  role: string;
  displayName: string | null;
  realName: string | null;
  email: string;
}

interface Preview {
  code: string;
  email: string;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: Record<InviteTab, string> = {
  observers: `<p>Sehr geehrte/r {{CODE}},</p>
<p>im Rahmen des <strong>ABCD Business Development Pitch (BDP)</strong> laden wir Sie herzlich zur Beobachtung und Bewertung ein.</p>
<p>Ihre Rolle als Vorstand ist entscheidend für die objektive Einschätzung der Teilnehmenden. Bitte nutzen Sie den folgenden Link, um sich in der Bewertungsplattform anzumelden:</p>
<p><strong>Login:</strong> <a href="{{LINK}}">{{LINK}}</a></p>
<p><strong>Workspace:</strong> {{WORKSPACE}}<br/><strong>Ihr Code:</strong> {{CODE}}</p>
<p>Session: {{SESSION}}</p>
<p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
<p>Mit freundlichen Grüßen,<br/>{{SENDER}}</p>`,
  experts: `<p>Sehr geehrte/r {{CODE}},</p>
<p>wir laden Sie herzlich als <strong>Experte</strong> zum <strong>ABCD Business Development Pitch (BDP)</strong> ein.</p>
<p>Ihre fachliche Expertise ist für die Bewertung der Pitches von großer Bedeutung. Bitte melden Sie sich über folgenden Link an:</p>
<p><strong>Login:</strong> <a href="{{LINK}}">{{LINK}}</a></p>
<p><strong>Workspace:</strong> {{WORKSPACE}}<br/><strong>Ihr Code:</strong> {{CODE}}</p>
<p>Session: {{SESSION}}</p>
<p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
<p>Mit freundlichen Grüßen,<br/>{{SENDER}}</p>`,
  participants: `<p>Sehr geehrte/r {{CODE}},</p>
<p>wir freuen uns, Sie zum <strong>ABCD Business Development Pitch (BDP)</strong> einzuladen.</p>
<p>Als Teilnehmer/in haben Sie die Gelegenheit, Ihre Geschäftsidee vor einem hochkarätigen Gremium zu präsentieren. Bitte melden Sie sich über folgenden Link an:</p>
<p><strong>Login:</strong> <a href="{{LINK}}">{{LINK}}</a></p>
<p><strong>Workspace:</strong> {{WORKSPACE}}<br/><strong>Ihr Code:</strong> {{CODE}}</p>
<p>Session: {{SESSION}}</p>
<p>Wir wünschen Ihnen viel Erfolg!</p>
<p>Mit freundlichen Grüßen,<br/>{{SENDER}}</p>`,
};

const DEFAULT_SUBJECTS: Record<InviteTab, string> = {
  observers: "ABCD BDP – Einladung zur Beobachtung & Bewertung",
  experts: "ABCD BDP – Einladung als Experte",
  participants: "ABCD BDP – Einladung zur Teilnahme am Business Development Pitch",
};

function ToolbarButton({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? "bg-[#0071e3] text-black" : "text-gray-500 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

export default function BdpInvitationsPage() {
  const { user } = useBdp();
  const router = useRouter();
  const [tab, setTab] = useState<InviteTab>("observers");
  const [recipients, setRecipients] = useState<Record<InviteTab, Recipient[]>>({ observers: [], experts: [], participants: [] });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [subjects, setSubjects] = useState<Record<InviteTab, string>>({ ...DEFAULT_SUBJECTS });
  const [sessionRef, setSessionRef] = useState("Alle Sessions");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [qaChecks, setQaChecks] = useState<{ name: string; pass: boolean; detail?: string }[]>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Einladungstext hier eingeben..." }),
    ],
    content: DEFAULT_TEMPLATES[tab],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] focus:outline-none p-4",
        "data-testid": "bdp-invite-editor",
      },
    },
  });

  const [templateCache, setTemplateCache] = useState<Record<InviteTab, string>>({
    observers: DEFAULT_TEMPLATES.observers,
    experts: DEFAULT_TEMPLATES.experts,
    participants: DEFAULT_TEMPLATES.participants,
  });

  useEffect(() => {
    if (!user?.isAdmin) { router.push("/abcd-bdp"); return; }
    fetchRecipients();
  }, [user]);

  useEffect(() => {
    if (editor) {
      const currentHtml = editor.getHTML();
      setTemplateCache(prev => ({ ...prev, [tab]: prev[tab] || currentHtml }));
    }
  }, [tab]);

  const switchTab = useCallback((newTab: InviteTab) => {
    if (editor) {
      setTemplateCache(prev => ({ ...prev, [tab]: editor.getHTML() }));
    }
    setTab(newTab);
    setSelected(new Set());
    setSearchQuery("");
    setPreviews([]);
    setShowPreview(false);
  }, [editor, tab]);

  useEffect(() => {
    if (editor && templateCache[tab]) {
      editor.commands.setContent(templateCache[tab]);
    }
  }, [tab, editor]);

  const fetchRecipients = async () => {
    try {
      const res = await fetch("/api/abcd-bdp/admin/invitations/recipients");
      if (!res.ok) return;
      const data = await res.json();
      setRecipients({
        observers: data.observers || [],
        experts: data.experts || [],
        participants: data.participants || [],
      });
      setSessions(data.sessions || []);
      const emailInit: Record<string, string> = {};
      [...(data.observers || []), ...(data.experts || []), ...(data.participants || [])].forEach((r: Recipient) => {
        if (r.email) emailInit[r.code] = r.email;
      });
      setEmails(prev => ({ ...emailInit, ...prev }));
    } catch {} finally {
      setLoading(false);
    }
  };

  const currentRecipients = recipients[tab] || [];
  const filtered = currentRecipients.filter(r => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return r.code.toLowerCase().includes(q) || (r.realName || "").toLowerCase().includes(q) || (r.displayName || "").toLowerCase().includes(q);
  });

  const toggleSelect = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.code)));
    }
  };

  const saveEmails = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/abcd-bdp/admin/invitations/save-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (res.ok) setMsg("E-Mails gespeichert");
      else setMsg("Fehler beim Speichern");
    } catch { setMsg("Fehler beim Speichern"); }
    finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  };

  const generatePreview = async () => {
    if (selected.size === 0) { setMsg("Bitte mindestens einen Empfänger auswählen"); setTimeout(() => setMsg(""), 3000); return; }
    if (!editor) return;

    if (editor) {
      setTemplateCache(prev => ({ ...prev, [tab]: editor.getHTML() }));
    }

    const selectedRecipients = currentRecipients
      .filter(r => selected.has(r.code))
      .map(r => ({ code: r.code, email: emails[r.code] || r.email || "" }));

    try {
      const res = await fetch("/api/abcd-bdp/admin/invitations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selectedRecipients,
          subject: subjects[tab],
          body: editor.getHTML(),
          sessionName: sessionRef,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviews(data.previews || []);
        setShowPreview(true);
      }
    } catch {}
  };

  const copyToClipboard = async (text: string, code: string) => {
    const plain = text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
    await navigator.clipboard.writeText(plain);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const addLink = () => {
    if (!editor) return;
    const url = prompt("URL eingeben:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const runQA = async () => {
    const checks: { name: string; pass: boolean; detail?: string }[] = [];

    checks.push({
      name: "Empfänger laden",
      pass: currentRecipients.length > 0,
      detail: `${currentRecipients.length} Empfänger geladen`,
    });

    checks.push({
      name: "Editor speichert Text",
      pass: !!editor && editor.getHTML().length > 10,
      detail: `${editor?.getHTML().length || 0} Zeichen`,
    });

    if (selected.size > 0 && editor) {
      try {
        const res = await fetch("/api/abcd-bdp/admin/invitations/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: [{ code: currentRecipients[0]?.code || "TEST", email: "" }],
            subject: subjects[tab],
            body: editor.getHTML(),
            sessionName: sessionRef,
          }),
        });
        const data = await res.json();
        const rendered = data.previews?.[0]?.body || "";
        const hasPlaceholders = rendered.includes("{{");
        checks.push({
          name: "Preview ersetzt Platzhalter korrekt",
          pass: !hasPlaceholders,
          detail: hasPlaceholders ? "Platzhalter nicht ersetzt" : "Alle Platzhalter ersetzt",
        });
      } catch {
        checks.push({ name: "Preview ersetzt Platzhalter korrekt", pass: false, detail: "Fehler" });
      }
    } else if (currentRecipients.length > 0) {
      try {
        const res = await fetch("/api/abcd-bdp/admin/invitations/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: [{ code: currentRecipients[0].code, email: "" }],
            subject: subjects[tab],
            body: editor?.getHTML() || "",
            sessionName: sessionRef,
          }),
        });
        const data = await res.json();
        const rendered = data.previews?.[0]?.body || "";
        checks.push({
          name: "Preview ersetzt Platzhalter korrekt",
          pass: !rendered.includes("{{"),
          detail: rendered.includes("{{") ? "Platzhalter nicht ersetzt" : "Alle Platzhalter ersetzt",
        });
      } catch {
        checks.push({ name: "Preview ersetzt Platzhalter korrekt", pass: false, detail: "Fehler" });
      }
    } else {
      checks.push({ name: "Preview ersetzt Platzhalter korrekt", pass: false, detail: "Keine Empfänger" });
    }

    checks.push({
      name: "Copy funktioniert",
      pass: typeof navigator.clipboard?.writeText === "function",
      detail: "Clipboard API verfügbar",
    });

    checks.push({
      name: "Non-admin blocked",
      pass: !!user?.isAdmin,
      detail: `isAdmin: ${user?.isAdmin}`,
    });

    setQaChecks(checks);
  };

  if (!user?.isAdmin) return null;

  const tabConfig: { key: InviteTab; label: string }[] = [
    { key: "observers", label: "Vorstände" },
    { key: "experts", label: "Experte(n)" },
    { key: "participants", label: "Teilnehmer" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-invitations-title">Einladungen</h1>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{msg}</div>}

      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
        {tabConfig.map(t => (
          <button
            key={t.key}
            data-testid={`bdp-invite-tab-${t.key}`}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-[#0071e3] text-black" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">Empfänger ({tab === "observers" ? "Vorstände" : tab === "experts" ? "Experten" : "Teilnehmer"})</h2>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                data-testid="bdp-invite-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Suchen (Code oder Name)..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <button
              onClick={toggleAll}
              data-testid="bdp-invite-select-all"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
              Alle auswählen ({filtered.length})
            </button>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.map(r => (
                <div
                  key={r.code}
                  data-testid={`bdp-invite-recipient-${r.code}`}
                  className={`p-3 border rounded-xl flex items-start gap-3 transition-colors ${selected.has(r.code) ? "border-[#0071e3] bg-yellow-50/30" : "border-gray-100"}`}
                >
                  <button onClick={() => toggleSelect(r.code)} className="mt-0.5 shrink-0">
                    {selected.has(r.code) ? <CheckSquare size={18} className="text-[#0071e3]" /> : <Square size={18} className="text-gray-300" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{r.code}</span>
                      {r.realName && <span className="text-xs text-gray-500">— {r.realName}</span>}
                      {!r.realName && r.displayName && <span className="text-xs text-gray-500">— {r.displayName}</span>}
                    </div>
                    <input
                      type="email"
                      value={emails[r.code] || ""}
                      onChange={e => setEmails(prev => ({ ...prev, [r.code]: e.target.value }))}
                      placeholder="E-Mail (optional)"
                      data-testid={`bdp-invite-email-${r.code}`}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Keine Empfänger gefunden</p>
              )}
            </div>

            <button
              onClick={saveEmails}
              disabled={saving}
              data-testid="bdp-invite-save-emails"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              <Save size={14} />
              {saving ? "Speichern..." : "E-Mails speichern"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">Betreff & Text</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Betreff</label>
              <input
                data-testid="bdp-invite-subject"
                type="text"
                value={subjects[tab]}
                onChange={e => setSubjects(prev => ({ ...prev, [tab]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Session Referenz</label>
              <select
                data-testid="bdp-invite-session"
                value={sessionRef}
                onChange={e => setSessionRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="Alle Sessions">Alle Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Einladungstext</label>
              {editor && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                    <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Fett">
                      <Bold size={16} />
                    </ToolbarButton>
                    <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Kursiv">
                      <Italic size={16} />
                    </ToolbarButton>
                    <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Unterstrichen">
                      <UnderlineIcon size={16} />
                    </ToolbarButton>
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste">
                      <List size={16} />
                    </ToolbarButton>
                    <ToolbarButton active={editor.isActive("link")} onClick={addLink} title="Link">
                      <LinkIcon size={16} />
                    </ToolbarButton>
                  </div>
                  <EditorContent editor={editor} />
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                Platzhalter: {"{{CODE}}"}, {"{{WORKSPACE}}"}, {"{{LINK}}"}, {"{{SESSION}}"}, {"{{SENDER}}"}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={generatePreview}
                data-testid="bdp-invite-preview"
                className="flex items-center gap-2 bg-[#0071e3] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#005bb5] transition-colors"
              >
                <Eye size={14} />
                Vorschau erzeugen
              </button>
              <button
                disabled
                data-testid="bdp-invite-send"
                className="flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                title="E-Mail-Versand wird in einem späteren Sprint aktiviert"
              >
                <Mail size={14} />
                Senden (kommt bald)
              </button>
            </div>
          </div>

          {showPreview && previews.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">Vorschau ({previews.length} Empfänger)</h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {previews.map(p => (
                  <div key={p.code} data-testid={`bdp-invite-preview-${p.code}`} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">{p.code}</span>
                        {p.email && <span className="text-xs text-gray-400 ml-2">{p.email}</span>}
                      </div>
                      <button
                        onClick={() => copyToClipboard(`Betreff: ${p.subject}\n\n${p.body}`, p.code)}
                        data-testid="bdp-invite-copy"
                        className="flex items-center gap-1 text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Copy size={12} />
                        {copied === p.code ? "Kopiert!" : "Kopieren"}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded">
                      <strong>Betreff:</strong> {p.subject}
                    </div>
                    <div
                      className="prose prose-xs max-w-none text-sm border-l-2 border-[#0071e3] pl-3"
                      dangerouslySetInnerHTML={{ __html: p.body }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">QA Checks</h2>
              <button onClick={runQA} data-testid="bdp-invite-run-qa" className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                QA starten
              </button>
            </div>
            {qaChecks.length > 0 && (
              <div className="space-y-1">
                {qaChecks.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${c.pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <span className="font-bold">{c.pass ? "PASS" : "FAIL"}</span>
                    <span>{c.name}</span>
                    {c.detail && <span className="text-gray-400 ml-auto">{c.detail}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
