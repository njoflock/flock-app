"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { type Proyecto, type Salud, type EstadoProyecto } from "@/lib/mock-proyectos";
import { actualizarProyecto } from "@/app/(main)/proyectos/actions";

// ── Tokens ────────────────────────────────────────────────────────────────────

const SALUD: Record<Salud, { color: string; bg: string; border: string; dot: string; label: string }> = {
  verde:    { color: "#15803d", bg: "rgba(22,163,74,0.05)",  border: "rgba(22,163,74,0.14)",  dot: "#16a34a", label: "Saludable" },
  amarillo: { color: "#92400e", bg: "rgba(202,138,4,0.05)",  border: "rgba(202,138,4,0.14)",  dot: "#d97706", label: "En riesgo" },
  rojo:     { color: "#991b1b", bg: "rgba(220,38,38,0.05)",  border: "rgba(220,38,38,0.14)",  dot: "#dc2626", label: "Crítico"   },
};

const ESTADO_LABELS: Record<EstadoProyecto, string> = { activo: "Activo", finalizado: "Finalizado" };

const L: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
  textTransform: "uppercase", color: "rgba(28,0,44,0.3)", marginBottom: 0,
};

// ── Estado badge (solo lectura) ───────────────────────────────────────────────

function EstadoBadge({ value }: { value: EstadoProyecto }) {
  const isActivo = value === "activo";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: isActivo ? "rgba(127,7,197,0.07)" : "rgba(107,114,128,0.08)",
      color:      isActivo ? "#7F07C5"               : "#6b7280",
    }}>
      <span style={{ width: 5.5, height: 5.5, borderRadius: "50%", background: isActivo ? "#7F07C5" : "#9ca3af", display: "inline-block" }} />
      {ESTADO_LABELS[value]}
    </div>
  );
}

// ── Estado dropdown (modo edición, con portal) ────────────────────────────────

