"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Proyecto } from "@/lib/mock-proyectos";
import { crearProyecto } from "@/app/(main)/proyectos/actions";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

const SEMAFORO_CONFIG = {
  verde:    { color: "#16a34a", bg: "rgba(22,163,74,0.09)",   dot: "#16a34a", label: "Saludable" },
  amarillo: { color: "#ca8a04", bg: "rgba(202,138,4,0.09)",   dot: "#ca8a04", label: "En riesgo" },
  rojo:     { color: "#dc2626", bg: "rgba(220,38,38,0.09)",   dot: "#dc2626", label: "Crítico"   },
};

const ESTADO_CONFIG = {
  activo:     { color: "#7F07C5", bg: "rgba(127,7,197,0.07)", label: "Activo" },
  finalizado: { color: "#6b7280", bg: "rgba(107,114,128,0.07)", label: "Finalizado" },
};

export function ProyectosList({ proyectos, clientes }: { proyectos: Proyecto[]; clientes: { id: string; nombre: string }[] }) {
  const router  = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [search,  setSearch]  = useState("");
  const [filtro,  setFiltro]  = useState<"todos" | "activo" | "finalizado">("todos");

  const activos     = proyectos.filter(p => p.estado === "activo").length;
  const finalizados = proyectos.filter(p => p.estado === "finalizado").length;

  const filtrados = useMemo(() => {
    let list = proyectos;
    if (filtro !== "todos") list = list.filter(p => p.estado === filtro);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q)
      );
    }
    return list;
  }, [proyectos, filtro, search]);

  async function handleAdd(data: { nombre: string; cliente_id: string; descripcion: string; fecha_inicio: string; fecha_fin: string; cmg_esperado: number; horas_vendidas: number }) {
    await crearProyecto({
      nombre: data.nombre,
      cliente_id: data.cliente_id,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      cmg_esperado: data.cmg_esperado,
      horas_vendidas: data.horas_vendidas,
      descripcion: data.descripcion || undefined,
    });
    setShowAdd(false);
    router.refresh();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1C002C] tracking-tight">Proyectos</h1>
          <p className="text-[13px] text-[rgba(28,0,44,0.42)] mt-0.5">
            {activos} activo{activos !== 1 ? "s" : ""} · {finalizados} finalizado{finalizados !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #FF5102 0%, #7F07C5 100%)",
            boxShadow: "0 2px 10px rgba(255,81,2,0.22)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar Proyecto
        </button>
      </div>

      {/* Búsqueda + Filtro */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[9px]"
          style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.015)", minWidth: 200 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proyecto o cliente…"
            className="flex-1 text-[13px] text-[#1C002C] bg-transparent outline-none placeholder:text-[rgba(28,0,44,0.3)]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="cursor-pointer" style={{ color: "rgba(28,0,44,0.3)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div
          className="flex items-center rounded-[9px] p-0.5"
          style={{ border: "1px solid rgba(28,0,44,0.09)", background: "rgba(28,0,44,0.02)" }}
        >
          {([
            { value: "todos",      label: "Todos",       count: proyectos.length },
            { value: "activo",     label: "Activos",     count: activos },
            { value: "finalizado", label: "Finalizados", count: finalizados },
          ] as { value: typeof filtro; label: string; count: number }[]).map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFiltro(value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: filtro === value ? "white" : "transparent",
                color:      filtro === value ? "#1C002C" : "rgba(28,0,44,0.4)",
                boxShadow:  filtro === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: filtro === value ? "rgba(127,7,197,0.08)" : "rgba(28,0,44,0.05)",
                    color:      filtro === value ? "#7F07C5" : "rgba(28,0,44,0.35)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla */}
      {filtrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map(p => <ProjectCard key={p.id} proyecto={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] font-medium text-[rgba(28,0,44,0.4)]">
            {search ? "No hay proyectos que coincidan con la búsqueda." : "No hay proyectos en esta categoría."}
          </p>
          {(search || filtro !== "todos") && (
            <button
              onClick={() => { setSearch(""); setFiltro("todos"); }}
              className="mt-3 text-[12.5px] font-medium cursor-pointer transition-colors duration-150"
              style={{ color: "rgba(127,7,197,0.6)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {showAdd && (
        <NuevoProyectoModal
          clientes={clientes}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

    </div>
  );
}

// ── NuevoProyectoModal ────────────────────────────────────────────────────────

function NuevoProyectoModal({
  clientes,
  onSave,
  onClose,
}: {
  clientes: { id: string; nombre: string }[];
  onSave: (data: { nombre: string; cliente_id: string; descripcion: string; fecha_inicio: string; fecha_fin: string; cmg_esperado: number; horas_vendidas: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre,        setNombre]        = useState("");
  const [clienteId,     setClienteId]     = useState("");
  const [descripcion,   setDescripcion]   = useState("");
  const [fechaInicio,   setFechaInicio]   = useState("");
  const [fechaFin,      setFechaFin]      = useState("");
  const [cmgEsperado,   setCmgEsperado]   = useState("");
  const [horasVendidas, setHorasVendidas] = useState("");
  const [isPending,     startTransition]  = useTransition();

  const canSave = nombre.trim() !== "" && clienteId !== "" && fechaInicio !== "" && fechaFin !== "" && cmgEsperado !== "" && horasVendidas !== "";

  function handleSave() {
    if (!canSave) return;
    startTransition(async () => {
      await onSave({
        nombre: nombre.trim(),
        cliente_id: clienteId,
        descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cmg_esperado: parseFloat(cmgEsperado),
        horas_vendidas: parseFloat(horasVendidas),
      });
    });
  }

  return (
    <FormModal
      title="Nuevo proyecto"
      description="Completá los datos para crear el proyecto."
      onClose={onClose}
      width={480}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={isPending} />
          <FMSubmitButton onClick={handleSave} disabled={isPending || !canSave}>
            {isPending ? "Creando…" : "Crear proyecto"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre del proyecto">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
          placeholder="Ingresá el nombre del proyecto"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
      <FormField label="Cliente">
        <select
          value={clienteId}
          onChange={e => setClienteId(e.target.value)}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)", appearance: "none" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        >
          <option value="" disabled>Seleccionar cliente…</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fecha de inicio">
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
        <FormField label="Fecha de fin">
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Horas vendidas">
          <input
            type="number"
            min="0"
            step="1"
            value={horasVendidas}
            onChange={e => setHorasVendidas(e.target.value)}
            placeholder="200"
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
        <FormField label="CMG esperado (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={cmgEsperado}
            onChange={e => setCmgEsperado(e.target.value)}
            placeholder="35"
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
      </div>
      <FormField label="Descripción" hint="Opcional">
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción del proyecto"
          rows={2}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] resize-none"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
    </FormModal>
  );
}

function ProjectCard({ proyecto }: { proyecto: Proyecto }) {
  const sem    = SEMAFORO_CONFIG[proyecto.semaforo];
  const estado = ESTADO_CONFIG[proyecto.estado];
  const pct    = proyecto.horas.horasVendidas > 0
    ? Math.round((proyecto.horas.horasConsumidas / proyecto.horas.horasVendidas) * 100)
    : 0;
  const fecha  = new Date(proyecto.fechaFin).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });

  const barColor =
    pct > 90 ? "linear-gradient(90deg,#dc2626,#ef4444)"
    : pct > 75 ? "linear-gradient(90deg,#ca8a04,#eab308)"
    : "linear-gradient(90deg,#FF5102,#7F07C5)";

  return (
    <Link
      href={`/proyectos/${proyecto.id}`}
      className="group flex flex-col rounded-[14px] border bg-white p-5 gap-4 transition-all duration-200"
      style={{
        borderColor: "rgba(28,0,44,0.07)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 0 rgba(127,7,197,0)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(127,7,197,0.16)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(127,7,197,0.09), 0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(28,0,44,0.07)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Fila 1: cliente + badges ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[rgba(28,0,44,0.38)] mb-1 truncate">
            {proyecto.cliente}
          </p>
          <h3 className="text-[15px] font-bold text-[#1C002C] leading-tight">
            {proyecto.nombre}
          </h3>
        </div>

        {/* Semáforo pill */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
          style={{ background: sem.bg, color: sem.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sem.dot }} />
          {sem.label}
        </span>
      </div>

      {/* ── Fila 2: barra de horas ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-[rgba(28,0,44,0.38)]">
            {proyecto.horas.horasConsumidas}h / {proyecto.horas.horasVendidas}h
          </span>
          <span
            className="font-bold"
            style={{
              color: pct > 90 ? "#dc2626" : pct > 75 ? "#ca8a04" : "rgba(28,0,44,0.55)",
            }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.05)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
          />
        </div>
      </div>

      {/* ── Fila 3: metadata ── */}
      <div
        className="flex items-center justify-between pt-1"
        style={{ borderTop: "1px solid rgba(28,0,44,0.05)" }}
      >
        <div className="flex items-center gap-2">
          {/* Estado */}
          <span
            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
            style={{ background: estado.bg, color: estado.color }}
          >
            {estado.label}
          </span>
          {/* CMG esperado */}
          <span
            className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
            style={{ background: "rgba(255,81,2,0.07)", color: "#c94000" }}
            title="CMG esperado"
          >
            CMG {proyecto.cmgEsperado}%
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Equipo */}
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {proyecto.equipo.slice(0, 3).map(m => (
                <div
                  key={m.persona.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-[1.5px] ring-white"
                  style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
                  title={m.persona.nombre}
                >
                  {m.persona.iniciales[0]}
                </div>
              ))}
              {proyecto.equipo.length > 3 && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold ring-[1.5px] ring-white"
                  style={{ background: "rgba(28,0,44,0.08)", color: "rgba(28,0,44,0.45)" }}
                >
                  +{proyecto.equipo.length - 3}
                </div>
              )}
            </div>
            <span className="text-[11px] text-[rgba(28,0,44,0.35)]">
              {proyecto.equipo.length}
            </span>
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.28)" }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-[11px] text-[rgba(28,0,44,0.35)]">{fecha}</span>
          </div>

          {/* Flecha — aparece en hover */}
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 -translate-x-1 group-hover:translate-x-0"
            style={{ color: "rgba(127,7,197,0.5)", transitionProperty: "opacity, transform" }}
          >
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
