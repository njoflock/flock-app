import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ elevated, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
        elevated
          ? "bg-[var(--bg-elevated)] shadow-[var(--shadow-md)]"
          : "bg-[var(--bg-surface)] shadow-[var(--shadow-card)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
