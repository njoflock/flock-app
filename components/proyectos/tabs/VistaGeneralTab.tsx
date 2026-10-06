"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { type Proyecto, type Salud, type EstadoProyecto, type MiembroEquipo } from "@/lib/mock-proyectos";
import {
  actualizarProyecto,
  crearAsignacion, actualizarAsignacion,
  getHorasAsignacion, crearHoraAsignacion, actualizarHoraAsignacion, eliminarHoraAsignacion,
} from "@/app/(main)/proyectos/actions";
import { Modal } from "@/components/ui/Modal";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PersonaSimple { id: string; nombre: string; iniciales: string }

interface MiembroLocal {
  key: string;
  persona: MiembroEquipo["persona"];
  rol: string;
  horas: number;
  horasDistribuidas: number;
  activo: boolean;
}

interface HoraLocal {
  id: string | null;
  mes: number;
  anio: number;
  horas_vendidas: number;
  horas_consumidas: number;
  toDelete: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SALUD_CFG: Record<Salud, { color: string; bg: string; border: string; dot: string; label: string }> = {
  verde:    { color: "#15803d", bg: "rgba(22,163,74,0.05)",  border: "rgba(22,163,74,0.14)",  dot: "#16a34a", label: "Saludable" },
  amarillo: { color: "#92400e", bg: "rgba(202,138,4,0.05)",  border: "rgba(202,138,4,0.14)",  dot: "#d97706", label: "En riesgo" },
  rojo:     { color: "#991b1b", bg: "rgba(220,38,38,0.05)",  border: "rgba(220,38,38,0.14)",  dot: "#dc2626", label: "Crítico"   },
};

const ESTADO_LABELS: Record<EstadoProyecto, string> = { activo: "Activo", finalizado: "Finalizado" };

const ROLES = ["Team Manager","FullStack Developer","Frontend Developer","Backend Developer","QA Analyst","UX/UI Designer","Functional Analyst"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const L: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "rgba(28,0,44,0.38)", marginBottom: 0,
};

function buildLocal(equipo: MiembroEquipo[]): MiembroLocal[] {
  return equipo.map(m => ({
    key: m.id,
    persona: m.persona,
    rol: m.rol,
    horas: m.horasTotalesAsignadas,
    horasDistribuidas: m.horasDistribuidas,
    activo: m.activo,
  }));
}

// ── EstadoBadge ───────────────────────────────────────────────────────────────

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

// ── EstadoSelect ──────────────────────────────────────────────────────────────

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

// ── MetaVDivider ──────────────────────────────────────────────────────────────

function MetaVDivider() {
  return <div style={{ width: 1, height: 28, background: "rgba(28,0,44,0.08)", flexShrink: 0 }} />;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ iniciales, size, inactivo }: { iniciales: string; size: number; inactivo?: boolean }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.33,
        background: inactivo ? "rgba(28,0,44,0.15)" : "linear-gradient(135deg,#FF5102,#7F07C5)",
        color: inactivo ? "rgba(28,0,44,0.4)" : "white",
      }}
    >
      {iniciales}
    </div>
  );
}

// ── MemberRow ─────────────────────────────────────────────────────────────────

