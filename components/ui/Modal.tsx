"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ onClose, children }: ModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const overlay = (
    <div
      className="fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center"
      style={{
        left: "var(--sidebar-w, 0px)",
        backdropFilter: "blur(4px)",
        background: "rgba(28,0,44,0.22)",
      }}
      onClick={onClose}
    >
      {/* Detiene la propagación para que el click dentro del modal no cierre */}
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
