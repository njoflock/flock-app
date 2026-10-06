"use client";

import { Modal } from "./Modal";

export interface ConfirmDestructiveModalProps {
  title: string;
  entityName: string;
  description?: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDestructiveModal({
  title,
  entityName,
  description = "Esta acción no podrá deshacerse.",
  confirmLabel = "Eliminar",
  pending = false,
  onConfirm,
  onClose,
}: ConfirmDestructiveModalProps) {
  return (
    <Modal onClose={onClose}>
      <div
        className="bg-white rounded-[20px] overflow-hidden"
        style={{
          width: 400,
          boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div className="px-7 pt-7 pb-6 space-y-5">

          {/* Icono + Título */}
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(220,38,38,0.08)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <p className="text-[17px] font-bold text-[#1C002C] leading-tight">{title}</p>
          </div>

          <div className="space-y-3">

            {/* Pregunta principal */}
            <p className="text-[14px] font-medium text-[#1C002C] leading-snug">
              ¿Querés eliminar{" "}
              <span className="font-semibold">&ldquo;{entityName}&rdquo;</span>?
            </p>

            {/* Descripción secundaria */}
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(28,0,44,0.45)" }}>
              {description}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div
          className="px-7 py-4 flex items-center justify-end gap-2.5"
          style={{ borderTop: "1px solid rgba(28,0,44,0.06)" }}
        >
          <button
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 rounded-[9px] text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
            style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="px-4 py-2 rounded-[9px] text-[13px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ background: "#dc2626" }}
          >
            {pending ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
