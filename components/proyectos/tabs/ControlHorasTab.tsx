"use client";

import { useState, useTransition } from "react";
import { type Proyecto } from "@/lib/mock-proyectos";
import { crearHoraAsignacion, actualizarHoraAsignacion } from "@/app/(main)/proyectos/actions";

// ── Constantes ─────────────────────────────────────────────────────────────────

const MES_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const L: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.1em", color: "rgba(28,0,44,0.35)",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateMonths(fechaInicio: string, fechaFin: string) {
  const inicio  = new Date(fechaInicio);
  const fin     = new Date(fechaFin);
  const months: { label: string; mes: number; anio: number }[] = [];
  const cur = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  while (cur <= fin) {
    months.push({ label: MES_LABELS[cur.getMonth()], mes: cur.getMonth() + 1, anio: cur.getFullYear() });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function pctColor(pct: number | null) {
  if (pct === null) return "rgba(28,0,44,0.35)";
  if (pct > 110) return "#b91c1c";
  if (pct > 101) return "#a16207";
  return "#15803d";
}
function pctBg(pct: number | null) {
  if (pct === null) return "rgba(28,0,44,0.06)";
  if (pct > 110) return "rgba(220,38,38,0.08)";
  if (pct > 101) return "rgba(202,138,4,0.09)";
  return "rgba(22,163,74,0.08)";
}

// ── Componentes auxiliares (deben estar ANTES del componente principal) ────────

function DesvPreview({ proy, real }: { proy: number; real: number }) {
  const desv = real - proy;
  const pct  = proy > 0 ? Math.round((real / proy) * 100) : 0;
  if (real === 0) return null;
  const bg    = desv > 0 ? "rgba(220,38,38,0.08)"  : "rgba(22,163,74,0.08)";
  const color = desv > 0 ? "#b91c1c"               : "#15803d";
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: bg, fontSize: 12.5, fontWeight: 600, color }}>
      {desv > 0
        ? `Desvío de +${desv}h sobre lo proyectado (${pct}%)`
        : desv < 0
          ? `${Math.abs(desv)}h por debajo del proyectado (${pct}%) — positivo`
          : `Exactamente según lo proyectado (100%)`}
    </div>
  );
}

