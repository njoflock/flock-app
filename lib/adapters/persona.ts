import type { PersonaDB } from "@/lib/types/persona";
import type { PersonaCompleta, InfoLaboral } from "@/lib/mock-personas";

function getIniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

export function adaptPersona(p: PersonaDB, horasAsignadas = 0): PersonaCompleta {
  const infoLaboral: InfoLaboral = p.tipo_perfil === "empleado"
    ? {
        tipo: "empleado",
        sueldoMensual: p.sueldo ?? 0,
        facturacionMensual: p.facturacion ?? null,
        horasEstandar: p.horas_disponibles,
      }
    : {
        tipo: "proveedor",
        tarifaHora: p.costo_hora ?? 0,
        horasEstandar: p.horas_disponibles,
      };

  return {
    id:               p.id,
    nombre:           p.nombre,
    email:            p.email,
    foto:             p.avatar,
    iniciales:        getIniciales(p.nombre),
    rol:              "",
    estado:           p.estado,
    playbook:         p.playbook  ?? "",
    instancia:        p.instancia ?? "",
    avanceInstancia:  p.avance_instancia ?? 0,
    horasDisponibles: p.horas_disponibles,
    horasAsignadas,
    infoLaboral,
  };
}
