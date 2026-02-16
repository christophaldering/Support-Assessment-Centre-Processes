import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Users,
  Brain,
  Target,
  Eye,
  Shield,
  FileText,
  Globe,
  ArrowRight,
  AlertCircle,
  Lock,
  Settings,
  UserCheck,
  ClipboardList,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useLang } from "@/lib/i18n";

function SectionReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PlatformLanding() {
  const [showMasterGate, setShowMasterGate] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [masterError, setMasterError] = useState("");
  const [masterLoading, setMasterLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t, toggle, lang } = useLang();

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterError("");
    setMasterLoading(true);
    try {
      await apiRequest("POST", "/api/platform/auth/master", { password: masterPassword });
      sessionStorage.setItem("master_admin_auth", "true");
      setLocation("/workspaces");
    } catch {
      setMasterError(t("platform.master_error"));
    } finally {
      setMasterLoading(false);
    }
  };

  const features = [
    { icon: Users, titleKey: "platform.feature_roles", descKey: "platform.feature_roles_desc" },
    { icon: Brain, titleKey: "platform.feature_ai", descKey: "platform.feature_ai_desc" },
    { icon: Target, titleKey: "platform.feature_competency", descKey: "platform.feature_competency_desc" },
    { icon: Eye, titleKey: "platform.feature_observer", descKey: "platform.feature_observer_desc" },
    { icon: Shield, titleKey: "platform.feature_audit", descKey: "platform.feature_audit_desc" },
    { icon: FileText, titleKey: "platform.feature_reports", descKey: "platform.feature_reports_desc" },
  ];

  const roles = [
    { icon: Settings, nameKey: "platform.role_admin", descKey: "platform.role_admin_desc" },
    { icon: ClipboardList, nameKey: "platform.role_moderator", descKey: "platform.role_moderator_desc" },
    { icon: Eye, nameKey: "platform.role_observer", descKey: "platform.role_observer_desc" },
    { icon: Briefcase, nameKey: "platform.role_assistant", descKey: "platform.role_assistant_desc" },
    { icon: UserCheck, nameKey: "platform.role_hr", descKey: "platform.role_hr_desc" },
    { icon: GraduationCap, nameKey: "platform.role_candidate", descKey: "platform.role_candidate_desc" },
  ];

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
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40"
            data-testid="button-lang-toggle"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "de" ? "EN" : "DE"}
          </button>
        </div>
      </header>

      <section className="relative min-h-[80vh] flex items-center bg-[#0f172a] pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#3b82f6]/5 blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/3 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 w-full py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-[#3b82f6]" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#3b82f6] font-semibold">
                {t("platform.title")}
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
              data-testid="text-hero-title"
            >
              {t("platform.hero_title")}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              {t("platform.hero_subtitle")}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setLocation("/login")}
                className="gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-12 px-8 text-sm shadow-lg shadow-[#3b82f6]/25 hover:shadow-xl hover:shadow-[#3b82f6]/30 transition-all"
                data-testid="button-candidate-login"
              >
                {t("platform.candidate_login")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowMasterGate(!showMasterGate)}
                variant="outline"
                className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-lg font-medium h-12 px-8 text-sm transition-all bg-transparent"
                data-testid="button-master-admin"
              >
                <Lock className="h-4 w-4" />
                {t("platform.master_admin")}
              </Button>
            </div>

            <AnimatePresence>
              {showMasterGate && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-md" data-testid="master-admin-gate">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-4 w-4 text-[#3b82f6]" />
                      <h3 className="text-white font-semibold text-sm">{t("platform.master_password")}</h3>
                    </div>
                    <form onSubmit={handleMasterSubmit} className="space-y-3">
                      <Input
                        type="password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder={t("platform.master_password_placeholder")}
                        className="w-full bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-[#3b82f6] focus:ring-[#3b82f6]/30 rounded-lg h-11"
                        data-testid="input-master-password"
                        autoFocus
                      />
                      <AnimatePresence>
                        {masterError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 text-sm text-red-400 overflow-hidden"
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span data-testid="text-master-error">{masterError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <Button
                        type="submit"
                        disabled={masterLoading || !masterPassword.trim()}
                        className="w-full gap-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] rounded-lg font-medium h-11 text-sm"
                        data-testid="button-master-submit"
                      >
                        {masterLoading ? "..." : t("platform.master_admin")}
                        {!masterLoading && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-features-title">
                {t("platform.features_title")}
              </h2>
              <div className="h-1 w-16 bg-[#3b82f6] mx-auto rounded-full" />
            </div>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <SectionReveal key={feature.titleKey} delay={i * 0.1}>
                <div
                  className="group p-8 rounded-2xl border border-slate-200 hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-[#3b82f6]/5 transition-all duration-300"
                  data-testid={`card-feature-${i}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-5 group-hover:bg-[#3b82f6]/15 transition-colors">
                    <feature.icon className="h-6 w-6 text-[#3b82f6]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0f172a] mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{t(feature.descKey)}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <SectionReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-4" data-testid="text-roles-title">
                {t("platform.roles_title")}
              </h2>
              <div className="h-1 w-16 bg-[#3b82f6] mx-auto rounded-full" />
            </div>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <SectionReveal key={role.nameKey} delay={i * 0.08}>
                <div
                  className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-[#3b82f6]/20 hover:shadow-md transition-all duration-300"
                  data-testid={`card-role-${i}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0f172a]/5 flex items-center justify-center shrink-0">
                    <role.icon className="h-5 w-5 text-[#0f172a]/60" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f172a] mb-1">{t(role.nameKey)}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{t(role.descKey)}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0f172a] py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <span
            className="text-white/80 font-serif text-sm font-medium tracking-tight block mb-3"
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
