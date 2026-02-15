import { Link, useLocation, useRoute } from "wouter";
import { LayoutDashboard, FileText, BarChart3, ClipboardList, Database, ArrowLeft } from "lucide-react";
import aestimamusLogo from "@assets/Bildschirmfoto_2026-02-15_um_02.45.11_1771120072465.png";
import { varexiaData } from "@/lib/data";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [match, params] = useRoute("/case/:id/:subpage*");
  
  // If we are on the suite dashboard (root), render children without sidebar
  if (location === "/") {
    return <>{children}</>;
  }

  const caseId = params?.id || "varexia";
  // In a real app, we'd fetch the case data based on ID. 
  // For now we default to Varexia if the ID matches, otherwise we'd show 404 or generic.
  const activeCase = caseId === "varexia" ? varexiaData : { name: "Unknown Case" };

  const navItems = [
    { href: `/case/${caseId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/case/${caseId}/briefing`, label: "Strategic Briefing", icon: FileText },
    { href: `/case/${caseId}/dataroom`, label: "Data Room", icon: Database },
    { href: `/case/${caseId}/financials`, label: "Financial Visualization", icon: BarChart3 },
    { href: `/case/${caseId}/assessment`, label: "Assessment Workspace", icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-2xl z-10">
        <div className="p-6 border-b border-sidebar-border/50 bg-sidebar-accent/10">
          <Link href="/">
            <a className="flex items-center gap-2 mb-6 text-sidebar-foreground/60 hover:text-white transition-colors text-xs uppercase tracking-widest font-medium group">
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
              Return to Suite
            </a>
          </Link>
          <div className="flex flex-col gap-4">
            <img src={aestimamusLogo} alt="Aestimamus" className="h-8 object-contain self-start opacity-90 invert brightness-0 grayscale" />
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-white leading-tight">{activeCase.name}</h1>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary text-[10px] font-bold uppercase tracking-wider border border-sidebar-primary/30">
                Active Module
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match for root, partial for others to handle sub-routes if any
            const isActive = location === item.href; 
            return (
              <Link key={item.href} href={item.href}>
                <a className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md translate-x-1" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white hover:translate-x-1"}
                `}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-sidebar-foreground/50"}`} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="bg-sidebar-accent/30 rounded-lg p-3 text-xs text-sidebar-foreground/60">
            <div className="flex items-center gap-2 mb-2 text-sidebar-foreground/80 font-medium">
              <Briefcase className="h-3 w-3" />
              Confidential
            </div>
            <p>Accessing secure assessment environment. All inputs are logged.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm/50 backdrop-blur-sm bg-white/90">
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span className="font-medium text-primary">Aestimamus Suite</span>
             <span className="text-slate-300">/</span>
             <span className="text-slate-900 font-medium">{activeCase.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400">CASE_ID: {caseId.toUpperCase()}</span>
            <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-serif text-xs">
              AV
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
