import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { LogOut, Globe, Calendar, ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  workspaceId: string;
}

interface CandidateAssessment {
  candidateProfile: {
    id: string;
    assessmentId: string;
    userId: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    briefingConfirmed?: boolean;
  };
  assessment: {
    id: string;
    workspaceId: string;
    title?: string;
    targetRole?: string;
    organizationName?: string;
    startDate?: string;
    endDate?: string;
    language: string;
    location?: string;
    status: string;
  };
}

export default function CandidatePortal() {
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [assessments, setAssessments] = useState<CandidateAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("platform_user");
    if (!raw) {
      setLocation("/login");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PlatformUser;
      if (!parsed.roles?.includes("CANDIDATE")) {
        setLocation("/login");
        return;
      }
      setUser(parsed);
      fetchAssessments(parsed.id);
    } catch {
      setLocation("/login");
    }
  }, []);

  const fetchAssessments = async (userId: string) => {
    try {
      const res = await apiRequest("GET", `/api/platform/candidate/${userId}/assessments`);
      const data = await res.json();
      setAssessments(data);
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("platform_user");
    setLocation("/login");
  };

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
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (!user) return null;

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
            <span className="text-slate-300 text-sm hidden sm:inline" data-testid="text-user-name">
              {user.firstName} {user.lastName}
            </span>
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
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <p className="text-slate-500 text-sm mb-1" data-testid="text-welcome">
              {t("candidate.welcome")}, {user.firstName}
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-3 tracking-tight"
              data-testid="text-candidate-title"
            >
              {t("candidate.title")}
            </h1>
            <div className="h-1 w-16 bg-[#3b82f6] mx-auto rounded-full mt-6 hidden" />
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assessments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-20"
              data-testid="empty-assessments"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-base">{t("candidate.no_assessments")}</p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {assessments.map((item, i) => (
                <motion.div
                  key={item.assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  data-testid={`card-assessment-${item.assessment.id}`}
                >
                  <div className="group p-6 rounded-2xl border border-slate-200 hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-[#3b82f6]/5 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className="text-lg font-semibold text-[#0f172a] mb-2"
                          data-testid={`text-assessment-title-${item.assessment.id}`}
                        >
                          {item.assessment.title || "Executive Assessment"}
                        </h3>
                        {item.assessment.organizationName && (
                          <p className="text-slate-500 text-sm mb-3" data-testid={`text-org-${item.assessment.id}`}>
                            {t("candidate.organization")}: {item.assessment.organizationName}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`text-[10px] uppercase tracking-wider font-semibold border ${statusColor(item.assessment.status)}`}
                            data-testid={`badge-status-${item.assessment.id}`}
                          >
                            {item.assessment.status}
                          </Badge>
                          <Badge
                            className="text-[10px] uppercase tracking-wider font-semibold border bg-blue-50 text-blue-700 border-blue-200"
                            data-testid={`badge-lang-${item.assessment.id}`}
                          >
                            {item.assessment.language}
                          </Badge>
                          {item.assessment.startDate && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.assessment.startDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => setLocation("/case/varexia")}
                        className="gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-11 px-6 text-sm shadow-lg shadow-[#3b82f6]/25 hover:shadow-xl hover:shadow-[#3b82f6]/30 transition-all shrink-0"
                        data-testid={`button-start-exercise-${item.assessment.id}`}
                      >
                        {t("candidate.start_exercise")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