function MemberRow({ miembro, isLast, onEdit, onHoras, onToggleActivo }: {
  miembro: MiembroLocal;
  isLast: boolean;
  onEdit: () => void;
  onHoras: () => void;
  onToggleActivo: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inactivo = !miembro.activo;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dist  = miembro.horasDistribuidas;
  const total = miembro.horas;
  const distInfo = total === 0 ? null
    : dist === total ? { dot: "#16a34a", color: "#15803d", label: "Distribución completa" }
    : dist >  total  ? { dot: "#dc2626", color: "#b91c1c", label: `Excede en ${dist - total}h` }
    : dist === 0     ? { dot: "rgba(28,0,44,0.22)", color: "rgba(28,0,44,0.38)", label: "Sin horas distribuidas" }
    :                  { dot: "#d97706", color: "#a16207", label: "Distribución pendiente" };

  return (
    <div
      className="relative"
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.018)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 180px 90px 130px 180px 36px",
        alignItems: "center",
        padding: "0 20px",
        minHeight: 60,
      }}>
        {/* Integrante */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            padding: 2, borderRadius: "50%", flexShrink: 0,
            background: inactivo ? "rgba(28,0,44,0.09)" : "linear-gradient(135deg,#FF5102,#7F07C5)",
          }}>
            <Avatar iniciales={miembro.persona.iniciales} size={32} inactivo={inactivo} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: inactivo ? "rgba(28,0,44,0.42)" : "#1C002C" }}>
            {miembro.persona.nombre}
          </span>
        </div>

        {/* Rol */}
        <div>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: inactivo ? "rgba(28,0,44,0.3)" : "rgba(127,7,197,0.7)" }}>
            {miembro.rol || <span style={{ fontStyle: "italic", color: "rgba(28,0,44,0.2)" }}>Sin rol</span>}
          </span>
        </div>

        {/* Estado */}
        <div>
          <span style={miembro.activo
            ? { fontSize: 11, fontWeight: 600, color: "#16a34a", background: "rgba(22,163,74,0.09)", padding: "3px 9px", borderRadius: 20 }
            : { fontSize: 11, fontWeight: 500, color: "#9ca3af", background: "rgba(107,114,128,0.07)", padding: "3px 9px", borderRadius: 20 }
          }>
            {miembro.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Horas asignadas */}
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: inactivo ? "rgba(28,0,44,0.35)" : "#1C002C" }}>{miembro.horas}</span>
          <span style={{ fontSize: 12, color: "rgba(28,0,44,0.35)", marginLeft: 2 }}>h</span>
        </div>

        {/* Distribución */}
        <div>
          {distInfo ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11.5, fontWeight: 500, color: distInfo.color,
              background: distInfo.dot === "#16a34a" ? "rgba(22,163,74,0.08)"
                : distInfo.dot === "#dc2626" ? "rgba(220,38,38,0.08)"
                : distInfo.dot === "#d97706" ? "rgba(217,119,6,0.08)"
                : "rgba(28,0,44,0.05)",
              padding: "3px 9px", borderRadius: 20,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: distInfo.dot, flexShrink: 0 }} />
              {distInfo.label}
            </span>
          ) : (
            <span style={{ fontSize: 11.5, color: "rgba(28,0,44,0.25)", fontStyle: "italic" }}>—</span>
          )}
        </div>

        {/* Acciones */}
        <div className="relative shrink-0" ref={menuRef} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center cursor-pointer transition-all duration-150"
            style={{
              color:      menuOpen ? "rgba(28,0,44,0.6)" : "rgba(28,0,44,0.2)",
              background: menuOpen ? "rgba(28,0,44,0.06)" : "transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; e.currentTarget.style.color = "rgba(28,0,44,0.6)"; }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(28,0,44,0.2)"; } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-[10px] overflow-hidden z-20"
              style={{ background: "white", border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 210 }}>
              {[
                { label: "Editar asignación",            fn: () => { onEdit();         setMenuOpen(false); } },
                { label: "Cargar distribución de horas", fn: () => { onHoras();        setMenuOpen(false); } },
                { label: miembro.activo ? "Desactivar" : "Activar asignación",
                                                         fn: () => { onToggleActivo(); setMenuOpen(false); } },
              ].map((item, i) => (
                <button key={i} onClick={item.fn}
                  className="w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors duration-100 cursor-pointer"
                  style={{ color: "rgba(28,0,44,0.7)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isLast && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "rgba(28,0,44,0.06)" }} />
      )}
    </div>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({ miembro, onSave, onClose }: {
  miembro: MiembroLocal;
  onSave: (m: MiembroLocal) => void;
  onClose: () => void;
}) {
  const [rol,   setRol]   = useState(miembro.rol);
  const [horas, setHoras] = useState(String(miembro.horas));

  return (
    <FormModal
      title="Editar integrante"
      description={`Modificá el rol y las horas asignadas a ${miembro.persona.nombre}.`}
      onClose={onClose}
      width={380}
      footer={<><FMCancelButton onClick={onClose} /><FMSubmitButton onClick={() => onSave({ ...miembro, rol, horas: Number(horas) || miembro.horas })}>Guardar cambios</FMSubmitButton></>}
    >
      <FormField label="Rol en el proyecto">
        <select value={rol} onChange={e => setRol(e.target.value)}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] appearance-none cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}>
          <option value="">Seleccioná un rol…</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </FormField>
      <FormField label="Horas asignadas">
        <div className="relative">
          <input type="number" min={0} value={horas} onChange={e => setHoras(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] transition-all duration-150"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
        </div>
      </FormField>
    </FormModal>
  );
}

// ── HorasModal ────────────────────────────────────────────────────────────────

function HorasModal({ miembro, proyectoId, onUpdateHoras, onClose }: {
  miembro: MiembroLocal;
  proyectoId: string;
  onUpdateHoras: (key: string, horas: number) => void;
  onClose: () => void;
}) {
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [horasVendidas, setHorasVendidas] = useState(miembro.horas);
  const [rows, setRows]                   = useState<HoraLocal[]>([]);
  const [showAddRow, setShowAddRow]       = useState(false);
  const [newMes, setNewMes]               = useState(1);
  const [newAnio, setNewAnio]             = useState(new Date().getFullYear());
  const [newHV, setNewHV]                 = useState(0);
  const [addError, setAddError]           = useState("");

  useEffect(() => {
    getHorasAsignacion(miembro.key)
      .then(data => {
        setRows(data.map(h => ({ id: h.id, mes: h.mes, anio: h.anio, horas_vendidas: h.horas_vendidas, horas_consumidas: h.horas_consumidas, toDelete: false })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [miembro.key]);

  const visibleRows     = rows.filter(r => !r.toDelete).sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes);
  const totalDistribuidas = visibleRows.reduce((s, r) => s + r.horas_vendidas, 0);
  const diff = horasVendidas - totalDistribuidas;

  function updateRowHV(row: HoraLocal, value: number) {
    setRows(prev => prev.map(r => r === row ? { ...r, horas_vendidas: value } : r));
  }

  function deleteRow(row: HoraLocal) {
    if (row.id === null) setRows(prev => prev.filter(r => r !== row));
    else setRows(prev => prev.map(r => r === row ? { ...r, toDelete: true } : r));
  }

  function handleAddRow() {
    setAddError("");
    if (visibleRows.some(r => r.mes === newMes && r.anio === newAnio)) { setAddError(`Ya existe ${MESES[newMes-1]} ${newAnio}.`); return; }
    setRows(prev => [...prev, { id: null, mes: newMes, anio: newAnio, horas_vendidas: newHV, horas_consumidas: 0, toDelete: false }]);
    setNewHV(0); setShowAddRow(false);
  }

  async function handleSave() {
    setSaving(true); setError("");
    try {
      if (horasVendidas !== miembro.horas)
        await actualizarAsignacion(proyectoId, miembro.key, { horas_vendidas: horasVendidas });
      for (const row of rows) {
        if (row.toDelete && row.id) await eliminarHoraAsignacion(row.id, proyectoId);
        else if (!row.toDelete && !row.id) await crearHoraAsignacion(miembro.key, proyectoId, miembro.persona.id, { mes: row.mes, anio: row.anio, horas_vendidas: row.horas_vendidas, horas_consumidas: 0 });
        else if (!row.toDelete && row.id)  await actualizarHoraAsignacion(row.id, proyectoId, { mes: row.mes, anio: row.anio, horas_vendidas: row.horas_vendidas });
      }
      onUpdateHoras(miembro.key, horasVendidas);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar."); setSaving(false); }
  }

  const diffColor = diff === 0 ? "#15803d" : diff > 0 ? "#b45309" : "#dc2626";
  const diffBg    = diff === 0 ? "rgba(22,163,74,0.07)" : diff > 0 ? "rgba(217,119,6,0.07)" : "rgba(220,38,38,0.07)";
  const diffMsg   = diff === 0 ? "Distribución completa" : diff > 0 ? `Restan ${diff}h por distribuir` : `Excede en ${Math.abs(diff)}h`;

  return (
    <Modal onClose={onClose}>
      <div className="relative rounded-[14px] flex flex-col mx-4 overflow-hidden"
        style={{ background: "white", boxShadow: "0 20px 50px rgba(0,0,0,0.14)", width: 500, maxHeight: "88vh" }}>

        {/* Header */}
        <div className="px-5 pt-4 pb-4 shrink-0 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid rgba(28,0,44,0.07)" }}>
          <div className="flex items-center gap-3">
            <Avatar iniciales={miembro.persona.iniciales} size={34} />
            <div>
              <p className="text-[13.5px] font-bold text-[#1C002C] leading-tight">{miembro.persona.nombre}</p>
              <p className="text-[11.5px] text-[rgba(28,0,44,0.42)]">{miembro.rol || "Sin rol"} · Distribución de horas</p>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer shrink-0" style={{ color: "rgba(28,0,44,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Horas vendidas + status */}
        <div className="px-5 py-3 shrink-0 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <p className="text-[11px] font-semibold text-[rgba(28,0,44,0.45)] uppercase tracking-[0.08em] shrink-0">Horas vendidas</p>
            <div className="relative">
              <input type="number" min={0} value={horasVendidas} onChange={e => setHorasVendidas(Number(e.target.value) || 0)}
                className="text-[13px] font-bold text-[#1C002C] outline-none py-1 px-2.5 rounded-[7px] w-20"
                style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.02)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.02)"; }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold ml-auto" style={{ background: diffBg, color: diffColor }}>
            <span>{diffMsg}</span>
            <span className="opacity-60">({totalDistribuidas}h dist.)</span>
          </div>
        </div>

        {/* Tabla distribución */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.35)]">Distribución mensual</p>
            <button onClick={() => { setShowAddRow(v => !v); setAddError(""); }}
              className="flex items-center gap-1 text-[11.5px] font-semibold cursor-pointer" style={{ color: "#7F07C5" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar mes
            </button>
          </div>

          {showAddRow && (
            <div className="mb-3 rounded-[9px] px-3 py-2.5 space-y-2" style={{ background: "rgba(127,7,197,0.04)", border: "1px solid rgba(127,7,197,0.1)" }}>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.38)] mb-1">Mes</p>
                  <select value={newMes} onChange={e => setNewMes(Number(e.target.value))} className="w-full text-[12px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] appearance-none cursor-pointer" style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }}>
                    {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.38)] mb-1">Año</p>
                  <input type="number" value={newAnio} onChange={e => setNewAnio(Number(e.target.value))} className="w-full text-[12px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px]" style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }} />
                </div>
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.38)] mb-1">Horas</p>
                  <input type="number" min={0} value={newHV} onChange={e => setNewHV(Number(e.target.value))} className="w-full text-[12px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px]" style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }} />
                </div>
              </div>
              {addError && <p className="text-[11px] text-red-500">{addError}</p>}
              <div className="flex gap-2">
                <button onClick={handleAddRow} className="px-3 py-1 rounded-[6px] text-[11.5px] font-semibold text-white cursor-pointer hover:opacity-90" style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}>Confirmar</button>
                <button onClick={() => { setShowAddRow(false); setAddError(""); }} className="px-3 py-1 rounded-[6px] text-[11.5px] font-medium cursor-pointer" style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.55)" }}>Cancelar</button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-[12px] text-[rgba(28,0,44,0.35)] text-center py-6">Cargando…</p>
          ) : visibleRows.length > 0 ? (
            <div className="rounded-[9px] overflow-hidden" style={{ border: "1px solid rgba(28,0,44,0.08)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(28,0,44,0.025)", borderBottom: "1px solid rgba(28,0,44,0.07)" }}>
                    {["Mes","Año","Horas proyectadas",""].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-[0.07em]" style={{ color: "rgba(28,0,44,0.4)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={`${row.id ?? "new"}-${row.mes}-${row.anio}`} style={{ borderBottom: i < visibleRows.length - 1 ? "1px solid rgba(28,0,44,0.05)" : "none" }}>
                      <td className="px-3 py-1.5">
                        <select value={row.mes} onChange={e => setRows(prev => prev.map(r => r === row ? { ...r, mes: Number(e.target.value) } : r))} className="text-[12px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] appearance-none cursor-pointer" style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }} onClick={e => e.stopPropagation()}>
                          {MESES.map((m,idx) => <option key={idx+1} value={idx+1}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={row.anio} onChange={e => setRows(prev => prev.map(r => r === row ? { ...r, anio: Number(e.target.value) } : r))} className="text-[12px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] w-16" style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }} onClick={e => e.stopPropagation()} />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="relative inline-block">
                          <input type="number" min={0} value={row.horas_vendidas} onChange={e => updateRowHV(row, Number(e.target.value))} className="text-[12px] font-semibold text-[#1C002C] outline-none py-1 pl-2 pr-6 rounded-[6px] w-24" style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }} onClick={e => e.stopPropagation()} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button onClick={e => { e.stopPropagation(); deleteRow(row); }} className="w-5 h-5 flex items-center justify-center rounded cursor-pointer ml-auto" style={{ color: "rgba(28,0,44,0.3)" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(28,0,44,0.3)"; }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 rounded-[9px]" style={{ border: "1px dashed rgba(28,0,44,0.1)" }}>
              <p className="text-[12.5px] text-[rgba(28,0,44,0.3)]">Sin distribución mensual. Agregá el primer mes.</p>
            </div>
          )}
          {error && <p className="text-[11.5px] text-red-500 mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center gap-2.5 shrink-0" style={{ borderTop: "1px solid rgba(28,0,44,0.07)" }}>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold text-white cursor-pointer hover:opacity-90 disabled:opacity-60" style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] text-[12.5px] font-medium cursor-pointer" style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.55)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── AddModal ──────────────────────────────────────────────────────────────────

