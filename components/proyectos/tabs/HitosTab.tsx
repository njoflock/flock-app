"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { type Proyecto, type Hito } from "@/lib/mock-proyectos";
import { crearHito, actualizarHito, eliminarHito } from "@/app/(main)/proyectos/actions";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

type EstadoHito = "pendiente" | "en_curso" | "completado" | "retrasado";

interface HitoLocal extends Hito {
  estado: EstadoHito;
}

const ESTADO_CFG: Record<EstadoHito, { label: string; color: string; bg: string; border: string; dot: string }> = {
  completado: { label: "Completado", color: "#15803d", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.2)",  dot: "#16a34a" },
  en_curso:   { label: "En curso",   color: "#7F07C5", bg: "rgba(127,7,197,0.08)",   border: "rgba(127,7,197,0.2)", dot: "#7F07C5" },
  retrasado:  { label: "Retrasado",  color: "#b91c1c", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)", dot: "#dc2626" },
  pendiente:  { label: "Pendiente",  color: "#6b7280", bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.15)", dot: "#9ca3af" },
};

function derivarEstado(hito: Hito, hoy: Date): EstadoHito {
  const fecha = new Date(hito.fecha + "T12:00:00");
  if (fecha < hoy) return "completado";
  return "pendiente";
}

function calcEstadoEfectivo(hito: HitoLocal, hoy: Date): EstadoHito {
  if (hito.estado === "completado") return "completado";
  if (hito.estado === "en_curso" || hito.estado === "pendiente") {
    const fecha = new Date(hito.fecha + "T12:00:00");
    if (fecha < hoy && hito.estado !== "completado") return "retrasado";
  }
  return hito.estado;
}

let nextId = 100;

