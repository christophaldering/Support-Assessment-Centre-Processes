"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BdpContext, BdpUser } from "./bdp-context";

const PUBLIC_PATHS = ["/arag-bdp/gate", "/arag-bdp/login", "/anmeldung"];

export default function BdpLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BdpUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  const tabs = [
    { href: "/arag-bdp", label: "Home", testId: "bdp-tab-home", icon: "🏠", disabled: false },
    { href: "/arag-bdp/sessions", label: "Sessions", testId: "bdp-tab-sessions", icon: "📋", disabled: false },
    { href: "/arag-bdp/bewertung", label: "Bewertung", testId: "bdp-tab-bewertung", icon: "⭐", disabled: false },
    { href: "/arag-bdp/auswertung", label: "Auswertung", testId: "bdp-tab-auswertung", icon: "📊", disabled: true },
  ];

  const viewModeClass = user.viewMode === "desktop" ? "max-w-6xl" : user.viewMode === "tablet" ? "max-w-2xl" : "max-w-md";

  return (
    <BdpContext.Provider value={{ user, loading, refetchUser: fetchUser }}>
      <div className="min-h-screen bg-[#FFFBF0] text-black flex flex-col">
        {user.environment === "demo" && (
          <div data-testid="demo-banner" className="bg-[#FFD700] text-black text-center py-1 text-sm font-bold tracking-wider">
            DEMO-UMGEBUNG
          </div>
        )}

        <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
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
                  <Link href="/arag-bdp/admin" data-testid="bdp-menu-admin" className="block py-2 px-4 rounded hover:bg-gray-100 font-bold" onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
                <button data-testid="bdp-menu-logout" onClick={handleLogout} className="block py-2 px-4 rounded hover:bg-red-50 text-red-600 w-full text-left">Abmelden</button>
              </nav>
            </div>
          </div>
        )}

        <main className={`flex-1 ${viewModeClass} mx-auto w-full px-4 py-4 pb-24`}>
          {children}
        </main>

        <footer className="text-center py-2 text-xs text-gray-400 border-t border-gray-100 bg-white">
          Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
        </footer>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40" data-testid="bottom-nav">
          <div className={`${viewModeClass} mx-auto flex justify-around py-2`}>
            {tabs.map(tab => {
              const active = pathname === tab.href || (tab.href !== "/arag-bdp" && pathname.startsWith(tab.href));
              if (tab.disabled) {
                return (
                  <span
                    key={tab.href}
                    data-testid={tab.testId}
                    className="flex flex-col items-center text-xs px-3 py-1 rounded-lg text-gray-300 cursor-not-allowed"
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                );
              }
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-testid={tab.testId}
                  className={`flex flex-col items-center text-xs px-3 py-1 rounded-lg transition-colors ${active ? "text-[#FFD700] font-bold" : "text-gray-500 hover:text-black"}`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </BdpContext.Provider>
  );
}
