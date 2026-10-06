interface SectionPlaceholderProps {
  section: string;
  description: string;
  icon: React.ReactNode;
}

export function SectionPlaceholder({
  section,
  description,
  icon,
}: SectionPlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-3.5rem)]">
      <div className="text-center space-y-4 max-w-xs">
        {/* Icono */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,81,2,0.08) 0%, rgba(127,7,197,0.08) 100%)",
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #FF5102, #7F07C5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {icon}
          </span>
        </div>

        {/* Texto */}
        <div className="space-y-1.5">
          <h2 className="text-[15px] font-semibold" style={{ color: "#1C002C" }}>
            {section}
          </h2>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "rgba(28,0,44,0.45)" }}
          >
            {description}
          </p>
        </div>

        {/* Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
          style={{
            background: "rgba(127,7,197,0.06)",
            color: "rgba(127,7,197,0.7)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#7F07C5", opacity: 0.5 }}
          />
          Próximamente
        </span>
      </div>
    </div>
  );
}
