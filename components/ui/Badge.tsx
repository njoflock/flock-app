import { HTMLAttributes } from "react";

type BadgeVariant = "brand" | "muted" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  brand:   "gradient-brand text-white",
  muted:   "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function Badge({ variant = "muted", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-full)]",
        "text-xs font-semibold tracking-wide",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
