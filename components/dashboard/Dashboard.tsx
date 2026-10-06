"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROYECTOS } from "@/lib/mock-proyectos";
import { PERSONAS } from "@/lib/mock-personas";
import { CLIENTES } from "@/lib/mock-clientes";

// ── Paleta ────────────────────────────────────────────────────────────────────

const C = {
  verde:    "#16a34a",
  amarillo: "#ca8a04",
  rojo:     "#dc2626",
  alto:     "#dc2626",
  medio:    "#ca8a04",
  bajo:     "#7F07C5",
  violet:   "#7F07C5",
  orange:   "#FF5102",
  dark:     "#1C002C",
  muted:    "rgba(28,0,44,0.38)",
  faint:    "rgba(28,0,44,0.06)",
};

const SEMAFORO_LABEL: Record<string, string> = {
  verde: "En línea", amarillo: "Atención", rojo: "Crítico",
};

// ── Datos ─────────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-06-27");
const MS_DAY = 86400000;

function daysDiff(iso: string) {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / MS_DAY);
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────

const MES_IDX: Record<string, number> = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
};

function inferFechaInicio(p: (typeof PROYECTOS)[0]): Date {
  const primerMes = p.horas.consumoMensual[0]?.mes;
  if (!primerMes || MES_IDX[primerMes] === undefined) return new Date("2025-01-01");
  return new Date(2025, MES_IDX[primerMes], 1);
}

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Proyectos activos
const activos = PROYECTOS.filter(p => p.estado === "activo");

// Donut proyectos
const semaforoCounts = { verde: 0, amarillo: 0, rojo: 0 };
activos.forEach(p => { semaforoCounts[p.semaforo]++; });

// Consumo horas enriquecido
const horasData = activos
  .map(p => {
    const inicio   = inferFechaInicio(p);
    const fin      = new Date(p.fechaFin);
    const durTotal = fin.getTime() - inicio.getTime();
    const transcurrido = TODAY.getTime() - inicio.getTime();
    const pctEsperado  = durTotal > 0
      ? Math.min(100, Math.round((transcurrido / durTotal) * 100))
      : 100;
    const pctConsumido = p.horas.horasVendidas > 0
      ? Math.round((p.horas.horasConsumidas / p.horas.horasVendidas) * 100)
      : 0;
    return {
      id:           p.id,
      nombre:       p.nombre,
      fechaFin:     p.fechaFin,
      pctConsumido,
      pctEsperado,
      desvio:       pctConsumido - pctEsperado,
      vendidas:     p.horas.horasVendidas,
      consumidas:   p.horas.horasConsumidas,
    };
  })
  .sort((a, b) => b.desvio - a.desvio);

// Rentabilidad (todos los proyectos, ordenados por CMG real desc)
const CMG_UMBRAL  = 32;
const CMG_MAX_ESC = 50; // escala fija del eje X (%)
const rentabilidadData = PROYECTOS.map(p => {
  const estado =
    p.cmgReal >= p.cmgEsperado ? "ok" as const
    : p.cmgReal >= CMG_UMBRAL   ? "atencion" as const
    :                              "critico" as const;
  return {
    id:          p.id,
    nombre:      p.nombre,
    cmgEsperado: p.cmgEsperado,
    cmgReal:     p.cmgReal,
    estado,
  };
}).sort((a, b) => b.cmgReal - a.cmgReal);

// Histograma ocupación
const buckets = [
  { label: "0–25%",   min: 0,   max: 25,  personas: [] as typeof PERSONAS },
  { label: "26–50%",  min: 26,  max: 50,  personas: [] as typeof PERSONAS },
  { label: "51–75%",  min: 51,  max: 75,  personas: [] as typeof PERSONAS },
  { label: "76–100%", min: 76,  max: 100, personas: [] as typeof PERSONAS },
  { label: "+100%",   min: 101, max: 999, personas: [] as typeof PERSONAS },
];
PERSONAS.filter(p => p.estado === "activo").forEach(p => {
  const pct = p.horasDisponibles > 0
    ? Math.round((p.horasAsignadas / p.horasDisponibles) * 100)
    : 0;
  const b = buckets.find(b => pct >= b.min && pct <= b.max);
  b?.personas.push(p);
});

// Donut riesgos
const riesgosAbiertos = PROYECTOS.flatMap(p => p.riesgos.filter(r => r.estado === "abierto"));
const riesgosCounts = { alto: 0, medio: 0, bajo: 0 };
riesgosAbiertos.forEach(r => { riesgosCounts[r.impacto]++; });

