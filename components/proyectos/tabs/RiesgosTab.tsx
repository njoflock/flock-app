"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { type Proyecto, type Riesgo, type EstadoRiesgo } from "@/lib/mock-proyectos";
import { crearRiesgo, actualizarRiesgo, eliminarRiesgo } from "@/app/(main)/proyectos/actions";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

type Impacto = "alto" | "medio" | "bajo";

interface RiesgoLocal extends Riesgo {
  fecha: string;
  createdOrder: number;
}

const IMPACTO_CFG: Record<Impacto, { color: string; bg: string; border: string; dot: string; label: string; peso: number }> = {
  alto:  { color: "#dc2626", bg: "rgba(220,38,38,0.07)",  border: "rgba(220,38,38,0.18)",  dot: "#dc2626", label: "Alto",  peso: 3 },
  medio: { color: "#ca8a04", bg: "rgba(202,138,4,0.07)",  border: "rgba(202,138,4,0.18)",  dot: "#ca8a04", label: "Medio", peso: 2 },
  bajo:  { color: "#16a34a", bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.18)",  dot: "#16a34a", label: "Bajo",  peso: 1 },
};

const ESTADO_CFG: Record<EstadoRiesgo, { color: string; bg: string; border: string; dot: string; label: string; peso: number }> = {
  abierto:  { color: "#ca8a04", bg: "rgba(202,138,4,0.07)",  border: "rgba(202,138,4,0.18)",  dot: "#ca8a04", label: "Abierto",  peso: 1 },
  mitigado: { color: "#16a34a", bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.18)",  dot: "#16a34a", label: "Mitigado", peso: 0 },
};

let nextId = 200;

