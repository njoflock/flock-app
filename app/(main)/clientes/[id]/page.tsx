import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteDetalle } from "@/components/clientes/ClienteDetalle";
import type { ClienteDB, ContactoClienteDB } from "@/lib/types/cliente";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: clienteRaw }, { data: contactosRaw }, { data: proyectosRaw }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id,nombre,logo,deleted_at,created_at,updated_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("contactos_cliente")
      .select("id,cliente_id,nombre,email,telefono,cargo,deleted_at,created_at,updated_at")
      .eq("cliente_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("proyectos")
      .select("id,nombre,estado,fecha_inicio,fecha_fin")
      .eq("cliente_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (!clienteRaw) notFound();

  type ProyectoRow = { id: string; nombre: string; estado: string; fecha_inicio: string | null; fecha_fin: string | null };
  const proyectos = (proyectosRaw ?? []) as ProyectoRow[];

  return (
    <ClienteDetalle
      cliente={clienteRaw as ClienteDB}
      contactos={(contactosRaw ?? []) as ContactoClienteDB[]}
      proyectos={proyectos}
    />
  );
}
