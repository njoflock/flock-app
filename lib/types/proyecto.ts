export type SaludDB = "saludable" | "en_riesgo" | "critico";
export type EstadoProyectoDB = "activo" | "finalizado";
export type EstadoRiesgoDB = "abierto" | "mitigado";
export type ImpactoDB = "alto" | "medio" | "bajo";
export type EstadoHitoDB = "pendiente" | "en_curso" | "completado" | "retrasado";

export interface ProyectoDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyectoDB;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cliente_id: string | null;
  cmg_esperado: number | null;
  horas_vendidas: number | null;
  salud: SaludDB | null;
  motivo_salud: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
  clientes?: { nombre: string } | null;
}

export interface PersonaDB {
  id: string;
  nombre: string;
  email: string | null;
  avatar: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface AsignacionDB {
  id: string;
  proyecto_id: string;
  persona_id: string;
  rol: string | null;
  horas_vendidas: number;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  deleted_at: string | null;
  created_at: string;
  personas?: PersonaDB | null;
}

export interface HoraDB {
  id: string;
  proyecto_id: string | null;
  persona_id: string | null;
  asignacion_id: string | null;
  mes: number;
  anio: number;
  horas_vendidas: number;
  horas_consumidas: number;
  created_at: string;
  updated_at: string | null;
}

export interface HitoDB {
  id: string;
  proyecto_id: string;
  nombre: string;
  fecha: string;
  descripcion: string | null;
  estado: EstadoHitoDB | null;
  deleted_at: string | null;
  created_at: string;
}

export interface RiesgoDB {
  id: string;
  proyecto_id: string;
  descripcion: string;
  estado: EstadoRiesgoDB;
  impacto: ImpactoDB;
  mitigacion: string | null;
  deleted_at: string | null;
  created_at: string;
}
