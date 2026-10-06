"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Cliente ───────────────────────────────────────────────────────────────────

export async function crearCliente(nombre: string, logo: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .insert({ nombre: nombre.trim(), logo: logo?.trim() || null });
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function actualizarCliente(
  id: string,
  fields: Partial<{
    nombre: string;
    logo: string | null;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(fields)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}

export async function eliminarCliente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

// ── Contactos ─────────────────────────────────────────────────────────────────

export async function crearContacto(
  clienteId: string,
  data: {
    nombre?: string | null;
    email?: string | null;
    telefono?: string | null;
    cargo?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("contactos_cliente")
    .insert({ cliente_id: clienteId, ...data })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
  return row.id as string;
}

export async function actualizarContacto(
  clienteId: string,
  contactoId: string,
  fields: Partial<{
    nombre: string | null;
    email: string | null;
    telefono: string | null;
    cargo: string | null;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos_cliente")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", contactoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}

export async function eliminarContacto(clienteId: string, contactoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos_cliente")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contactoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}
