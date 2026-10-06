"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClienteDB } from "@/lib/types/cliente";
import { crearCliente } from "@/app/(main)/clientes/actions";
import { EntityCard } from "@/components/ui/EntityCard";
import { FormModal, FMCancelButton, FMSubmitButton } from "@/components/ui/FormModal";
import { FormField } from "@/components/ui/FormField";

export function ClientesList({ clientes: initial, contactosPorCliente = {}, proyectosPorCliente = {} }: { clientes: ClienteDB[]; contactosPorCliente?: Record<string, number>; proyectosPorCliente?: Record<string, { total: number; activos: number }> }) {
  const router   = useRouter();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return initial;
    const q = search.toLowerCase();
    return initial.filter(c => c.nombre.toLowerCase().includes(q));
  }, [initial, search]);

  async function handleAdd(nombre: string, logo: string | null) {
    await crearCliente(nombre, logo);
    setShowAdd(false);
    router.refresh();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1C002C] tracking-tight">Clientes</h1>
          <p className="text-[13px] text-[rgba(28,0,44,0.42)] mt-0.5">
            {initial.length} cliente{initial.length !== 1 ? "s" : ""} activo{initial.length !== 1 ? "s" : ""}
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
          Agregar cliente
        </button>
      </div>

      {/* ── Búsqueda ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[9px]"
          style={{ border: "1px solid rgba(28,0,44,0.1)", background: "rgba(28,0,44,0.015)", minWidth: 165 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente…"
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
      </div>

      {/* ── Grilla ── */}
      {clientesFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientesFiltrados.map(c => <ClienteCard key={c.id} cliente={c} numContactos={contactosPorCliente[c.id] ?? 0} proyectos={proyectosPorCliente[c.id] ?? { total: 0, activos: 0 }} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] font-medium text-[rgba(28,0,44,0.4)]">
            {search ? "No hay clientes que coincidan con la búsqueda." : "Aún no hay clientes registrados."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-[12.5px] font-medium cursor-pointer transition-colors duration-150"
              style={{ color: "rgba(127,7,197,0.6)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7F07C5"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(127,7,197,0.6)"; }}
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {showAdd && (
        <AddClienteModal onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

// ── ClienteCard ───────────────────────────────────────────────────────────────

const IconFolder = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)", flexShrink: 0 }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconPeople = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(28,0,44,0.3)", flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

function ClienteCard({ cliente, numContactos, proyectos }: { cliente: ClienteDB; numContactos: number; proyectos: { total: number; activos: number } }) {
  const { total, activos } = proyectos;

  const proyLabel = activos > 0
    ? `${activos} proyecto${activos !== 1 ? "s" : ""} activo${activos !== 1 ? "s" : ""}`
    : total > 0
    ? `${total} proyecto${total !== 1 ? "s" : ""}`
    : "Sin proyectos";

  const contactLabel = numContactos > 0
    ? `${numContactos} contacto${numContactos !== 1 ? "s" : ""}`
    : "Sin contactos";

  const badge = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold w-fit"
      style={{ background: "rgba(127,7,197,0.07)", color: "#7F07C5" }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#7F07C5" }} />
      Activo
    </span>
  );

  return (
    <EntityCard
      href={`/clientes/${cliente.id}`}
      logoUrl={cliente.logo}
      avatarInitials={cliente.nombre.slice(0, 2).toUpperCase()}
      name={cliente.nombre}
      badge={badge}
      indicators={[
        { icon: IconFolder, label: proyLabel },
        { icon: IconPeople, label: contactLabel },
      ]}
    />
  );
}

// ── AddClienteModal ───────────────────────────────────────────────────────────

function AddClienteModal({
  onSave, onClose,
}: {
  onSave: (nombre: string, logo: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre,  setNombre]  = useState("");
  const [logo,    setLogo]    = useState("");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (!nombre.trim()) return;
    startTransition(async () => {
      await onSave(nombre.trim(), logo.trim() || null);
    });
  }

  return (
    <FormModal
      title="Nuevo cliente"
      description="Completá la información para crear un nuevo cliente."
      onClose={onClose}
      width={420}
      footer={
        <>
          <FMCancelButton onClick={onClose} disabled={pending} />
          <FMSubmitButton onClick={handleSave} disabled={!nombre.trim() || pending}>
            {pending ? "Creando…" : "Crear cliente"}
          </FMSubmitButton>
        </>
      }
    >
      <FormField label="Nombre del cliente">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ingresá el nombre del cliente"
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
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
