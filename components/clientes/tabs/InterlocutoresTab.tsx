"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import type { ClienteDB, ContactoClienteDB } from "@/lib/types/cliente";
import { crearContacto, actualizarContacto, eliminarContacto } from "@/app/(main)/clientes/actions";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { ConfirmDestructiveModal } from "@/components/ui/ConfirmDestructiveModal";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

// ── Auto-save ─────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
    saving: { bg: "rgba(28,0,44,0.75)", icon: <Spinner />,    msg: "Guardando…" },
    saved:  { bg: "rgba(22,163,74,0.9)", icon: <CheckIcon />, msg: "Cambios guardados" },
    error:  { bg: "rgba(220,38,38,0.9)", icon: <ErrIcon />,   msg: "No fue posible guardar los cambios" },
  }[status];
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-[11px] text-[13px] font-medium text-white shadow-xl"
      style={{ background: cfg.bg, backdropFilter: "blur(8px)" }}>
      {cfg.icon}{cfg.msg}
    </div>
  );
}
function Spinner() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function ErrIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

// ── InterlocutoresTab ─────────────────────────────────────────────────────────

let nextTempId = -1;

export function InterlocutoresTab({
  cliente,
  contactos: initialContactos,
}: {
  cliente: ClienteDB;
  contactos: ContactoClienteDB[];
}) {
  const { status, save } = useAutoSave();
  const [contactos, setContactos] = useState<ContactoClienteDB[]>(initialContactos);
  const [showAdd, setShowAdd] = useState(false);

  function handleAddContacto(data: { nombre: string; email: string; telefono: string; cargo: string }) {
    const tempId = String(nextTempId--);
    const temp: ContactoClienteDB = {
      id: tempId,
      cliente_id: cliente.id,
      nombre:   data.nombre   || null,
      email:    data.email    || null,
      telefono: data.telefono || null,
      cargo:    data.cargo    || null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    setContactos(prev => [...prev, temp]);
    setShowAdd(false);
    save(async () => {
      const realId = await crearContacto(cliente.id, {
        nombre:   data.nombre   || null,
        email:    data.email    || null,
        telefono: data.telefono || null,
        cargo:    data.cargo    || null,
      });
      setContactos(prev => prev.map(c => c.id === tempId ? { ...c, id: realId } : c));
    });
  }

  function handleUpdateField(
    contactoId: string,
    fields: Partial<{ nombre: string | null; email: string | null; telefono: string | null; cargo: string | null }>
  ) {
    setContactos(prev => prev.map(c => c.id === contactoId ? { ...c, ...fields } : c));
    save(() => actualizarContacto(cliente.id, contactoId, fields));
  }

  function handleDelete(contactoId: string) {
    setContactos(prev => prev.filter(c => c.id !== contactoId));
    save(() => eliminarContacto(cliente.id, contactoId));
  }

  return (
    <>
      <SaveToast status={status} />

      <div className="pb-16 space-y-4">

        {/* Encabezado de sección */}
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-[#1C002C]">Contactos del cliente</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90 shrink-0"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)", boxShadow: "0 2px 10px rgba(255,81,2,0.18)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar contacto
          </button>
        </div>

        {/* InfoBanner compacto */}
        <InfoBanner title="Edición rápida" compact>
          Hacé clic sobre cualquier dato para editarlo directamente o utilizá el menú ⋮ para acceder a más acciones.
        </InfoBanner>

        {/* Lista de contactos */}
        {contactos.length === 0 ? (
          <div
            className="rounded-[12px] px-5 py-10 flex flex-col items-center text-center gap-3"
            style={{ border: "1px dashed rgba(28,0,44,0.1)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(127,7,197,0.07)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7F07C5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <p className="text-[13px] text-[rgba(28,0,44,0.35)]">Sin interlocutores registrados.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-[12.5px] font-semibold transition-colors duration-150 cursor-pointer"
              style={{ color: "#7F07C5" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              Agregar el primero
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contactos.map(contacto => (
              <ContactoCard
                key={contacto.id}
                contacto={contacto}
                onUpdateField={(fields) => handleUpdateField(contacto.id, fields)}
                onDelete={() => handleDelete(contacto.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddContactoModal
          onSave={handleAddContacto}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}

// ── ContactoCard ──────────────────────────────────────────────────────────────

function ContactoCard({
  contacto,
  onUpdateField,
  onDelete,
}: {
  contacto: ContactoClienteDB;
  onUpdateField: (fields: Partial<{ nombre: string | null; email: string | null; telefono: string | null; cargo: string | null }>) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const nombre   = contacto.nombre   ?? "";
  const email    = contacto.email    ?? "";
  const telefono = contacto.telefono ?? "";
  const cargo    = contacto.cargo    ?? "";

  const initials = nombre
    ? nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
    : "?";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div
        className="rounded-[12px] border bg-white px-5 py-4"
        style={{ borderColor: "rgba(28,0,44,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
          >
            {initials}
          </div>

          {/* Campos */}
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
            {/* Nombre */}
            <RowField
              value={nombre}
              onCommit={v => onUpdateField({ nombre: v || null })}
              placeholder="Nombre completo"
              bold
            />
            {/* Cargo */}
            <RowField
              value={cargo}
              onCommit={v => onUpdateField({ cargo: v || null })}
              placeholder="Cargo"
              muted
            />
            {/* Email */}
            <RowField
              value={email}
              onCommit={v => onUpdateField({ email: v || null })}
              placeholder="email@empresa.com"
              icon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              }
            />
            {/* Teléfono */}
            <RowField
              value={telefono}
              onCommit={v => onUpdateField({ telefono: v || null })}
              placeholder="+56 9 0000 0000"
              icon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              }
            />
          </div>

          {/* Menú ⋮ */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer"
              style={{ color: "rgba(28,0,44,0.35)", background: menuOpen ? "rgba(28,0,44,0.06)" : "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; }}
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
                style={{ background: "white", border: "1px solid rgba(28,0,44,0.09)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180 }}
              >
                <button
                  onClick={() => { setMenuOpen(false); setShowConfirm(true); }}
                  className="w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors duration-100 cursor-pointer"
                  style={{ color: "#dc2626" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  Eliminar contacto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDestructiveModal
          title="Eliminar contacto"
          entityName={nombre || "este contacto"}
          description="El contacto dejará de aparecer como interlocutor. Esta acción no podrá deshacerse."
          onConfirm={() => { setShowConfirm(false); onDelete(); }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ── AddContactoModal ──────────────────────────────────────────────────────────

function AddContactoModal({
  onSave,
  onClose,
}: {
  onSave: (data: { nombre: string; email: string; telefono: string; cargo: string }) => void;
  onClose: () => void;
}) {
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargo,    setCargo]    = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(() => {
      onSave({ nombre, email, telefono, cargo });
    });
  }

  return (
    <FormModal
      title="Nuevo contacto"
      description="Agregá un interlocutor del cliente."
      onClose={onClose}
      width={480}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={isPending} />
          <FMSubmitButton onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando…" : "Agregar contacto"}
          </FMSubmitButton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre">
          <input
            autoFocus
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre completo"
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
        <FormField label="Cargo" hint="Opcional">
          <input
            value={cargo}
            onChange={e => setCargo(e.target.value)}
            placeholder="Gerente de TI"
            className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
            style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
          />
        </FormField>
      </div>
      <FormField label="Email" hint="Opcional">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
      <FormField label="Teléfono" hint="Opcional">
        <input
          type="tel"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="+56 9 0000 0000"
          className="w-full text-[14px] text-[#1C002C] outline-none py-2 px-3 rounded-[8px]"
          style={{ border: "1px solid rgba(28,0,44,0.12)", background: "rgba(28,0,44,0.015)" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(127,7,197,0.4)"; e.currentTarget.style.background = "white"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(28,0,44,0.12)"; e.currentTarget.style.background = "rgba(28,0,44,0.015)"; }}
        />
      </FormField>
    </FormModal>
  );
}

// ── RowField ──────────────────────────────────────────────────────────────────

function RowField({
  value, onCommit, placeholder, bold, muted, icon,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  bold?: boolean;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft.trim());
  }

  const textClass = bold
    ? "text-[13.5px] font-semibold text-[#1C002C]"
    : muted
    ? "text-[12.5px] text-[rgba(28,0,44,0.5)]"
    : "text-[12.5px] text-[rgba(28,0,44,0.6)]";

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
          if (e.key === "Enter")  commit();
        }}
        placeholder={placeholder}
        className={`w-full bg-transparent outline-none ${textClass}`}
        style={{ borderBottom: "1.5px solid rgba(127,7,197,0.3)" }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`flex items-center gap-1.5 text-left w-full cursor-text transition-opacity duration-150 hover:opacity-70 ${textClass}`}
    >
      {icon && <span style={{ color: "rgba(28,0,44,0.28)", flexShrink: 0 }}>{icon}</span>}
      <span className="truncate">
        {value || <span className="text-[rgba(28,0,44,0.2)] italic font-normal">{placeholder}</span>}
      </span>
    </button>
  );
}

