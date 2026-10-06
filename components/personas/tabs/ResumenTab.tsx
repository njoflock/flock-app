"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type PersonaCompleta,
  type EstadoPersona,
  PLAYBOOKS_DISPONIBLES,
  INSTANCIAS_DISPONIBLES,
} from "@/lib/mock-personas";
import { actualizarPersona, eliminarPersona } from "@/app/(main)/personas/actions";
import { ConfirmDestructiveModal } from "@/components/ui/ConfirmDestructiveModal";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

const ESTADO_CFG: Record<EstadoPersona, { color: string; bg: string; border: string; label: string }> = {
  activo:   { color: "#7F07C5", bg: "rgba(127,7,197,0.08)", border: "rgba(127,7,197,0.2)",    label: "Activo"   },
  inactivo: { color: "#6b7280", bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.15)", label: "Inactivo" },
};

// ── Save toast ─────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = useCallback((fn: () => Promise<void>) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    fn().then(() => {
      setStatus("saved");
      timer.current = setTimeout(() => setStatus("idle"), 2500);
    }).catch(() => {
      setStatus("error");
      timer.current = setTimeout(() => setStatus("idle"), 3500);
    });
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { status, save };
}

function SaveToast({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const cfg = {
    saving: { bg: "rgba(28,0,44,0.75)", icon: <SpinnerIcon />, msg: "Guardando…" },
    saved:  { bg: "rgba(22,163,74,0.9)", icon: <CheckIcon />,  msg: "Cambios guardados" },
    error:  { bg: "rgba(220,38,38,0.9)", icon: <ErrIcon />,    msg: "No fue posible guardar los cambios" },
  }[status];
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-[11px] text-[13px] font-medium text-white shadow-xl"
      style={{ background: cfg.bg, backdropFilter: "blur(8px)" }}>
      {cfg.icon}{cfg.msg}
    </div>
  );
}
function SpinnerIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function ErrIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

// ── EditPersonaModal ──────────────────────────────────────────────────────────

type EditFields = {
  nombre: string; email: string; estado: EstadoPersona;
  playbook: string; instancia: string; avance_instancia: number; horas_disponibles: number;
};


