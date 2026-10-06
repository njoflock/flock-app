"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearPersona(data: {
  nombre: string;
  email: string;
  tipo_perfil: "empleado" | "proveedor";
  horas_disponibles: number;
  playbook?: string | null;
  instancia?: string | null;
  avance_instancia?: number;
}) {
  const sb = await createClient();
  const { data: row, error } = await sb
    .from("personas")
    .insert({ ...data, estado: "activo" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/personas");
  return row.id as string;
}

export async function actualizarPersona(
  id: string,
  fields: Partial<{
    nombre: string;
    email: string;
    estado: "activo" | "inactivo";
    tipo_perfil: "empleado" | "proveedor";
    playbook: string | null;
    instancia: string | null;
    avance_instancia: number;
    horas_disponibles: number;
    sueldo: number | null;
    facturacion: number | null;
    costo_hora: number | null;
  }>
) {
  const sb = await createClient();
  const { error } = await sb
    .from("personas")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/personas");
  revalidatePath(`/personas/${id}`);
}

export async function eliminarPersona(id: string) {
  const sb = await createClient();
  const { error } = await sb
    .from("personas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/personas");
}
