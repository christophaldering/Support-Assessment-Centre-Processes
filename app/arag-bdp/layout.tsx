"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  Calendar,
  Scale,
  BarChart3,
  Shield,
  FlaskConical,
  Download,
  LogOut,
  User,
  Mail,
} from "lucide-react";
import { BdpContext, BdpUser } from "./bdp-context";

const PUBLIC_PATHS = ["/arag-bdp/gate", "/arag-bdp/login", "/anmeldung"];

export default function BdpLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BdpUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchUser = async () => {
    try {
      const bdpRes = await fetch("/api/arag-bdp/auth/session");
      const bdpData = await bdpRes.json();
      if (bdpData.authenticated) {
        setUser(bdpData.user);
        setLoading(false);
        return;
      }

      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        const isArag = meData.workspaceSlug === "arag";
        if (isArag) {
          setUser({
            id: meData.id,
            code: meData.name || meData.email.split("@")[0],
            role: meData.roles?.[0] || "USER",
            isAdmin: meData.roles?.includes("ADMIN") || meData.roles?.includes("WORKSPACE_ADMIN") || false,
            environment: "demo",
            viewMode: "mobile",
            uiPreset: "whatsapp_spiegel",
          });
          setLoading(false);
          return;
        }
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/anmeldung");
    }
  }, [loading, user, pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/arag-bdp/auth/session", { method: "DELETE" });
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/anmeldung");
  };

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isPublicPath) {
    return (
      <BdpContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
        <div className="min-h-screen bg-[#FFFBF0]">{children}</div>
      </BdpContext.Provider>
    );
  }

  if (!user) return null;

  const mobileTabs = [
    { href: "/arag-bdp", label: "Home", testId: "bdp-tab-home", Icon: LayoutGrid, disabled: false },
    { href: "/arag-bdp/sessions", label: "Sessions", testId: "bdp-tab-sessions", Icon: Calendar, disabled: false },
    { href: "/arag-bdp/bewertung", label: "Bewertung", testId: "bdp-tab-bewertung", Icon: Scale, disabled: false },
    { href: "/arag-bdp/auswertung", label: "Auswertung", testId: "bdp-tab-auswertung", Icon: BarChart3, disabled: true },
  ];

  const sidebarMain = [
    { href: "/arag-bdp", label: "Dashboard", testId: "bdp-side-dashboard", Icon: LayoutGrid },
    { href: "/arag-bdp/sessions", label: "Sessions", testId: "bdp-side-sessions", Icon: Calendar },
    { href: "/arag-bdp/bewertung", label: "Bewertung", testId: "bdp-side-bewertung", Icon: Scale },
    { href: "/arag-bdp/auswertung", label: "Auswertung", testId: "bdp-side-auswertung", Icon: BarChart3 },
  ];

  const sidebarAdmin = [
    { href: "/arag-bdp/admin", label: "Admin Konsole", testId: "bdp-side-admin", Icon: Shield },
    { href: "/arag-bdp/admin/qa", label: "QA", testId: "bdp-side-qa", Icon: FlaskConical },
    { href: "/arag-bdp/admin?tab=export", label: "Exporte", testId: "bdp-side-exports", Icon: Download },
    { href: "/arag-bdp/admin/invitations", label: "Einladungen", testId: "bdp-side-invitations", Icon: Mail },
  ];

  const isActive = (href: string) => {
    if (href === "/arag-bdp") return pathname === "/arag-bdp";
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath === "/arag-bdp/admin" && hrefQuery) {
      const params = new URLSearchParams(hrefQuery);
      const tabValue = params.get("tab");
      return pathname === "/arag-bdp/admin" && searchParams.get("tab") === tabValue;
    }
    if (hrefPath === "/arag-bdp/admin" && !hrefQuery) {
      return pathname === "/arag-bdp/admin" && !searchParams.get("tab");
    }
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  };

  return (
    <BdpContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
      {/* ═══════════════════════════════════════════════
          DESKTOP SHELL (lg: breakpoint and above)
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen bg-[#FFFBF0] text-black">
        <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#0b0b0b] text-[#FFFBF0] flex flex-col z-50">
          <div className="h-14 flex items-center px-6 border-b border-white/5">
            <span className="text-sm font-semibold tracking-wide text-[#FFFBF0]/80">ARAG BDP</span>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
            {sidebarMain.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.testId}
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                    active
                      ? "text-[#FFD700] bg-white/5"
                      : "text-[#FFFBF0]/60 hover:text-[#FFFBF0] hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FFD700] rounded-r-full" />
                  )}
                  <item.Icon size={18} strokeWidth={1.75} className={active ? "text-[#FFD700]" : ""} />
                  {item.label}
                </Link>
              );
            })}

            {user.isAdmin && (
              <>
                <div className="my-3 mx-3 border-t border-white/10" />
                {sidebarAdmin.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.testId}
                      href={item.href}
                      data-testid={item.testId}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                        active
                          ? "text-[#FFD700] bg-white/5"
                          : "text-[#FFFBF0]/60 hover:text-[#FFFBF0] hover:bg-white/5"
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FFD700] rounded-r-full" />
                      )}
                      <item.Icon size={18} strokeWidth={1.75} className={active ? "text-[#FFD700]" : ""} />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-xs shrink-0">
                {user.photoUrl ? <img src={user.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" /> : user.code[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#FFFBF0] truncate">{user.code}</div>
                <div className="text-[10px] text-[#FFFBF0]/40">{user.role}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 h-14 bg-[#FFFBF0] border-b border-black/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {user.environment === "demo" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFD700] text-black px-2 py-0.5 rounded">
                  Demo
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-black/50">{user.code}</span>
              <Link
                href="/arag-bdp/profile"
                data-testid="link-profile"
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <User size={14} strokeWidth={1.75} className="text-black/50" />
              </Link>
              <button
                onClick={handleLogout}
                data-testid="bdp-desktop-logout"
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors text-black/50"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <main className="flex-1 px-8 py-6">
            <div className="max-w-[1140px] mx-auto">
              {children}
            </div>
          </main>

          <footer className="text-center py-2 text-xs text-gray-400 border-t border-gray-100">
            Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </footer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE SHELL (below lg: breakpoint)
          ═══════════════════════════════════════════════ */}
      <div className="lg:hidden fixed inset-0 bg-[#FFFBF0] text-black flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
        {user.environment === "demo" && (
          <div data-testid="demo-banner" className="bg-[#FFD700] text-black text-center py-1 text-sm font-bold tracking-wider shrink-0">
            DEMO-UMGEBUNG
          </div>
        )}

        <header className="bg-black text-white px-4 py-3 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">ARAG BDP</span>
            <span className="text-[#FFD700] text-sm font-mono">{user.code}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/arag-bdp/profile" data-testid="link-profile" className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-sm">
              {user.photoUrl ? <img src={user.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" /> : user.code[0]}
            </Link>
            <button data-testid="bdp-menu-hamburger" onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">☰</button>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-xl">✕</button>
              <nav className="mt-12 space-y-4">
                <Link href="/arag-bdp/profile" data-testid="bdp-menu-profile" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Profil</Link>
                <Link href="/arag-bdp/profile" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Einstellungen</Link>
                {user.isAdmin && (
                  <>
                    <Link href="/arag-bdp/admin" data-testid="bdp-menu-admin" className="block py-2 px-4 rounded hover:bg-gray-100 font-bold" onClick={() => setMenuOpen(false)}>Admin</Link>
                    <Link href="/arag-bdp/admin/invitations" data-testid="bdp-menu-invitations" className="block py-2 px-4 rounded hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Einladungen</Link>
                  </>
                )}
                <button data-testid="bdp-menu-logout" onClick={handleLogout} className="block py-2 px-4 rounded hover:bg-red-50 text-red-600 w-full text-left">Abmelden</button>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overscroll-none max-w-md mx-auto w-full px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
          {children}
        </main>

        <nav className="shrink-0 bg-[#FFFBF0] border-t border-black/10 z-50" role="navigation" data-testid="bottom-nav">
          <div className="max-w-[480px] mx-auto flex justify-around items-center h-[70px]">
            {mobileTabs.map(tab => {
              const active = pathname === tab.href || (tab.href !== "/arag-bdp" && pathname.startsWith(tab.href));

              if (tab.disabled) {
                return (
                  <span
                    key={tab.href}
                    data-testid={tab.testId}
                    className="flex flex-col items-center justify-center gap-1 min-w-[60px] cursor-not-allowed opacity-30"
                  >
                    <tab.Icon size={22} strokeWidth={1.75} />
                    <span className="text-[11px] uppercase tracking-wide">
                      {tab.label}
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-testid={tab.testId}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-150 ease-in-out ${
                    active
                      ? "text-[#FFD700]"
                      : "text-black/70 hover:opacity-100 opacity-70"
                  }`}
                >
                  <tab.Icon
                    size={22}
                    strokeWidth={1.75}
                    className={`transition-transform duration-150 ease-in-out ${active ? "scale-105" : "scale-100"}`}
                  />
                  <span className="text-[11px] uppercase tracking-wide">
                    {tab.label}
                  </span>
                  {active && (
                    <div className="w-6 h-0.5 bg-[#FFD700] rounded-full mt-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </BdpContext.Provider>
  );
}
