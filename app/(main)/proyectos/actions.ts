"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { SALUD_APP_TO_DB } from "@/lib/adapters/proyecto";

// ── Proyecto ──────────────────────────────────────────────────────────────────

export async function actualizarProyecto(
  id: string,
  fields: {
    nombre?: string;
    descripcion?: string;
    estado?: "activo" | "finalizado";
    salud?: "verde" | "amarillo" | "rojo";
    motivo_salud?: string;
    fecha_fin?: string;
    horas_vendidas?: number;
    cmg_esperado?: number;
  },
) {
  const sb = await createClient();
  const { salud, ...rest } = fields;
  const dbFields = {
    ...rest,
    ...(salud ? { salud: SALUD_APP_TO_DB[salud] } : {}),
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb
    .from("proyectos")
    .update(dbFields)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
}

export async function crearProyecto(data: {
  nombre: string;
  cliente_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  cmg_esperado: number;
  horas_vendidas: number;
  descripcion?: string;
  estado?: "activo" | "finalizado";
}) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("proyectos")
    .insert({ ...data, estado: data.estado ?? "activo" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
  return row.id as string;
}

export async function eliminarProyecto(id: string) {
  const sb = createAdminClient();
  const { error } = await sb
    .from("proyectos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proyectos");
}

// ── Asignaciones ─────────────────────────────────────────────────────────────

export async function crearAsignacion(proyectoId: string, data: {
  persona_id: string;
  rol: string;
  horas_vendidas: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("asignaciones")
    .insert({ proyecto_id: proyectoId, activo: true, ...data })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
  return row.id as string;
}

export async function actualizarAsignacion(
  proyectoId: string,
  asignacionId: string,
  fields: {
    rol?: string;
    horas_vendidas?: number;
    activo?: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
  },
) {
  const sb = await createClient();
  const { error } = await sb
    .from("asignaciones")
    .update(fields)
    .eq("id", asignacionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function eliminarAsignacion(proyectoId: string, asignacionId: string) {
  const sb = await createClient();
  const { error } = await sb
    .from("asignaciones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", asignacionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

// ── Horas por asignación ─────────────────────────────────────────────────────

export async function getHorasAsignacion(asignacionId: string) {
  const sb = await createClient();
  const { data, error } = await sb
    .from("horas")
    .select("id,asignacion_id,mes,anio,horas_vendidas,horas_consumidas,created_at,updated_at")
    .eq("asignacion_id", asignacionId)
    .order("anio")
    .order("mes");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function crearHoraAsignacion(
  asignacionId: string,
  proyectoId: string,
  personaId: string,
  data: { mes: number; anio: number; horas_vendidas: number; horas_consumidas: number },
) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("horas")
    .insert({ asignacion_id: asignacionId, proyecto_id: proyectoId, persona_id: personaId, ...data })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
  return row.id as string;
}

export async function actualizarHoraAsignacion(
  horaId: string,
  proyectoId: string,
  data: { mes?: number; anio?: number; horas_vendidas?: number; horas_consumidas?: number },
) {
  const sb = await createClient();
  const { error } = await sb
    .from("horas")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", horaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function eliminarHoraAsignacion(horaId: string, proyectoId: string) {
  const sb = await createClient();
  const { error } = await sb.from("horas").delete().eq("id", horaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

// ── Hitos ─────────────────────────────────────────────────────────────────────

export async function crearHito(proyectoId: string, data: {
  nombre: string;
  fecha: string;
  descripcion?: string;
  estado?: "pendiente" | "en_curso" | "completado" | "retrasado";
}) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("hitos")
    .insert({ proyecto_id: proyectoId, ...data, estado: data.estado ?? "pendiente" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
  return row.id as string;
}

export async function actualizarHito(
  proyectoId: string,
  hitoId: string,
  fields: {
    nombre?: string;
    fecha?: string;
    descripcion?: string;
    estado?: "pendiente" | "en_curso" | "completado" | "retrasado";
  },
) {
  const sb = await createClient();
  const { error } = await sb
    .from("hitos")
    .update(fields)
    .eq("id", hitoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function eliminarHito(proyectoId: string, hitoId: string) {
  const sb = await createClient();
  const { error } = await sb
    .from("hitos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", hitoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

// ── Riesgos ───────────────────────────────────────────────────────────────────

export async function crearRiesgo(proyectoId: string, data: {
  descripcion: string;
  estado?: "abierto" | "mitigado";
  impacto?: "alto" | "medio" | "bajo";
  mitigacion?: string;
}) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("riesgos")
    .insert({
      proyecto_id: proyectoId,
      descripcion: data.descripcion,
      estado:      data.estado    ?? "abierto",
      impacto:     data.impacto   ?? "medio",
      mitigacion:  data.mitigacion ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
  return row.id as string;
}

export async function actualizarRiesgo(
  proyectoId: string,
  riesgoId: string,
  fields: {
    descripcion?: string;
    estado?: "abierto" | "mitigado";
    impacto?: "alto" | "medio" | "bajo";
    mitigacion?: string;
  },
) {
  const sb = await createClient();
  const { error } = await sb
    .from("riesgos")
    .update(fields)
    .eq("id", riesgoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}

export async function eliminarRiesgo(proyectoId: string, riesgoId: string) {
  const sb = await createClient();
  const { error } = await sb
    .from("riesgos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", riesgoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/proyectos/${proyectoId}`);
}