export function RiesgosTab({ proyecto }: { proyecto: Proyecto }) {
  const [isPending, startTransition] = useTransition();

  const [riesgos, setRiesgos] = useState<RiesgoLocal[]>(() =>
    proyecto.riesgos.map((r, i) => ({ ...r, fecha: "", createdOrder: i }))
  );
  const [modal,         setModal]         = useState<RiesgoLocal | null>(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [filtroEstado,  setFiltroEstado]  = useState<EstadoRiesgo | "todos">("todos");
  const [filtroImpacto, setFiltroImpacto] = useState<Impacto | "todos">("todos");
  const [filtroDesde,   setFiltroDesde]   = useState("");
  const [filtroHasta,   setFiltroHasta]   = useState("");
  const [ordenCampo,    setOrdenCampo]    = useState<"fecha" | "impacto" | "estado">("fecha");
  const [ordenDir,      setOrdenDir]      = useState<"asc" | "desc">("asc");

  function updateRiesgo(r: RiesgoLocal) {
    setRiesgos(prev => prev.map(x => x.id === r.id ? r : x));
    startTransition(() =>
      actualizarRiesgo(proyecto.id, r.id, {
        descripcion: r.riesgo,
        estado:      r.estado,
        impacto:     r.impacto as Impacto,
        mitigacion:  r.mitigacion,
      }).catch(() => {})
    );
  }

  function addRiesgo(r: Omit<RiesgoLocal, "id" | "createdOrder">) {
    const tempId = String(nextId++);
    setRiesgos(prev => [...prev, { ...r, id: tempId, createdOrder: prev.length }]);
    startTransition(async () => {
      try {
        const realId = await crearRiesgo(proyecto.id, {
          descripcion: r.riesgo,
          estado:      r.estado,
          impacto:     r.impacto as Impacto,
          mitigacion:  r.mitigacion,
        });
        setRiesgos(prev => prev.map(x => x.id === tempId ? { ...x, id: realId } : x));
      } catch {}
    });
  }

  function removeRiesgo(id: string) {
    setRiesgos(prev => prev.filter(x => x.id !== id));
    startTransition(() => eliminarRiesgo(proyecto.id, id).catch(() => {}));
  }

  function setEstado(id: string, estado: EstadoRiesgo) {
    setRiesgos(prev => prev.map(x => x.id === id ? { ...x, estado } : x));
    startTransition(() => actualizarRiesgo(proyecto.id, id, { estado }).catch(() => {}));
  }

  // Resumen
  const cntAbiertos  = riesgos.filter(r => r.estado === "abierto").length;
  const cntMitigados = riesgos.filter(r => r.estado === "mitigado").length;
  const cntAlto      = riesgos.filter(r => r.impacto === "alto").length;

  // Filtros
  const hayFiltros = filtroEstado !== "todos" || filtroImpacto !== "todos" || filtroDesde !== "" || filtroHasta !== "";

  const riesgosVisibles = useMemo(() => {
    let lista = [...riesgos];
    if (filtroEstado !== "todos")  lista = lista.filter(r => r.estado  === filtroEstado);
    if (filtroImpacto !== "todos") lista = lista.filter(r => r.impacto === filtroImpacto);
    if (filtroDesde) lista = lista.filter(r => r.fecha >= filtroDesde);
    if (filtroHasta) lista = lista.filter(r => r.fecha <= filtroHasta);

    lista.sort((a, b) => {
      let cmp = 0;
      if (ordenCampo === "fecha")   cmp = a.fecha.localeCompare(b.fecha) || (a.createdOrder - b.createdOrder);
      if (ordenCampo === "impacto") cmp = IMPACTO_CFG[a.impacto as Impacto].peso - IMPACTO_CFG[b.impacto as Impacto].peso;
      if (ordenCampo === "estado")  cmp = ESTADO_CFG[a.estado].peso - ESTADO_CFG[b.estado].peso;
      return ordenDir === "asc" ? cmp : -cmp;
    });

    return lista;
  }, [riesgos, filtroEstado, filtroImpacto, filtroDesde, filtroHasta, ordenCampo, ordenDir]);

  return (
    <div className="space-y-4 pb-16">

      {/* ── Resumen ── */}
      <div
        className="rounded-[12px] border px-5 py-4"
        style={{ borderColor: "rgba(28,0,44,0.07)", background: "#fafafa" }}
      >
        <div className="flex items-center gap-6 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cntAbiertos > 0 ? "#ca8a04" : "#16a34a" }} />
            <span className="text-[rgba(28,0,44,0.5)]">
              <span className="font-bold text-[#1C002C]">{cntAbiertos}</span>{" "}
              {cntAbiertos === 1 ? "riesgo abierto" : "riesgos abiertos"}
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: "rgba(28,0,44,0.1)" }} />
          <span className="text-[rgba(28,0,44,0.5)]">
            <span className="font-bold text-[#1C002C]">{cntMitigados}</span>{" "}
            {cntMitigados === 1 ? "mitigado" : "mitigados"}
          </span>
          {cntAlto > 0 && (
            <>
              <div style={{ width: 1, height: 14, background: "rgba(28,0,44,0.1)" }} />
              <span style={{ color: IMPACTO_CFG.alto.color }}>
                <span className="font-bold">{cntAlto}</span> de impacto alto
              </span>
            </>
          )}
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
            { value: "todos",    label: "Todos" },
            { value: "abierto",  label: "Abierto" },
            { value: "mitigado", label: "Mitigado" },
          ] as { value: EstadoRiesgo | "todos"; label: string }[]).map(({ value, label }) => {
            const active = filtroEstado === value;
            const cfg = value !== "todos" ? ESTADO_CFG[value] : null;
            return (
              <button
                key={value}
                onClick={() => setFiltroEstado(value)}
                className="px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? (cfg ? cfg.bg : "rgba(28,0,44,0.07)") : "transparent",
                  color:      active ? (cfg ? cfg.color : "#1C002C")          : "rgba(28,0,44,0.4)",
                  border:     `1px solid ${active ? (cfg ? cfg.border : "rgba(28,0,44,0.15)") : "transparent"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 20, background: "rgba(28,0,44,0.1)" }} className="shrink-0" />

        {/* Impacto */}
        <div className="flex items-center gap-1">
          {([
            { value: "todos", label: "Todos" },
            { value: "alto",  label: "Alto" },
            { value: "medio", label: "Medio" },
            { value: "bajo",  label: "Bajo" },
          ] as { value: Impacto | "todos"; label: string }[]).map(({ value, label }) => {
            const active = filtroImpacto === value;
            const cfg = value !== "todos" ? IMPACTO_CFG[value] : null;
            return (
              <button
                key={value}
                onClick={() => setFiltroImpacto(value)}
                className="px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? (cfg ? cfg.bg : "rgba(28,0,44,0.07)") : "transparent",
                  color:      active ? (cfg ? cfg.color : "#1C002C")          : "rgba(28,0,44,0.4)",
                  border:     `1px solid ${active ? (cfg ? cfg.border : "rgba(28,0,44,0.15)") : "transparent"}`,
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
            <option value="impacto">Impacto</option>
            <option value="estado">Estado</option>
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

        {/* Limpiar */}
        {hayFiltros && (
          <button
            onClick={() => { setFiltroEstado("todos"); setFiltroImpacto("todos"); setFiltroDesde(""); setFiltroHasta(""); }}
            className="text-[11.5px] font-medium transition-colors duration-150 cursor-pointer"
            style={{ color: "rgba(127,7,197,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}
          >
            Limpiar
          </button>
        )}

        {/* Agregar riesgo */}
        <div className="ml-auto shrink-0">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)", boxShadow: "0 2px 10px rgba(255,81,2,0.2)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar riesgo
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-[14px] border overflow-hidden" style={{ borderColor: "rgba(28,0,44,0.07)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Riesgo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Fecha</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Estado</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Impacto</th>
              <th className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(28,0,44,0.38)]">Mitigación</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {riesgosVisibles.map((r, i) => (
              <RiesgoRow
                key={r.id}
                riesgo={r}
                last={i === riesgosVisibles.length - 1}
                onEdit={() => setModal(r)}
                onSetEstado={(estado) => setEstado(r.id, estado)}
                onRemove={() => removeRiesgo(r.id)}
              />
            ))}
            {riesgosVisibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-[13px] text-[rgba(28,0,44,0.3)]">
                    {riesgos.length === 0
                      ? "No hay riesgos registrados."
                      : "No hay riesgos que coincidan con los filtros."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <RiesgoModal
          riesgo={modal}
          onSave={(updated) => { updateRiesgo(updated); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {showAdd && (
        <RiesgoModal
          onSave={(r) => { addRiesgo(r); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── RiesgoRow ─────────────────────────────────────────────────────────────────

function RiesgoRow({
  riesgo, last, onEdit, onSetEstado, onRemove,
}: {
  riesgo: RiesgoLocal;
  last: boolean;
  onEdit: () => void;
  onSetEstado: (e: EstadoRiesgo) => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const imp = IMPACTO_CFG[riesgo.impacto as Impacto];
  const est = ESTADO_CFG[riesgo.estado];
  const fechaFormateada = riesgo.fecha
    ? new Date(riesgo.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <tr
      className="group"
      style={{ borderBottom: last ? "none" : "1px solid rgba(28,0,44,0.04)", background: "white" }}
    >
      {/* Riesgo */}
      <td className="px-5 py-4 max-w-[200px]">
        <p className="text-[13.5px] font-medium text-[#1C002C] leading-relaxed">{riesgo.riesgo}</p>
      </td>

      {/* Fecha */}
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-[13px] text-[rgba(28,0,44,0.5)]">{fechaFormateada}</span>
      </td>

      {/* Estado */}
      <td className="px-4 py-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
          style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: est.dot }} />
          {est.label}
        </span>
      </td>

      {/* Impacto */}
      <td className="px-4 py-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
          style={{ background: imp.bg, color: imp.color, border: `1px solid ${imp.border}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: imp.dot }} />
          {imp.label}
        </span>
      </td>

      {/* Mitigación */}
      <td className="px-5 py-4">
        <p className="text-[13px] text-[rgba(28,0,44,0.55)] leading-relaxed">{riesgo.mitigacion}</p>
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
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 rounded-[10px] overflow-hidden z-20"
              style={{ background: "white", border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 190 }}
            >
              {[
                { label: "Editar riesgo",        action: () => { onEdit(); setMenuOpen(false); } },
                { label: "Marcar como abierto",  action: () => { onSetEstado("abierto");  setMenuOpen(false); } },
                { label: "Marcar como mitigado", action: () => { onSetEstado("mitigado"); setMenuOpen(false); } },
                { label: "Eliminar riesgo",      action: () => { onRemove(); setMenuOpen(false); }, danger: true },
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

// ── RiesgoModal ───────────────────────────────────────────────────────────────

function RiesgoModal({
  riesgo, onSave, onClose,
}: {
  riesgo?: RiesgoLocal;
  onSave: (r: RiesgoLocal | Omit<RiesgoLocal, "id" | "createdOrder">) => void;
  onClose: () => void;
}) {
  const isNew = !riesgo;
  const [nombre,     setNombre]     = useState(riesgo?.riesgo     ?? "");
  const [fecha,      setFecha]      = useState(riesgo?.fecha       ?? "");
  const [estado,     setEstado]     = useState<EstadoRiesgo>(riesgo?.estado    ?? "abierto");
  const [impacto,    setImpacto]    = useState<Impacto>((riesgo?.impacto as Impacto) ?? "medio");
  const [mitigacion, setMitigacion] = useState(riesgo?.mitigacion ?? "");

  function handleSave() {
    if (!nombre.trim()) return;
    if (isNew) {
      onSave({ riesgo: nombre, fecha, estado, impacto, mitigacion });
    } else {
      onSave({ ...riesgo!, riesgo: nombre, fecha, estado, impacto, mitigacion });
    }
  }

  return (
    <FormModal
      title={isNew ? "Nuevo riesgo" : "Editar riesgo"}
      description={isNew ? "Registrá un riesgo identificado para el proyecto." : "Modificá los datos del riesgo."}
      onClose={onClose}
      width={480}
      footer={
        <>
          <FMCancelButton onClick={onClose} />
          <FMSubmitButton onClick={handleSave} disabled={!nombre.trim()}>
            {isNew ? "Crear riesgo" : "Guardar cambios"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Descripción del riesgo">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Describí el riesgo identificado"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Fecha" hint="Opcional">
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
            onChange={e => setEstado(e.target.value as EstadoRiesgo)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          >
            <option value="abierto">Abierto</option>
            <option value="mitigado">Mitigado</option>
          </select>
        </FormField>

        <FormField label="Impacto">
          <select
            value={impacto}
            onChange={e => setImpacto(e.target.value as Impacto)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          >
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
        </FormField>
      </div>

      <FormField label="Plan de mitigación" hint="Opcional">
        <textarea
          value={mitigacion}
          onChange={e => setMitigacion(e.target.value)}
          placeholder="¿Cómo se está mitigando este riesgo?"
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

