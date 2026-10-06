"use client";

import { useState } from "react";
import Link from "next/link";
import { type PersonaCompleta } from "@/lib/mock-personas";
import { ResumenTab }     from "./tabs/ResumenTab";
import { ProyectosTab }   from "./tabs/ProyectosTab";
import { InfoLaboralTab } from "./tabs/InfoLaboralTab";

type Tab = "proyectos" | "laboral";

const TABS: { id: Tab; label: string }[] = [
  { id: "proyectos", label: "Proyectos" },
  { id: "laboral",   label: "Compensatorio" },
];

export type ProyectoPersona = {
  asignacionId: string;
  proyectoId: string;
  proyectoNombre: string;
  proyectoEstado: "activo" | "finalizado";
  clienteNombre: string;
  rol: string;
  horasVendidas: number;
  fechaInicio?: string;
  fechaFin: string | null;
  activo: boolean;
};

export function PersonaDetalle({ persona, proyectos = [] }: { persona: PersonaCompleta; proyectos?: ProyectoPersona[] }) {
  const [tab, setTab] = useState<Tab>("proyectos");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12.5px]">
        <Link
          href="/personas"
          className="text-[rgba(28,0,44,0.4)] hover:text-[rgba(28,0,44,0.7)] transition-colors duration-150"
        >
          Personas
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.22)" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="text-[rgba(28,0,44,0.52)] font-medium">{persona.nombre}</span>
      </nav>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b" style={{ borderColor: "rgba(28,0,44,0.07)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="relative px-4 py-2.5 text-[13.5px] font-medium transition-colors duration-150 cursor-pointer"
            style={{ color: tab === t.id ? "#7F07C5" : "rgba(28,0,44,0.42)" }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = "rgba(28,0,44,0.7)"; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = "rgba(28,0,44,0.42)"; }}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                style={{ background: "linear-gradient(90deg,#FF5102,#7F07C5)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {tab === "proyectos" && <ProyectosTab   persona={persona} proyectos={proyectos} />}
        {tab === "laboral"   && <InfoLaboralTab persona={persona} />}
      </div>
    </div>
  );
}
