"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type PersonaCompleta } from "@/lib/mock-personas";
import { type ProyectoPersona } from "@/components/personas/PersonaDetalle";

const ESTADO_CFG = {
  activo:     { color: "#7F07C5", bg: "rgba(127,7,197,0.07)", border: "rgba(127,7,197,0.15)", label: "Activo" },
  finalizado: { color: "#6b7280", bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.12)", label: "Finalizado" },
};

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatPeriodo(fechaInicio?: string, fechaFin?: string | null): string {
  if (!fechaInicio) return "—";
  const inicio = formatFecha(fechaInicio);
  const fin    = fechaFin ? formatFecha(fechaFin) : "Actualidad";
  return `${inicio} → ${fin}`;
}

export function ProyectosTab({ persona, proyectos }: { persona: PersonaCompleta; proyectos: ProyectoPersona[] }) {
  const [filtroEstado, setFiltroEstado] = useState<"activo" | "finalizado" | "todos">("todos");

  const filtered = useMemo(() =>
    filtroEstado === "todos" ? proyectos : proyectos.filter(p => p.proyectoEstado === filtroEstado),
    [proyectos, filtroEstado]
  );

  if (proyectos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(28,0,44,0.04)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.25)" }}>
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <p className="text-[14px] font-medium text-[rgba(28,0,44,0.4)]">Sin proyectos asignados</p>
        <p className="text-[12.5px] text-[rgba(28,0,44,0.3)] mt-1">La asignación se gestiona desde el módulo Proyectos.</p>
      </div>
    );
  }

  const cntActivos     = proyectos.filter(p => p.proyectoEstado === "activo").length;
  const cntFinalizados = proyectos.filter(p => p.proyectoEstado === "finalizado").length;

  return (
    <div className="space-y-3 pb-16">

      {/* Filtros */}
      <div className="flex justify-end">
        <div
          className="flex items-center rounded-[9px] p-0.5"
          style={{ border: "1px solid rgba(28,0,44,0.09)", background: "rgba(28,0,44,0.02)" }}
        >
          {([
            { value: "todos",      label: "Todos",       count: proyectos.length },
            { value: "activo",     label: "Activos",     count: cntActivos },
            { value: "finalizado", label: "Finalizados", count: cntFinalizados },
          ] as { value: "activo" | "finalizado" | "todos"; label: string; count: number }[]).map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFiltroEstado(value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: filtroEstado === value ? "white" : "transparent",
                color:      filtroEstado === value ? "#1C002C" : "rgba(28,0,44,0.4)",
                boxShadow:  filtroEstado === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: filtroEstado === value ? "rgba(127,7,197,0.08)" : "rgba(28,0,44,0.05)",
                    color:      filtroEstado === value ? "#7F07C5" : "rgba(28,0,44,0.35)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {filtered.length > 0 ? (
        <div className="rounded-[14px] border overflow-hidden" style={{ borderColor: "rgba(28,0,44,0.07)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
                <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Proyecto</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Cliente</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Rol</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Período</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Horas</th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const est  = ESTADO_CFG[p.proyectoEstado];
                const last = i === filtered.length - 1;
                return (
                  <tr
                    key={p.asignacionId}
                    style={{ borderBottom: last ? "none" : "1px solid rgba(28,0,44,0.04)", background: "white" }}
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/proyectos/${p.proyectoId}`}
                        className="text-[13.5px] font-semibold text-[#1C002C] hover:text-[#7F07C5] transition-colors duration-150 group/link flex items-center gap-1.5"
                      >
                        {p.proyectoNombre}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="opacity-0 group-hover/link:opacity-100 transition-opacity duration-150" style={{ color: "#7F07C5" }}>
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[13px] text-[rgba(28,0,44,0.5)]">{p.clienteNombre}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[13px] text-[rgba(28,0,44,0.6)]">{p.rol || "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12.5px] text-[rgba(28,0,44,0.5)] whitespace-nowrap">
                        {formatPeriodo(p.fechaInicio, p.fechaFin)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[13px] font-medium text-[rgba(28,0,44,0.65)]">{p.horasVendidas}h</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
                        style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: est.color }} />
                        {est.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-[14px] border" style={{ borderColor: "rgba(28,0,44,0.06)" }}>
          <p className="text-[13.5px] font-medium text-[rgba(28,0,44,0.38)]">
            Sin proyectos {filtroEstado === "activo" ? "activos" : "finalizados"}
          </p>
          <button
            onClick={() => setFiltroEstado("todos")}
            className="mt-2 text-[12px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: "rgba(127,7,197,0.55)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.55)"; }}
          >
            Ver todos
          </button>
        </div>
      )}
    </div>
  );
}
