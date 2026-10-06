import type {
  ProyectoDB, AsignacionDB, HoraDB, HitoDB, RiesgoDB, PersonaDB,
} from "@/lib/types/proyecto";
import type { Proyecto, Persona, MiembroEquipo, ControlHoras, Hito, Riesgo } from "@/lib/mock-proyectos";

const MES_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const SALUD_DB_TO_APP: Record<string, "verde" | "amarillo" | "rojo"> = {
  saludable: "verde",
  en_riesgo: "amarillo",
  critico:   "rojo",
};

export const SALUD_APP_TO_DB: Record<string, "saludable" | "en_riesgo" | "critico"> = {
  verde:    "saludable",
  amarillo: "en_riesgo",
  rojo:     "critico",
};

function getIniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function adaptPersona(p: PersonaDB | null | undefined, fallbackId: string): Persona {
  const nombre = p?.nombre ?? "Persona";
  return {
    id: p?.id ?? fallbackId,
    nombre,
    avatar: p?.avatar ?? null,
    iniciales: getIniciales(nombre),
    cargo: "",
  };
}

function buildControlHoras(
  horasDB: HoraDB[],
  asignaciones: AsignacionDB[],
  horasVendidasProyecto: number,
): ControlHoras {
  const horasVendidas  = horasVendidasProyecto || horasDB.reduce((s, h) => s + (h.horas_vendidas  ?? 0), 0);
  const horasConsumidas = horasDB.reduce((s, h) => s + (h.horas_consumidas ?? 0), 0);

  // Aggregate by month (all personas combined)
  const byMes = new Map<string, { mes: string; horasVendidas: number; horasConsumidas: number }>();
  for (const h of horasDB) {
    const key   = `${h.anio}-${String(h.mes).padStart(2, "0")}`;
    const label = MES_LABELS[(h.mes ?? 1) - 1] ?? `M${h.mes}`;
    if (!byMes.has(key)) byMes.set(key, { mes: label, horasVendidas: 0, horasConsumidas: 0 });
    const e = byMes.get(key)!;
    e.horasVendidas  += h.horas_vendidas  ?? 0;
    e.horasConsumidas += h.horas_consumidas ?? 0;
  }
  const consumoMensual = [...byMes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);

  // Aggregate by persona
  const personaMap    = new Map<string, PersonaDB>();
  const horasTotalesMap  = new Map<string, number>(); // persona_id → horas_vendidas de la asignacion
  const asignacionIdMap  = new Map<string, string>(); // persona_id → asignacion_id (first one)
  for (const a of asignaciones) {
    if (a.personas && a.persona_id) personaMap.set(a.persona_id, a.personas);
    if (a.persona_id) {
      horasTotalesMap.set(a.persona_id, (horasTotalesMap.get(a.persona_id) ?? 0) + (a.horas_vendidas ?? 0));
      if (!asignacionIdMap.has(a.persona_id)) asignacionIdMap.set(a.persona_id, a.id);
    }
  }

  const byPersona = new Map<string, { vendidas: number; consumidas: number; porMes: Map<string, { consumidas: number; vendidas: number; horaId: string | null; mesNum: number; anio: number }> }>();
  for (const h of horasDB) {
    const pid = h.persona_id;
    if (!pid) continue;
    if (!byPersona.has(pid)) byPersona.set(pid, { vendidas: 0, consumidas: 0, porMes: new Map() });
    const e = byPersona.get(pid)!;
    e.vendidas   += h.horas_vendidas   ?? 0;
    e.consumidas += h.horas_consumidas ?? 0;
    const key = `${h.anio}-${String(h.mes).padStart(2, "0")}`;
    const entry = e.porMes.get(key) ?? { consumidas: 0, vendidas: 0, horaId: h.id ?? null, mesNum: h.mes ?? 1, anio: h.anio ?? new Date().getFullYear() };
    entry.consumidas += h.horas_consumidas ?? 0;
    entry.vendidas   += h.horas_vendidas   ?? 0;
    e.porMes.set(key, entry);
  }

  const consumoPorPersona = [...byPersona.entries()].map(([pid, data]) => ({
    persona:              adaptPersona(personaMap.get(pid) ?? null, pid),
    asignacionId:         asignacionIdMap.get(pid) ?? "",
    horasVendidas:        data.vendidas,
    horasTotalesAsignadas: horasTotalesMap.get(pid) ?? data.vendidas,
    horasConsumidas:      data.consumidas,
    consumoPorMes: [...data.porMes.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, d]) => ({
        mes:             MES_LABELS[parseInt(key.split("-")[1]) - 1] ?? key,
        mesNum:          d.mesNum,
        anio:            d.anio,
        horasConsumidas: d.consumidas,
        horasVendidas:   d.vendidas,
        horaId:          d.horaId,
      })),
  }));

  return { horasVendidas, horasConsumidas, consumoMensual, consumoPorPersona };
}

export function adaptProyecto({
  p,
  asignaciones = [],
  horas = [],
  hitos = [],
  riesgos = [],
}: {
  p: ProyectoDB;
  asignaciones?: AsignacionDB[];
  horas?: HoraDB[];
  hitos?: HitoDB[];
  riesgos?: RiesgoDB[];
}): Proyecto {
  // Suma de horas_vendidas distribuidas por asignacion
  const horasDistribuidasMap = new Map<string, number>();
  for (const h of horas) {
    if (!h.asignacion_id) continue;
    horasDistribuidasMap.set(h.asignacion_id, (horasDistribuidasMap.get(h.asignacion_id) ?? 0) + (h.horas_vendidas ?? 0));
  }

  const equipo: MiembroEquipo[] = asignaciones.map(a => ({
    id: a.id,
    persona: adaptPersona(a.personas ?? null, a.persona_id),
    rol: a.rol ?? "",
    horasTotalesAsignadas: a.horas_vendidas ?? 0,
    horasDistribuidas: horasDistribuidasMap.get(a.id) ?? 0,
    activo: a.activo ?? true,
    fechaInicio: a.fecha_inicio ?? undefined,
    fechaFin:   a.fecha_fin   ?? null,
  }));

  const hitosAdapted: Hito[] = hitos.map(h => ({
    id:          h.id,
    nombre:      h.nombre,
    fecha:       h.fecha,
    descripcion: h.descripcion ?? "",
  }));

  const riesgosAdapted: Riesgo[] = riesgos.map(r => ({
    id:         r.id,
    riesgo:     r.descripcion,
    estado:     r.estado,
    impacto:    r.impacto,
    mitigacion: r.mitigacion ?? "",
  }));

  const hoy = new Date().toISOString().slice(0, 10);

  return {
    id:          p.id,
    nombre:      p.nombre,
    cliente:     p.clientes?.nombre ?? "Sin cliente",
    descripcion: p.descripcion ?? "",
    estado:      p.estado,
    semaforo:    SALUD_DB_TO_APP[p.salud ?? "saludable"] ?? "verde",
    salud:       SALUD_DB_TO_APP[p.salud ?? "saludable"] ?? "verde",
    saludMotivo: p.motivo_salud ?? "",
    fechaInicio: p.fecha_inicio ?? "",
    fechaFin:    p.fecha_fin ?? hoy,
    cmgEsperado: p.cmg_esperado ?? 0,
    cmgReal:     0,
    equipo,
    horas:  buildControlHoras(horas, asignaciones, p.horas_vendidas ?? 0),
    hitos:  hitosAdapted,
    riesgos: riesgosAdapted,
  };
}
