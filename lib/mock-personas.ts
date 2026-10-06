export type EstadoPersona = "activo" | "inactivo";

export interface InfoLaboralEmpleado {
  tipo: "empleado";
  sueldoMensual: number;
  facturacionMensual: number | null;
  horasEstandar: number;
}

export interface InfoLaboralProveedor {
  tipo: "proveedor";
  tarifaHora: number;
  horasEstandar: number;
}

export type InfoLaboral = InfoLaboralEmpleado | InfoLaboralProveedor;

export interface PersonaCompleta {
  id: string;
  nombre: string;
  email: string;
  foto: string | null;
  iniciales: string;
  rol: string;
  estado: EstadoPersona;
  playbook: string;        // Ej: "Desarrollo", "UX/UI", "QA"
  instancia: string;       // Ej: "Instancia 3"
  avanceInstancia: number; // 0–100
  horasDisponibles: number; // por mes
  horasAsignadas: number;   // por mes
  infoLaboral: InfoLaboral;
}

export const PERSONAS: PersonaCompleta[] = [
  {
    id: "p1",
    nombre: "Roberto Kim",
    email: "roberto.kim@flock.app",
    foto: null,
    iniciales: "RK",
    rol: "Tech Lead",
    estado: "activo",
    playbook: "Liderazgo Técnico",
    instancia: "Instancia 4",
    avanceInstancia: 60,
    horasDisponibles: 160,
    horasAsignadas: 144,
    infoLaboral: {
      tipo: "empleado",
      sueldoMensual: 3200000,
      facturacionMensual: 960000,
      horasEstandar: 160,
    },
  },
  {
    id: "p2",
    nombre: "Ana García",
    email: "ana.garcia@flock.app",
    foto: null,
    iniciales: "AG",
    rol: "Diseñadora UX/UI",
    estado: "activo",
    playbook: "UX/UI",
    instancia: "Instancia 5",
    avanceInstancia: 80,
    horasDisponibles: 120,
    horasAsignadas: 90,
    infoLaboral: {
      tipo: "empleado",
      sueldoMensual: 1900000,
      facturacionMensual: 570000,
      horasEstandar: 160,
    },
  },
  {
    id: "p3",
    nombre: "Carlos Méndez",
    email: "carlos.mendez@flock.app",
    foto: null,
    iniciales: "CM",
    rol: "Desarrollador Full Stack",
    estado: "activo",
    playbook: "Desarrollo",
    instancia: "Instancia 3",
    avanceInstancia: 55,
    horasDisponibles: 160,
    horasAsignadas: 128,
    infoLaboral: {
      tipo: "empleado",
      sueldoMensual: 1500000,
      facturacionMensual: 450000,
      horasEstandar: 160,
    },
  },
  {
    id: "p4",
    nombre: "Marta Fernández",
    email: "marta.fernandez@flock.app",
    foto: null,
    iniciales: "MF",
    rol: "Project Manager",
    estado: "activo",
    playbook: "Project Management",
    instancia: "Instancia 4",
    avanceInstancia: 40,
    horasDisponibles: 140,
    horasAsignadas: 112,
    infoLaboral: {
      tipo: "empleado",
      sueldoMensual: 2100000,
      facturacionMensual: 630000,
      horasEstandar: 160,
    },
  },
  {
    id: "p5",
    nombre: "Laura Sánchez",
    email: "laura.sanchez@flock.app",
    foto: null,
    iniciales: "LS",
    rol: "QA Engineer",
    estado: "activo",
    playbook: "QA",
    instancia: "Instancia 2",
    avanceInstancia: 70,
    horasDisponibles: 160,
    horasAsignadas: 80,
    infoLaboral: {
      tipo: "empleado",
      sueldoMensual: 900000,
      facturacionMensual: null,
      horasEstandar: 160,
    },
  },
  {
    id: "p6",
    nombre: "Diego Pinto",
    email: "diego.pinto@flock.app",
    foto: null,
    iniciales: "DP",
    rol: "Desarrollador Backend",
    estado: "activo",
    playbook: "Desarrollo",
    instancia: "Instancia 3",
    avanceInstancia: 90,
    horasDisponibles: 160,
    horasAsignadas: 160,
    infoLaboral: {
      tipo: "proveedor",
      tarifaHora: 12000,
      horasEstandar: 160,
    },
  },
  {
    id: "p7",
    nombre: "Sofía Torres",
    email: "sofia.torres@flock.app",
    foto: null,
    iniciales: "ST",
    rol: "Diseñadora UX/UI",
    estado: "inactivo",
    playbook: "UX/UI",
    instancia: "Instancia 2",
    avanceInstancia: 30,
    horasDisponibles: 120,
    horasAsignadas: 0,
    infoLaboral: {
      tipo: "proveedor",
      tarifaHora: 7500,
      horasEstandar: 120,
    },
  },
];

export function getPersona(id: string): PersonaCompleta | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export const ROLES_DISPONIBLES = [
  "Tech Lead",
  "Diseñadora UX/UI",
  "Desarrollador Full Stack",
  "Project Manager",
  "QA Engineer",
  "Desarrollador Backend",
];

export const PLAYBOOKS_DISPONIBLES = [
  "QA Analyst",
  "Software Architect",
  "Software Engineer",
  "Team Manager",
  "UX/UI Designer",
  "Functional Analyst",
];

export const INSTANCIAS_DISPONIBLES = [
  "Instancia 1", "Instancia 2", "Instancia 3",
  "Instancia 4", "Instancia 5", "Instancia 6",
];
