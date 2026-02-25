"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ModuleItem {
  title: string;
  href: string;
  icon: string;
  count?: number;
  moduleKey: string;
}

interface AdminSidebarProps {
  workspaceSlug: string;
  workspaceName: string;
  modules: ModuleItem[];
  featureFlags: Record<string, boolean>;
  isMaster: boolean;
  isAdmin: boolean;
  userRoles: string[];
  teamCount: number;
}

function ModuleIcon({ icon, color }: { icon: string; color: string }) {
  const cls = "w-4 h-4";
  const props = { className: cls, fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: color };
  switch (icon) {
    case "target":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" /></svg>;
    case "library":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
    case "builder":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.573-5.572a2.625 2.625 0 113.714-3.714l5.573 5.572M11.42 15.17l4.572 4.574a2.625 2.625 0 003.714-3.714l-4.573-4.574M11.42 15.17l-1.06-1.06" /></svg>;
    case "clipboard":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" /></svg>;
    case "chart":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
    case "palette":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>;
    case "brain":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
    case "users":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case "competency":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    case "casestudy":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    case "report":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5" /></svg>;
    case "audio":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
    case "consent":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
    case "governance":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;
    default:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>;
  }
}

export default function AdminSidebar({
  workspaceSlug,
  workspaceName,
  modules,
  featureFlags,
  isMaster,
  isAdmin,
  teamCount,
}: AdminSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const base = `/w/${workspaceSlug}/admin`;
  const canSeeAll = isMaster || isAdmin;

  const isActive = (href: string) => {
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  };

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-2 text-sm transition-all text-left border-l-[3px] no-underline ${
      active
        ? "font-medium border-[#A6473B]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
    }`;
  const activeStyle = { color: "#A6473B", backgroundColor: "rgba(166, 71, 59, 0.06)" };

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-1.5 rounded-lg bg-white/80 shadow-sm border border-slate-200 hover:bg-white transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-toggle-sidebar"
        style={{ top: "1.1rem" }}
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-14 left-0 z-40 md:z-10 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 shrink-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <Link href={base} className="no-underline" onClick={() => setSidebarOpen(false)}>
            <h2 className="text-sm font-bold truncate" style={{ color: "#A6473B", fontFamily: "'Satoshi', 'Inter', sans-serif" }}>{workspaceName}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Enterprise Cockpit</p>
          </Link>
        </div>

        <nav className="flex-1 py-3">
          <div className="px-4 mb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Übersicht</p>
          </div>
          <Link
            href={base}
            className={navItemClass(pathname === base)}
            style={pathname === base ? activeStyle : undefined}
            onClick={() => setSidebarOpen(false)}
            data-testid="nav-dashboard"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <div className="px-4 mt-4 mb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projekte</p>
          </div>
          <Link
            href={`${base}/assessments`}
            className={navItemClass(isActive(`${base}/assessments`))}
            style={isActive(`${base}/assessments`) ? activeStyle : undefined}
            onClick={() => setSidebarOpen(false)}
            data-testid="nav-assessments"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span>Assessments</span>
          </Link>

          <div className="px-4 mt-4 mb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Werkzeuge</p>
          </div>
          {modules.map((mod) => {
            const released = featureFlags[mod.moduleKey] ?? false;
            const accessible = released || canSeeAll;
            if (!released && !canSeeAll) return null;
            return (
              <Link
                key={mod.title}
                href={accessible ? mod.href : "#"}
                className={`${navItemClass(isActive(mod.href))} ${!accessible ? "opacity-40 pointer-events-none" : ""}`}
                style={isActive(mod.href) ? activeStyle : undefined}
                onClick={(e) => {
                  if (!accessible) { e.preventDefault(); return; }
                  setSidebarOpen(false);
                }}
                data-testid={`nav-module-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                  <ModuleIcon icon={mod.icon} color="currentColor" />
                </div>
                <span className="truncate">{mod.title}</span>
                {mod.count !== undefined && (
                  <span className="ml-auto text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {mod.count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="px-4 mt-4 mb-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verwaltung</p>
          </div>
          <Link
            href={`${base}/users`}
            className={navItemClass(isActive(`${base}/users`))}
            style={isActive(`${base}/users`) ? activeStyle : undefined}
            onClick={() => setSidebarOpen(false)}
            data-testid="nav-users"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Benutzer & Rollen</span>
          </Link>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 space-y-2 mt-auto">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>{teamCount} Teammitglieder</span>
          </div>
          {isMaster && (
            <Link
              href="/admin/workspaces"
              className="flex items-center gap-2 text-[11px] font-medium text-[#297587] hover:underline no-underline"
              data-testid="sidebar-link-switch-workspace"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Workspace wechseln
            </Link>
          )}
          <p className="text-[9px] text-slate-400 pt-1">
            &copy; Christoph Aldering &middot; Private initiative &ndash; for training reasons only &ndash; no data from reality so far!
          </p>
        </div>
      </aside>
    </>
  );
}
