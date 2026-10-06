import { createClient } from "@/lib/supabase/server";
import { ClientesList } from "@/components/clientes/ClientesList";
import type { ClienteDB } from "@/lib/types/cliente";

export default async function ClientesPage() {
  const supabase = await createClient();

  const [{ data: clientesRaw }, { data: contactosRaw }, { data: proyectosRaw }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id,nombre,logo,deleted_at,created_at,updated_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("contactos_cliente")
      .select("cliente_id")
      .is("deleted_at", null),
    supabase
      .from("proyectos")
      .select("cliente_id,estado")
      .is("deleted_at", null),
  ]);

  const contactosPorCliente: Record<string, number> = {};
  for (const c of contactosRaw ?? []) {
    contactosPorCliente[c.cliente_id] = (contactosPorCliente[c.cliente_id] ?? 0) + 1;
  }

  const proyectosPorCliente: Record<string, { total: number; activos: number }> = {};
  for (const p of proyectosRaw ?? []) {
    if (!proyectosPorCliente[p.cliente_id]) proyectosPorCliente[p.cliente_id] = { total: 0, activos: 0 };
    proyectosPorCliente[p.cliente_id].total += 1;
    if (p.estado === "activo") proyectosPorCliente[p.cliente_id].activos += 1;
  }

  return (
    <ClientesList
      clientes={(clientesRaw ?? []) as ClienteDB[]}
      contactosPorCliente={contactosPorCliente}
      proyectosPorCliente={proyectosPorCliente}
    />
  );
}
