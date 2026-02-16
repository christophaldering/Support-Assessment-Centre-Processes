import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { LogOut, Lock, ArrowRight, AlertCircle, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

interface Workspace {
  id: number;
  name: string;
  slug: string;
  status: string;
}

export default function WorkspaceSelector() {
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("master_admin_auth") !== "true") {
      setLocation("/");
      return;
    }
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await apiRequest("GET", "/api/platform/workspaces");
      const data = await res.json();
      setWorkspaces(data);
    } catch {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("master_admin_auth");
    setLocation("/");
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    if (selectedWorkspace?.id === workspace.id) {
      setSelectedWorkspace(null);
      setPassword("");
      setError("");
    } else {
      setSelectedWorkspace(workspace);
      setPassword("");
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/platform/auth/workspace", {
        workspaceId: selectedWorkspace.id,
        password,
      });
      sessionStorage.setItem("workspace_auth", "true");
      sessionStorage.setItem("workspace_id", String(selectedWorkspace.id));
      sessionStorage.setItem("workspace_slug", selectedWorkspace.slug);
      setLocation(`/workspace/${selectedWorkspace.slug}`);
    } catch {
      setError(t("workspaces.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "inactive":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "setup":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <span
            className="text-white font-serif text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            data-testid="text-platform-name"
          >
            {t("platform.title")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40"
              data-testid="button-lang-toggle"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "de" ? "EN" : "DE"}
            </button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-lg font-medium h-9 px-4 text-xs transition-all bg-transparent"
              data-testid="button-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("workspaces.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h1
              className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-3 tracking-tight"
              data-testid="text-workspaces-title"
            >
              {t("workspaces.title")}
            </h1>
            <p className="text-slate-500 text-base" data-testid="text-workspaces-subtitle">
              {t("workspaces.subtitle")}
            </p>
            <div className="h-1 w-16 bg-[#3b82f6] mx-auto rounded-full mt-6" />
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {workspaces.map((workspace, i) => (
                <motion.div
                  key={workspace.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={`group p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedWorkspace?.id === workspace.id
                        ? "border-[#3b82f6]/50 shadow-lg shadow-[#3b82f6]/10 bg-[#3b82f6]/[0.02]"
                        : "border-slate-200 hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-[#3b82f6]/5"
                    }`}
                    onClick={() => handleWorkspaceClick(workspace)}
                    data-testid={`card-workspace-${workspace.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0f172a]/5 flex items-center justify-center group-hover:bg-[#3b82f6]/10 transition-colors">
                        <Building2 className="h-6 w-6 text-[#0f172a]/60 group-hover:text-[#3b82f6] transition-colors" />
                      </div>
                      <Badge
                        className={`text-[10px] uppercase tracking-wider font-semibold border ${statusColor(workspace.status)}`}
                        data-testid={`badge-status-${workspace.id}`}
                      >
                        {workspace.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-[#0f172a] mb-1" data-testid={`text-workspace-name-${workspace.id}`}>
                      {workspace.name}
                    </h3>
                    <p className="text-slate-400 text-sm font-mono">{workspace.slug}</p>
                  </div>

                  <AnimatePresence>
                    {selectedWorkspace?.id === workspace.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-5 bg-slate-50 rounded-xl border border-slate-200" data-testid={`gate-workspace-${workspace.id}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Lock className="h-4 w-4 text-[#3b82f6]" />
                            <h4 className="text-sm font-semibold text-[#0f172a]">{t("workspaces.password")}</h4>
                          </div>
                          <form onSubmit={handleSubmit} className="space-y-3">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t("workspaces.password")}
                              className="w-full bg-white border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                              data-testid="input-workspace-password"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <AnimatePresence>
                              {error && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-2 text-sm text-red-500 overflow-hidden"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span data-testid="text-workspace-error">{error}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <Button
                              type="submit"
                              disabled={submitting || !password.trim()}
                              className="w-full gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-11 text-sm"
                              data-testid="button-workspace-submit"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {submitting ? "..." : t("workspaces.enter")}
                              {!submitting && <ArrowRight className="h-4 w-4" />}
                            </Button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0f172a] py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <span
            className="text-white/80 font-serif text-sm font-medium tracking-tight block mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("platform.title")}
          </span>
          <p className="text-slate-500 text-xs" data-testid="text-footer-credit">
            {t("platform.footer_credit")}
          </p>
        </div>
      </footer>
    </div>
  );
}