function EntryModal({
  nombre, rol, mesLabel, proyectado, realActual, onSave, onClose, saving,
}: {
  nombre: string; rol: string; mesLabel: string; proyectado: number;
  realActual: number | null; onSave: (val: number) => void; onClose: () => void; saving: boolean;
}) {
  const [val, setVal] = useState(realActual !== null ? String(realActual) : "");
  const num = parseFloat(val);
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "white", borderRadius: 16, width: 420, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid rgba(28,0,44,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1C002C" }}>Cargar horas — {mesLabel}</p>
            <p style={{ fontSize: 12, color: "rgba(28,0,44,0.45)", marginTop: 2 }}>{nombre} · {rol}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "transparent", color: "rgba(28,0,44,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(28,0,44,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ ...L, marginBottom: 6 }}>Horas proyectadas para el mes</p>
            <div style={{ position: "relative" }}>
              <input
                value={proyectado}
                readOnly
                style={{ width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#1C002C", border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.03)", outline: "none", opacity: 0.7, cursor: "default", boxSizing: "border-box" }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(28,0,44,0.35)", pointerEvents: "none" }}>h</span>
            </div>
          </div>
          <div>
            <p style={{ ...L, marginBottom: 6 }}>Horas consumidas reales</p>
            <div style={{ position: "relative" }}>
              <input
                autoFocus
                type="number"
                min="0"
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder="0"
                style={{ width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#1C002C", border: "1px solid rgba(28,0,44,0.15)", background: "white", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.15)"; }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(28,0,44,0.35)", pointerEvents: "none" }}>h</span>
            </div>
          </div>
          {val !== "" && !isNaN(num) && <DesvPreview proy={proyectado} real={num} />}
        </div>
        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(28,0,44,0.08)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)" }}
          >
            Cancelar
          </button>
          <button
            disabled={saving || val === "" || isNaN(num) || num < 0}
            onClick={() => { if (!isNaN(num) && num >= 0) onSave(num); }}
            style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: saving ? "wait" : "pointer", color: "white", background: "linear-gradient(135deg,#FF5102,#7F07C5)", opacity: (saving || val === "" || isNaN(num) || num < 0) ? 0.6 : 1 }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function ControlHorasTab({ proyecto }: { proyecto: Proyecto }) {
  const allMonths  = generateMonths(proyecto.fechaInicio, proyecto.fechaFin);
  const hoy        = new Date();
  const defaultIdx = Math.max(0, allMonths.findLastIndex(m => m.anio < hoy.getFullYear() || (m.anio === hoy.getFullYear() && m.mes <= hoy.getMonth() + 1)));
  const [mesIdx, setMesIdx]   = useState(defaultIdx);
  const [modal, setModal]     = useState<{ personaIdx: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeMes = allMonths[mesIdx];
  const { horas }  = proyecto;

  // ── Datos del mes activo ────────────────────────────────────────────────────
  const totalProyMes = horas.consumoPorPersona.reduce((s, cp) => {
    const entry = cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio);
    return s + (entry?.horasVendidas ?? 0);
  }, 0);

  const totalRealMes = horas.consumoPorPersona.reduce((s, cp) => {
    const entry = cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio);
    return s + (entry?.horasConsumidas ?? 0);
  }, 0);

  const tieneRealMes = horas.consumoPorPersona.some(cp =>
    cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio)
  );
  const desvMes    = tieneRealMes ? totalRealMes - totalProyMes : null;
  const pctMes     = tieneRealMes && totalProyMes > 0 ? Math.round((totalRealMes / totalProyMes) * 100) : null;

  // ── Progreso global ─────────────────────────────────────────────────────────
  const totalVendidas    = horas.horasVendidas;
  const totalConsumidas  = horas.horasConsumidas;
  const pctConsumoGlobal = totalVendidas > 0 ? Math.round((totalConsumidas / totalVendidas) * 100) : 0;
  const pctTiempoGlobal  = allMonths.length > 0 ? Math.round(((mesIdx + 1) / allMonths.length) * 100) : 0;

  // ── Guardar horas ───────────────────────────────────────────────────────────
  async function handleSave(personaIdx: number, real: number) {
    const cp    = horas.consumoPorPersona[personaIdx];
    const entry = cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio);
    startTransition(async () => {
      if (entry?.horaId) {
        await actualizarHoraAsignacion(entry.horaId, proyecto.id, { horas_consumidas: real });
      } else {
        await crearHoraAsignacion(cp.asignacionId, proyecto.id, cp.persona.id, {
          mes:              activeMes.mes,
          anio:             activeMes.anio,
          horas_vendidas:   entry?.horasVendidas ?? 0,
          horas_consumidas: real,
        });
      }
      setModal(null);
    });
  }

  const mesLabel = `${activeMes.label} ${activeMes.anio}`;

  return (
    <div style={{ paddingBottom: 64 }}>

      {/* ── Selector de mes ── */}
      <p style={{ ...L, marginBottom: 10 }}>Mes en curso</p>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 28 }}>
        {allMonths.map((m, i) => {
          const isFuture = m.anio > hoy.getFullYear() || (m.anio === hoy.getFullYear() && m.mes > hoy.getMonth() + 1);
          const isActive = i === mesIdx;
          return (
            <button
              key={`${m.anio}-${m.mes}`}
              onClick={() => setMesIdx(i)}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", border: isActive ? "1px solid rgba(127,7,197,0.25)" : "1px solid rgba(28,0,44,0.08)",
                background: isActive ? "rgba(127,7,197,0.07)" : "transparent",
                color: isActive ? "#7F07C5" : isFuture ? "rgba(28,0,44,0.28)" : "rgba(28,0,44,0.55)",
                transition: "all 0.12s",
              }}
            >
              {m.label} {allMonths.some((x, j) => j !== i && x.mes === m.mes && x.anio !== m.anio) ? m.anio : (i === 0 || allMonths[i - 1].anio !== m.anio ? m.anio : "")}
            </button>
          );
        })}
      </div>

      {/* ── KPIs del mes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <KpiCard label={`Proyectado ${activeMes.label}`} value={totalProyMes} sub="Suma de distribuciones" />
        <KpiCard
          label={`Consumido ${activeMes.label}`}
          value={tieneRealMes ? totalRealMes : null}
          sub={tieneRealMes ? "Real del mes" : "Sin datos aún"}
          pct={pctMes}
        />
        <KpiCard
          label={`Desvío ${activeMes.label}`}
          value={desvMes}
          sub={pctMes !== null ? `${pctMes}% del proyectado` : "Cargá el consumo real"}
          isDesv
        />
      </div>

      {/* ── Barra global ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "rgba(28,0,44,0.38)", marginBottom: 6 }}>
          <span>{totalConsumidas}h consumidas de {totalVendidas}h vendidas</span>
          <span>{pctConsumoGlobal}% consumido · {pctTiempoGlobal}% del período</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(28,0,44,0.06)", position: "relative", overflow: "visible" }}>
          <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#FF5102,#7F07C5)", width: `${Math.min(pctConsumoGlobal, 100)}%`, transition: "width 0.3s" }} />
          {pctTiempoGlobal > 0 && pctTiempoGlobal <= 100 && (
            <div style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", left: `${pctTiempoGlobal}%`, width: 2, height: 14, borderRadius: 1, background: "rgba(28,0,44,0.3)" }} />
          )}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          <LegItem color="linear-gradient(90deg,#FF5102,#7F07C5)" label="Consumido" />
          <LegItem color="rgba(28,0,44,0.25)" label="Tiempo transcurrido" tick />
        </div>
      </div>

      {/* ── Tabla por persona ── */}
      <p style={{ ...L, marginBottom: 12 }}>Por persona — {mesLabel}</p>
      {horas.consumoPorPersona.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(28,0,44,0.35)", padding: "24px 0" }}>Sin integrantes asignados.</p>
      ) : (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(28,0,44,0.07)" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 90px", padding: "8px 16px", background: "rgba(28,0,44,0.025)", borderBottom: "1px solid rgba(28,0,44,0.07)" }}>
            {["Integrante", "Proy. mes", "Real mes", "Desvío", "Consumido", "Restantes"].map((h, i) => (
              <div key={h} style={{ padding: "4px 0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(28,0,44,0.38)", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {horas.consumoPorPersona.map((cp, idx) => {
            const entry       = cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio);
            const proy        = entry?.horasVendidas ?? 0;
            const real        = entry?.horasConsumidas ?? null;
            const hasReal     = real !== null && real > 0;
            const desv        = hasReal && proy > 0 ? real! - proy : null;
            const pct         = hasReal && proy > 0 ? Math.round((real! / proy) * 100) : null;
            const totalCons   = cp.horasConsumidas;
            const totalPctCons = cp.horasTotalesAsignadas > 0 ? Math.round((totalCons / cp.horasTotalesAsignadas) * 100) : null;
            const restantes   = cp.horasTotalesAsignadas - totalCons;
            const isLast      = idx === horas.consumoPorPersona.length - 1;
            return (
              <PersonaRow
                key={cp.persona.id}
                cp={cp}
                proy={proy}
                real={real}
                desv={desv}
                pct={pct}
                totalPctCons={totalPctCons}
                restantes={restantes}
                isLast={isLast}
                onEdit={() => setModal({ personaIdx: idx })}
              />
            );
          })}
          {/* Totales */}
          <TotalRow
            totalProy={totalProyMes}
            totalReal={tieneRealMes ? totalRealMes : null}
            desv={desvMes}
            totalCons={totalConsumidas}
            restantes={totalVendidas - totalConsumidas}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(127,7,197,0.04)", border: "1px solid rgba(127,7,197,0.12)", fontSize: 12, color: "rgba(28,0,44,0.55)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(127,7,197,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Hacé click en cualquier integrante para cargar las horas reales del mes seleccionado.
      </div>

      {/* ── Modal ── */}
      {modal !== null && (() => {
        const cp    = horas.consumoPorPersona[modal.personaIdx];
        const entry = cp.consumoPorMes.find(m => m.mesNum === activeMes.mes && m.anio === activeMes.anio);
        const proy  = entry?.horasVendidas ?? 0;
        const real  = entry?.horasConsumidas ?? null;
        return (
          <EntryModal
            nombre={cp.persona.nombre}
            rol={cp.persona.cargo || "—"}
            mesLabel={mesLabel}
            proyectado={proy}
            realActual={real && real > 0 ? real : null}
            saving={isPending}
            onSave={val => handleSave(modal.personaIdx, val)}
            onClose={() => setModal(null)}
          />
        );
      })()}
    </div>
  );
}

// ── Componentes de fila ────────────────────────────────────────────────────────

function PersonaRow({ cp, proy, real, desv, pct, totalPctCons, restantes, isLast, onEdit }: {
  cp: import("@/lib/mock-proyectos").ConsumoPersona;
  proy: number; real: number | null; desv: number | null; pct: number | null;
  totalPctCons: number | null; restantes: number; isLast: boolean;
  onEdit: () => void;
}) {
  const hasReal   = real !== null && real > 0;
  const desvColor = desv === null ? "rgba(28,0,44,0.35)" : desv > 0 ? "#b91c1c" : "#15803d";
  return (
    <div
      onClick={onEdit}
      style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 90px", padding: "9px 16px", alignItems: "center", borderBottom: isLast ? "none" : "1px solid rgba(28,0,44,0.04)", cursor: "pointer", transition: "background 0.12s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(127,7,197,0.025)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Integrante */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}>
          {cp.persona.iniciales}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C002C" }}>{cp.persona.nombre}</div>
          {cp.persona.cargo && <div style={{ fontSize: 11.5, color: "#7F07C5", opacity: 0.7, marginTop: 1 }}>{cp.persona.cargo}</div>}
        </div>
      </div>
      {/* Proy mes */}
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: proy > 0 ? "#1C002C" : "rgba(28,0,44,0.3)" }}>{proy > 0 ? `${proy}h` : "—"}</span>
      </div>
      {/* Real mes */}
      <div style={{ textAlign: "right" }}>
        {hasReal
          ? <span style={{ fontSize: 13, fontWeight: 700, color: "#1C002C" }}>{real}h</span>
          : <span style={{ fontSize: 12, color: "rgba(28,0,44,0.3)" }}>—</span>}
      </div>
      {/* Desvío */}
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: desvColor }}>
          {desv !== null ? `${desv >= 0 ? "+" : ""}${desv}h` : "—"}
        </span>
      </div>
      {/* % consumido total */}
      <div style={{ textAlign: "right" }}>
        <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: pctBg(totalPctCons), color: pctColor(totalPctCons) }}>
          {totalPctCons !== null ? `${totalPctCons}%` : "—"}
        </span>
        <div style={{ fontSize: 10, color: "rgba(28,0,44,0.3)", marginTop: 1 }}>{cp.horasConsumidas}h</div>
      </div>
      {/* Restantes */}
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: restantes < 0 ? "#b91c1c" : "#1C002C" }}>{restantes}h</span>
        <div style={{ fontSize: 10, color: "rgba(28,0,44,0.3)", marginTop: 1 }}>
          {cp.horasTotalesAsignadas > 0 ? Math.round((restantes / cp.horasTotalesAsignadas) * 100) : 0}%
        </div>
      </div>
    </div>
  );
}

