"use client";

import Link from "next/link";
import React from "react";

export interface EntityCardIndicator {
  icon: React.ReactNode;
  label: string;
}

export interface EntityCardProps {
  href: string;
  logoUrl?: string | null;
  avatarInitials: string;
  name: string;
  badge?: React.ReactNode;
  indicators: EntityCardIndicator[];
}

export function EntityCard({
  href, logoUrl, avatarInitials, name, badge, indicators,
}: EntityCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 rounded-[16px] border bg-white px-6 py-5 transition-all duration-200"
      style={{
        borderColor: "rgba(28,0,44,0.07)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(127,7,197,0.18)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(127,7,197,0.1), 0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(28,0,44,0.07)";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Logo / Avatar */}
      <div
        className="shrink-0 w-[56px] h-[56px] rounded-[13px] overflow-hidden flex items-center justify-center"
        style={{
          background: "white",
          border: "1px solid rgba(28,0,44,0.07)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="w-9 h-9 object-contain" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[14px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#FF5102,#7F07C5)" }}
          >
            {avatarInitials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="text-[15.5px] font-bold text-[#1C002C] truncate leading-tight">{name}</p>
        {badge}
        {indicators.length > 0 && (
          <div className="flex items-center flex-wrap">
            {indicators.map((ind, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span className="mx-2 select-none" style={{ color: "rgba(28,0,44,0.15)", fontSize: 12 }}>|</span>
                )}
                <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(28,0,44,0.45)" }}>
                  {ind.icon}
                  {ind.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Chevron */}
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: "rgba(28,0,44,0.18)" }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