function AddModal({ proyectoId, personas, onAdd, onClose }: {
  proyectoId: string;
  personas: PersonaSimple[];
  onAdd: (id: string, persona: PersonaSimple, rol: string, horas: number) => void;
  onClose: () => void;
}) {
  const [personaId, setPersonaId] = useState("");
  const [rol, setRol]             = useState("");
  const [horas, setHoras]         = useState("0");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit() {
    if (!personaId) { setError("Seleccioná una persona."); return; }
    setSaving(true); setError("");
    try {
      const id = await crearAsignacion(proyectoId, { persona_id: personaId, rol, horas_vendidas: Number(horas) || 0 });
      onAdd(id, personas.find(p => p.id === personaId)!, rol, Number(horas) || 0);
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); setSaving(false); }
  }

  if (!personas.length) return (
    <Modal onClose={onClose}>
      <div className="relative rounded-[16px] p-6 max-w-sm w-full mx-4" style={{ background: "white", boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }}>
        <p className="text-[13px] text-[rgba(28,0,44,0.45)] text-center py-4">No hay personas disponibles en el directorio.</p>
        <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-[9px] text-[13px] font-medium cursor-pointer" style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)" }}>Cerrar</button>
      </div>
    </Modal>
  );

  return (
    <FormModal title="Nuevo integrante" description="Agregá una persona al equipo del proyecto." onClose={onClose} width={400}
      footer={<>{error && <p className="text-[12px] text-red-500 mr-auto">{error}</p>}<FMCancelButton onClick={onClose} disabled={saving} /><FMSubmitButton onClick={handleSubmit} disabled={saving}>{saving ? "Guardando…" : "Agregar"}</FMSubmitButton></>}>
      <FormField label="Persona">
        <select value={personaId} onChange={e => setPersonaId(e.target.value)}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] appearance-none cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}>
          <option value="">Seleccioná una persona…</option>
          {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </FormField>
      <FormField label="Rol en el proyecto" hint="Opcional">
        <select value={rol} onChange={e => setRol(e.target.value)}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] appearance-none cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}>
          <option value="">Seleccioná un rol…</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </FormField>
      <FormField label="Horas asignadas">
        <div className="relative">
          <input type="number" min={0} value={horas} onChange={e => setHoras(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
        </div>
      </FormField>
    </FormModal>
  );
}