function TotalRow({ totalProy, totalReal, desv, totalCons, restantes }: {
  totalProy: number; totalReal: number | null; desv: number | null;
  totalCons: number; restantes: number;
}) {
  const desvColor = desv === null ? "rgba(28,0,44,0.45)" : desv > 0 ? "#b91c1c" : "#15803d";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 90px", padding: "12px 16px", alignItems: "center", background: "rgba(28,0,44,0.025)", borderTop: "1px solid rgba(28,0,44,0.07)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(28,0,44,0.45)" }}>Proyecto</div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, color: "#1C002C" }}>{totalProy}h</div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, color: "#1C002C" }}>{totalReal !== null ? `${totalReal}h` : "—"}</div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, color: desvColor }}>
        {desv !== null ? `${desv >= 0 ? "+" : ""}${desv}h` : "—"}
      </div>
      <div style={{ textAlign: "right", fontSize: 12, color: "rgba(28,0,44,0.55)" }}>{totalCons}h</div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, color: "#1C002C" }}>{restantes}h</div>
    </div>
  );
}

// ── Auxiliares UI ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, pct, isDesv }: { label: string; value: number | null; sub: string; pct?: number | null; isDesv?: boolean }) {
  const showWarn  = pct !== null && pct !== undefined && (pct > 101);
  const bg        = showWarn ? (pct! > 110 ? "rgba(220,38,38,0.06)" : "rgba(202,138,4,0.06)") : "rgba(28,0,44,0.02)";
  const valColor  = isDesv && value !== null
    ? (value > 0 ? "#b91c1c" : value < 0 ? "#15803d" : "#1C002C")
    : showWarn ? (pct! > 110 ? "#b91c1c" : "#a16207")
    : "#1C002C";
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: bg, border: `1px solid rgba(28,0,44,0.07)`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...L, marginBottom: 3 }}>{label}</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: valColor, lineHeight: 1 }}>
          {value !== null ? (isDesv && value > 0 ? "+" : "") + value : "—"}
          {value !== null && <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.35)", marginLeft: 2 }}>h</span>}
        </p>
      </div>
      <p style={{ fontSize: 11, color: "rgba(28,0,44,0.38)", textAlign: "right", flexShrink: 0 }}>{sub}</p>
    </div>
  );
}

function LegItem({ color, label, tick }: { color: string; label: string; tick?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(28,0,44,0.38)" }}>
      {tick
        ? <div style={{ width: 2, height: 13, borderRadius: 1, background: "rgba(28,0,44,0.3)", flexShrink: 0 }} />
        : <div style={{ width: 20, height: 5, borderRadius: 99, background: color, flexShrink: 0 }} />}
      {label}
    </div>
  );
}
