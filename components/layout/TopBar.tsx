"use client";

import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/proyectos": "Proyectos",
  "/personas": "Personas",
  "/clientes": "Clientes",
};

interface TopBarProps {
  user: {
    name: string;
    email: string;
    avatar: string | null;
    initials: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();

  const sectionLabel =
    Object.entries(SECTION_LABELS).find(
      ([key]) => pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "Flock";

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0"
      style={{
        background: `linear-gradient(90deg, #1E0033 0%, #24003E 50%, #1C002C 100%)`,
        borderBottom: "1px solid rgba(127,7,197,0.15)",
        boxShadow: "0 1px 0 rgba(255,81,2,0.06), 0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {/* Acento luminoso inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(127,7,197,0.35) 40%, rgba(255,81,2,0.2) 70%, transparent 100%)",
          position: "initial",
        }}
      />

      {/* Título */}
      <div className="flex items-center gap-3">
        <h1
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: "rgba(255,255,255,0.88)" }}
        >
          {sectionLabel}
        </h1>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5">
        {/* Notificaciones */}
        <button
          aria-label="Notificaciones"
          className="relative w-8 h-8 flex items-center justify-center rounded-[7px] transition-all duration-150 cursor-pointer"
          style={{ color: "rgba(255,255,255,0.45)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Dot */}
          <span
            className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full"
            style={{
              background: "#FF5102",
              boxShadow: "0 0 4px rgba(255,81,2,0.6)",
            }}
          />
        </button>

        {/* Divisor */}
        <div
          className="w-px h-4 mx-1"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {/* Avatar compacto — el menú de usuario está en sidebar */}
        <div className="flex items-center gap-2 pl-1">
          <TopBarAvatar user={user} />
          <span
            className="text-[13px] font-medium hidden sm:block"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {user.name.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
}

function TopBarAvatar({ user }: { user: TopBarProps["user"] }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="rounded-full object-cover"
        style={{
          width: 28,
          height: 28,
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1)",
        }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        width: 28,
        height: 28,
        fontSize: 10,
        background: "linear-gradient(135deg, #FF5102, #7F07C5)",
        boxShadow: "0 0 0 1.5px rgba(255,255,255,0.12)",
      }}
    >
      {user.initials}
    </div>
  );
}
