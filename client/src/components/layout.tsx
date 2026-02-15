import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { LayoutDashboard, FileText, BarChart3, ClipboardList, Database, ArrowLeft, Briefcase, Mail, Newspaper, Timer, CheckCircle, Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { varexiaData } from "@/lib/data";
import { useLang } from "@/lib/i18n";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const EXERCISE_DURATION = 90 * 60;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/case/:id/:subpage*");
  const [matchCase] = useRoute("/case/:id");
  const { t, toggle, lang } = useLang();

  const caseId = params?.id || (matchCase ? "varexia" : "varexia");

  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const globalAuth = sessionStorage.getItem("aestimamus_global_auth");
    if (globalAuth !== "true") {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`aestimamus_start_${caseId}`);
    if (stored) {
      startTime.current = parseInt(stored);
    } else {
      startTime.current = Date.now();
      sessionStorage.setItem(`aestimamus_start_${caseId}`, String(startTime.current));
    }

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [caseId]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`aestimamus_visited_${caseId}`);
    if (stored) {
      setVisitedSections(new Set(JSON.parse(stored)));
    }
  }, [caseId]);

  useEffect(() => {
    const section = location.split("/").pop() || "overview";
    setVisitedSections(prev => {
      const next = new Set(prev);
      next.add(section === caseId ? "overview" : section);
      sessionStorage.setItem(`aestimamus_visited_${caseId}`, JSON.stringify(Array.from(next)));
      return next;
    });
    setSidebarOpen(false);
  }, [location, caseId]);

  const activeCase = caseId === "varexia" ? varexiaData : { name: "Unknown Case" };
  const remaining = Math.max(0, EXERCISE_DURATION - elapsed);

  const navItems = [
    { href: `/case/${caseId}`, label: t("nav.overview"), icon: LayoutDashboard, key: "overview" },
    { href: `/case/${caseId}/news`, label: t("nav.press"), icon: Newspaper, key: "news" },
    { href: `/case/${caseId}/emails`, label: t("nav.emails"), icon: Mail, key: "emails" },
    { href: `/case/${caseId}/briefing`, label: t("nav.briefing"), icon: FileText, key: "briefing" },
    { href: `/case/${caseId}/dataroom`, label: t("nav.dataroom"), icon: Database, key: "dataroom" },
    { href: `/case/${caseId}/financials`, label: t("nav.financials"), icon: BarChart3, key: "financials" },
    { href: `/case/${caseId}/assessment`, label: t("nav.assessment"), icon: ClipboardList, key: "assessment" },
  ];

  const progressPercent = Math.round((visitedSections.size / navItems.length) * 100);

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-sidebar-border/50 bg-sidebar-accent/10">
        <Link href="/portal" className="flex items-center gap-2 mb-6 text-sidebar-foreground/60 hover:text-white transition-colors text-xs uppercase tracking-widest font-medium group">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          {t("nav.back_to_portal")}
        </Link>
        <div className="flex flex-col gap-4">
          <img src={aestimamusLogo} alt="Aestimamus" className="h-8 object-contain self-start opacity-90 invert brightness-0 grayscale" />
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-white leading-tight">{activeCase.name}</h1>
            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary text-[10px] font-bold uppercase tracking-wider border border-sidebar-primary/30">
              {t("nav.active_module")}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          const isVisited = visitedSections.has(item.key);
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md translate-x-1"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white hover:translate-x-1"}
            `}>
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-sidebar-foreground/50"}`} />
              {item.label}
              {isVisited && !isActive && (
                <CheckCircle className="h-3 w-3 ml-auto text-green-500/60" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50 space-y-3">
        <div className="bg-sidebar-accent/30 rounded-lg p-3">
          <div className="flex justify-between text-xs text-sidebar-foreground/80 mb-2">
            <span>{t("header.progress")}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sidebar-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 mt-1.5">
            {visitedSections.size}/{navItems.length} {lang === "de" ? "Bereiche besucht" : "sections visited"}
          </div>
        </div>

        <div className="bg-sidebar-accent/30 rounded-lg p-3 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-2 mb-2 text-sidebar-foreground/80 font-medium">
            <Briefcase className="h-3 w-3" />
            {t("nav.confidential")}
          </div>
          <p>{t("nav.confidential_msg")}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border shadow-2xl z-10">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col z-40 md:hidden shadow-2xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-white"
                data-testid="button-close-sidebar"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto bg-background relative">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm/50 backdrop-blur-sm bg-card/90">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted"
              data-testid="button-open-sidebar"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-primary">{t("header.suite")}</span>
              <span className="text-border hidden sm:inline">/</span>
              <span className="text-foreground font-medium hidden sm:inline">{activeCase.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center gap-1.5 text-xs" data-testid="status-timer">
              <Timer className={`h-3.5 w-3.5 ${remaining < 600 ? "text-red-500" : "text-muted-foreground"}`} />
              <span className={`font-mono tabular-nums ${remaining < 600 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                {formatTime(remaining)}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
              <span className="text-border">|</span>
              <span>{progressPercent}%</span>
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-foreground/20"
              data-testid="button-lang-toggle"
            >
              <Globe className="h-3 w-3" />
              {lang === "de" ? "EN" : "DE"}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