// Barras hitos
const todosHitos = PROYECTOS.flatMap(p => p.hitos.map(h => ({ ...h, proyecto: p.nombre })));
const hitosBuckets = [
  { label: "Vencidos",       hitos: todosHitos.filter(h => daysDiff(h.fecha) < 0) },
  { label: "Esta semana",    hitos: todosHitos.filter(h => daysDiff(h.fecha) >= 0 && daysDiff(h.fecha) <= 7) },
  { label: "Próximos 30d",   hitos: todosHitos.filter(h => daysDiff(h.fecha) > 7 && daysDiff(h.fecha) <= 30) },
  { label: "Más adelante",   hitos: todosHitos.filter(h => daysDiff(h.fecha) > 30) },
];

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1C002C] tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-[rgba(28,0,44,0.42)] mt-0.5">Visión general de la operación</p>
        </div>
        <p className="text-[12px] text-[rgba(28,0,44,0.3)]">
          {TODAY.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── 2×2 grid ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* ── 1. Estado de Proyectos (top-left) ── */}
        <Card title="Estado de Proyectos" subtitle={`${activos.length} proyectos activos`}>
          <div className="flex items-center gap-8">
            <DonutChart
              segments={[
                { value: semaforoCounts.verde,    color: C.verde,    label: SEMAFORO_LABEL.verde },
                { value: semaforoCounts.amarillo, color: C.amarillo, label: SEMAFORO_LABEL.amarillo },
                { value: semaforoCounts.rojo,     color: C.rojo,     label: SEMAFORO_LABEL.rojo },
              ]}
              onSegmentClick={i => router.push("/proyectos")}
              size={140}
            />
            <div className="space-y-3 flex-1">
              {[
                { key: "verde",    color: C.verde,    label: SEMAFORO_LABEL.verde },
                { key: "amarillo", color: C.amarillo, label: SEMAFORO_LABEL.amarillo },
                { key: "rojo",     color: C.rojo,     label: SEMAFORO_LABEL.rojo },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => router.push("/proyectos")}
                  className="flex items-center justify-between w-full group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[13px] text-[rgba(28,0,44,0.65)] group-hover:text-[#7F07C5] transition-colors duration-150">{s.label}</span>
                  </div>
                  <span className="text-[20px] font-bold text-[#1C002C]">{semaforoCounts[s.key as keyof typeof semaforoCounts]}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── 2. Rentabilidad (top-right) ── */}
        <Card title="Rentabilidad" subtitle="CMG real vs. esperado por proyecto">
          <RentabilidadChart data={rentabilidadData} onRowClick={id => router.push(`/proyectos/${id}`)} />
        </Card>

        {/* ── 3. Consumo de Horas (bottom-left) ── */}
        <Card title="Consumo de Horas" subtitle="Proyectos activos">
          <div className="space-y-5">
            {activos.map((p, i) => (
              <TimelineRow
                key={p.id}
                proyecto={p}
                last={i === activos.length - 1}
                onClick={() => router.push(`/proyectos/${p.id}`)}
              />
            ))}
          </div>
        </Card>

        {/* ── 4. Ocupación del Equipo (bottom-right) ── */}
        <Card title="Ocupación del Equipo" subtitle={`${PERSONAS.filter(p => p.estado === "activo").length} personas activas`}>
          <OcupacionHistogram buckets={buckets} onBucketClick={b => router.push("/personas")} />
        </Card>

      </div>
    </div>
  );
}

// ── Rentabilidad ──────────────────────────────────────────────────────────────

const CMG_COLOR = { ok: C.verde, atencion: C.amarillo, critico: C.rojo };
const CMG_BG    = {
  ok:       "rgba(22,163,74,0.10)",
  atencion: "rgba(202,138,4,0.10)",
  critico:  "rgba(220,38,38,0.10)",
};
const CMG_LABEL = { ok: "OK", atencion: "Atención", critico: "Crítico" };

type CmgEstado = "ok" | "atencion" | "critico";

interface RentabilidadRow {
  id: string;
  nombre: string;
  cmgEsperado: number;
  cmgReal: number;
  estado: CmgEstado;
}

