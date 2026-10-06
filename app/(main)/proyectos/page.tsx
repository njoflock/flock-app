import { createClient } from "@/lib/supabase/server";
import { adaptProyecto } from "@/lib/adapters/proyecto";
import { ProyectosList } from "@/components/proyectos/ProyectosList";
import type { ProyectoDB, AsignacionDB, HoraDB } from "@/lib/types/proyecto";

export default async function ProyectosPage() {
  const sb = await createClient();

  const { data: proyectos } = await sb
    .from("proyectos")
    .select("*, clientes(nombre)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = (proyectos ?? []) as ProyectoDB[];
  const ids  = rows.map(p => p.id);

  const [{ data: horasAll }, { data: asignacionesAll }, { data: clientesRaw }] = await Promise.all([
    ids.length
      ? sb.from("horas").select("proyecto_id,horas_vendidas,horas_consumidas,persona_id,mes,anio").in("proyecto_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? sb.from("asignaciones").select("proyecto_id,persona_id,rol,fecha_inicio,fecha_fin,personas(id,nombre,avatar)").is("deleted_at", null).in("proyecto_id", ids)
      : Promise.resolve({ data: [] }),
    sb.from("clientes").select("id,nombre").is("deleted_at", null).order("nombre", { ascending: true }),
  ]);

  // Group by proyecto_id
  const horasByProyecto = new Map<string, HoraDB[]>();
  for (const h of (horasAll ?? []) as unknown as HoraDB[]) {
    if (!h.proyecto_id) continue;
    if (!horasByProyecto.has(h.proyecto_id)) horasByProyecto.set(h.proyecto_id, []);
    horasByProyecto.get(h.proyecto_id)!.push(h);
  }

  const asignacionesByProyecto = new Map<string, AsignacionDB[]>();
  for (const a of (asignacionesAll ?? []) as unknown as AsignacionDB[]) {
    if (!asignacionesByProyecto.has(a.proyecto_id)) asignacionesByProyecto.set(a.proyecto_id, []);
    asignacionesByProyecto.get(a.proyecto_id)!.push(a);
  }

  const proyectosAdaptados = rows.map(p =>
    adaptProyecto({
      p,
      horas:        horasByProyecto.get(p.id)        ?? [],
      asignaciones: asignacionesByProyecto.get(p.id) ?? [],
    })
  );

  const clientes = (clientesRaw ?? []) as { id: string; nombre: string }[];

  return <ProyectosList proyectos={proyectosAdaptados} clientes={clientes} />;
}
