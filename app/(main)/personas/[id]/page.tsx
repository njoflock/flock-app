import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adaptPersona } from "@/lib/adapters/persona";
import { PersonaDetalle } from "@/components/personas/PersonaDetalle";
import type { PersonaDB } from "@/lib/types/persona";

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();

  const [{ data }, { data: asignaciones }] = await Promise.all([
    sb
      .from("personas")
      .select("id,nombre,email,avatar,estado,tipo_perfil,playbook,instancia,avance_instancia,horas_disponibles,sueldo,facturacion,costo_hora,created_at,updated_at,deleted_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    sb
      .from("asignaciones")
      .select("id,rol,horas_vendidas,fecha_inicio,fecha_fin,activo,proyectos(id,nombre,estado,clientes(nombre))")
      .eq("persona_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (!data) notFound();

  type AsignacionRow = {
    id: string;
    rol: string | null;
    horas_vendidas: number | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    activo: boolean;
    proyectos: { id: string; nombre: string; estado: string; clientes: { nombre: string } | null } | null;
  };

  const rows = (asignaciones ?? []) as unknown as AsignacionRow[];

  const horasAsignadas = rows
    .filter(a => a.activo)
    .reduce((sum, a) => sum + (a.horas_vendidas ?? 0), 0);

  const persona = adaptPersona(data as PersonaDB, horasAsignadas);

  const proyectosPersona = rows
    .filter(a => a.proyectos)
    .map(a => ({
      asignacionId:   a.id,
      proyectoId:     a.proyectos!.id,
      proyectoNombre: a.proyectos!.nombre,
      proyectoEstado: a.proyectos!.estado as "activo" | "finalizado",
      clienteNombre:  a.proyectos!.clientes?.nombre ?? "Sin cliente",
      rol:            a.rol ?? "",
      horasVendidas:  a.horas_vendidas ?? 0,
      fechaInicio:    a.fecha_inicio ?? undefined,
      fechaFin:       a.fecha_fin ?? null,
      activo:         a.activo,
    }));

  return <PersonaDetalle persona={persona} proyectos={proyectosPersona} />;
}
