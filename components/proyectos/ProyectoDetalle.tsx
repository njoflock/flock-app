"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Proyecto } from "@/lib/mock-proyectos";
import { eliminarProyecto } from "@/app/(main)/proyectos/actions";
import { VistaGeneralTab } from "./tabs/VistaGeneralTab";
import { ControlHorasTab } from "./tabs/ControlHorasTab";
import { HitosTab }        from "./tabs/HitosTab";
import { RiesgosTab }      from "./tabs/RiesgosTab";

type Tab = "general" | "horas" | "hitos" | "riesgos";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Vista General" },
  { id: "horas",   label: "Control de Horas" },
  { id: "hitos",   label: "Hitos" },
  { id: "riesgos", label: "Riesgos" },
];

interface PersonaSimple { id: string; nombre: string; iniciales: string }

export function ProyectoDetalle({ proyecto, personas = [] }: { proyecto: Proyecto; personas?: PersonaSimple[] }) {
  const [tab, setTab]       = useState<Tab>("general");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleEliminar() {
    await eliminarProyecto(proyecto.id);
    router.push("/proyectos");
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb + menú */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12.5px]">
          <Link
            href="/proyectos"
            className="text-[rgba(28,0,44,0.4)] hover:text-[rgba(28,0,44,0.7)] transition-colors duration-150"
          >
            Proyectos
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.22)" }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[rgba(28,0,44,0.52)] font-medium">{proyecto.nombre}</span>
        </nav>

        {/* Menú tres puntos */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] transition-colors duration-150 cursor-pointer"
            style={{
              color:      menuOpen ? "rgba(28,0,44,0.6)" : "rgba(28,0,44,0.28)",
              background: menuOpen ? "rgba(28,0,44,0.06)" : "transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; e.currentTarget.style.color = "rgba(28,0,44,0.6)"; }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(28,0,44,0.28)"; } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 rounded-[10px] bg-white overflow-hidden z-50"
              style={{ minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)", border: "1px solid rgba(28,0,44,0.07)" }}
            >
              <button
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors duration-100 cursor-pointer"
                style={{ color: "#1C002C" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => { setMenuOpen(false); setTab("general"); }}
              >
                <span style={{ fontSize: 13 }}>✏️</span>
                <span className="font-medium">Editar proyecto</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors duration-100 cursor-pointer"
                style={{ color: "#1C002C" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => { setMenuOpen(false); }}
              >
                <span style={{ fontSize: 13 }}>📦</span>
                <span className="font-medium">Archivar proyecto</span>
              </button>
              <div style={{ height: 1, background: "rgba(28,0,44,0.06)", margin: "0 10px" }} />
              <button
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors duration-100 cursor-pointer"
                style={{ color: "#dc2626" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => { setMenuOpen(false); setShowDelete(true); }}
              >
                <span style={{ fontSize: 13 }}>🗑</span>
                <span className="font-medium">Eliminar proyecto</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-[16px] p-6 w-[380px]" style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.18)" }}>
            <p className="text-[16px] font-bold text-[#1C002C] mb-2">Eliminar proyecto</p>
            <p className="text-[13.5px] text-[rgba(28,0,44,0.55)] mb-6">¿Estás seguro que querés eliminar <strong>{proyecto.nombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-[8px] text-[13px] font-medium cursor-pointer" style={{ color: "rgba(28,0,44,0.6)", background: "rgba(28,0,44,0.05)" }}>Cancelar</button>
              <button onClick={handleEliminar} className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white cursor-pointer" style={{ background: "#dc2626" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b" style={{ borderColor: "rgba(28,0,44,0.07)" }}>
        {TABS.map(t => {
          const disabled = t.id === "hitos" || t.id === "riesgos";
          return (
            <button
              key={t.id}
              onClick={() => { if (!disabled) setTab(t.id); }}
              disabled={disabled}
              className="relative px-4 py-2.5 text-[13.5px] font-medium transition-colors duration-150"
              style={{
                color: disabled ? "rgba(28,0,44,0.22)" : tab === t.id ? "#7F07C5" : "rgba(28,0,44,0.42)",
                cursor: disabled ? "default" : "pointer",
              }}
              onMouseEnter={e => { if (!disabled && tab !== t.id) e.currentTarget.style.color = "rgba(28,0,44,0.7)"; }}
              onMouseLeave={e => { if (!disabled && tab !== t.id) e.currentTarget.style.color = "rgba(28,0,44,0.42)"; }}
            >
              {t.label}
              {tab === t.id && !disabled && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: "linear-gradient(90deg,#FF5102,#7F07C5)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div>
        {tab === "general"  && <VistaGeneralTab proyecto={proyecto} personas={personas} onSwitchToHoras={() => setTab("horas")} />}
        {tab === "horas"    && <ControlHorasTab proyecto={proyecto} />}
        {tab === "hitos"    && <HitosTab        proyecto={proyecto} />}
        {tab === "riesgos"  && <RiesgosTab      proyecto={proyecto} />}
      </div>
    </div>
  );
}