function RentabilidadChart({
  data,
  onRowClick,
}: {
  data: RentabilidadRow[];
  onRowClick: (id: string) => void;
}) {
  const SCALE = CMG_MAX_ESC; // eje X va de 0 a 50%

  return (
    <div className="space-y-0">
      {data.map((row, i) => {
        const last       = i === data.length - 1;
        const color      = CMG_COLOR[row.estado];
        const bg         = CMG_BG[row.estado];
        const label      = CMG_LABEL[row.estado];
        const pctReal    = Math.min(100, (row.cmgReal    / SCALE) * 100);
        const pctEsp     = Math.min(100, (row.cmgEsperado / SCALE) * 100);

        return (
          <button
            key={row.id}
            onClick={() => onRowClick(row.id)}
            className="w-full text-left group cursor-pointer flex items-center"
            style={{
              gap: 6,
              paddingTop:    i === 0 ? 0 : 10,
              paddingBottom: last    ? 0 : 10,
              borderBottom:  last ? "none" : "1px solid rgba(28,0,44,0.05)",
            }}
          >
            {/* Nombre 22% */}
            <p
              className="text-[11.5px] font-semibold text-[#1C002C] group-hover:text-[#7F07C5] transition-colors duration-150 truncate"
              style={{ flex: "0 0 22%", minWidth: 0 }}
              title={row.nombre}
            >
              {row.nombre}
            </p>

            {/* Barra comparativa 44% */}
            <div
              className="relative overflow-hidden"
              style={{ flex: "0 0 44%", minWidth: 0, height: 22 }}
            >
              {/* Track: eje de referencia completo */}
              <div
                className="absolute inset-x-0"
                style={{
                  top: "50%", transform: "translateY(-50%)",
                  height: 2, background: "rgba(28,0,44,0.08)", borderRadius: 1,
                }}
              />
              {/* Barra CMG real */}
              <div
                className="absolute"
                style={{
                  top: "50%", transform: "translateY(-50%)",
                  left: 0, width: `${pctReal}%`, height: 8,
                  background: color, opacity: 0.85,
                  borderRadius: "0 4px 4px 0",
                }}
              />
              {/* Marca de referencia: CMG esperado */}
              <div
                className="absolute"
                style={{
                  top: "50%", transform: "translate(-50%, -50%)",
                  left: `${pctEsp}%`,
                  width: 2, height: 18,
                  background: C.dark, opacity: 0.30,
                  borderRadius: 1,
                }}
              />
            </div>

            {/* CMG real / esperado 22% */}
            <p
              className="text-right"
              style={{ flex: "0 0 22%", minWidth: 0, fontSize: 11 }}
            >
              <span className="font-bold text-[#1C002C]">{row.cmgReal}%</span>
              <span className="text-[rgba(28,0,44,0.38)]"> / {row.cmgEsperado}%</span>
            </p>

            {/* Badge estado 12% */}
            <div
              className="flex justify-end"
              style={{ flex: "0 0 12%", minWidth: 0 }}
            >
              <span
                title={label}
                className="inline-flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: bg }}
              >
                <span className="rounded-full" style={{ width: 7, height: 7, background: color }} />
              </span>
            </div>
          </button>
        );
      })}

      {/* Leyenda de referencia */}
      <div
        className="flex items-center gap-3 pt-3 mt-1"
        style={{ borderTop: "1px solid rgba(28,0,44,0.05)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 6, background: "rgba(28,0,44,0.50)", opacity: 0.4 }} />
          <span className="text-[10px] text-[rgba(28,0,44,0.38)]">CMG esperado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded-sm" style={{ width: 12, height: 6, background: C.verde, opacity: 0.85 }} />
          <span className="text-[10px] text-[rgba(28,0,44,0.38)]">CMG real</span>
        </div>
      </div>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] border bg-white p-6 space-y-5"
      style={{ borderColor: "rgba(28,0,44,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div>
        <p className="text-[14.5px] font-bold text-[#1C002C]">{title}</p>
        {subtitle && <p className="text-[11.5px] text-[rgba(28,0,44,0.38)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────

interface DonutSegment { value: number; color: string; label: string; }

function DonutChart({ segments, onSegmentClick, size = 140 }: {
  segments: DonutSegment[];
  onSegmentClick: (i: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const r = 42;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const GAP = 2;

  let offset = -circ / 4; // start at top

  const arcs = segments.map((seg, i) => {
    const len   = (seg.value / total) * (circ - GAP * segments.length);
    const dash  = `${Math.max(len, 0)} ${circ}`;
    const off   = -offset;
    offset     -= len + GAP;
    return { ...seg, dash, off: -offset - len - GAP, origOff: off, index: i };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {total === 1 && segments.every(s => s.value === 0) ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(28,0,44,0.08)" strokeWidth={10} />
        ) : (
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === i ? 13 : 10}
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.origOff}
              strokeLinecap="round"
              style={{ cursor: "pointer", transition: "stroke-width 150ms, opacity 150ms", opacity: hovered !== null && hovered !== i ? 0.45 : 1 }}
              onClick={() => onSegmentClick(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))
        )}
        {/* Centro */}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: C.dark }}>{total === 1 && segments.every(s => s.value === 0) ? "0" : segments.reduce((s, seg) => s + seg.value, 0)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fill: C.muted, letterSpacing: 0.5 }}>TOTAL</text>
      </svg>
      {hovered !== null && (
        <div
          className="pointer-events-none absolute px-2.5 py-1.5 rounded-[8px] text-[11.5px] font-medium text-white whitespace-nowrap z-10"
          style={{ background: arcs[hovered].color, bottom: -32, left: "50%", transform: "translateX(-50%)" }}
        >
          {arcs[hovered].label}: {arcs[hovered].value}
        </div>
      )}
    </div>
  );
}

// ── OcupacionHistogram ────────────────────────────────────────────────────────

function OcupacionHistogram({
  buckets, onBucketClick,
}: {
  buckets: { label: string; personas: typeof PERSONAS }[];
  onBucketClick: (b: { label: string; personas: typeof PERSONAS }) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...buckets.map(b => b.personas.length), 1);

  const barColors = [C.verde, "#4ade80", C.amarillo, C.orange, C.rojo];

  return (
    <div className="space-y-4">
      {/* Barras verticales */}
      <div className="flex items-end gap-3 h-[120px]">
        {buckets.map((b, i) => {
          const pct = b.personas.length / max;
          return (
            <button
              key={b.label}
              onClick={() => onBucketClick(b)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex-1 flex flex-col items-center justify-end cursor-pointer"
              style={{ height: "100%" }}
            >
              <span className="text-[12px] font-bold mb-1" style={{ color: barColors[i], opacity: hovered !== null && hovered !== i ? 0.4 : 1 }}>
                {b.personas.length}
              </span>
              <div
                className="w-full rounded-t-[6px] transition-all duration-300"
                style={{
                  height: `${Math.max(pct * 100, b.personas.length > 0 ? 8 : 4)}%`,
                  background: barColors[i],
                  opacity: hovered !== null && hovered !== i ? 0.35 : 1,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-3">
        {buckets.map((b, i) => (
          <button
            key={b.label}
            onClick={() => onBucketClick(b)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="flex-1 text-center cursor-pointer"
          >
            <span
              className="text-[10.5px] font-medium transition-colors duration-150"
              style={{ color: hovered === i ? "#7F07C5" : "rgba(28,0,44,0.38)" }}
            >
              {b.label}
            </span>
          </button>
        ))}
      </div>

      {/* Detalle hover */}
      {hovered !== null && buckets[hovered].personas.length > 0 && (
        <div
          className="rounded-[10px] px-3.5 py-2.5 space-y-1"
          style={{ background: "rgba(28,0,44,0.03)", border: "1px solid rgba(28,0,44,0.07)" }}
        >
          <p className="text-[10.5px] font-semibold text-[rgba(28,0,44,0.4)]">{buckets[hovered].label}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {buckets[hovered].personas.map(p => (
              <span key={p.id} className="text-[12px] text-[rgba(28,0,44,0.65)]">{p.nombre}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TimelineRow ───────────────────────────────────────────────────────────────

const SEM_COLOR: Record<string, string> = {
  verde:    "#16a34a",
  amarillo: "#ca8a04",
  rojo:     "#dc2626",
};
const SEM_LABEL: Record<string, string> = {
  verde:    "Según planificación",
  amarillo: "Sobre planificación",
  rojo:     "Fuera de planificación",
};
const SEM_BG: Record<string, string> = {
  verde:    "rgba(22,163,74,0.10)",
  amarillo: "rgba(202,138,4,0.10)",
  rojo:     "rgba(220,38,38,0.10)",
};
// Texto abreviado que cabe en la píldora compacta
const SEM_SHORT: Record<string, string> = {
  verde:    "En plan.",
  amarillo: "Sobre",
  rojo:     "Fuera",
};

function TimelineRow({
  proyecto, last, onClick,
}: {
  proyecto: (typeof PROYECTOS)[0];
  last: boolean;
  onClick: () => void;
}) {
  const inicio     = inferFechaInicio(proyecto);
  const fin        = new Date(proyecto.fechaFin);
  const durTotal   = fin.getTime() - inicio.getTime();
  const elapsed    = TODAY.getTime() - inicio.getTime();
  const pctHoy     = durTotal > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / durTotal) * 100))) : 100;
  const pctConsumo = proyecto.horas.horasVendidas > 0
    ? Math.min(100, Math.round((proyecto.horas.horasConsumidas / proyecto.horas.horasVendidas) * 100))
    : 0;

  const sem   = proyecto.semaforo as keyof typeof SEM_COLOR;
  const color = SEM_COLOR[sem] ?? SEM_COLOR.verde;
  const label = SEM_LABEL[sem] ?? SEM_LABEL.verde;   // texto completo → tooltip
  const short = SEM_SHORT[sem] ?? SEM_SHORT.verde;
  const bg    = SEM_BG[sem]   ?? SEM_BG.verde;

  const [yy, mm, dd] = proyecto.fechaFin.split("-");
  const fechaFin = `${dd}/${mm}/${yy.slice(2)}`;

  // Widths are % of the row so the layout scales at any card size
  return (
    <button
      onClick={onClick}
      className="w-full text-left group cursor-pointer flex items-center"
      style={{
        gap: 6,
        paddingBottom: last ? 0 : 11,
        borderBottom:  last ? "none" : "1px solid rgba(28,0,44,0.05)",
      }}
    >
      {/* ① Nombre: 22% */}
      <p
        className="text-[11.5px] font-semibold text-[#1C002C] group-hover:text-[#7F07C5] transition-colors duration-150 truncate"
        style={{ flex: "0 0 22%", minWidth: 0 }}
        title={proyecto.nombre}
      >
        {proyecto.nombre}
      </p>

      {/* ② Timeline: 46% — elemento protagonista */}
      <div
        className="relative overflow-hidden"
        style={{ flex: "0 0 46%", minWidth: 0, height: 22 }}
      >
        {/* Track (línea de tiempo completa, fina) */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "50%", transform: "translateY(-50%)",
            height: 2, background: "rgba(28,0,44,0.10)", borderRadius: 1,
          }}
        />
        {/* Barra de consumo (gruesa, sobre el track) */}
        <div
          className="absolute"
          style={{
            top: "50%", transform: "translateY(-50%)",
            left: 0, width: `${pctConsumo}%`, height: 8,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: "0 4px 4px 0",
          }}
        />
        {/* Marcador HOY */}
        {pctHoy > 3 && pctHoy < 97 && (
          <div
            className="absolute inset-y-0"
            style={{ left: `${pctHoy}%`, width: 1.5, background: "rgba(28,0,44,0.45)", transform: "translateX(-50%)" }}
          />
        )}
      </div>

      {/* ③ Horas: 22% */}
      <p
        className="text-right truncate"
        style={{ flex: "0 0 22%", minWidth: 0, fontSize: 11 }}
      >
        <span className="font-bold text-[#1C002C]">{proyecto.horas.horasConsumidas}</span>
        <span className="text-[rgba(28,0,44,0.40)]"> / {proyecto.horas.horasVendidas} h</span>
      </p>

      {/* ④ Estado: 10% — punto de color con tooltip */}
      <div style={{ flex: "0 0 10%", minWidth: 0 }} className="flex justify-end">
        <span
          title={label}
          className="inline-flex items-center justify-center rounded-full"
          style={{ width: 20, height: 20, background: bg }}
        >
          <span className="rounded-full" style={{ width: 7, height: 7, background: color }} />
        </span>
      </div>
    </button>
  );
}

// ── HitosBarras ───────────────────────────────────────────────────────────────

function HitosBarras({
  buckets, onBucketClick,
}: {
  buckets: { label: string; hitos: { nombre: string; fecha: string; proyecto: string }[] }[];
  onBucketClick: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...buckets.map(b => b.hitos.length), 1);

  const barColors = [C.rojo, C.amarillo, C.orange, C.violet];

  return (
    <div className="space-y-2.5">
      {buckets.map((b, i) => (
        <button
          key={b.label}
          onClick={onBucketClick}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className="w-full cursor-pointer space-y-1 text-left"
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11.5px] font-medium transition-colors duration-150"
              style={{ color: hovered === i ? "#7F07C5" : "rgba(28,0,44,0.6)" }}
            >
              {b.label}
            </span>
            <span className="text-[13px] font-bold" style={{ color: barColors[i] }}>{b.hitos.length}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(28,0,44,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(b.hitos.length / max) * 100}%`,
                background: barColors[i],
                opacity: hovered !== null && hovered !== i ? 0.35 : 1,
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
