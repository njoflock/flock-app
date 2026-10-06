"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2"/>
        <rect x="14" y="3" width="7" height="7" rx="2"/>
        <rect x="3" y="14" width="7" height="7" rx="2"/>
        <rect x="14" y="14" width="7" height="7" rx="2"/>
      </svg>
    ),
  },
  {
    href: "/proyectos",
    label: "Proyectos",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z"/>
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
        <line x1="12" y1="11" x2="12" y2="16"/>
        <line x1="9.5" y1="13.5" x2="14.5" y2="13.5"/>
      </svg>
    ),
  },
  {
    href: "/personas",
    label: "Personas",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="7" r="3.5"/>
        <path d="M2 21c0-3.866 2.686-7 6-7h4c3.314 0 6 3.134 6 7"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        <path d="M21 21c0-3.325-1.745-6.165-4.34-7.315"/>
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: {
    name: string;
    email: string;
    avatar: string | null;
    initials: string;
  };
}

export function Sidebar({ collapsed, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="relative flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 64 : 228,
        // Gradiente multicapa premium
        background: `
          linear-gradient(180deg,
            #1E0033 0%,
            #24003E 30%,
            #1C002C 60%,
            #1A0028 100%
          )
        `,
        boxShadow: "2px 0 24px 0 rgba(0,0,0,0.22), inset -1px 0 0 rgba(127,7,197,0.14)",
      }}
    >
      {/* Acento luminoso superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(127,7,197,0.6) 40%, rgba(255,81,2,0.4) 70%, transparent)",
        }}
      />

      {/* Orbe decorativo muy sutil */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(127,7,197,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-24 left-0 w-32 h-32 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(255,81,2,0.05) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo ── */}
      <div className="flex items-center h-16 px-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #FF5102 0%, #7F07C5 100%)", boxShadow: "0 2px 8px rgba(255,81,2,0.35)" }}
        >
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="10" height="10" rx="2.5" fill="white"/>
            <rect x="18" y="4" width="10" height="10" rx="2.5" fill="white" fillOpacity="0.7"/>
            <rect x="4" y="18" width="10" height="10" rx="2.5" fill="white" fillOpacity="0.7"/>
            <rect x="18" y="18" width="10" height="10" rx="2.5" fill="white" fillOpacity="0.45"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="ml-2.5 font-semibold text-[15px] tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
            Flock
          </span>
        )}

        {/* Botón colapsar — solo visible expandido */}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Colapsar sidebar"
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer"
            style={{ color: "rgba(255,255,255,0.28)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">

        {!collapsed && (
          <p className="px-2 pt-1 pb-3 text-[10px] font-semibold tracking-[0.09em] uppercase" style={{ color: "rgba(255,255,255,0.28)" }}>
            Menú
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="group relative flex items-center gap-3 rounded-[9px] transition-all duration-150 select-none"
              style={{
                padding: collapsed ? "11px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : undefined,
                background: active
                  ? "linear-gradient(90deg, rgba(255,81,2,0.18) 0%, rgba(127,7,197,0.14) 100%)"
                  : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.72)",
                boxShadow: active
                  ? "inset 0 0 20px rgba(255,81,2,0.06), 0 0 0 1px rgba(255,81,2,0.1)"
                  : "none",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.92)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.72)";
                }
              }}
            >
              {/* Indicador lateral activo */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                  style={{
                    width: 3,
                    height: 22,
                    background: "linear-gradient(180deg, #FF5102 0%, #7F07C5 100%)",
                    boxShadow: "0 0 8px rgba(255,81,2,0.7)",
                  }}
                />
              )}

              {/* Ícono */}
              <span
                className="shrink-0 transition-all duration-150"
                style={{
                  filter: active ? "drop-shadow(0 0 5px rgba(255,81,2,0.55))" : "none",
                  opacity: active ? 1 : 0.85,
                }}
              >
                {item.icon(active)}
              </span>

              {!collapsed && (
                <span
                  className="text-[14.5px] tracking-tight leading-none"
                  style={{ fontWeight: active ? 600 : 450 }}
                >
                  {item.label}
                </span>
              )}

              {/* Tooltip colapsado */}
              {collapsed && (
                <span
                  className="pointer-events-none absolute left-full ml-2.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{ background: "#1C002C", color: "rgba(255,255,255,0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", border: "1px solid rgba(127,7,197,0.2)" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Botón expandir cuando colapsado ── */}
      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expandir sidebar"
          className="mx-auto mb-4 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 cursor-pointer"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}

      {/* ── Usuario ── */}
      <div
        className="relative shrink-0 px-2.5 pb-3 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        ref={menuRef}
      >
        <button
          onClick={() => !collapsed && setUserMenuOpen(v => !v)}
          className="w-full flex items-center gap-2.5 rounded-[8px] transition-all duration-150 cursor-pointer text-left"
          style={{ padding: collapsed ? "8px 0" : "8px 10px", justifyContent: collapsed ? "center" : undefined }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <UserAvatar user={user} size={28} />

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: "rgba(255,255,255,0.88)" }}>
                {user.name.split(" ")[0]}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {user.email}
              </p>
            </div>
          )}

          {!collapsed && (
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
        </button>

        {/* Menú de usuario */}
        {userMenuOpen && !collapsed && (
          <div
            className="absolute bottom-full left-2 right-2 mb-1 rounded-[10px] overflow-hidden"
            style={{ background: "#270040", border: "1px solid rgba(127,7,197,0.22)", boxShadow: "0 -8px 24px rgba(0,0,0,0.3)" }}
          >
            {/* Info */}
            <div className="px-3.5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2.5">
                <UserAvatar user={user} size={32} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{user.name}</p>
                  <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{user.email}</p>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="py-1">
              <UserMenuItem icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}>
                Mi perfil
              </UserMenuItem>
              <UserMenuItem icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}>
                Configuración
              </UserMenuItem>
            </div>

            <div className="py-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors duration-150 cursor-pointer text-left"
                style={{ color: "rgba(255,110,50,0.9)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,81,2,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function UserAvatar({ user, size }: { user: SidebarProps["user"]; size: number }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="rounded-full object-cover shrink-0 ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, #FF5102, #7F07C5)",
        boxShadow: "0 0 0 1.5px rgba(255,255,255,0.12)",
      }}
    >
      {user.initials}
    </div>
  );
}

function UserMenuItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors duration-150 cursor-pointer text-left"
      style={{ color: "rgba(255,255,255,0.55)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
    >
      <span style={{ color: "rgba(255,255,255,0.3)" }}>{icon}</span>
      {children}
    </button>
  );
}
