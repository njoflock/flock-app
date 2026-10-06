"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClienteDB } from "@/lib/types/cliente";
import { actualizarCliente, eliminarCliente } from "@/app/(main)/clientes/actions";
import { ConfirmDestructiveModal } from "@/components/ui/ConfirmDestructiveModal";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

const PROYECTO_ESTADO_CFG = {
  activo:     { color: "#7F07C5", bg: "rgba(127,7,197,0.07)", border: "rgba(127,7,197,0.15)", label: "Activo" },
  finalizado: { color: "#6b7280", bg: "rgba(107,114,128,0.07)", border: "rgba(107,114,128,0.12)", label: "Finalizado" },
};

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── ResumenTab ────────────────────────────────────────────────────────────────

type ProyectoRow = { id: string; nombre: string; estado: string; fecha_inicio: string | null; fecha_fin: string | null };

export function ResumenTab({ cliente, proyectos = [] }: { cliente: ClienteDB; proyectos?: ProyectoRow[] }) {
  const router = useRouter();
  const { status, save } = useAutoSave();

  // Estado local del cliente (se actualiza al guardar desde el modal)
  const [nombre, setNombre] = useState(cliente.nombre);
  const [logo,   setLogo]   = useState(cliente.logo ?? "");

  // Acciones menu
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePending, startDelete] = useTransition();
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
      await eliminarCliente(cliente.id);
      router.push("/clientes");
      router.refresh();
    });
  }

  function handleSaveEdit(nuevoNombre: string, nuevoLogo: string) {
    const fields: Parameters<typeof actualizarCliente>[1] = {
      nombre: nuevoNombre,
      logo: nuevoLogo || null,
    };
    setNombre(nuevoNombre);
    setLogo(nuevoLogo);
    save(() => actualizarCliente(cliente.id, fields));
  }

  return (
    <>
      <SaveToast status={status} />
      <div className="pb-12 space-y-7">

        {/* ── Hero ── */}
        <div className="flex items-center gap-6">

          {/* Logo */}
          <div
            className="shrink-0 w-[80px] h-[80px] rounded-[18px] flex items-center justify-center overflow-hidden"
            style={{
              background: "white",
              border: "1px solid rgba(28,0,44,0.07)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={nombre} className="w-14 h-14 object-contain" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-[22px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
              >
                {nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Nombre + badge + proyectos */}
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-[26px] font-bold text-[#1C002C] tracking-tight leading-tight truncate">
              {nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
                style={{ background: "rgba(127,7,197,0.08)", color: "#7F07C5", border: "1px solid rgba(127,7,197,0.18)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#7F07C5" }} />
                Activo
              </span>
              <span style={{ color: "rgba(28,0,44,0.15)" }}>·</span>
              <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "rgba(28,0,44,0.4)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.28)" }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""} asociado{proyectos.length !== 1 ? "s" : ""}
              </span>
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
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.15s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1.5 rounded-[12px] bg-white overflow-hidden z-50"
                style={{
                  minWidth: 190,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(28,0,44,0.07)",
                }}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-left transition-colors duration-100 cursor-pointer"
                  style={{ color: "#1C002C" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { setMenuOpen(false); setShowEdit(true); }}
                >
                  <span style={{ fontSize: 14 }}>✏️</span>
                  <span className="font-medium">Editar cliente</span>
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
                  <span className="font-medium">Eliminar cliente</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Proyectos asociados ── */}
        <div
          className="rounded-[16px] bg-white overflow-hidden"
          style={{ border: "1px solid rgba(28,0,44,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(28,0,44,0.3)" }}>
              Proyectos asociados
            </p>
          </div>

          {proyectos.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(28,0,44,0.04)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.25)" }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-[13.5px] font-medium" style={{ color: "rgba(28,0,44,0.45)" }}>Sin proyectos asociados</p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(28,0,44,0.3)" }}>La asociación se gestiona desde el módulo Proyectos.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(28,0,44,0.06)" }}>
                  <th className="text-left px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(28,0,44,0.38)" }}>Proyecto</th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(28,0,44,0.38)" }}>Fecha inicio</th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(28,0,44,0.38)" }}>Fecha fin</th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(28,0,44,0.38)" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map((p, i) => {
                  const est  = PROYECTO_ESTADO_CFG[p.estado as keyof typeof PROYECTO_ESTADO_CFG] ?? PROYECTO_ESTADO_CFG.finalizado;
                  const last = i === proyectos.length - 1;
                  const fi   = p.fecha_inicio?.split("-");
                  const ff   = p.fecha_fin?.split("-");
                  return (
                    <tr key={p.id} style={{ borderBottom: last ? "none" : "1px solid rgba(28,0,44,0.04)" }}>
                      <td className="px-6 py-3.5">
                        <Link href={`/proyectos/${p.id}`}
                          className="text-[13px] font-semibold text-[#1C002C] hover:text-[#7F07C5] transition-colors duration-150 flex items-center gap-1.5 group/link">
                          {p.nombre}
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="opacity-0 group-hover/link:opacity-100 transition-opacity duration-150" style={{ color: "#7F07C5" }}>
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px]" style={{ color: "rgba(28,0,44,0.5)" }}>
                          {fi ? `${fi[2]}/${fi[1]}/${fi[0]}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px]" style={{ color: "rgba(28,0,44,0.5)" }}>
                          {ff ? `${ff[2]}/${ff[1]}/${ff[0]}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
                          style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}` }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: est.color }} />
                          {est.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="px-6 py-3.5 flex items-center justify-end"
            style={{ borderTop: "1px solid rgba(28,0,44,0.05)", background: "#fafafa" }}>
            <Link href="/proyectos"
              className="flex items-center gap-1.5 text-[12.5px] font-medium transition-colors duration-150"
              style={{ color: "rgba(127,7,197,0.6)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}>
              Ver en Proyectos
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal editar ── */}
      {showEdit && (
        <EditClienteModal
          nombre={nombre}
          logo={logo}
          onSave={(n, l) => { handleSaveEdit(n, l); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* ── Modal eliminar ── */}
      {showDelete && (
        <ConfirmDestructiveModal
          title="Eliminar cliente"
          entityName={nombre}
          description="El cliente dejará de aparecer en el sistema. Esta acción no podrá deshacerse."
          pending={deletePending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

// ── EditClienteModal ──────────────────────────────────────────────────────────

function EditClienteModal({ nombre: initialNombre, logo: initialLogo, onSave, onClose }: {
  nombre: string; logo: string;
  onSave: (nombre: string, logo: string) => void;
  onClose: () => void;
}) {
  const [nombre,  setNombre]  = useState(initialNombre);
  const [logo,    setLogo]    = useState(initialLogo);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (!nombre.trim()) return;
    startTransition(() => { onSave(nombre.trim(), logo.trim()); });
  }

  return (
    <FormModal
      title="Editar cliente"
      description="Modificá el nombre o el logo del cliente."
      onClose={onClose}
      width={440}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={pending} />
          <FMSubmitButton onClick={handleSave} disabled={!nombre.trim() || pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre del cliente">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
          placeholder="Ingresá el nombre del cliente"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
      <FormField label="Logo (URL)" hint="Opcional" helper="Ingresá la URL pública del logo del cliente.">
        <input
          value={logo}
          onChange={e => setLogo(e.target.value)}
          placeholder="https://empresa.com/logo.png"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
    </FormModal>
  );
}
