import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adaptProyecto } from "@/lib/adapters/proyecto";
import { ProyectoDetalle } from "@/components/proyectos/ProyectoDetalle";
import type { ProyectoDB, AsignacionDB, HoraDB, HitoDB, RiesgoDB } from "@/lib/types/proyecto";

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();

  const { data: proyectoRaw } = await sb
    .from("proyectos")
    .select("*, clientes(nombre)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!proyectoRaw) notFound();

  const p = proyectoRaw as ProyectoDB;

  const [
    { data: asignacionesRaw },
    { data: horasRaw },
    { data: hitosRaw },
    { data: riesgosRaw },
  ] = await Promise.all([
    sb.from("asignaciones")
      .select("*, personas(id,nombre,email,avatar)")
      .eq("proyecto_id", id)
      .is("deleted_at", null),
    sb.from("horas")
      .select("*")
      .eq("proyecto_id", id)
      .order("anio").order("mes"),
    sb.from("hitos")
      .select("*")
      .eq("proyecto_id", id)
      .is("deleted_at", null)
      .order("fecha"),
    sb.from("riesgos")
      .select("*")
      .eq("proyecto_id", id)
      .is("deleted_at", null),
  ]);

  const { data: personasRaw } = await sb
    .from("personas")
    .select("id,nombre,avatar")
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  const personas = (personasRaw ?? []).map((p: { id: string; nombre: string; avatar: string | null }) => {
    const iniciales = p.nombre.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
    return { id: p.id, nombre: p.nombre, iniciales };
  });

  const proyecto = adaptProyecto({
    p,
    asignaciones: (asignacionesRaw ?? []) as AsignacionDB[],
    horas:        (horasRaw        ?? []) as HoraDB[],
    hitos:        (hitosRaw        ?? []) as HitoDB[],
    riesgos:      (riesgosRaw      ?? []) as RiesgoDB[],
  });

  return <ProyectoDetalle proyecto={proyecto} personas={personas} />;
}
