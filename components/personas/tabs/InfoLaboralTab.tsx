"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type PersonaCompleta, type InfoLaboral } from "@/lib/mock-personas";
import { actualizarPersona } from "@/app/(main)/personas/actions";

function fmt(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useCallback((fn: () => Promise<void>) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    fn()
      .then(() => {
        setStatus("saved");
        timer.current = setTimeout(() => setStatus("idle"), 2500);
      })
      .catch(() => {
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

function parseAmount(s: string): number {
  const raw = s.trim().replace(/\s/g, "");
  const lastComma = raw.lastIndexOf(",");
  const lastDot   = raw.lastIndexOf(".");
  const normalized = lastComma > lastDot
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/,/g, "");
  return parseFloat(normalized) || 0;
}

function RadioGroup({ value, onChange }: {
  value: "empleado" | "proveedor";
  onChange: (v: "empleado" | "proveedor") => void;
}) {
  return (
    <div className="flex items-center gap-8">
      {(["empleado", "proveedor"] as const).map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className="flex items-center gap-2.5 cursor-pointer"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              border: active ? "none" : "1.5px solid rgba(28,0,44,0.22)",
              background: active ? "#7F07C5" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              boxShadow: active ? "0 0 0 3px rgba(127,7,197,0.12)" : "none",
            }}>
              {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: active ? 500 : 400,
              color: active ? "#1C002C" : "rgba(28,0,44,0.45)",
              userSelect: "none",
            }}>
              {opt === "empleado" ? "Empleado Flock" : "Proveedor"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AmountField({ label, optional, hint, value, onCommit }: {
  label: string;
  optional?: boolean;
  hint?: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value === 0 ? "" : fmt(value));

  useEffect(() => { if (!focused) setDraft(value === 0 ? "" : fmt(value)); }, [value, focused]);

  function commit() {
    setFocused(false);
    const n = parseAmount(draft);
    onCommit(n);
    setDraft(n === 0 ? "" : fmt(n));
  }

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.7)", marginBottom: 8 }}>
        {label}
        {optional && <span style={{ marginLeft: 6, fontWeight: 400, color: "rgba(28,0,44,0.35)", fontSize: 11 }}>opcional</span>}
      </p>
      <div
        className="flex items-center gap-2 rounded-[9px] px-3.5 py-3"
        style={{
          border: focused ? "1px solid rgba(127,7,197,0.45)" : "1px solid rgba(28,0,44,0.22)",
          boxShadow: focused ? "0 0 0 3px rgba(127,7,197,0.08)" : "none",
          background: "white",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span style={{ fontSize: 14, color: "rgba(28,0,44,0.35)", userSelect: "none" }}>$</span>
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          placeholder="0"
          onFocus={() => { setFocused(true); setDraft(value === 0 ? "" : String(value)); }}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="flex-1 min-w-0 bg-transparent outline-none border-none"
          style={{ fontSize: 15, color: "#1C002C" }}
        />
        {hint && <span style={{ fontSize: 12, color: "rgba(28,0,44,0.3)", userSelect: "none", flexShrink: 0 }}>{hint}</span>}
      </div>
    </div>
  );
}

const SECTION = { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(28,0,44,0.38)", marginBottom: 18 };
function Divider() {
  return <div style={{ margin: "32px 0", height: 1, background: "rgba(28,0,44,0.08)" }} />;
}

export function InfoLaboralTab({ persona }: { persona: PersonaCompleta }) {
  const { status, save } = useAutoSave();
  const [info, setInfo] = useState<InfoLaboral>(persona.infoLaboral);

  const tipo = info.tipo;

  const costoMensual = tipo === "empleado"
    ? info.sueldoMensual * 1.5 + (info.facturacionMensual ?? 0)
    : info.tarifaHora * persona.horasDisponibles;

  const costoHora = persona.horasDisponibles > 0
    ? Math.floor((costoMensual / persona.horasDisponibles) * 100) / 100
    : 0;

  function update(next: InfoLaboral) {
    setInfo(next);
    if (next.tipo === "empleado") {
      save(() => actualizarPersona(persona.id, {
        tipo_perfil: "empleado",
        sueldo: next.sueldoMensual,
        facturacion: next.facturacionMensual,
        costo_hora: null,
      }));
    } else {
      save(() => actualizarPersona(persona.id, {
        tipo_perfil: "proveedor",
        costo_hora: next.tarifaHora,
        sueldo: null,
        facturacion: null,
      }));
    }
  }

  function switchTipo(t: "empleado" | "proveedor") {
    if (t === tipo) return;
    const next: InfoLaboral = t === "empleado"
      ? { tipo: "empleado", sueldoMensual: 0, facturacionMensual: null, horasEstandar: persona.horasDisponibles }
      : { tipo: "proveedor", tarifaHora: 0, horasEstandar: persona.horasDisponibles };
    update(next);
  }

  return (
    <>
      <SaveToast status={status} />
      <div className="w-full pb-16">

        {/* Tipo de perfil */}
        <p style={SECTION}>Tipo de perfil</p>
        <RadioGroup value={tipo} onChange={switchTipo} />

        <Divider />

        {/* Remuneración */}
        <p style={SECTION}>Remuneración</p>

        {/* Última novedad — solo empleados */}
        {tipo === "empleado" && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded-[7px] mb-4"
            style={{ background: "rgba(255,81,2,0.07)", border: "1px solid rgba(255,81,2,0.13)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5102" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(28,0,44,0.5)", whiteSpace: "nowrap" }}>Mes última novedad</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1C002C" }}>may.-26</span>
            <span style={{ width: 1, height: 12, background: "rgba(28,0,44,0.12)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(28,0,44,0.5)", whiteSpace: "nowrap" }}>% Actualización</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1C002C" }}>12,33%</span>
            <span style={{ width: 1, height: 12, background: "rgba(28,0,44,0.12)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(28,0,44,0.5)", whiteSpace: "nowrap" }}>Motivo</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1C002C" }}>Ajuste por IPC</span>
          </div>
        )}

        {tipo === "empleado" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <AmountField
              label="Sueldo mensual"
              hint="ARS"
              value={info.sueldoMensual}
              onCommit={v => update({ ...info, sueldoMensual: v })}
            />
            <AmountField
              label="Facturación mensual"
              optional
              hint="ARS"
              value={info.facturacionMensual ?? 0}
              onCommit={v => update({ ...info, facturacionMensual: v || null })}
            />
          </div>
        ) : (
          <AmountField
            label="Tarifa por hora"
            hint="ARS / h"
            value={info.tarifaHora}
            onCommit={v => update({ ...info, tarifaHora: v })}
          />
        )}

        <Divider />

        {/* Costos calculados */}
        <p style={SECTION}>Costos calculados</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Costo mensual",  value: costoMensual },
            { label: "Costo por hora", value: costoHora },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,0,44,0.65)", marginBottom: 8 }}>{item.label}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#1C002C" }}>
                $ {fmt(item.value)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
