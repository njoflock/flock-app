export type EstadoPersonaDB = "activo" | "inactivo";
export type TipoPerfilDB   = "empleado" | "proveedor";

export interface PersonaDB {
  id: string;
  nombre: string;
  email: string;
  avatar: string | null;
  estado: EstadoPersonaDB;
  tipo_perfil: TipoPerfilDB;
  playbook: string | null;
  instancia: string | null;
  avance_instancia: number | null;
  horas_disponibles: number;
  sueldo: number | null;
  facturacion: number | null;
  costo_hora: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
