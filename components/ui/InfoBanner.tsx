import React from "react";

export interface InfoBannerProps {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function InfoBanner({ title, children, compact = false }: InfoBannerProps) {
  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3.5 py-2 rounded-[9px]"
        style={{
          background: "rgba(127,7,197,0.04)",
          border: "1px solid rgba(127,7,197,0.09)",
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#7F07C5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="8"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
        </svg>
        <p className="text-[11.5px] leading-snug" style={{ color: "rgba(28,0,44,0.45)" }}>
          <span className="font-semibold" style={{ color: "#7F07C5" }}>{title}:</span>{" "}
          {children}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3.5 px-4 py-3.5 rounded-[12px]"
      style={{
        background: "rgba(127,7,197,0.04)",
        border: "1px solid rgba(127,7,197,0.1)",
      }}
    >
      <div
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-px"
        style={{ background: "rgba(127,7,197,0.09)" }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#7F07C5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="8"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
        </svg>
      </div>
      <div className="space-y-0.5">
        <p className="text-[12px] font-semibold" style={{ color: "#7F07C5" }}>
          {title}
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(28,0,44,0.5)" }}>
          {children}
        </p>
      </div>
    </div>
  );
}