export function HitosTab({ proyecto }: { proyecto: Proyecto }) {
  const hoy = new Date();
  const [isPending, startTransition] = useTransition();

  const [hitos, setHitos] = useState<HitoLocal[]>(() =>
    proyecto.hitos.map(h => ({ ...h, estado: derivarEstado(h, hoy) }))
  );
  const [modal,        setModal]        = useState<HitoLocal | null>(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [dragIdx,      setDragIdx]      = useState<number | null>(null);
  const [overIdx,      setOverIdx]      = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoHito | "todos">("todos");
  const [filtroDesde,  setFiltroDesde]  = useState("");
  const [filtroHasta,  setFiltroHasta]  = useState("");
  const [ordenCampo,   setOrdenCampo]   = useState<"fecha" | "estado" | "nombre">("fecha");
  const [ordenDir,     setOrdenDir]     = useState<"asc" | "desc">("asc");

  function updateHito(updated: HitoLocal) {
    setHitos(prev => prev.map(h => h.id === updated.id ? updated : h));
    startTransition(() =>
      actualizarHito(proyecto.id, updated.id, {
        nombre:      updated.nombre,
        fecha:       updated.fecha,
        descripcion: updated.descripcion,
        estado:      updated.estado,
      }).catch(() => {})
    );
  }

  function removeHito(id: string) {
    setHitos(prev => prev.filter(h => h.id !== id));
    startTransition(() => eliminarHito(proyecto.id, id).catch(() => {}));
  }

  function addHito(h: Omit<HitoLocal, "id">) {
    const tempId = String(nextId++);
    setHitos(prev => [...prev, { ...h, id: tempId }]);
    startTransition(async () => {
      try {
        const realId = await crearHito(proyecto.id, {
          nombre:      h.nombre,
          fecha:       h.fecha,
          descripcion: h.descripcion,
          estado:      h.estado,
        });
        setHitos(prev => prev.map(x => x.id === tempId ? { ...x, id: realId } : x));
      } catch {}
    });
  }

  function setEstado(id: string, estado: EstadoHito) {
    setHitos(prev => prev.map(h => h.id === id ? { ...h, estado } : h));
    startTransition(() => actualizarHito(proyecto.id, id, { estado }).catch(() => {}));
  }

  // Drag & drop
  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx); }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...hitos];
    const [item] = next.splice(dragIdx, 1);
    next.splice(idx, 0, item);
    setHitos(next);
    setDragIdx(null);
    setOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); }

  // Filtros y ordenamiento
  const hayFiltros = filtroEstado !== "todos" || filtroDesde !== "" || filtroHasta !== "";

  const ESTADO_PESO: Record<EstadoHito, number> = { retrasado: 0, en_curso: 1, pendiente: 2, completado: 3 };

  const hitosVisibles = useMemo(() => {
    let lista = hitos.map((h, idx) => ({ h, idx }));
    if (filtroEstado !== "todos") {
      lista = lista.filter(({ h }) => calcEstadoEfectivo(h, hoy) === filtroEstado);
    }
    if (filtroDesde) lista = lista.filter(({ h }) => h.fecha >= filtroDesde);
    if (filtroHasta) lista = lista.filter(({ h }) => h.fecha <= filtroHasta);
    lista.sort((a, b) => {
      let cmp = 0;
      if (ordenCampo === "fecha")   cmp = a.h.fecha.localeCompare(b.h.fecha);
      if (ordenCampo === "estado")  cmp = ESTADO_PESO[calcEstadoEfectivo(a.h, hoy)] - ESTADO_PESO[calcEstadoEfectivo(b.h, hoy)];
      if (ordenCampo === "nombre")  cmp = a.h.nombre.localeCompare(b.h.nombre, "es");
      return ordenDir === "asc" ? cmp : -cmp;
    });
    return lista;
  }, [hitos, filtroEstado, filtroDesde, filtroHasta, ordenCampo, ordenDir]);

  // Resumen (siempre sobre la lista completa)
  const efectivos = hitos.map(h => calcEstadoEfectivo(h, hoy));
  const cntTotal     = hitos.length;
  const cntCompletados = efectivos.filter(e => e === "completado").length;
  const cntEnCurso     = efectivos.filter(e => e === "en_curso").length;
  const cntPendientes  = efectivos.filter(e => e === "pendiente").length;
  const cntRetrasados  = efectivos.filter(e => e === "retrasado").length;
  const pctProgreso    = cntTotal > 0 ? Math.round((cntCompletados / cntTotal) * 100) : 0;

  return (
    <div className="space-y-5 pb-16">

      {/* ── Resumen ── */}
      <div
        className="rounded-[12px] border p-4"
        style={{ borderColor: "rgba(28,0,44,0.07)", background: "#fafafa" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-5 text-[12.5px]">
            <span className="text-[rgba(28,0,44,0.45)]">
              <span className="font-bold text-[#1C002C]">{cntTotal}</span> hitos
            </span>
            {cntCompletados > 0 && (
              <span style={{ color: ESTADO_CFG.completado.color }}>
                <span className="font-semibold">{cntCompletados}</span> completados
              </span>
            )}
            {cntEnCurso > 0 && (
              <span style={{ color: ESTADO_CFG.en_curso.color }}>
                <span className="font-semibold">{cntEnCurso}</span> en curso
              </span>
            )}
            {cntPendientes > 0 && (
              <span className="text-[rgba(28,0,44,0.45)]">
                <span className="font-semibold">{cntPendientes}</span> pendientes
              </span>
            )}
            {cntRetrasados > 0 && (
              <span style={{ color: ESTADO_CFG.retrasado.color }}>
                <span className="font-semibold">{cntRetrasados}</span> retrasados
              </span>
            )}
          </div>
          <span className="text-[12px] font-bold" style={{ color: "#7F07C5" }}>{pctProgreso}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pctProgreso}%`,
              background: "linear-gradient(90deg,#FF5102,#7F07C5)",
            }}
          />
        </div>
      </div>

      {/* ── Filtros + Agregar ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Fechas */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[rgba(28,0,44,0.38)] shrink-0">Desde</span>
          <input
            type="date"
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            className="text-[12.5px] text-[rgba(28,0,44,0.65)] outline-none rounded-[8px] px-2.5 py-1.5 cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)", minWidth: 130 }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.35)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.1)"; }}
          />
          <span className="text-[11px] font-medium text-[rgba(28,0,44,0.38)] shrink-0">Hasta</span>
          <input
            type="date"
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            className="text-[12.5px] text-[rgba(28,0,44,0.65)] outline-none rounded-[8px] px-2.5 py-1.5 cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)", minWidth: 130 }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.35)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.1)"; }}
          />
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 20, background: "rgba(28,0,44,0.1)" }} className="shrink-0" />

        {/* Estado */}
        <div className="flex items-center gap-1">
          {([
            { value: "todos",      label: "Todos" },
            { value: "pendiente",  label: "Pendiente" },
            { value: "en_curso",   label: "En curso" },
            { value: "completado", label: "Completado" },
            { value: "retrasado",  label: "Retrasado" },
          ] as { value: EstadoHito | "todos"; label: string }[]).map(({ value, label }) => {
            const active = filtroEstado === value;
            const cfg = value !== "todos" ? ESTADO_CFG[value] : null;
            return (
              <button
                key={value}
                onClick={() => setFiltroEstado(value)}
                className="px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: active
                    ? (cfg ? cfg.bg : "rgba(28,0,44,0.07)")
                    : "transparent",
                  color: active
                    ? (cfg ? cfg.color : "#1C002C")
                    : "rgba(28,0,44,0.4)",
                  border: `1px solid ${active ? (cfg ? cfg.border : "rgba(28,0,44,0.15)") : "transparent"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 20, background: "rgba(28,0,44,0.1)" }} className="shrink-0" />

        {/* Ordenamiento */}
        <div className="flex items-center gap-1.5">
          <select
            value={ordenCampo}
            onChange={e => setOrdenCampo(e.target.value as typeof ordenCampo)}
            className="text-[12px] text-[rgba(28,0,44,0.6)] outline-none rounded-[8px] px-2.5 py-1.5 cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)" }}
          >
            <option value="fecha">Fecha</option>
            <option value="estado">Estado</option>
            <option value="nombre">Nombre</option>
          </select>
          <button
            onClick={() => setOrdenDir(d => d === "asc" ? "desc" : "asc")}
            className="flex items-center justify-center w-7 h-7 rounded-[7px] transition-colors duration-150 cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.02)", color: "rgba(28,0,44,0.5)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.02)"; }}
            title={ordenDir === "asc" ? "Ascendente" : "Descendente"}
          >
            {ordenDir === "asc" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            )}
          </button>
        </div>

        {/* Limpiar filtros */}
        {hayFiltros && (
          <button
            onClick={() => { setFiltroEstado("todos"); setFiltroDesde(""); setFiltroHasta(""); }}
            className="text-[11.5px] font-medium transition-colors duration-150 cursor-pointer"
            style={{ color: "rgba(127,7,197,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}
          >
            Limpiar
          </button>
        )}

        {/* Agregar hito a la derecha */}
        <div className="ml-auto shrink-0">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)", boxShadow: "0 2px 10px rgba(255,81,2,0.2)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar hito
          </button>
        </div>
      </div>

      {/* ── Lista de hitos ── */}
      <div className="rounded-[14px] border overflow-hidden" style={{ borderColor: "rgba(28,0,44,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
              <th className="w-8 px-3 py-3" />
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Hito</th>
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Fecha</th>
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Estado</th>
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Descripción</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {hitosVisibles.map(({ h, idx }, visIdx) => {
              const estadoEfectivo = calcEstadoEfectivo(h, hoy);
              const cfg  = ESTADO_CFG[estadoEfectivo];
              const last = visIdx === hitosVisibles.length - 1;
              const fecha = new Date(h.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
              const isDragging = dragIdx === idx;
              const isOver     = overIdx === idx && dragIdx !== idx;

              return (
                <HitoRow
                  key={h.id}
                  hito={h}
                  estadoEfectivo={estadoEfectivo}
                  cfg={cfg}
                  fecha={fecha}
                  last={last}
                  isDragging={isDragging}
                  isOver={isOver}
                  dragDisabled={hayFiltros || ordenCampo !== "fecha" || ordenDir !== "asc"}
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  onEdit={() => setModal(h)}
                  onSetEstado={(estado) => setEstado(h.id, estado)}
                  onRemove={() => removeHito(h.id)}
                />
              );
            })}
            {hitosVisibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-[13px] text-[rgba(28,0,44,0.3)]">
                    {hitos.length === 0 ? "No hay hitos registrados." : "No hay hitos que coincidan con los filtros."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal edición ── */}
      {modal && (
        <HitoModal
          hito={modal}
          onSave={(updated) => { updateHito(updated); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal nuevo hito ── */}
      {showAdd && (
        <HitoModal
          onSave={(h) => { addHito(h); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── HitoRow ───────────────────────────────────────────────────────────────────

function HitoRow({
  hito, estadoEfectivo, cfg, fecha, last,
  isDragging, isOver, dragDisabled,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onSetEstado, onRemove,
}: {
  hito: HitoLocal;
  estadoEfectivo: EstadoHito;
  cfg: typeof ESTADO_CFG[EstadoHito];
  fecha: string;
  last: boolean;
  isDragging: boolean;
  isOver: boolean;
  dragDisabled: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onSetEstado: (e: EstadoHito) => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <tr
      draggable={!dragDisabled}
      onDragStart={dragDisabled ? undefined : onDragStart}
      onDragOver={dragDisabled ? undefined : onDragOver}
      onDrop={dragDisabled ? undefined : onDrop}
      onDragEnd={dragDisabled ? undefined : onDragEnd}
      className="group"
      style={{
        borderBottom: last ? "none" : "1px solid rgba(28,0,44,0.04)",
        background: isOver ? "rgba(127,7,197,0.04)" : isDragging ? "rgba(28,0,44,0.02)" : "white",
        opacity: isDragging ? 0.5 : 1,
        transition: "background 100ms",
        outline: isOver ? "1px solid rgba(127,7,197,0.2)" : "none",
      }}
    >
      {/* Drag handle */}
      <td className="px-3 py-4">
        <div
          className={`transition-opacity duration-150 cursor-grab active:cursor-grabbing ${dragDisabled ? "invisible" : "opacity-0 group-hover:opacity-100"}`}
          style={{ color: "rgba(28,0,44,0.25)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9"  cy="5"  r="1" fill="currentColor"/><circle cx="15" cy="5"  r="1" fill="currentColor"/>
            <circle cx="9"  cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
            <circle cx="9"  cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
          </svg>
        </div>
      </td>

      {/* Nombre */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: estadoEfectivo === "completado"
                ? "linear-gradient(135deg,#FF5102,#7F07C5)"
                : estadoEfectivo === "retrasado"
                  ? "rgba(220,38,38,0.12)"
                  : estadoEfectivo === "en_curso"
                    ? "rgba(127,7,197,0.1)"
                    : "rgba(28,0,44,0.06)",
            }}
          >
            {estadoEfectivo === "completado" ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : estadoEfectivo === "retrasado" ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : estadoEfectivo === "en_curso" ? (
              <span className="w-2 h-2 rounded-full" style={{ background: "#7F07C5" }} />
            ) : (
              <span className="w-2 h-2 rounded-full" style={{ background: "rgba(28,0,44,0.22)" }} />
            )}
          </div>
          <span className="text-[13.5px] font-semibold text-[#1C002C]">{hito.nombre}</span>
        </div>
      </td>

      {/* Fecha */}
      <td className="px-5 py-4">
        <span className="text-[13px] text-[rgba(28,0,44,0.5)]">{fecha}</span>
      </td>

      {/* Estado badge */}
      <td className="px-5 py-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </td>

      {/* Descripción */}
      <td className="px-5 py-4">
        <p className="text-[13px] text-[rgba(28,0,44,0.5)] leading-relaxed max-w-sm">{hito.descripcion}</p>
      </td>

      {/* Menú contextual */}
      <td className="px-3 py-4">
        <div className="relative flex justify-end" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
            style={{
              background: menuOpen ? "rgba(28,0,44,0.07)" : "transparent",
              color: "rgba(28,0,44,0.4)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.07)"; }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 rounded-[10px] overflow-hidden z-20"
              style={{ background: "white", border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 200 }}
            >
              {[
                { label: "Editar hito", action: () => { onEdit(); setMenuOpen(false); } },
                { label: "Marcar como pendiente",   action: () => { onSetEstado("pendiente");   setMenuOpen(false); } },
                { label: "Marcar como en curso",     action: () => { onSetEstado("en_curso");    setMenuOpen(false); } },
                { label: "Marcar como completado",  action: () => { onSetEstado("completado");  setMenuOpen(false); } },
                { label: "Eliminar hito", action: () => { onRemove(); setMenuOpen(false); }, danger: true },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors duration-100 cursor-pointer"
                  style={{ color: item.danger ? "#dc2626" : "rgba(28,0,44,0.7)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "rgba(220,38,38,0.04)" : "rgba(28,0,44,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── HitoModal ─────────────────────────────────────────────────────────────────

function HitoModal({
  hito, onSave, onClose,
}: {
  hito?: HitoLocal;
  onSave: (h: HitoLocal | Omit<HitoLocal, "id">) => void;
  onClose: () => void;
}) {
  const isNew = !hito;
  const [nombre,      setNombre]      = useState(hito?.nombre      ?? "");
  const [fecha,       setFecha]       = useState(hito?.fecha        ?? "");
  const [descripcion, setDescripcion] = useState(hito?.descripcion  ?? "");
  const [estado,      setEstado]      = useState<EstadoHito>(hito?.estado ?? "pendiente");

  function handleSave() {
    if (!nombre.trim() || !fecha) return;
    if (isNew) {
      onSave({ nombre, fecha, descripcion, estado, id: "" } as HitoLocal);
    } else {
      onSave({ ...hito!, nombre, fecha, descripcion, estado });
    }
  }

  return (
    <FormModal
      title={isNew ? "Nuevo hito" : "Editar hito"}
      description={isNew ? "Definí un punto de control para el proyecto." : "Modificá los datos del hito."}
      onClose={onClose}
      width={480}
      footer={
        <>
          <FMCancelButton onClick={onClose} />
          <FMSubmitButton onClick={handleSave} disabled={!nombre.trim() || !fecha}>
            {isNew ? "Crear hito" : "Guardar cambios"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre del hito">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ingresá el nombre del hito"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fecha">
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>

        <FormField label="Estado">
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as EstadoHito)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
          </select>
        </FormField>
      </div>

      <FormField label="Descripción" hint="Opcional">
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción del hito"
          rows={3}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] resize-none"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
    </FormModal>
  );
}

