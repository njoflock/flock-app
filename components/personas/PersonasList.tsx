"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PLAYBOOKS_DISPONIBLES,
  INSTANCIAS_DISPONIBLES,
  type PersonaCompleta,
  type EstadoPersona,
} from "@/lib/mock-personas";
import { crearPersona, eliminarPersona, actualizarPersona } from "@/app/(main)/personas/actions";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { ConfirmDestructiveModal } from "@/components/ui/ConfirmDestructiveModal";

const ESTADO_CFG: Record<EstadoPersona, { color: string; bg: string; label: string }> = {
  activo:   { color: "#7F07C5", bg: "rgba(127,7,197,0.07)", label: "Activo" },
  inactivo: { color: "#6b7280", bg: "rgba(107,114,128,0.07)", label: "Inactivo" },
};

export function PersonasList({ personas: initial }: { personas: PersonaCompleta[] }) {
  const router = useRouter();
  const [search,       setSearch]       = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoPersona | "todos">("todos");
  const [showAdd,      setShowAdd]      = useState(false);

  const cntActivos   = initial.filter(p => p.estado === "activo").length;
  const cntInactivos = initial.filter(p => p.estado === "inactivo").length;

  const personasFiltradas = useMemo(() => {
    let lista = [...initial];
    if (filtroEstado !== "todos") lista = lista.filter(p => p.estado === filtroEstado);
    if (search.trim()) {
      const q = search.toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [initial, filtroEstado, search]);

  async function handleAdd(data: {
    nombre: string;
    email: string;
    tipo_perfil: "empleado" | "proveedor";
    horas_disponibles: number;
    playbook: string;
    instancia: string;
    avance_instancia: number;
  }) {
    await crearPersona({
      nombre: data.nombre,
      email: data.email,
      tipo_perfil: data.tipo_perfil,
      horas_disponibles: data.horas_disponibles,
      playbook: data.playbook || null,
      instancia: data.instancia || null,
      avance_instancia: data.avance_instancia,
    });
    setShowAdd(false);
    router.refresh();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1C002C] tracking-tight">Personas</h1>
          <p className="text-[13px] text-[rgba(28,0,44,0.42)] mt-0.5">
            {cntActivos} activa{cntActivos !== 1 ? "s" : ""} · {cntInactivos} inactiva{cntInactivos !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,#FF5102 0%,#7F07C5 100%)",
            boxShadow: "0 2px 10px rgba(255,81,2,0.22)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar persona
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[9px]"
          style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.015)", minWidth: 220 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar persona…"
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
            { value: "todos",    label: "Todos" },
            { value: "activo",   label: "Activos" },
            { value: "inactivo", label: "Inactivos" },
          ] as { value: EstadoPersona | "todos"; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltroEstado(value)}
              className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: filtroEstado === value ? "white" : "transparent",
                color:      filtroEstado === value ? "#1C002C" : "rgba(28,0,44,0.4)",
                boxShadow:  filtroEstado === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* InfoBanner */}
      <InfoBanner title="Acciones rápidas" compact>
        Utilizá el menú ⋮ de cada persona para editar su perfil o eliminarla.
      </InfoBanner>

      {/* Grilla */}
      {personasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personasFiltradas.map(p => <PersonaCard key={p.id} persona={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] font-medium text-[rgba(28,0,44,0.4)]">
            No hay personas que coincidan con los filtros.
          </p>
          <button
            onClick={() => { setSearch(""); setFiltroEstado("todos"); }}
            className="mt-3 text-[12.5px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: "rgba(127,7,197,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {showAdd && (
        <AddPersonaModal onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

// ── PersonaCard ───────────────────────────────────────────────────────────────

function PersonaCard({ persona }: { persona: PersonaCompleta }) {
  const router = useRouter();
  const est = ESTADO_CFG[persona.estado];
  const esProveedor = persona.infoLaboral.tipo === "proveedor";
  const pctOcupacion = persona.horasDisponibles > 0
    ? Math.round((persona.horasAsignadas / persona.horasDisponibles) * 100)
    : 0;

  const colorDisponibilidad =
    pctOcupacion > 120 ? "#e05c6a"
    : pctOcupacion > 100 ? "#c026a0"
    : pctOcupacion === 100 ? "#7F07C5"
    : pctOcupacion >= 80  ? "#b45309"
    : "#d97706";

  const [menuOpen,      setMenuOpen]   = useState(false);
  const [showEdit,      setShowEdit]   = useState(false);
  const [showDelete,    setShowDelete] = useState(false);
  const [deletePending, startDelete]   = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  function handleDelete() {
    startDelete(async () => {
      await eliminarPersona(persona.id);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Link
        href={`/personas/${persona.id}`}
        className="group flex flex-col rounded-[14px] border bg-white p-4 gap-3.5 transition-all duration-200"
        style={{ borderColor: "rgba(28,0,44,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
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
        {/* Avatar + nombre + [Proveedor] + estado + menu */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-bold text-white shrink-0"
            style={{ background: esProveedor ? "linear-gradient(135deg,#0ea5e9,#0369a1)" : "linear-gradient(135deg,#FF5102,#7F07C5)" }}
          >
            {persona.iniciales}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-[14px] font-bold text-[#1C002C] leading-tight truncate">{persona.nombre}</h3>
              {esProveedor && (
                <span
                  className="shrink-0 px-1.5 py-[1.5px] rounded-[4px] text-[9.5px] font-semibold"
                  style={{ background: "rgba(8,145,178,0.09)", color: "#0891b2" }}
                >
                  Proveedor
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[rgba(28,0,44,0.4)] mt-0.5 truncate">{persona.email}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
              style={{ background: est.bg, color: est.color }}
            >
              {est.label}
            </span>
            {/* Menú contextual */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                className="w-6 h-6 flex items-center justify-center rounded-[6px] transition-colors duration-150 cursor-pointer"
                style={{
                  color: menuOpen ? "rgba(28,0,44,0.6)" : "rgba(28,0,44,0.28)",
                  background: menuOpen ? "rgba(28,0,44,0.06)" : "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; e.currentTarget.style.color = "rgba(28,0,44,0.6)"; }}
                onMouseLeave={e => {
                  if (!menuOpen) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(28,0,44,0.28)";
                  }
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 rounded-[10px] bg-white overflow-hidden z-50"
                  style={{ minWidth: 170, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)", border: "1px solid rgba(28,0,44,0.07)" }}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors duration-100 cursor-pointer"
                    style={{ color: "#1C002C" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                  >
                    <span style={{ fontSize: 13 }}>✏️</span>
                    <span className="font-medium">Editar perfil</span>
                  </button>
                  <div style={{ height: 1, background: "rgba(28,0,44,0.06)", margin: "0 10px" }} />
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors duration-100 cursor-pointer"
                    style={{ color: "#dc2626" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    onClick={() => { setMenuOpen(false); setShowDelete(true); }}
                  >
                    <span style={{ fontSize: 13 }}>🗑</span>
                    <span className="font-medium">Eliminar persona</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avance de instancia */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-[rgba(28,0,44,0.32)]">Desarrollo profesional</p>
          <p className="text-[11.5px] text-[rgba(28,0,44,0.45)]">
            {persona.playbook || "Sin playbook"}
            {persona.instancia && (
              <>
                <span className="mx-1.5 text-[rgba(28,0,44,0.2)]">·</span>
                {persona.instancia}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.05)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${persona.avanceInstancia}%`, background: "linear-gradient(90deg,#FF5102,#7F07C5)" }}
              />
            </div>
            <span
              className="shrink-0 text-[10.5px] font-medium tabular-nums"
              style={{ color: "rgba(28,0,44,0.35)", minWidth: 26, textAlign: "right" }}
            >
              {persona.avanceInstancia}%
            </span>
          </div>
        </div>

        {/* Ocupación */}
        <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid rgba(28,0,44,0.05)" }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.32)", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="text-[11px] font-semibold text-[rgba(28,0,44,0.32)]">Ocupación</p>
            </div>
            <span className="text-[11.5px] text-[rgba(28,0,44,0.45)] tabular-nums shrink-0">
              {persona.horasAsignadas} h / {persona.horasDisponibles} h
              <span className="ml-1.5 font-semibold" style={{ color: colorDisponibilidad }}>
                {pctOcupacion}%
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(pctOcupacion, 100)}%`, background: colorDisponibilidad }}
            />
          </div>
        </div>
      </Link>

      {showEdit && (
        <EditPersonaCardModal
          persona={persona}
          onClose={() => setShowEdit(false)}
          onSave={async (fields) => {
            await actualizarPersona(persona.id, fields);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}

      {showDelete && (
        <ConfirmDestructiveModal
          title="Eliminar persona"
          entityName={persona.nombre}
          description="La persona dejará de aparecer en el sistema. Esta acción no podrá deshacerse."
          pending={deletePending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

// ── EditPersonaCardModal ──────────────────────────────────────────────────────

function EditPersonaCardModal({
  persona,
  onClose,
  onSave,
}: {
  persona: PersonaCompleta;
  onClose: () => void;
  onSave: (fields: {
    nombre: string; email: string; estado: EstadoPersona;
    playbook: string; instancia: string; avance_instancia: number; horas_disponibles: number;
  }) => Promise<void>;
}) {
  const [nombre,    setNombre]    = useState(persona.nombre);
  const [email,     setEmail]     = useState(persona.email);
  const [estado,    setEstado]    = useState<EstadoPersona>(persona.estado);
  const [playbook,  setPlaybook]  = useState(persona.playbook);
  const [instancia, setInstancia] = useState(persona.instancia);
  const [avance,    setAvance]    = useState(String(persona.avanceInstancia));
  const [horas,     setHoras]     = useState(String(persona.horasDisponibles));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const avanceNum = Math.min(100, Math.max(0, Number(avance) || 0));
    const horasNum  = Math.max(1, Number(horas) || 160);
    startTransition(() => onSave({ nombre: nombre.trim(), email: email.trim(), estado, playbook, instancia, avance_instancia: avanceNum, horas_disponibles: horasNum }));
  }

  const inputCls = "w-full rounded-[10px] px-3.5 py-2.5 text-[13.5px] outline-none transition-shadow bg-white";
  const inputStyle = { border: "1.5px solid rgba(28,0,44,0.12)", color: "#1C002C" };
  function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(127,7,197,0.07)";
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)";
    e.currentTarget.style.boxShadow   = "none";
  }

  return (
    <FormModal
      title="Editar persona"
      description="Actualizá los datos de esta persona en el sistema."
      onClose={onClose}
      width={500}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={isPending} />
          <FMSubmitButton onClick={handleSave} disabled={isPending || !nombre.trim()}>
            {isPending ? "Guardando…" : "Guardar"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre completo">
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. María López"
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </FormField>
      <FormField label="Email">
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="persona@empresa.com"
          className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </FormField>
      <FormField label="Estado">
        <select value={estado} onChange={e => setEstado(e.target.value as EstadoPersona)}
          className={`${inputCls} appearance-none cursor-pointer`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Playbook">
          <select value={playbook} onChange={e => setPlaybook(e.target.value)}
            className={`${inputCls} appearance-none cursor-pointer`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
            {PLAYBOOKS_DISPONIBLES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Instancia">
          <select value={instancia} onChange={e => setInstancia(e.target.value)}
            className={`${inputCls} appearance-none cursor-pointer`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
            {INSTANCIAS_DISPONIBLES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Avance en instancia" hint="0–100 %">
          <input value={avance} onChange={e => setAvance(e.target.value)} type="number" min={0} max={100}
            className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </FormField>
        <FormField label="Jornada mensual" hint="horas">
          <input value={horas} onChange={e => setHoras(e.target.value)} type="number" min={1} max={300} placeholder="160"
            className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </FormField>
      </div>
    </FormModal>
  );
}

// ── AddPersonaModal ───────────────────────────────────────────────────────────

function AddPersonaModal({
  onSave, onClose,
}: {
  onSave: (data: {
    nombre: string;
    email: string;
    tipo_perfil: "empleado" | "proveedor";
    horas_disponibles: number;
    playbook: string;
    instancia: string;
    avance_instancia: number;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre,      setNombre]      = useState("");
  const [email,       setEmail]       = useState("");
  const [tipoPerfil,  setTipoPerfil]  = useState<"empleado" | "proveedor">("empleado");
  const [playbook,    setPlaybook]    = useState("");
  const [instancia,   setInstancia]   = useState("");
  const [avance,      setAvance]      = useState("0");
  const [jornada,     setJornada]     = useState<"160"|"120"|"80"|"40"|"custom">("160");
  const [horasCustom, setHorasCustom] = useState("");
  const [isPending,   startTransition] = useTransition();

  const horasDisponibles =
    jornada === "custom" ? (Number(horasCustom) || 0) : Number(jornada);

  function handleSave() {
    if (!nombre.trim() || !email.trim()) return;
    const avanceNum = Math.min(100, Math.max(0, Number(avance) || 0));
    startTransition(async () => {
      await onSave({
        nombre: nombre.trim(),
        email: email.trim(),
        tipo_perfil: tipoPerfil,
        horas_disponibles: horasDisponibles,
        playbook,
        instancia,
        avance_instancia: avanceNum,
      });
    });
  }

  return (
    <FormModal
      title="Nueva persona"
      description="Registrá una nueva persona en el sistema."
      onClose={onClose}
      width={480}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={isPending} />
          <FMSubmitButton onClick={handleSave} disabled={isPending || !nombre.trim() || !email.trim()}>
            {isPending ? "Creando…" : "Crear persona"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre completo">
        <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ana García"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
      <FormField label="Email">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@empresa.com"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
      <FormField label="Tipo de perfil">
        <div className="flex gap-2">
          {(["empleado", "proveedor"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipoPerfil(t)}
              className="flex-1 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: tipoPerfil === t ? "rgba(127,7,197,0.08)" : "rgba(28,0,44,0.03)",
                color:      tipoPerfil === t ? "#7F07C5" : "rgba(28,0,44,0.5)",
                border:     tipoPerfil === t ? "1px solid rgba(127,7,197,0.25)" : "1px solid rgba(28,0,44,0.1)",
                fontWeight: tipoPerfil === t ? 600 : 400,
              }}
            >
              {t === "empleado" ? "Empleado Flock" : "Proveedor"}
            </button>
          ))}
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Playbook" hint="Opcional">
          <select value={playbook} onChange={e => setPlaybook(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          >
            <option value="">--</option>
            {PLAYBOOKS_DISPONIBLES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Instancia" hint="Opcional">
          <select value={instancia} onChange={e => setInstancia(e.target.value)}
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          >
            <option value="">--</option>
            {INSTANCIAS_DISPONIBLES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Avance en la instancia" hint="Opcional">
        <div className="relative">
          <input
            type="number" value={avance} onChange={e => setAvance(e.target.value)}
            min={0} max={100} placeholder="0"
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 pl-3 pr-9 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)";
              e.currentTarget.style.background = "rgba(28,0,44,0.015)";
              const v = Math.min(100, Math.max(0, Number(e.currentTarget.value) || 0));
              setAvance(String(v));
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[rgba(28,0,44,0.3)] pointer-events-none">%</span>
        </div>
      </FormField>
      <FormField label="Jornada mensual">
        <select
          value={jornada}
          onChange={e => setJornada(e.target.value as "160"|"120"|"80"|"40"|"custom")}
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px] cursor-pointer"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
        >
          <option value="160">Jornada completa (160 h)</option>
          <option value="120">120 h</option>
          <option value="80">80 h</option>
          <option value="40">40 h</option>
          <option value="custom">Personalizada…</option>
        </select>
      </FormField>
      {jornada === "custom" && (
        <FormField label="Horas mensuales">
          <div className="relative">
            <input
              type="number" value={horasCustom} onChange={e => setHorasCustom(e.target.value)}
              min={1} max={300} placeholder="100"
              className="w-full text-[14px] text-[#1C002C] outline-none py-2 pl-3 pr-9 rounded-[8px]"
              style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[rgba(28,0,44,0.3)] pointer-events-none">h</span>
          </div>
        </FormField>
      )}
    </FormModal>
  );
}
