"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={[
            "h-10 px-3 rounded-[var(--radius-md)] text-sm",
            "bg-[var(--bg-surface)] text-[var(--text-primary)]",
            "border transition-colors duration-150",
            "placeholder:text-[var(--text-tertiary)]",
            error
              ? "border-red-400 focus:outline-2 focus:outline-red-400"
              : "border-[var(--border)] focus:outline-2 focus:outline-[#FF5102] focus:border-[#FF5102]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          ].join(" ")}
          {...props}
        />
        {(hint || error) && (
          <p className={`text-xs ${error ? "text-red-500" : "text-[var(--text-tertiary)]"}`}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
