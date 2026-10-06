"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { type Proyecto, type MiembroEquipo } from "@/lib/mock-proyectos";
import { Modal } from "@/components/ui/Modal";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import {
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  getHorasAsignacion,
  crearHoraAsignacion,
  actualizarHoraAsignacion,
  eliminarHoraAsignacion,
} from "@/app/(main)/proyectos/actions";

type FiltroVista = "todos" | "activos" | "inactivos";

const ROLES = [
  "Team Manager",
  "FullStack Developer",
  "Frontend Developer",
  "Backend Developer",
  "QA Analyst",
  "UX/UI Designer",
  "Functional Analyst",
];

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface PersonaSimple { id: string; nombre: string; iniciales: string }

interface MiembroLocal {
  key: string; // asignacion id
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

// ── MemberRow ─────────────────────────────────────────────────────────────────

function MemberRow({
  miembro, isLast, onEdit, onHoras, onToggleActivo,
}: {
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

  const menuItems = [
    { label: "Editar asignación",            action: () => { onEdit();         setMenuOpen(false); } },
    { label: "Cargar distribución de horas", action: () => { onHoras();        setMenuOpen(false); } },
    { label: miembro.activo ? "Desactivar asignación" : "Activar asignación",
                                             action: () => { onToggleActivo(); setMenuOpen(false); } },
  ];

  const dist  = miembro.horasDistribuidas;
  const total = miembro.horas;
  const distInfo = total === 0 ? null
    : dist === total ? { dot: "#16a34a", color: "#15803d", label: "Distribución completa" }
    : dist >  total  ? { dot: "#dc2626", color: "#b91c1c", label: `Excede en ${dist - total}h` }
    : dist === 0     ? { dot: "rgba(28,0,44,0.22)", color: "rgba(28,0,44,0.38)", label: "Sin distribución" }
    :                  { dot: "#d97706", color: "#a16207", label: `${dist}h de ${total}h` };

  // px-5(20) + padding(2) + avatar(34) + gap(12) = 68px — separator indent
  const SEP_LEFT = 68;

  return (
    <div
      className="relative"
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.018)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Fila */}
      <div className="flex items-center gap-3 px-5" style={{ minHeight: 64 }}>

        {/* Avatar con anillo gradiente */}
        <div className="shrink-0" style={{
          padding: 2, borderRadius: "50%",
          background: inactivo ? "rgba(28,0,44,0.09)" : "linear-gradient(135deg,#FF5102,#7F07C5)",
        }}>
          <Avatar iniciales={miembro.persona.iniciales} size={34} inactivo={inactivo} />
        </div>

        {/* Identidad — izquierda, ancho natural */}
        <div className="shrink-0" style={{ maxWidth: 280 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13.5, fontWeight: 600, color: inactivo ? "rgba(28,0,44,0.42)" : "#1C002C", whiteSpace: "nowrap" }}>
              {miembro.persona.nombre}
            </span>
            <span style={miembro.activo
              ? { fontSize: 10, fontWeight: 600, color: "#16a34a", background: "rgba(22,163,74,0.09)", padding: "1px 6px", borderRadius: 20 }
              : { fontSize: 10, fontWeight: 500, color: "#9ca3af", background: "rgba(107,114,128,0.07)", padding: "1px 6px", borderRadius: 20 }
            }>
              {miembro.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p style={{ fontSize: 12, marginTop: 3, color: "rgba(127,7,197,0.58)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {miembro.rol || <span style={{ fontStyle: "italic", color: "rgba(28,0,44,0.2)" }}>Sin rol</span>}
          </p>
        </div>

        {/* Espaciador */}
        <div className="flex-1" />

        {/* Asignación — derecha */}
        <div className="shrink-0 flex items-center gap-2" style={{ color: "rgba(28,0,44,0.32)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontSize: 12.5 }}>
            <span style={{ fontWeight: 600, color: inactivo ? "rgba(28,0,44,0.35)" : "rgba(28,0,44,0.68)" }}>{miembro.horas}</span>
            {" h asignadas"}
          </span>
          {distInfo && (
            <>
              <span style={{ color: "rgba(28,0,44,0.14)" }}>·</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: distInfo.dot, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: distInfo.color, whiteSpace: "nowrap" }}>{distInfo.label}</span>
            </>
          )}
        </div>

        {/* Menú ⋮ */}
        <div className="relative shrink-0 ml-2" ref={menuRef} onClick={e => e.stopPropagation()}>
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
            <div
              className="absolute right-0 top-full mt-1 rounded-[10px] overflow-hidden z-20"
              style={{ background: "white", border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 210 }}
            >
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
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

      {/* Separador indentado */}
      {!isLast && (
        <div style={{
          position: "absolute", bottom: 0,
          left: SEP_LEFT, right: 20,
          height: 1, background: "rgba(28,0,44,0.07)",
        }} />
      )}
    </div>
  );
}

export function EquipoTab({
  proyecto,
  personas,
}: {
  proyecto: Proyecto;
  personas: PersonaSimple[];
}) {
  const [miembros, setMiembros] = useState<MiembroLocal[]>(() => buildLocal(proyecto.equipo));
  const [filtro,   setFiltro]   = useState<FiltroVista>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editing,  setEditing]  = useState<MiembroLocal | null>(null);
  const [horasModal, setHorasModal] = useState<MiembroLocal | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [, startTransition] = useTransition();

  function handleToggleActivo(key: string) {
    const m = miembros.find(m => m.key === key);
    if (!m) return;
    const newActivo = !m.activo;
    setMiembros(prev => prev.map(m => m.key === key ? { ...m, activo: newActivo } : m));
    startTransition(async () => {
      await actualizarAsignacion(proyecto.id, key, { activo: newActivo });
    });
  }

  function handleSaveEdit(updated: MiembroLocal) {
    setMiembros(prev => prev.map(m => m.key === updated.key ? updated : m));
    setEditing(null);
    startTransition(async () => {
      await actualizarAsignacion(proyecto.id, updated.key, {
        rol: updated.rol,
        horas_vendidas: updated.horas,
      });
    });
  }

  function handleAddMiembro(asignacionId: string, persona: PersonaSimple, rol: string, horas: number) {
    setMiembros(prev => [...prev, {
      key: asignacionId,
      persona: { id: persona.id, nombre: persona.nombre, avatar: null, iniciales: persona.iniciales, cargo: "" },
      rol,
      horas,
      horasDistribuidas: 0,
      activo: true,
    }]);
    setShowAdd(false);
  }

  function handleUpdateHoras(key: string, newHoras: number) {
    setMiembros(prev => prev.map(m => m.key === key ? { ...m, horas: newHoras } : m));
  }

  const porEstado = miembros.filter(m => {
    if (filtro === "activos")   return m.activo;
    if (filtro === "inactivos") return !m.activo;
    return true;
  });

  const visibles = porEstado.filter(m =>
    busqueda.trim() === "" ||
    m.persona.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.rol.toLowerCase().includes(busqueda.toLowerCase())
  ).sort((a, b) => {
    if (filtro === "todos") {
      const diff = (a.activo ? 0 : 1) - (b.activo ? 0 : 1);
      if (diff !== 0) return diff;
    }
    return a.persona.nombre.localeCompare(b.persona.nombre);
  });

  const cntActivos   = miembros.filter(m => m.activo).length;
  const cntInactivos = miembros.filter(m => !m.activo).length;
  const totalHoras   = miembros.reduce((s, m) => s + m.horas, 0);

  const FILTROS: { key: FiltroVista; label: string; count: number }[] = [
    { key: "todos",     label: "Todos",     count: miembros.length },
    { key: "activos",   label: "Activos",   count: cntActivos },
    { key: "inactivos", label: "Inactivos", count: cntInactivos },
  ];

  return (
    <div className="space-y-5 pb-16">

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-[9px] transition-all duration-150"
          style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar persona…"
            className="flex-1 bg-transparent outline-none text-[13px] text-[#1C002C] placeholder:text-[rgba(28,0,44,0.3)]"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="cursor-pointer" style={{ color: "rgba(28,0,44,0.3)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div
          className="flex items-center rounded-[9px] p-0.5"
          style={{ background: "rgba(28,0,44,0.04)", border: "1px solid rgba(28,0,44,0.07)" }}
        >
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: filtro === f.key ? "white"   : "transparent",
                color:      filtro === f.key ? "#1C002C" : "rgba(28,0,44,0.42)",
                fontWeight: filtro === f.key ? 600       : 400,
                boxShadow:  filtro === f.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {f.label}
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: filtro === f.key ? "rgba(127,7,197,0.08)" : "rgba(28,0,44,0.06)",
                  color:      filtro === f.key ? "#7F07C5"              : "rgba(28,0,44,0.38)",
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90 shrink-0"
          style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)", boxShadow: "0 2px 10px rgba(255,81,2,0.2)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar Integrante
        </button>
      </div>

      <p className="text-[12.5px] text-[rgba(28,0,44,0.38)]">
        {cntActivos} activo{cntActivos !== 1 ? "s" : ""}
        {cntInactivos > 0 && ` · ${cntInactivos} inactivo${cntInactivos !== 1 ? "s" : ""}`}
        {" · "}
        <span className="font-semibold text-[rgba(28,0,44,0.6)]">{totalHoras}h</span> asignadas
      </p>

      {visibles.length > 0 ? (
        <div>
          {visibles.map((m, i) => (
            <MemberRow
              key={m.key}
              miembro={m}
              isLast={i === visibles.length - 1}
              onEdit={() => setEditing(m)}
              onHoras={() => setHorasModal(m)}
              onToggleActivo={() => handleToggleActivo(m.key)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[rgba(28,0,44,0.3)] text-[14px]">
            {busqueda ? `Sin resultados para "${busqueda}"` : "No hay integrantes en este grupo."}
          </p>
        </div>
      )}

      {editing && (
        <EditModal miembro={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}

      {horasModal && (
        <HorasModal
          miembro={horasModal}
          proyectoId={proyecto.id}
          onUpdateHoras={handleUpdateHoras}
          onClose={() => setHorasModal(null)}
        />
      )}

      {showAdd && (
        <AddModal
          proyectoId={proyecto.id}
          personas={personas}
          onAdd={handleAddMiembro}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── HorasModal ────────────────────────────────────────────────────────────────

function HorasModal({
  miembro, proyectoId, onUpdateHoras, onClose,
}: {
  miembro: MiembroLocal;
  proyectoId: string;
  onUpdateHoras: (key: string, horas: number) => void;
  onClose: () => void;
}) {
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [horasVendidas, setHorasVendidas] = useState(miembro.horas);
  const [rows,          setRows]          = useState<HoraLocal[]>([]);
  const [showAddRow,    setShowAddRow]    = useState(false);
  const [newMes,        setNewMes]        = useState(1);
  const [newAnio,       setNewAnio]       = useState(new Date().getFullYear());
  const [newHV,         setNewHV]         = useState(0);
  const [newHC,         setNewHC]         = useState(0);
  const [addError,      setAddError]      = useState("");

  useEffect(() => {
    getHorasAsignacion(miembro.key)
      .then(data => {
        setRows(data.map(h => ({
          id: h.id,
          mes: h.mes,
          anio: h.anio,
          horas_vendidas: h.horas_vendidas,
          horas_consumidas: h.horas_consumidas,
          toDelete: false,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [miembro.key]);

  const visibleRows = rows
    .filter(r => !r.toDelete)
    .sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes);

  const totalDistribuidas = visibleRows.reduce((s, r) => s + r.horas_vendidas, 0);
  const totalConsumidas   = visibleRows.reduce((s, r) => s + r.horas_consumidas, 0);
  const diff = horasVendidas - totalDistribuidas;

  function updateRow(idx: number, field: keyof HoraLocal, value: number) {
    setRows(prev => {
      const copy = [...prev];
      const realIdx = prev.findIndex((r, i) => !r.toDelete && visibleRows[idx] === r);
      if (realIdx >= 0) copy[realIdx] = { ...copy[realIdx], [field]: value };
      return copy;
    });
  }

  function updateRowByRef(row: HoraLocal, field: keyof HoraLocal, value: number) {
    setRows(prev => prev.map(r => r === row ? { ...r, [field]: value } : r));
  }

  function deleteRow(row: HoraLocal) {
    if (row.id === null) {
      setRows(prev => prev.filter(r => r !== row));
    } else {
      setRows(prev => prev.map(r => r === row ? { ...r, toDelete: true } : r));
    }
  }

  function handleAddRow() {
    setAddError("");
    const duplicate = visibleRows.some(r => r.mes === newMes && r.anio === newAnio);
    if (duplicate) { setAddError(`Ya existe un registro para ${MESES[newMes - 1]} ${newAnio}.`); return; }
    setRows(prev => [...prev, { id: null, mes: newMes, anio: newAnio, horas_vendidas: newHV, horas_consumidas: newHC, toDelete: false }]);
    setNewHV(0); setNewHC(0);
    setShowAddRow(false);
    setAddError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (horasVendidas !== miembro.horas) {
        await actualizarAsignacion(proyectoId, miembro.key, { horas_vendidas: horasVendidas });
      }
      for (const row of rows) {
        if (row.toDelete && row.id) {
          await eliminarHoraAsignacion(row.id, proyectoId);
        } else if (!row.toDelete && row.id === null) {
          await crearHoraAsignacion(miembro.key, proyectoId, miembro.persona.id, {
            mes: row.mes, anio: row.anio,
            horas_vendidas: row.horas_vendidas, horas_consumidas: row.horas_consumidas,
          });
        } else if (!row.toDelete && row.id) {
          await actualizarHoraAsignacion(row.id, proyectoId, {
            mes: row.mes, anio: row.anio,
            horas_vendidas: row.horas_vendidas, horas_consumidas: row.horas_consumidas,
          });
        }
      }
      onUpdateHoras(miembro.key, horasVendidas);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
      setSaving(false);
    }
  }

  // Status indicator
  const statusInfo = diff === 0
    ? { color: "#15803d", bg: "rgba(22,163,74,0.08)", icon: "🟢", msg: "Distribución completa." }
    : diff > 0
    ? { color: "#b45309", bg: "rgba(217,119,6,0.08)", icon: "🟡", msg: `Restan ${diff}h por distribuir.` }
    : { color: "#dc2626", bg: "rgba(220,38,38,0.08)", icon: "🔴", msg: `La distribución excede en ${Math.abs(diff)}h las horas vendidas.` };

  return (
    <Modal onClose={onClose}>
      <div
        className="relative rounded-[16px] flex flex-col mx-4 overflow-hidden"
        style={{ background: "white", boxShadow: "0 24px 60px rgba(0,0,0,0.15)", width: 620, maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5 shrink-0" style={{ borderBottom: "1px solid rgba(28,0,44,0.07)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar iniciales={miembro.persona.iniciales} size={40} />
              <div>
                <p className="text-[15px] font-bold text-[#1C002C] leading-tight">{miembro.persona.nombre}</p>
                <p className="text-[12px] text-[rgba(28,0,44,0.45)] mt-0.5">{miembro.rol || "Sin rol"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer shrink-0"
              style={{ color: "rgba(28,0,44,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Horas vendidas editable */}
          <div className="mt-4 flex items-center gap-3">
            <p className="text-[12px] font-semibold text-[rgba(28,0,44,0.5)] uppercase tracking-[0.08em] shrink-0">Horas vendidas</p>
            <div className="relative w-28">
              <input
                type="number"
                min={0}
                value={horasVendidas}
                onChange={e => setHorasVendidas(Number(e.target.value) || 0)}
                className="w-full text-[14px] font-bold text-[#1C002C] outline-none py-1.5 px-3 rounded-[8px] transition-all duration-150"
                style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
            </div>
          </div>
        </div>

        {/* ── Body scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Resumen dinámico */}
          <div className="rounded-[10px] p-4 space-y-3" style={{ background: statusInfo.bg }}>
            <div className="flex items-center gap-2">
              <span className="text-[13px]">{statusInfo.icon}</span>
              <p className="text-[12.5px] font-semibold" style={{ color: statusInfo.color }}>{statusInfo.msg}</p>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-1">
              {[
                { label: "Vendidas",     value: horasVendidas },
                { label: "Distribuidas", value: totalDistribuidas },
                { label: "Consumidas",   value: totalConsumidas },
                { label: "Diferencia",   value: diff, signed: true },
              ].map(({ label, value, signed }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.4)]">{label}</p>
                  <p className="text-[16px] font-bold text-[#1C002C]">
                    {signed && value > 0 ? `+${value}` : value}
                    <span className="text-[11px] font-normal text-[rgba(28,0,44,0.4)] ml-0.5">h</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla mensual */}
          {loading ? (
            <p className="text-[13px] text-[rgba(28,0,44,0.35)] text-center py-6">Cargando…</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.35)]">Distribución mensual</p>
                <button
                  onClick={() => { setShowAddRow(v => !v); setAddError(""); }}
                  className="flex items-center gap-1 text-[12px] font-semibold cursor-pointer transition-colors duration-150"
                  style={{ color: "#7F07C5" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar mes
                </button>
              </div>

              {/* Formulario agregar fila */}
              {showAddRow && (
                <div className="mb-3 rounded-[10px] p-3 space-y-3" style={{ background: "rgba(127,7,197,0.04)", border: "1px solid rgba(127,7,197,0.1)" }}>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.35)]">Mes</p>
                      <select
                        value={newMes}
                        onChange={e => setNewMes(Number(e.target.value))}
                        className="w-full text-[12.5px] text-[#1C002C] outline-none py-1.5 px-2 rounded-[7px] appearance-none cursor-pointer"
                        style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }}
                      >
                        {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.35)]">Año</p>
                      <input
                        type="number"
                        value={newAnio}
                        onChange={e => setNewAnio(Number(e.target.value))}
                        className="w-full text-[12.5px] text-[#1C002C] outline-none py-1.5 px-2 rounded-[7px]"
                        style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.35)]">H. Vendidas</p>
                      <input
                        type="number"
                        min={0}
                        value={newHV}
                        onChange={e => setNewHV(Number(e.target.value))}
                        className="w-full text-[12.5px] text-[#1C002C] outline-none py-1.5 px-2 rounded-[7px]"
                        style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[rgba(28,0,44,0.35)]">H. Consumidas</p>
                      <input
                        type="number"
                        min={0}
                        value={newHC}
                        onChange={e => setNewHC(Number(e.target.value))}
                        className="w-full text-[12.5px] text-[#1C002C] outline-none py-1.5 px-2 rounded-[7px]"
                        style={{ border: "1px solid rgba(28,0,44,0.12)", background: "white" }}
                      />
                    </div>
                  </div>
                  {addError && <p className="text-[11.5px] text-red-500">{addError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRow}
                      className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-white cursor-pointer hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => { setShowAddRow(false); setAddError(""); }}
                      className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer"
                      style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.55)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla */}
              {visibleRows.length > 0 ? (
                <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid rgba(28,0,44,0.08)" }}>
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr style={{ background: "rgba(28,0,44,0.03)", borderBottom: "1px solid rgba(28,0,44,0.07)" }}>
                        {["Mes","Año","H. Vendidas","H. Consumidas",""].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-semibold text-[10.5px] uppercase tracking-[0.07em]" style={{ color: "rgba(28,0,44,0.4)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, i) => (
                        <tr
                          key={`${row.id ?? "new"}-${row.mes}-${row.anio}`}
                          style={{ borderBottom: i < visibleRows.length - 1 ? "1px solid rgba(28,0,44,0.05)" : "none" }}
                        >
                          <td className="px-3 py-2">
                            <select
                              value={row.mes}
                              onChange={e => updateRowByRef(row, "mes", Number(e.target.value))}
                              className="text-[12.5px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] appearance-none cursor-pointer w-full"
                              style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
                              onClick={e => e.stopPropagation()}
                            >
                              {MESES.map((m, idx) => <option key={idx+1} value={idx+1}>{m}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={row.anio}
                              onChange={e => updateRowByRef(row, "anio", Number(e.target.value))}
                              className="text-[12.5px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] w-20"
                              style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={row.horas_vendidas}
                              onChange={e => updateRowByRef(row, "horas_vendidas", Number(e.target.value))}
                              className="text-[12.5px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] w-20"
                              style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={row.horas_consumidas}
                              onChange={e => updateRowByRef(row, "horas_consumidas", Number(e.target.value))}
                              className="text-[12.5px] text-[#1C002C] outline-none py-1 px-2 rounded-[6px] w-20"
                              style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={e => { e.stopPropagation(); deleteRow(row); }}
                              className="w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer ml-auto"
                              style={{ color: "rgba(28,0,44,0.3)" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.07)"; e.currentTarget.style.color = "#dc2626"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(28,0,44,0.3)"; }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 rounded-[10px]" style={{ border: "1px dashed rgba(28,0,44,0.1)" }}>
                  <p className="text-[13px] text-[rgba(28,0,44,0.3)]">Sin distribución mensual. Agregá el primer mes.</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex items-center gap-3 shrink-0" style={{ borderTop: "1px solid rgba(28,0,44,0.07)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-[9px] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
            style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.55)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({
  miembro, onSave, onClose,
}: {
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
      footer={
        <>
          <FMCancelButton onClick={onClose} />
          <FMSubmitButton onClick={() => onSave({ ...miembro, rol, horas: Number(horas) || miembro.horas })}>
            Guardar cambios
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Rol en el proyecto">
        <select
          value={rol}
          onChange={e => setRol(e.target.value)}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] appearance-none cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
        >
          <option value="">Seleccioná un rol…</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </FormField>

      <FormField label="Horas asignadas">
        <div className="relative">
          <input
            type="number"
            min={0}
            value={horas}
            onChange={e => setHoras(e.target.value)}
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

// ── AddModal ─────────────────────────────────────────────────────────────────

function AddModal({
  proyectoId, personas, onAdd, onClose,
}: {
  proyectoId: string;
  personas: PersonaSimple[];
  onAdd: (asignacionId: string, persona: PersonaSimple, rol: string, horas: number) => void;
  onClose: () => void;
}) {
  const [personaId,   setPersonaId]   = useState("");
  const [rol,         setRol]         = useState("");
  const [horas,       setHoras]       = useState("0");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin,    setFechaFin]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit() {
    if (!personaId) { setError("Seleccioná una persona."); return; }
    setSaving(true); setError("");
    try {
      const id = await crearAsignacion(proyectoId, {
        persona_id: personaId, rol, horas_vendidas: Number(horas) || 0,
        ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
        ...(fechaFin    ? { fecha_fin:    fechaFin    } : {}),
      });
      const persona = personas.find(p => p.id === personaId)!;
      onAdd(id, persona, rol, Number(horas) || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
      setSaving(false);
    }
  }

  if (personas.length === 0) {
    return (
      <Modal onClose={onClose}>
        <div className="relative rounded-[16px] p-6 max-w-sm w-full mx-4" style={{ background: "white", boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }}>
          <p className="text-[13px] text-[rgba(28,0,44,0.45)] text-center py-4">No hay personas disponibles en el directorio.</p>
          <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-[9px] text-[13px] font-medium cursor-pointer" style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)" }}>Cerrar</button>
        </div>
      </Modal>
    );
  }

  return (
    <FormModal
      title="Nuevo integrante"
      description="Agregá una persona al equipo del proyecto."
      onClose={onClose}
      width={400}
      footer={
        <>
          {error && <p className="text-[12px] text-red-500 mr-auto">{error}</p>}
          <FMCancelButton onClick={onClose} disabled={saving} />
          <FMSubmitButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </FMSubmitButton>
        </>
      }
    >
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
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] transition-all duration-150"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[rgba(28,0,44,0.35)] pointer-events-none">h</span>
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha de inicio" hint="Opcional">
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] transition-all duration-150"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
        <FormField label="Fecha de fin" hint="Opcional">
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] transition-all duration-150"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
      </div>
    </FormModal>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