function EstadoSelect({ value, onChange }: { value: EstadoProyecto; onChange: (v: EstadoProyecto) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleOpen() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
    setOpen(v => !v);
  }

  const isActivo = value === "activo";
  return (
    <>
      <div ref={triggerRef} onClick={handleOpen} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
        background: isActivo ? "rgba(127,7,197,0.07)" : "rgba(107,114,128,0.08)",
        color:      isActivo ? "#7F07C5"               : "#6b7280",
      }}>
        <span style={{ width: 5.5, height: 5.5, borderRadius: "50%", background: isActivo ? "#7F07C5" : "#9ca3af", display: "inline-block" }} />
        {ESTADO_LABELS[value]}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: 1 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && createPortal(
        <div ref={menuRef} style={{ position: "absolute", top: pos.top, left: pos.left, background: "white", borderRadius: 10, zIndex: 9999, border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
          {(["activo", "finalizado"] as EstadoProyecto[]).map(v => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, cursor: "pointer", border: "none",
                color:      v === value ? "#7F07C5" : "rgba(28,0,44,0.7)",
                background: v === value ? "rgba(127,7,197,0.06)" : "transparent",
                fontWeight: v === value ? 600 : 400 }}>
              {ESTADO_LABELS[v]}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ResumenTab({ proyecto }: { proyecto: Proyecto }) {
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState(false);

  // Valores confirmados (lo que se guardó)
  const [nombre,        setNombre]        = useState(proyecto.nombre);
  const [cliente,       setCliente]       = useState(proyecto.cliente);
  const [descripcion,   setDescripcion]   = useState(proyecto.descripcion);
  const [estado,        setEstado]        = useState<EstadoProyecto>(proyecto.estado);
  const [salud,         setSalud]         = useState<Salud>(proyecto.salud);
  const [saludMotivo,   setSaludMotivo]   = useState(proyecto.saludMotivo);
  const [fechaFin,      setFechaFin]      = useState(proyecto.fechaFin);
  const [horasVendidas, setHorasVendidas] = useState(String(proyecto.horas.horasVendidas ?? 0));
  const [cmgEsperado,   setCmgEsperado]   = useState(String(proyecto.cmgEsperado ?? 0));

  // Borradores (lo que el usuario está editando)
  const [dNombre,        setDNombre]        = useState(nombre);
  const [dCliente,       setDCliente]       = useState(cliente);
  const [dDescripcion,   setDDescripcion]   = useState(descripcion);
  const [dEstado,        setDEstado]        = useState<EstadoProyecto>(estado);
  const [dSalud,         setDSalud]         = useState<Salud>(salud);
  const [dSaludMotivo,   setDSaludMotivo]   = useState(saludMotivo);
  const [dFechaFin,      setDFechaFin]      = useState(fechaFin);
  const [dHorasVendidas, setDHorasVendidas] = useState(horasVendidas);
  const [dCmgEsperado,   setDCmgEsperado]   = useState(cmgEsperado);

  function handleEdit() {
    setDNombre(nombre); setDCliente(cliente); setDDescripcion(descripcion);
    setDEstado(estado); setDSalud(salud); setDSaludMotivo(saludMotivo);
    setDFechaFin(fechaFin); setDHorasVendidas(horasVendidas); setDCmgEsperado(cmgEsperado);
    setSaveError(false);
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    setSaveError(false);
  }

  function handleSave() {
    setSaveError(false);
    startTransition(async () => {
      try {
        await actualizarProyecto(proyecto.id, {
          nombre:        dNombre,
          descripcion:   dDescripcion,
          estado:        dEstado,
          salud:         dSalud,
          motivo_salud:  dSaludMotivo,
          fecha_fin:     dFechaFin,
          horas_vendidas: parseFloat(dHorasVendidas) || 0,
          cmg_esperado:   parseFloat(dCmgEsperado)   || 0,
        });
        // Confirmar todos los valores
        setNombre(dNombre); setCliente(dCliente); setDescripcion(dDescripcion);
        setEstado(dEstado); setSalud(dSalud); setSaludMotivo(dSaludMotivo);
        setFechaFin(dFechaFin); setHorasVendidas(dHorasVendidas); setCmgEsperado(dCmgEsperado);
        setEditMode(false);
      } catch {
        setSaveError(true);
      }
    });
  }

  const s = SALUD[editMode ? dSalud : salud];

  const fechaFmt = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={{ width: "100%", paddingBottom: 64, position: "relative" }}>

      {/* ── Ícono lápiz (solo lectura) o barra guardado (edición) ────────── */}
      {!editMode ? (
        <div style={{ position: "absolute", top: 0, right: 0 }}>
          <button
            onClick={handleEdit}
            title="Editar resumen"
            style={{
              width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", color: "rgba(28,0,44,0.22)",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; e.currentTarget.style.background = "rgba(127,7,197,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(28,0,44,0.22)"; e.currentTarget.style.background = "transparent"; }}
          >
            <IcEdit />
          </button>
        </div>
      ) : (
        <div style={{
          position: "fixed", bottom: 24,
          left: "calc((var(--sidebar-w, 228px) + 100vw) / 2)",
          transform: "translateX(-50%)",
          zIndex: 50, display: "flex", alignItems: "center", gap: 6,
          padding: "5px 5px 5px 14px", borderRadius: 10,
          background: "white",
          border: "1px solid rgba(28,0,44,0.1)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
        }}>
          {saveError
            ? <span style={{ fontSize: 12, color: "#fca5a5", marginRight: 4 }}>No fue posible guardar.</span>
            : <span style={{ fontSize: 12.5, color: "rgba(28,0,44,0.35)", letterSpacing: "0.01em" }}>Editando resumen</span>
          }
          <button onClick={handleCancel} disabled={isPending} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            border: "none", background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.5)",
            opacity: isPending ? 0.4 : 1, transition: "background 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}
          >
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
            cursor: isPending ? "default" : "pointer", border: "none",
            background: "rgba(127,7,197,0.9)", color: "white",
            opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s",
          }}>
            {isPending ? <><IcSpin />Guardando…</> : "Guardar"}
          </button>
        </div>
      )}

      {/* ── 1. ENCABEZADO ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 14, flexShrink: 0,
          background: "rgba(127,7,197,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IcProject />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nombre */}
          {editMode ? (
            <input
              value={dNombre}
              onChange={e => setDNombre(e.target.value)}
              style={{ fontSize: 20, fontWeight: 700, color: "#1C002C", letterSpacing: "-0.018em", lineHeight: 1.25,
                width: "100%", background: "transparent", border: "none", outline: "none",
                borderBottom: "1.5px solid rgba(127,7,197,0.3)", marginBottom: 10, paddingBottom: 2 }}
            />
          ) : (
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C002C", letterSpacing: "-0.018em", lineHeight: 1.25, marginBottom: 8 }}>
              {nombre}
            </h1>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

            {/* 1. Cliente */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <IcBuilding />
              {editMode ? (
                <input value={dCliente} onChange={e => setDCliente(e.target.value)}
                  style={{ fontSize: 13, fontWeight: 500, color: "rgba(28,0,44,0.55)", background: "transparent",
                    border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", paddingBottom: 1, width: 120 }} />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(28,0,44,0.55)" }}>{cliente}</span>
              )}
            </div>

            <MetaVDivider />

            {/* 2. Estado */}
            <div style={{ flexShrink: 0 }}>
              {editMode
                ? <EstadoSelect value={dEstado} onChange={setDEstado} />
                : <EstadoBadge value={estado} />}
            </div>

            <MetaVDivider />

            {/* 3. Finalización */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <IcCalendar />
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>Finalización</p>
                {editMode ? (
                  <input type="date" value={dFechaFin} onChange={e => setDFechaFin(e.target.value)}
                    style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", background: "transparent",
                      border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", lineHeight: 1, cursor: "pointer" }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", lineHeight: 1 }}>{fechaFmt(fechaFin)}</span>
                )}
              </div>
            </div>

            <MetaVDivider />

            {/* 4. Horas vendidas */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <IcClock color="rgba(127,7,197,0.5)" />
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>Horas vendidas</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  {editMode ? (
                    <input type="number" min="0" step="1" value={dHorasVendidas} onChange={e => setDHorasVendidas(e.target.value)}
                      style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", width: 52, background: "transparent",
                        border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", lineHeight: 1, padding: 0 }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", lineHeight: 1 }}>{horasVendidas}</span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.4)" }}>h</span>
                </div>
              </div>
            </div>

            <MetaVDivider />

            {/* 5. CMG esperado */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <IcTrend color="rgba(255,81,2,0.65)" />
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>CMG esperado</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  {editMode ? (
                    <input type="number" min="0" max="100" step="0.1" value={dCmgEsperado} onChange={e => setDCmgEsperado(e.target.value)}
                      style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", width: 40, background: "transparent",
                        border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", lineHeight: 1, padding: 0 }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", lineHeight: 1 }}>{cmgEsperado}</span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.4)" }}>%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. OBJETIVO DEL PROYECTO ─────────────────────────────────────── */}
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(127,7,197,0.13)",
        borderLeft: "3px solid rgba(127,7,197,0.45)",
        background: editMode ? "rgba(127,7,197,0.04)" : "rgba(127,7,197,0.03)",
        padding: "18px 22px",
        marginBottom: 16,
        transition: "background 0.2s",
      }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(127,7,197,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <IcTarget />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...L, marginBottom: 8 }}>Objetivo del proyecto</p>
            {editMode ? (
              <textarea
                value={dDescripcion}
                onChange={e => setDDescripcion(e.target.value)}
                rows={Math.max(3, dDescripcion.split("\n").length)}
                style={{ fontSize: 13.5, lineHeight: 1.78, color: "rgba(28,0,44,0.7)", textAlign: "justify",
                  width: "100%", background: "transparent", border: "none", outline: "none", resize: "none",
                  borderBottom: "1.5px solid rgba(127,7,197,0.28)", paddingBottom: 2 }}
              />
            ) : (
              <p style={{ fontSize: 13.5, lineHeight: 1.78, color: "rgba(28,0,44,0.62)", textAlign: "justify", margin: 0 }}>
                {descripcion || <span style={{ color: "rgba(28,0,44,0.2)", fontStyle: "italic" }}>Sin objetivo definido</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. ESTADO DEL PROYECTO ───────────────────────────────────────── */}
      <div style={{
        borderRadius: 12,
        border: `1px solid ${s.border}`,
        background: s.bg,
        padding: "18px 22px",
        transition: "background 0.2s, border-color 0.2s",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0 }}>

          {/* Columna izquierda: salud */}
          <div style={{ paddingRight: 24, borderRight: "1px solid rgba(28,0,44,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <IcShield color={s.dot} />
              <p style={L}>Estado del proyecto</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(["verde", "amarillo", "rojo"] as Salud[]).map(key => {
                const cfg = SALUD[key];
                const current = editMode ? dSalud : salud;
                const active = current === key;
                return (
                  <button key={key}
                    onClick={() => { if (editMode) setDSalud(key); }}
                    disabled={!editMode}
                    style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", padding: 0,
                      cursor: editMode ? "pointer" : "default" }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      border: active ? "none" : "1.5px solid rgba(28,0,44,0.2)",
                      background: active ? cfg.dot : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: active ? `0 0 0 3px ${cfg.bg}` : "none",
                      transition: "all 0.15s",
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? cfg.color : "rgba(28,0,44,0.45)" }}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: motivo */}
          <div style={{ paddingLeft: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IcNote color="rgba(28,0,44,0.3)" />
              <p style={L}>Situación actual</p>
            </div>
            {editMode ? (
              <textarea
                value={dSaludMotivo}
                onChange={e => setDSaludMotivo(e.target.value)}
                rows={Math.max(3, dSaludMotivo.split("\n").length)}
                placeholder="Describí la situación actual del proyecto…"
                style={{ fontSize: 13, lineHeight: 1.72, color: "rgba(28,0,44,0.7)",
                  width: "100%", background: "transparent", border: "none", outline: "none", resize: "none",
                  borderBottom: "1.5px solid rgba(127,7,197,0.28)", paddingBottom: 2 }}
              />
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.72, color: "rgba(28,0,44,0.62)", margin: 0 }}>
                {saludMotivo || <span style={{ color: "rgba(28,0,44,0.2)", fontStyle: "italic" }}>Sin descripción</span>}
              </p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function MetaVDivider() {
  return <div style={{ width: 1, height: 28, background: "rgba(28,0,44,0.08)", flexShrink: 0 }} />;
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IcSpin()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" style={{ marginRight: 4 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>; }
function IcEdit()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IcProject() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(127,7,197,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 7h2M7 11h2M13 7h4M13 11h4"/></svg>; }
function IcBuilding(){ return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(28,0,44,0.32)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcCalendar(){ return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(28,0,44,0.32)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcTarget()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(127,7,197,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function IcShield({ color }: { color: string }) { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcNote({ color }: { color: string })   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IcClock({ color }: { color: string })  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IcTrend({ color }: { color: string })  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