// ── Íconos ────────────────────────────────────────────────────────────────────

function IcSpin()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" style={{ marginRight: 4 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>; }
function IcEdit()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IcBuilding(){ return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(28,0,44,0.32)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcCalendar(){ return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(28,0,44,0.32)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IcTarget()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(127,7,197,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function IcShield({ color }: { color: string }) { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcNote({ color }: { color: string })   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IcClock({ color }: { color: string })  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IcTrend({ color }: { color: string })  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function IcUsers()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(127,7,197,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }


// ── VistaGeneralTab ───────────────────────────────────────────────────────────

export function VistaGeneralTab({
  proyecto,
  personas = [],
  onSwitchToHoras,
}: {
  proyecto: Proyecto;
  personas?: PersonaSimple[];
  onSwitchToHoras?: () => void;
}) {
  // ── Estado: edición del proyecto ──────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [saveError, setSaveError]     = useState(false);

  const [nombre,        setNombre]        = useState(proyecto.nombre);
  const [cliente,       setCliente]       = useState(proyecto.cliente);
  const [descripcion,   setDescripcion]   = useState(proyecto.descripcion);
  const [estado,        setEstado]        = useState<EstadoProyecto>(proyecto.estado);
  const [salud,         setSalud]         = useState<Salud>(proyecto.salud);
  const [saludMotivo,   setSaludMotivo]   = useState(proyecto.saludMotivo);
  const [fechaFin,      setFechaFin]      = useState(proyecto.fechaFin);
  const [horasVendidas, setHorasVendidas] = useState(String(proyecto.horas.horasVendidas ?? 0));
  const [cmgEsperado,   setCmgEsperado]   = useState(String(proyecto.cmgEsperado ?? 0));

  const [dNombre,        setDNombre]        = useState(nombre);
  const [dCliente,       setDCliente]       = useState(cliente);
  const [dDescripcion,   setDDescripcion]   = useState(descripcion);
  const [dEstado,        setDEstado]        = useState<EstadoProyecto>(estado);
  const [dSalud,         setDSalud]         = useState<Salud>(salud);
  const [dSaludMotivo,   setDSaludMotivo]   = useState(saludMotivo);
  const [dFechaFin,      setDFechaFin]      = useState(fechaFin);
  const [dHorasVendidas, setDHorasVendidas] = useState(horasVendidas);
  const [dCmgEsperado,   setDCmgEsperado]   = useState(cmgEsperado);

  // ── Estado: equipo ────────────────────────────────────────────────────────
  const [miembros, setMiembros]     = useState<MiembroLocal[]>(() => buildLocal(proyecto.equipo));
  const [editing,  setEditing]      = useState<MiembroLocal | null>(null);
  const [horasModal, setHorasModal] = useState<MiembroLocal | null>(null);
  const [showAdd,  setShowAdd]      = useState(false);
  const [, startEquipoTransition]   = useTransition();

  // ── Handlers: edición ─────────────────────────────────────────────────────

  function handleEdit() {
    setDNombre(nombre); setDCliente(cliente); setDDescripcion(descripcion);
    setDEstado(estado); setDSalud(salud); setDSaludMotivo(saludMotivo);
    setDFechaFin(fechaFin); setDHorasVendidas(horasVendidas); setDCmgEsperado(cmgEsperado);
    setSaveError(false); setEditMode(true);
  }

  function handleCancel() { setEditMode(false); setSaveError(false); }

  function handleSave() {
    setSaveError(false);
    startTransition(async () => {
      try {
        await actualizarProyecto(proyecto.id, {
          nombre: dNombre, descripcion: dDescripcion, estado: dEstado,
          salud: dSalud, motivo_salud: dSaludMotivo, fecha_fin: dFechaFin,
          horas_vendidas: parseFloat(dHorasVendidas) || 0,
          cmg_esperado:   parseFloat(dCmgEsperado)   || 0,
        });
        setNombre(dNombre); setCliente(dCliente); setDescripcion(dDescripcion);
        setEstado(dEstado); setSalud(dSalud); setSaludMotivo(dSaludMotivo);
        setFechaFin(dFechaFin); setHorasVendidas(dHorasVendidas); setCmgEsperado(dCmgEsperado);
        setEditMode(false);
      } catch { setSaveError(true); }
    });
  }

  // ── Handlers: equipo ──────────────────────────────────────────────────────

  function handleToggleActivo(key: string) {
    const m = miembros.find(m => m.key === key);
    if (!m) return;
    const newActivo = !m.activo;
    setMiembros(prev => prev.map(m => m.key === key ? { ...m, activo: newActivo } : m));
    startEquipoTransition(async () => { await actualizarAsignacion(proyecto.id, key, { activo: newActivo }); });
  }

  function handleSaveEdit(updated: MiembroLocal) {
    setMiembros(prev => prev.map(m => m.key === updated.key ? updated : m));
    setEditing(null);
    startEquipoTransition(async () => {
      await actualizarAsignacion(proyecto.id, updated.key, { rol: updated.rol, horas_vendidas: updated.horas });
    });
  }

  function handleAddMiembro(asignacionId: string, persona: PersonaSimple, rol: string, horas: number) {
    setMiembros(prev => [...prev, {
      key: asignacionId,
      persona: { id: persona.id, nombre: persona.nombre, avatar: null, iniciales: persona.iniciales, cargo: "" },
      rol, horas, horasDistribuidas: 0, activo: true,
    }]);
    setShowAdd(false);
  }

  // ── Cálculos ──────────────────────────────────────────────────────────────

  const s = SALUD_CFG[editMode ? dSalud : salud];
  const fechaFmt = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  const cntActivos   = miembros.filter(m => m.activo).length;
  const cntInactivos = miembros.filter(m => !m.activo).length;
  const totalHoras   = miembros.reduce((s, m) => s + m.horas, 0);

  const miembrosOrdenados = [...miembros].sort((a, b) => {
    const diff = (a.activo ? 0 : 1) - (b.activo ? 0 : 1);
    return diff !== 0 ? diff : a.persona.nombre.localeCompare(b.persona.nombre);
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", paddingBottom: 80, position: "relative" }}>

      {/* ── Barra guardado (edición) ───────────────────────────────────────── */}
      {editMode && (
        <div style={{
          position: "fixed", bottom: 24,
          left: "calc((var(--sidebar-w, 228px) + 100vw) / 2)",
          transform: "translateX(-50%)",
          zIndex: 50, display: "flex", alignItems: "center", gap: 6,
          padding: "5px 5px 5px 14px", borderRadius: 10,
          background: "white", border: "1px solid rgba(28,0,44,0.1)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
        }}>
          {saveError
            ? <span style={{ fontSize: 12, color: "#fca5a5", marginRight: 4 }}>No fue posible guardar.</span>
            : <span style={{ fontSize: 12.5, color: "rgba(28,0,44,0.35)" }}>Editando vista general</span>
          }
          <button onClick={handleCancel} disabled={isPending} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            border: "none", background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.5)",
            opacity: isPending ? 0.4 : 1,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
            cursor: isPending ? "default" : "pointer", border: "none",
            background: "rgba(127,7,197,0.9)", color: "white",
            opacity: isPending ? 0.6 : 1,
          }}>
            {isPending ? <><IcSpin />Guardando…</> : "Guardar"}
          </button>
        </div>
      )}

      {/* ── 1. INFORMACIÓN PRINCIPAL ──────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editMode ? (
              <input value={dNombre} onChange={e => setDNombre(e.target.value)}
                style={{ fontSize: 20, fontWeight: 700, color: "#1C002C", letterSpacing: "-0.018em", lineHeight: 1.25,
                  width: "100%", background: "transparent", border: "none", outline: "none",
                  borderBottom: "1.5px solid rgba(127,7,197,0.3)", marginBottom: 10, paddingBottom: 2 }} />
            ) : (
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C002C", letterSpacing: "-0.018em", lineHeight: 1.25, marginBottom: 10 }}>
                {nombre}
              </h1>
            )}

            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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

              <div style={{ flexShrink: 0 }}>
                {editMode ? <EstadoSelect value={dEstado} onChange={setDEstado} /> : <EstadoBadge value={estado} />}
              </div>

              <MetaVDivider />

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <IcCalendar />
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>Finalización</p>
                  {editMode ? (
                    <input type="date" value={dFechaFin} onChange={e => setDFechaFin(e.target.value)}
                      style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", background: "transparent",
                        border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", cursor: "pointer" }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C" }}>{fechaFmt(fechaFin)}</span>
                  )}
                </div>
              </div>

              <MetaVDivider />

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <IcClock color="rgba(127,7,197,0.5)" />
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>Horas vendidas</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    {editMode ? (
                      <input type="number" min="0" value={dHorasVendidas} onChange={e => setDHorasVendidas(e.target.value)}
                        style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", width: 52, background: "transparent",
                          border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", padding: 0 }} />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C" }}>{horasVendidas}</span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.4)" }}>h</span>
                  </div>
                </div>
              </div>

              <MetaVDivider />

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <IcTrend color="rgba(255,81,2,0.65)" />
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 500, color: "rgba(28,0,44,0.35)", lineHeight: 1, marginBottom: 2 }}>CMG esperado</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    {editMode ? (
                      <input type="number" min="0" max="100" step="0.1" value={dCmgEsperado} onChange={e => setDCmgEsperado(e.target.value)}
                        style={{ fontSize: 13, fontWeight: 600, color: "#1C002C", width: 40, background: "transparent",
                          border: "none", outline: "none", borderBottom: "1px solid rgba(127,7,197,0.3)", padding: 0 }} />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1C002C" }}>{cmgEsperado}</span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.4)" }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!editMode && (
            <button onClick={handleEdit} title="Editar"
              style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", color: "rgba(28,0,44,0.22)", transition: "color 0.15s, background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; e.currentTarget.style.background = "rgba(127,7,197,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(28,0,44,0.22)"; e.currentTarget.style.background = "transparent"; }}>
              <IcEdit />
            </button>
          )}
        </div>
      </div>

      {/* ── Mapa de secciones ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
        {[
          { n: "1", label: "Objetivo",      anchor: "sec-objetivo" },
          { n: "2", label: "Estado actual", anchor: "sec-estado"   },
          { n: "3", label: "Equipo",        anchor: "sec-equipo"   },
        ].map(({ n, label, anchor }, i) => (
          <div key={anchor} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <a href={`#${anchor}`} style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0 }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                (el.querySelector(".sec-dot") as HTMLElement).style.background = "#7F07C5";
                (el.querySelector(".sec-dot") as HTMLElement).style.color = "white";
                (el.querySelector(".sec-lbl") as HTMLElement).style.color = "#7F07C5";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                (el.querySelector(".sec-dot") as HTMLElement).style.background = "rgba(28,0,44,0.06)";
                (el.querySelector(".sec-dot") as HTMLElement).style.color = "rgba(28,0,44,0.35)";
                (el.querySelector(".sec-lbl") as HTMLElement).style.color = "rgba(28,0,44,0.45)";
              }}>
              <div className="sec-dot" style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: "rgba(28,0,44,0.06)", color: "rgba(28,0,44,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, transition: "all 0.15s",
              }}>{n}</div>
              <span className="sec-lbl" style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(28,0,44,0.45)", transition: "color 0.15s", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </a>
            {i < 2 && (
              <div style={{ flex: 1, height: 1, background: "rgba(28,0,44,0.1)", margin: "0 12px" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── 2. OBJETIVO ───────────────────────────────────────────────────── */}
      <div id="sec-objetivo" style={{ marginBottom: 36 }}>
        <p style={{ ...L, marginBottom: 12 }}>Objetivo</p>
        <div style={{
          borderRadius: 10,
          borderLeft: "3px solid rgba(127,7,197,0.35)",
          background: editMode ? "rgba(127,7,197,0.035)" : "rgba(127,7,197,0.025)",
          padding: "14px 18px",
        }}>
          {editMode ? (
            <textarea value={dDescripcion} onChange={e => setDDescripcion(e.target.value)}
              rows={Math.max(3, dDescripcion.split("\n").length)}
              style={{ fontSize: 13.5, lineHeight: 1.78, color: "rgba(28,0,44,0.72)",
                width: "100%", background: "transparent", border: "none", outline: "none", resize: "none",
                borderBottom: "1.5px solid rgba(127,7,197,0.28)", paddingBottom: 2 }} />
          ) : (
            <p style={{ fontSize: 13.5, lineHeight: 1.78, color: "rgba(28,0,44,0.65)", margin: 0 }}>
              {descripcion || <span style={{ color: "rgba(28,0,44,0.2)", fontStyle: "italic" }}>Sin objetivo definido</span>}
            </p>
          )}
        </div>
      </div>

      {/* ── Divisor ───────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "rgba(28,0,44,0.07)", marginBottom: 28 }} />

      {/* ── 3. ESTADO ACTUAL ──────────────────────────────────────────────── */}
      <div id="sec-estado" style={{ marginBottom: 36 }}>
        <p style={{ ...L, marginBottom: 12 }}>Estado actual</p>
        <div style={{
          borderRadius: 10, border: `1px solid ${s.border}`, background: s.bg, padding: "18px 20px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
            <div style={{ paddingRight: 24, borderRight: "1px solid rgba(28,0,44,0.06)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(28,0,44,0.38)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
                Salud del proyecto
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(["verde", "amarillo", "rojo"] as Salud[]).map(key => {
                const cfg = SALUD_CFG[key];
                const active = (editMode ? dSalud : salud) === key;
                return (
                  <button key={key} onClick={() => { if (editMode) setDSalud(key); }} disabled={!editMode}
                    style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", padding: 0, cursor: editMode ? "pointer" : "default" }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
                      border: active ? "none" : "1.5px solid rgba(28,0,44,0.2)",
                      background: active ? cfg.dot : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: active ? `0 0 0 3px ${cfg.bg}` : "none",
                    }}>
                      {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "white" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? cfg.color : "rgba(28,0,44,0.45)" }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

            <div style={{ paddingLeft: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(28,0,44,0.38)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Situación actual
              </p>
            {editMode ? (
              <textarea value={dSaludMotivo} onChange={e => setDSaludMotivo(e.target.value)}
                rows={Math.max(3, dSaludMotivo.split("\n").length)}
                placeholder="Describí la situación actual del proyecto…"
                style={{ fontSize: 13, lineHeight: 1.72, color: "rgba(28,0,44,0.7)",
                  width: "100%", background: "transparent", border: "none", outline: "none", resize: "none",
                  borderBottom: "1.5px solid rgba(127,7,197,0.28)", paddingBottom: 2 }} />
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.72, color: "rgba(28,0,44,0.62)", margin: 0 }}>
                {saludMotivo || <span style={{ color: "rgba(28,0,44,0.2)", fontStyle: "italic" }}>Sin descripción</span>}
              </p>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Divisor ───────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "rgba(28,0,44,0.07)", marginBottom: 28 }} />

      {/* ── 4. EQUIPO ASIGNADO ────────────────────────────────────────────── */}
      <div id="sec-equipo" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={L}>Equipo asignado</p>
              <p style={{ fontSize: 12, color: "rgba(28,0,44,0.38)", marginTop: 4 }}>
                <span style={{ fontWeight: 600, color: "rgba(28,0,44,0.58)" }}>{miembros.length}</span> integrante{miembros.length !== 1 ? "s" : ""}
                {" · "}
                <span style={{ color: "#16a34a", fontWeight: 500 }}>{cntActivos} activo{cntActivos !== 1 ? "s" : ""}</span>
                {cntInactivos > 0 && <><span style={{ color: "rgba(28,0,44,0.25)" }}> · </span><span style={{ fontWeight: 500 }}>{cntInactivos} inactivo{cntInactivos !== 1 ? "s" : ""}</span></>}
                {" · "}
                <span style={{ fontWeight: 600, color: "rgba(28,0,44,0.6)" }}>{totalHoras}h</span> asignadas
              </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-white cursor-pointer hover:opacity-90 shrink-0"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)", boxShadow: "0 2px 8px rgba(255,81,2,0.18)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar integrante
          </button>
        </div>

        {miembrosOrdenados.length > 0 ? (
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(28,0,44,0.07)" }}>
            {/* Header de columnas */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px 90px 130px 180px 36px",
              padding: "0 20px",
              background: "rgba(28,0,44,0.025)",
              borderBottom: "1px solid rgba(28,0,44,0.07)",
            }}>
              {["Integrante", "Rol", "Estado", "Horas vendidas", "Distribución mensual", ""].map(h => (
                <div key={h} style={{ padding: "9px 0", fontSize: 10.5, fontWeight: 600, color: "rgba(28,0,44,0.38)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </div>
              ))}
            </div>
            {miembrosOrdenados.map((m, i) => (
              <MemberRow
                key={m.key}
                miembro={m}
                isLast={i === miembrosOrdenados.length - 1}
                onEdit={() => setEditing(m)}
                onHoras={() => setHorasModal(m)}
                onToggleActivo={() => handleToggleActivo(m.key)}
              />
            ))}
          </div>
        ) : (
          <div style={{ borderRadius: 10, border: "1px dashed rgba(28,0,44,0.1)", padding: "32px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(28,0,44,0.3)" }}>Sin integrantes asignados todavía.</p>
          </div>
        )}
      </div>

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {editing && <EditModal miembro={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />}
      {horasModal && <HorasModal miembro={horasModal} proyectoId={proyecto.id} onUpdateHoras={(key, h) => setMiembros(prev => prev.map(m => m.key === key ? { ...m, horas: h } : m))} onClose={() => setHorasModal(null)} />}
      {showAdd && <AddModal proyectoId={proyecto.id} personas={personas} onAdd={handleAddMiembro} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