function EditPersonaModal({
  persona,
  onClose,
  onSave,
}: {
  persona: PersonaCompleta;
  onClose: () => void;
  onSave: (fields: EditFields) => void;
}) {
  const [nombre,    setNombre]    = useState(persona.nombre);
  const [email,     setEmail]     = useState(persona.email);
  const [estado,    setEstado]    = useState<EstadoPersona>(persona.estado);
  const [playbook,  setPlaybook]  = useState(persona.playbook);
  const [instancia, setInstancia] = useState(persona.instancia);
  const [avance,    setAvance]    = useState(String(persona.avanceInstancia));
  const [horas,     setHoras]     = useState(String(persona.horasDisponibles));

  function handleSubmit() {
    const avanceNum = Math.min(100, Math.max(0, Number(avance) || 0));
    const horasNum  = Math.max(1, Number(horas) || 160);
    onSave({ nombre: nombre.trim(), email: email.trim(), estado, playbook, instancia, avance_instancia: avanceNum, horas_disponibles: horasNum });
    onClose();
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
          <FMCancelButton onClick={onClose} />
          <FMSubmitButton onClick={handleSubmit} disabled={!nombre.trim()}>Guardar</FMSubmitButton>
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

// ── ResumenTab ────────────────────────────────────────────────────────────────

export function ResumenTab({ persona }: { persona: PersonaCompleta }) {
  const router = useRouter();
  const { status, save } = useAutoSave();

  const [nombre,       setNombre]       = useState(persona.nombre);
  const [email,        setEmail]        = useState(persona.email);
  const [estado,       setEstado]       = useState<EstadoPersona>(persona.estado);
  const [playbook,     setPlaybook]     = useState(persona.playbook);
  const [instancia,    setInstancia]    = useState(persona.instancia);
  const [avance,       setAvance]       = useState(persona.avanceInstancia);
  const [horasJornada, setHorasJornada] = useState(persona.horasDisponibles);

  const horasAsignadas = persona.horasAsignadas;
  const esProveedor    = persona.infoLaboral.tipo === "proveedor";
  const iniciales      = nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const est            = ESTADO_CFG[estado];

  const pctOcupacion = horasJornada > 0
    ? Math.round((horasAsignadas / horasJornada) * 100)
    : 0;

  const ocupColor =
    pctOcupacion > 120 ? "#e05c6a"
    : pctOcupacion > 100 ? "#c026a0"
    : pctOcupacion === 100 ? "#7F07C5"
    : pctOcupacion >= 80  ? "#b45309"
    : "#d97706";

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);
  const [deletePending, startDelete]      = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  function handleSaveEdit(fields: EditFields) {
    setNombre(fields.nombre);
    setEmail(fields.email);
    setEstado(fields.estado);
    setPlaybook(fields.playbook);
    setInstancia(fields.instancia);
    setAvance(fields.avance_instancia);
    setHorasJornada(fields.horas_disponibles);
    save(() => actualizarPersona(persona.id, fields));
  }

  function handleDelete() {
    startDelete(async () => {
      await eliminarPersona(persona.id);
      router.push("/personas");
      router.refresh();
    });
  }

  return (
    <>
      <SaveToast status={status} />

      <div className="pb-12 space-y-6">

        {/* ── Hero ── */}
        <div className="flex items-center gap-6">

          <div
            className="shrink-0 w-[80px] h-[80px] rounded-full flex items-center justify-center text-[22px] font-bold text-white"
            style={{ background: esProveedor ? "linear-gradient(135deg,#0ea5e9,#0369a1)" : "linear-gradient(135deg,#FF5102,#7F07C5)" }}
          >
            {iniciales}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h1 className="text-[26px] font-bold text-[#1C002C] tracking-tight leading-tight truncate">
              {nombre}
            </h1>
            <p className="text-[14px] font-medium truncate" style={{ color: "rgba(28,0,44,0.42)" }}>
              {playbook || "Sin playbook"}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
                style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: est.color }} />
                {est.label}
              </span>
              {esProveedor && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
                  style={{ background: "rgba(8,145,178,0.09)", color: "#0891b2", border: "1px solid rgba(8,145,178,0.18)" }}
                >
                  Proveedor
                </span>
              )}
              <span style={{ color: "rgba(28,0,44,0.15)" }}>·</span>
              <span className="text-[13px]" style={{ color: "rgba(28,0,44,0.4)" }}>{email}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="shrink-0 relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-colors duration-150 cursor-pointer"
              style={{
                background: menuOpen ? "rgba(28,0,44,0.07)" : "rgba(28,0,44,0.04)",
                color: "#1C002C",
                border: "1px solid rgba(28,0,44,0.09)",
              }}
              onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = "rgba(28,0,44,0.07)"; }}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
            >
              Acciones
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.15s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1.5 rounded-[12px] bg-white overflow-hidden z-50"
                style={{ minWidth: 190, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(28,0,44,0.07)" }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-left transition-colors duration-100 cursor-pointer"
                  style={{ color: "#1C002C" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                >
                  <span style={{ fontSize: 14 }}>✏️</span>
                  <span className="font-medium">Editar persona</span>
                </button>
                <div style={{ height: 1, background: "rgba(28,0,44,0.06)", margin: "0 12px" }} />
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-left transition-colors duration-100 cursor-pointer"
                  style={{ color: "#dc2626" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { setMenuOpen(false); setShowDelete(true); }}
                >
                  <span style={{ fontSize: 14 }}>🗑</span>
                  <span className="font-medium">Eliminar persona</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Dos cards ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Card: Desarrollo profesional */}
          <div
            className="rounded-[16px] p-5 space-y-4"
            style={{ background: "white", border: "1px solid rgba(28,0,44,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <p className="text-[12px] font-semibold" style={{ color: "rgba(28,0,44,0.35)" }}>
              Desarrollo profesional
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px]" style={{ color: "rgba(28,0,44,0.4)" }}>Playbook</span>
                <span
                  className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(127,7,197,0.07)", color: "#7F07C5", border: "1px solid rgba(127,7,197,0.18)" }}
                >
                  {playbook || "Sin asignar"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px]" style={{ color: "rgba(28,0,44,0.4)" }}>Instancia</span>
                <span
                  className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)", border: "1px solid rgba(28,0,44,0.1)" }}
                >
                  {instancia || "Sin asignar"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px]" style={{ color: "rgba(28,0,44,0.4)" }}>Avance de instancia</span>
                <span className="text-[13px] font-bold" style={{ color: "#7F07C5" }}>{avance}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${avance}%`, background: "linear-gradient(90deg,#FF5102,#7F07C5)" }}
                />
              </div>
            </div>
          </div>

          {/* Card: Ocupación */}
          <div
            className="rounded-[16px] p-5 space-y-4"
            style={{ background: "white", border: "1px solid rgba(28,0,44,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <p className="text-[12px] font-semibold" style={{ color: "rgba(28,0,44,0.35)" }}>
              Ocupación
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-0.5">
                <p className="text-[11px]" style={{ color: "rgba(28,0,44,0.38)" }}>Jornada</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[20px] font-bold text-[#1C002C]">{horasJornada}</span>
                  <span className="text-[12px]" style={{ color: "rgba(28,0,44,0.38)" }}>h</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px]" style={{ color: "rgba(28,0,44,0.38)" }}>Asignadas</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[20px] font-bold text-[#1C002C]">{horasAsignadas}</span>
                  <span className="text-[12px]" style={{ color: "rgba(28,0,44,0.38)" }}>h</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px]" style={{ color: "rgba(28,0,44,0.38)" }}>Ocupación</p>
                <p className="text-[20px] font-bold" style={{ color: ocupColor }}>{pctOcupacion}%</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pctOcupacion, 100)}%`, background: ocupColor }}
                />
              </div>
              <p className="text-[11px]" style={{ color: "rgba(28,0,44,0.35)" }}>
                {horasAsignadas} h / {horasJornada} h este mes
              </p>
            </div>
          </div>
        </div>

      </div>

      {showEdit && (
        <EditPersonaModal
          persona={{ ...persona, nombre, email, estado, playbook, instancia, avanceInstancia: avance, horasDisponibles: horasJornada }}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveEdit}
        />
      )}

      {showDelete && (
        <ConfirmDestructiveModal
          title="Eliminar persona"
          entityName={nombre}
          description="La persona dejará de aparecer en el sistema. Esta acción no podrá deshacerse."
          pending={deletePending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

