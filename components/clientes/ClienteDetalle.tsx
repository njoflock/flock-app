"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClienteDB, ContactoClienteDB } from "@/lib/types/cliente";
import { ResumenTab }        from "./tabs/ResumenTab";
import { InterlocutoresTab } from "./tabs/InterlocutoresTab";

type Tab = "resumen" | "contacto";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen",  label: "Resumen" },
  { id: "contacto", label: "Contacto" },
];

type ProyectoRow = { id: string; nombre: string; estado: string; fecha_inicio: string | null; fecha_fin: string | null };

export function ClienteDetalle({ cliente, contactos, proyectos = [] }: { cliente: ClienteDB; contactos: ContactoClienteDB[]; proyectos?: ProyectoRow[] }) {
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-[13px] mb-8">
        <Link
          href="/clientes"
          className="font-medium transition-colors duration-150"
          style={{ color: "rgba(28,0,44,0.38)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(28,0,44,0.38)"; }}
        >
          Clientes
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.2)" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className="font-semibold text-[#1C002C]">{cliente.nombre}</span>
      </nav>

      {/* ── Tabs ── */}
      <div className="flex items-end gap-1 mb-8" style={{ borderBottom: "1px solid rgba(28,0,44,0.08)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="relative px-4 pb-3 pt-1 text-[13.5px] font-medium transition-colors duration-150 cursor-pointer"
            style={{ color: tab === t.id ? "#1C002C" : "rgba(28,0,44,0.38)" }}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full"
                style={{ background: "linear-gradient(90deg,#FF5102,#7F07C5)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      {tab === "resumen"  && <ResumenTab        cliente={cliente} proyectos={proyectos} />}
      {tab === "contacto" && <InterlocutoresTab cliente={cliente} contactos={contactos} />}
    </div>
  );
}
