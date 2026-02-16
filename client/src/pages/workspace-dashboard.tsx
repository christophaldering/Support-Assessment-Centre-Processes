import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Globe,
  LogOut,
  Settings,
  Eye,
  LayoutDashboard,
  ExternalLink,
  Calendar,
  Users,
  ClipboardList,
  Info,
  Database,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

interface WorkspaceTheme {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontFamilyHeading: string;
  darkMode?: boolean;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  theme?: WorkspaceTheme;
  dataResidency?: string;
  status: string;
}

interface Assessment {
  id: string;
  workspaceId: string;
  title?: string;
  targetRole?: string;
  organizationName?: string;
  startDate?: string;
  endDate?: string;
  language: string;
  status: string;
  candidateCount?: number;
}

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  workspaceId: string;
}

export default function WorkspaceDashboard() {
  const [, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { t, toggle, lang } = useLang();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  useEffect(() => {
    const masterAuth = sessionStorage.getItem("workspace_auth") === "true";
    const masterAdminAuth = sessionStorage.getItem("master_admin_auth") === "true";
    const rawUser = sessionStorage.getItem("platform_user");
    let parsedUser: PlatformUser | null = null;

    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {}
    }

    const hasUserRole = parsedUser?.roles?.some((r) =>
      ["ADMIN", "MODERATOR", "HR_CLIENT"].includes(r)
    );

    if (!masterAuth && !masterAdminAuth && !hasUserRole) {
      setLocation("/login");
      return;
    }

    if (masterAdminAuth || masterAuth) {
      setIsMasterAdmin(true);
    }
    if (parsedUser) {
      setUser(parsedUser);
    }

    fetchWorkspace();
  }, [slug]);

  const fetchWorkspace = async () => {
    try {
      const res = await apiRequest("GET", `/api/platform/workspaces/${slug}`);
      const ws: Workspace = await res.json();
      setWorkspace(ws);
      fetchAssessments(ws.id);
    } catch {
      setLoading(false);
    }
  };

  const fetchAssessments = async (workspaceId: string) => {
    try {
      const res = await apiRequest("GET", `/api/platform/assessments/${workspaceId}`);
      const data = await res.json();
      setAssessments(Array.isArray(data) ? data : []);
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("platform_user");
    sessionStorage.removeItem("workspace_auth");
    sessionStorage.removeItem("workspace_id");
    sessionStorage.removeItem("workspace_slug");
    sessionStorage.removeItem("master_admin_auth");
    setLocation("/login");
  };

  const handleBack = () => {
    setLocation("/workspaces");
  };

  const theme = workspace?.theme;
  const primaryColor = theme?.primaryColor || "#3b82f6";
  const secondaryColor = theme?.secondaryColor || "#0f172a";
  const accentColor = theme?.accentColor || "#3b82f6";
  const bgColor = theme?.backgroundColor || "#ffffff";
  const textColor = theme?.textColor || "#0f172a";
  const headingFont = theme?.fontFamilyHeading || "'Playfair Display', serif";

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "closed":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "draft":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (!workspace && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <p className="text-slate-500">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{
          backgroundColor: secondaryColor + "f2",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMasterAdmin && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("workspace.back")}
              </button>
            )}
            <span
              className="text-white font-serif text-lg font-bold tracking-tight"
              style={{ fontFamily: headingFont, color: primaryColor }}
              data-testid="text-workspace-name"
            >
              {workspace?.name || "..."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-slate-300 text-sm hidden sm:inline" data-testid="text-user-name">
                {user.firstName} {user.lastName}
              </span>
            )}
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
              {t("candidate.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <h1
              className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
              style={{ fontFamily: headingFont, color: textColor }}
              data-testid="text-dashboard-title"
            >
              {workspace?.name}
            </h1>
            <div className="h-1 w-16 rounded-full mt-2" style={{ backgroundColor: primaryColor }} />
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <ClipboardList className="h-5 w-5" style={{ color: primaryColor }} />
                  {t("workspace.assessments")}
                </h2>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div
                      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
                    />
                  </div>
                ) : assessments.length === 0 ? (
                  <div
                    className="text-center py-12 rounded-2xl border border-slate-200"
                    data-testid="empty-assessments"
                  >
                    <ClipboardList className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500">{t("workspace.no_assessments")}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {assessments.map((assessment, i) => (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                        data-testid={`card-assessment-${assessment.id}`}
                      >
                        <div
                          className="group p-5 rounded-2xl border hover:shadow-lg transition-all duration-300"
                          style={{
                            borderColor: "rgba(0,0,0,0.08)",
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-base font-semibold mb-1 truncate"
                                style={{ color: textColor }}
                                data-testid={`text-assessment-title-${assessment.id}`}
                              >
                                {assessment.title || "Executive Assessment"}
                              </h3>
                              {assessment.organizationName && (
                                <p className="text-sm text-slate-500 mb-2">{assessment.organizationName}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  className={`text-[10px] uppercase tracking-wider font-semibold border ${statusColor(assessment.status)}`}
                                  data-testid={`badge-status-${assessment.id}`}
                                >
                                  {assessment.status}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(assessment.startDate)}
                                  {assessment.endDate && ` – ${formatDate(assessment.endDate)}`}
                                </span>
                                {assessment.candidateCount !== undefined && (
                                  <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Users className="h-3 w-3" />
                                    {assessment.candidateCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => setLocation("/admin")}
                              className="gap-2 rounded-lg font-medium h-10 px-5 text-sm shrink-0 transition-all"
                              style={{
                                backgroundColor: primaryColor,
                                color: "#ffffff",
                              }}
                              data-testid={`button-manage-${assessment.id}`}
                            >
                              <Settings className="h-4 w-4" />
                              {t("workspace.manage")}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <Link2 className="h-5 w-5" style={{ color: primaryColor }} />
                  {t("workspace.quick_links")}
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setLocation("/observer")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                    data-testid="link-observer"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor + "15" }}
                    >
                      <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block" style={{ color: textColor }}>
                        Observer View
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                  <button
                    onClick={() => setLocation("/admin")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                    data-testid="link-admin"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor + "15" }}
                    >
                      <LayoutDashboard className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block" style={{ color: textColor }}>
                        Admin Dashboard
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                  <button
                    onClick={() => setLocation("/portal")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                    data-testid="link-portal"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor + "15" }}
                    >
                      <ExternalLink className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block" style={{ color: textColor }}>
                        Aestimamus Portal
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                  <Info className="h-5 w-5" style={{ color: primaryColor }} />
                  {t("workspace.info")}
                </h2>
                <div className="p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{t("candidate.status")}</span>
                    <Badge
                      className={`text-[10px] uppercase tracking-wider font-semibold border ${statusColor(workspace?.status || "")}`}
                      data-testid="badge-workspace-status"
                    >
                      {workspace?.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Slug</span>
                    <span className="text-sm font-mono text-slate-600" data-testid="text-workspace-slug">
                      {workspace?.slug}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {t("workspace.data_residency")}
                    </span>
                    <span className="text-sm font-medium" data-testid="text-data-residency">
                      {workspace?.dataResidency || "EU"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <footer
        className="py-8 border-t"
        style={{
          backgroundColor: secondaryColor,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <span
            className="text-sm font-medium tracking-tight block mb-2"
            style={{ fontFamily: headingFont, color: primaryColor, opacity: 0.8 }}
          >
            {workspace?.name}
          </span>
          <p className="text-slate-500 text-xs" data-testid="text-footer-credit">
            {t("platform.footer_credit")}
          </p>
        </div>
      </footer>
    </div>
  );
}
