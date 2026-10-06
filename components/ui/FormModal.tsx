"use client";

import { Modal } from "./Modal";

const XIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export interface FormModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export function FormModal({ title, description, onClose, footer, children, width = 460 }: FormModalProps) {
  return (
    <Modal onClose={onClose}>
      <div
        className="bg-white rounded-[20px] overflow-hidden"
        style={{ width, boxShadow: "0 32px 80px rgba(0,0,0,0.16)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-6">
          <div>
            <p className="text-[16px] font-bold text-[#1C002C] leading-tight">{title}</p>
            {description && (
              <p className="text-[12.5px] mt-1.5 leading-snug" style={{ color: "rgba(28,0,44,0.42)" }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer"
            style={{ color: "rgba(28,0,44,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {XIcon}
          </button>
        </div>

        {/* Body */}
        <div className="px-7 pb-8 space-y-5">
          {children}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex items-center justify-end gap-2.5">
          {footer}
        </div>
      </div>
    </Modal>
  );
}

export function FMCancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2 rounded-[9px] text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
      style={{ background: "rgba(28,0,44,0.05)", color: "rgba(28,0,44,0.6)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,0,44,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(28,0,44,0.05)"; }}
    >
      Cancelar
    </button>
  );
}

export function FMSubmitButton({
  onClick, disabled, children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2 rounded-[9px] text-[13px] font-semibold text-white transition-opacity duration-150 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
    >
      {children}
    </button>
  );
}
