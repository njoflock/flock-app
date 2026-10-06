import { signInWithEmail } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── Columna izquierda ── */}
      <div className="hidden hidden md:flex md:w-1/2 relative overflow-hidden flex-col">
        {/* Gradiente base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #7F07C5 0%, #44016B 45%, #FF5102 100%)",
          }}
        />

        {/* Patrón de puntos sutiles */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Orbes decorativos */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #FF5102, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #ffffff, transparent 70%)",
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 8C6 6.89543 6.89543 6 8 6H14C15.1046 6 16 6.89543 16 8V14C16 15.1046 15.1046 16 14 16H8C6.89543 16 6 15.1046 6 14V8Z"
                  fill="white"
                />
                <path
                  d="M18 8C18 6.89543 18.8954 6 20 6H24C25.1046 6 26 6.89543 26 8V12C26 13.1046 25.1046 14 24 14H20C18.8954 14 18 13.1046 18 12V8Z"
                  fill="white"
                  fillOpacity="0.7"
                />
                <path
                  d="M6 20C6 18.8954 6.89543 18 8 18H12C13.1046 18 14 18.8954 14 20V24C14 25.1046 13.1046 26 12 26H8C6.89543 26 6 25.1046 6 24V20Z"
                  fill="white"
                  fillOpacity="0.7"
                />
                <path
                  d="M18 18C18 16.8954 18.8954 16 20 16H24C25.1046 16 26 16.8954 26 18V26C26 27.1046 25.1046 28 24 28H20C18.8954 28 18 27.1046 18 26V18Z"
                  fill="white"
                  fillOpacity="0.5"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">
              Flock
            </span>
          </div>

          {/* Mensaje central */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 w-fit"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5102]" />
              Trabajo colaborativo reimaginado
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Proyectos que{" "}
              <span style={{ color: "#FFB38A" }}>avanzan</span>
              {" "}juntos.
            </h1>

            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              Gestiona proyectos, coordina equipos y toma decisiones con
              claridad. Todo en un solo lugar, diseñado para moverse rápido.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { value: "10×", label: "más rápido" },
                { value: "100%", label: "en la nube" },
                { value: "∞", label: "colaboradores" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            © 2026 Flock. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ── Columna derecha ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-xl gradient-brand" />
            <span className="font-semibold text-[var(--text-primary)] text-lg">Flock</span>
          </div>

          {/* Encabezado */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#1C002C] tracking-tight">
              Bienvenido
            </h2>
            <p className="text-sm text-[#6B5B7B] leading-relaxed">
              Ingresá tu email y contraseña para continuar.
            </p>
          </div>

          {/* Error */}
          <ErrorBanner searchParams={searchParams} />

          {/* Formulario email + contraseña */}
          <form action={signInWithEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#9B8AAD]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@empresa.com"
                className="w-full h-11 px-4 rounded-[10px] border border-[rgba(127,7,197,0.15)] bg-white text-[#1C002C] text-sm outline-none transition-all duration-150 placeholder:text-[#C4B8D0] focus:border-[rgba(127,7,197,0.45)] focus:shadow-[0_0_0_3px_rgba(127,7,197,0.08)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#9B8AAD]">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-[10px] border border-[rgba(127,7,197,0.15)] bg-white text-[#1C002C] text-sm outline-none transition-all duration-150 placeholder:text-[#C4B8D0] focus:border-[rgba(127,7,197,0.45)] focus:shadow-[0_0_0_3px_rgba(127,7,197,0.08)]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-[10px] text-white text-sm font-semibold transition-opacity duration-150 hover:opacity-90 active:scale-[0.99] cursor-pointer"
              style={{ background: "linear-gradient(135deg,#FF5102 0%,#7F07C5 100%)" }}
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

async function ErrorBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  const messages: Record<string, string> = {
    auth_failed: "No se pudo completar la autenticación. Intenta nuevamente.",
    oauth_failed: "Error al conectar con Microsoft. Intenta más tarde.",
  };

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-[10px] bg-red-50 border border-red-100">
      <svg
        className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <div>
        <p className="text-xs text-red-600">
          {messages[params.error] ?? "Ocurrió un error inesperado."}
        </p>
        {params.msg && (
          <p className="text-[10.5px] text-red-400 mt-1 font-mono">{params.msg}</p>
        )}
      </div>
    </div>
  );
}
