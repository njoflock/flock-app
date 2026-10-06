"use client";

export interface FormFieldProps {
  label: string;
  hint?: string;
  helper?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, helper, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12.5px] font-semibold text-[#1C002C]">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal" style={{ color: "rgba(28,0,44,0.38)" }}>
            · {hint}
          </span>
        )}
      </p>
      {children}
      {helper && (
        <p className="text-[11.5px] leading-snug" style={{ color: "rgba(28,0,44,0.4)" }}>
          {helper}
        </p>
      )}
    </div>
  );
}
