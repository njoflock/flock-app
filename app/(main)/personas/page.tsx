import { createClient } from "@/lib/supabase/server";
import { adaptPersona } from "@/lib/adapters/persona";
import { PersonasList } from "@/components/personas/PersonasList";
import type { PersonaDB } from "@/lib/types/persona";

export default async function PersonasPage() {
  const sb = await createClient();

  const now   = new Date();
  const mes   = now.getMonth() + 1; // 1–12
  const anio  = now.getFullYear();

  const [{ data }, { data: asignacionesRaw }, { data: horasMes }] = await Promise.all([
    sb
      .from("personas")
      .select("id,nombre,email,avatar,estado,tipo_perfil,playbook,instancia,avance_instancia,horas_disponibles,sueldo,facturacion,costo_hora,created_at,updated_at,deleted_at")
      .is("deleted_at", null)
      .order("nombre", { ascending: true }),
    sb
      .from("asignaciones")
      .select("id,persona_id")
      .is("deleted_at", null)
      .eq("activo", true),
    sb
      .from("horas")
      .select("persona_id,asignacion_id,horas_vendidas")
      .eq("mes", mes)
      .eq("anio", anio),
  ]);

  // IDs de asignaciones activas (para filtrar las horas del mes)
  const asignacionesActivas = new Set(
    (asignacionesRaw ?? []).map((a: { id: string }) => a.id)
  );

  // Suma de horas_vendidas del mes en curso, solo de asignaciones activas
  const horasPorPersona = new Map<string, number>();
  for (const h of (horasMes ?? []) as { persona_id: string | null; asignacion_id: string | null; horas_vendidas: number }[]) {
    if (!h.persona_id || !h.asignacion_id) continue;
    if (!asignacionesActivas.has(h.asignacion_id)) continue;
    horasPorPersona.set(h.persona_id, (horasPorPersona.get(h.persona_id) ?? 0) + (h.horas_vendidas ?? 0));
  }

  const personas = (data ?? [] as PersonaDB[]).map(p =>
    adaptPersona(p as PersonaDB, horasPorPersona.get(p.id) ?? 0)
  );

  return <PersonasList personas={personas} />;
}
