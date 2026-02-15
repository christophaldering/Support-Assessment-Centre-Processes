import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, BarChart3, ClipboardList, Briefcase } from "lucide-react";
import logo from "../assets/logo-varexia.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/briefing", label: "Strategic Briefing", icon: FileText },
    { href: "/financials", label: "Financial Data", icon: BarChart3 },
    { href: "/assessment", label: "Assessment Workspace", icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-2xl z-10">
        <div className="p-6 border-b border-sidebar-border/50 bg-sidebar-accent/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Varexia Logo" className="h-10 w-10 object-contain rounded-sm bg-white p-1" />
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight text-white">VAREXIA SE</h1>
              <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest">Executive Board</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
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
            <p>This session contains sensitive insider information. For Executive Board use only.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm/50 backdrop-blur-sm bg-white/90">
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Assessment Center</span>
             <span className="text-slate-300">/</span>
             <span className="text-slate-900 font-medium">FY 2026 Strategy Review</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400">SESSION_ID: VRX-2991-A</span>
            <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-serif text-xs">
              EB
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
