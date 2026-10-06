export type Semaforo = "verde" | "amarillo" | "rojo";
export type Salud = "verde" | "amarillo" | "rojo";
export type EstadoProyecto = "activo" | "finalizado";
export type EstadoRiesgo = "abierto" | "mitigado";
export type Impacto = "alto" | "medio" | "bajo";

export interface Persona {
  id: string;
  nombre: string;
  avatar: string | null;
  iniciales: string;
  cargo: string;
}

export interface MiembroEquipo {
  id: string; // asignacion id
  persona: Persona;
  rol: string;
  horasTotalesAsignadas: number;
  horasDistribuidas: number; // suma de horas_vendidas en tabla horas para esta asignacion
  activo: boolean;
  fechaInicio?: string;
  fechaFin?: string | null;
}

export interface ConsumoMensual {
  mes: string; // "Ene", "Feb", ...
  horasVendidas: number;
  horasConsumidas: number;
}

export interface ConsumoPersona {
  persona: Persona;
  asignacionId: string;
  horasVendidas: number;        // suma de horas_vendidas de la distribución
  horasTotalesAsignadas: number; // horas_vendidas de la asignacion (total del contrato)
  horasConsumidas: number;
  consumoPorMes: { mes: string; mesNum: number; anio: number; horasConsumidas: number; horasVendidas: number; horaId: string | null }[];
}

export interface ControlHoras {
  horasVendidas: number;
  horasConsumidas: number;
  consumoMensual: ConsumoMensual[];
  consumoPorPersona: ConsumoPersona[];
}

export interface Hito {
  id: string;
  nombre: string;
  fecha: string;
  descripcion: string;
}

export interface Riesgo {
  id: string;
  riesgo: string;
  estado: EstadoRiesgo;
  impacto: Impacto;
  mitigacion: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  descripcion: string;
  estado: EstadoProyecto;
  semaforo: Semaforo;
  salud: Salud;
  saludMotivo: string;
  fechaInicio: string;
  fechaFin: string;
  cmgEsperado: number; // % margen de contribución esperado
  cmgReal: number;     // % margen de contribución real
  equipo: MiembroEquipo[];
  horas: ControlHoras;
  hitos: Hito[];
  riesgos: Riesgo[];
}

// ── Personas ──────────────────────────────────────────────────────────────────
const PERSONAS: Record<string, Persona> = {
  ana: { id: "1", nombre: "Ana García", avatar: null, iniciales: "AG", cargo: "Project Manager" },
  carlos: { id: "2", nombre: "Carlos Mendoza", avatar: null, iniciales: "CM", cargo: "Tech Lead" },
  sofia: { id: "3", nombre: "Sofía Torres", avatar: null, iniciales: "ST", cargo: "Diseñadora UX" },
  miguel: { id: "4", nombre: "Miguel López", avatar: null, iniciales: "ML", cargo: "Desarrollador" },
  laura: { id: "5", nombre: "Laura Sánchez", avatar: null, iniciales: "LS", cargo: "QA Engineer" },
  pedro: { id: "6", nombre: "Pedro Ramírez", avatar: null, iniciales: "PR", cargo: "Desarrollador" },
};

// ── Proyectos ─────────────────────────────────────────────────────────────────
export const PROYECTOS: Proyecto[] = [
  {
    id: "alpha",
    nombre: "Portal de Gestión Interna",
    cliente: "Banco Nacional",
    descripcion: "Desarrollo de un portal centralizado para la gestión de operaciones internas del área de tecnología. Incluye módulos de seguimiento de activos, reportes automatizados e integración con sistemas legacy.",
    estado: "activo",
    semaforo: "verde",
    salud: "verde",
    saludMotivo: "El proyecto avanza dentro del cronograma. Las integraciones con los sistemas del cliente están siendo completadas según lo previsto y el equipo mantiene un ritmo de entrega consistente.",
    cmgEsperado: 36,
    cmgReal: 41,
    fechaInicio: "2025-03-01",
    fechaFin: "2025-09-30",
    equipo: [
      { id: "m1", activo: true, persona: PERSONAS.ana, rol: "Project Manager", horasTotalesAsignadas: 80, horasDistribuidas: 0, fechaInicio: "2025-03-01", fechaFin: null },
      { id: "m2", activo: true, persona: PERSONAS.carlos, rol: "Tech Lead", horasTotalesAsignadas: 200, horasDistribuidas: 0, fechaInicio: "2025-03-01", fechaFin: null },
      { id: "m3", activo: true, persona: PERSONAS.sofia, rol: "UX Designer", horasTotalesAsignadas: 120, horasDistribuidas: 0, fechaInicio: "2025-03-01", fechaFin: null },
      { id: "m4", activo: true, persona: PERSONAS.miguel, rol: "Desarrollador Frontend", horasTotalesAsignadas: 180, horasDistribuidas: 0, fechaInicio: "2025-03-01", fechaFin: null },
      { id: "m5", activo: true, persona: PERSONAS.laura, rol: "QA Engineer", horasTotalesAsignadas: 60, horasDistribuidas: 0, fechaInicio: "2025-06-01", fechaFin: null },
    ],
    horas: {
      horasVendidas: 640,
      horasConsumidas: 398,
      consumoMensual: [
        { mes: "Mar", horasVendidas: 120, horasConsumidas: 88 },
        { mes: "Abr", horasVendidas: 120, horasConsumidas: 102 },
        { mes: "May", horasVendidas: 120, horasConsumidas: 97 },
        { mes: "Jun", horasVendidas: 120, horasConsumidas: 111 },
        { mes: "Jul", horasVendidas: 80, horasConsumidas: 0 },
        { mes: "Ago", horasVendidas: 80, horasConsumidas: 0 },
      ],
      consumoPorPersona: [
        { persona: PERSONAS.ana,    asignacionId: "mock-a1", horasVendidas: 80,  horasTotalesAsignadas: 80,  horasConsumidas: 52,  consumoPorMes: [{ mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 14, horasVendidas: 13, horaId: "mock-h1" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 12, horasVendidas: 13, horaId: "mock-h2" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 14, horasVendidas: 13, horaId: "mock-h3" }, { mes: "Jun", mesNum: 6, anio: 2025, horasConsumidas: 12, horasVendidas: 14, horaId: "mock-h4" }] },
        { persona: PERSONAS.carlos, asignacionId: "mock-a2", horasVendidas: 200, horasTotalesAsignadas: 200, horasConsumidas: 138, consumoPorMes: [{ mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 32, horasVendidas: 33, horaId: "mock-h5" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 38, horasVendidas: 33, horaId: "mock-h6" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 34, horasVendidas: 33, horaId: "mock-h7" }, { mes: "Jun", mesNum: 6, anio: 2025, horasConsumidas: 34, horasVendidas: 34, horaId: "mock-h8" }] },
        { persona: PERSONAS.sofia,  asignacionId: "mock-a3", horasVendidas: 120, horasTotalesAsignadas: 120, horasConsumidas: 68,  consumoPorMes: [{ mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 18, horasVendidas: 20, horaId: "mock-h9" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 20, horasVendidas: 20, horaId: "mock-h10" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 16, horasVendidas: 20, horaId: "mock-h11" }, { mes: "Jun", mesNum: 6, anio: 2025, horasConsumidas: 14, horasVendidas: 20, horaId: "mock-h12" }] },
        { persona: PERSONAS.miguel, asignacionId: "mock-a4", horasVendidas: 180, horasTotalesAsignadas: 180, horasConsumidas: 112, consumoPorMes: [{ mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 22, horasVendidas: 30, horaId: "mock-h13" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 26, horasVendidas: 30, horaId: "mock-h14" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 30, horasVendidas: 30, horaId: "mock-h15" }, { mes: "Jun", mesNum: 6, anio: 2025, horasConsumidas: 34, horasVendidas: 30, horaId: "mock-h16" }] },
        { persona: PERSONAS.laura,  asignacionId: "mock-a5", horasVendidas: 60,  horasTotalesAsignadas: 60,  horasConsumidas: 28,  consumoPorMes: [{ mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 2,  horasVendidas: 10, horaId: "mock-h17" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 6,  horasVendidas: 10, horaId: "mock-h18" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 3,  horasVendidas: 10, horaId: "mock-h19" }, { mes: "Jun", mesNum: 6, anio: 2025, horasConsumidas: 17, horasVendidas: 10, horaId: "mock-h20" }] },
      ],
    },
    hitos: [
      { id: "h1", nombre: "Kickoff y relevamiento", fecha: "2025-03-15", descripcion: "Reunión inicial, levantamiento de requerimientos y validación del alcance con stakeholders." },
      { id: "h2", nombre: "Entrega diseños UX", fecha: "2025-04-30", descripcion: "Entrega de wireframes y prototipos aprobados por el cliente." },
      { id: "h3", nombre: "MVP funcional", fecha: "2025-06-20", descripcion: "Primera versión funcional con módulos core disponibles en staging." },
      { id: "h4", nombre: "UAT y aprobación cliente", fecha: "2025-08-15", descripcion: "Pruebas de aceptación con usuarios del cliente y firma de aprobación." },
      { id: "h5", nombre: "Go-live", fecha: "2025-09-30", descripcion: "Puesta en producción y traspaso al equipo de soporte del cliente." },
    ],
    riesgos: [
      { id: "r1", riesgo: "Dependencia de APIs legacy del cliente con documentación incompleta", estado: "abierto", impacto: "alto", mitigacion: "Coordinar sesiones técnicas semanales con el equipo de IT del cliente para mapear las APIs necesarias." },
      { id: "r2", riesgo: "Rotación del equipo de QA en julio", estado: "mitigado", impacto: "medio", mitigacion: "Se incorporó Laura Sánchez al proyecto con 2 meses de anticipación para asegurar la transición del conocimiento." },
      { id: "r3", riesgo: "Cambio de alcance no controlado en módulo de reportes", estado: "abierto", impacto: "medio", mitigacion: "Establecer proceso formal de change requests con aprobación del PM y cliente antes de cualquier ajuste." },
    ],
  },
  {
    id: "beta",
    nombre: "Rediseño E-Commerce",
    cliente: "Retail Prime",
    descripcion: "Rediseño completo de la plataforma de e-commerce B2C con foco en performance, experiencia móvil y conversión. Migración desde plataforma legacy a stack moderno con React y headless CMS.",
    estado: "activo",
    semaforo: "amarillo",
    salud: "amarillo",
    saludMotivo: "El consumo de horas está por encima de lo esperado para esta etapa del proyecto. Se está evaluando el alcance del módulo de pagos con el cliente para evitar comprometer la fecha de entrega.",
    cmgEsperado: 38,
    cmgReal: 29,
    fechaInicio: "2025-02-01",
    fechaFin: "2025-07-31",
    equipo: [
      { id: "m6", activo: true, persona: PERSONAS.carlos, rol: "Tech Lead", horasTotalesAsignadas: 160, horasDistribuidas: 0, fechaInicio: "2025-01-15", fechaFin: null },
      { id: "m7", activo: true, persona: PERSONAS.sofia, rol: "UX Lead", horasTotalesAsignadas: 100, horasDistribuidas: 0, fechaInicio: "2025-01-15", fechaFin: null },
      { id: "m8", activo: true, persona: PERSONAS.pedro, rol: "Desarrollador Full Stack", horasTotalesAsignadas: 200, horasDistribuidas: 0, fechaInicio: "2025-01-15", fechaFin: null },
    ],
    horas: {
      horasVendidas: 460,
      horasConsumidas: 392,
      consumoMensual: [
        { mes: "Feb", horasVendidas: 100, horasConsumidas: 112 },
        { mes: "Mar", horasVendidas: 100, horasConsumidas: 108 },
        { mes: "Abr", horasVendidas: 100, horasConsumidas: 98 },
        { mes: "May", horasVendidas: 80, horasConsumidas: 74 },
        { mes: "Jun", horasVendidas: 80, horasConsumidas: 0 },
      ],
      consumoPorPersona: [
        { persona: PERSONAS.carlos, asignacionId: "mock-b1", horasVendidas: 160, horasTotalesAsignadas: 160, horasConsumidas: 148, consumoPorMes: [{ mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 42, horasVendidas: 27, horaId: "mock-h21" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 38, horasVendidas: 27, horaId: "mock-h22" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 36, horasVendidas: 26, horaId: "mock-h23" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 32, horasVendidas: 27, horaId: "mock-h24" }] },
        { persona: PERSONAS.sofia,  asignacionId: "mock-b2", horasVendidas: 100, horasTotalesAsignadas: 100, horasConsumidas: 88,  consumoPorMes: [{ mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 24, horasVendidas: 17, horaId: "mock-h25" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 26, horasVendidas: 17, horaId: "mock-h26" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 22, horasVendidas: 16, horaId: "mock-h27" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 16, horasVendidas: 17, horaId: "mock-h28" }] },
        { persona: PERSONAS.pedro,  asignacionId: "mock-b3", horasVendidas: 200, horasTotalesAsignadas: 200, horasConsumidas: 156, consumoPorMes: [{ mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 46, horasVendidas: 33, horaId: "mock-h29" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 44, horasVendidas: 34, horaId: "mock-h30" }, { mes: "Abr", mesNum: 4, anio: 2025, horasConsumidas: 40, horasVendidas: 33, horaId: "mock-h31" }, { mes: "May", mesNum: 5, anio: 2025, horasConsumidas: 26, horasVendidas: 33, horaId: "mock-h32" }] },
      ],
    },
    hitos: [
      { id: "h1", nombre: "Auditoría plataforma actual", fecha: "2025-02-10", descripcion: "Análisis técnico de la plataforma existente, identificación de deuda técnica y plan de migración." },
      { id: "h2", nombre: "Nuevo diseño aprobado", fecha: "2025-03-20", descripcion: "Sistema de diseño completo y flujos principales validados por el cliente." },
      { id: "h3", nombre: "Entrega catálogo y checkout", fecha: "2025-05-30", descripcion: "Módulos de catálogo de productos y proceso de compra disponibles en staging." },
      { id: "h4", nombre: "Lanzamiento", fecha: "2025-07-31", descripcion: "Go-live de la nueva plataforma con plan de rollback definido." },
    ],
    riesgos: [
      { id: "r1", riesgo: "Sobreconsumo de horas en fase de desarrollo", estado: "abierto", impacto: "alto", mitigacion: "Revisar semanalmente el burn rate. Evaluar alcance con el cliente si la tendencia continúa en las próximas 2 semanas." },
      { id: "r2", riesgo: "Integración con sistema de pagos con cambios en la API del proveedor", estado: "abierto", impacto: "medio", mitigacion: "Mantener contacto directo con el account de la pasarela de pagos. Mock de API como respaldo para el desarrollo." },
    ],
  },
  {
    id: "gamma",
    nombre: "Automatización Procesos RRHH",
    cliente: "Grupo Industrial Sur",
    descripcion: "Implementación de un sistema de automatización para los procesos de onboarding, gestión de licencias y evaluación de desempeño del área de recursos humanos.",
    estado: "finalizado",
    semaforo: "verde",
    salud: "verde",
    saludMotivo: "Proyecto completado exitosamente dentro del presupuesto y cronograma pactado. El cliente aprobó el sistema sin observaciones pendientes.",
    cmgEsperado: 35,
    cmgReal: 33,
    fechaInicio: "2024-12-01",
    fechaFin: "2025-03-31",
    equipo: [
      { id: "m9", activo: true, persona: PERSONAS.ana, rol: "Project Manager", horasTotalesAsignadas: 60, horasDistribuidas: 0, fechaInicio: "2024-12-01", fechaFin: "2025-03-31" },
      { id: "m10", activo: true, persona: PERSONAS.miguel, rol: "Desarrollador", horasTotalesAsignadas: 160, horasDistribuidas: 0, fechaInicio: "2024-12-01", fechaFin: "2025-03-31" },
      { id: "m11", activo: true, persona: PERSONAS.laura, rol: "QA Engineer", horasTotalesAsignadas: 80, horasDistribuidas: 0, fechaInicio: "2025-01-15", fechaFin: "2025-03-31" },
    ],
    horas: {
      horasVendidas: 300,
      horasConsumidas: 287,
      consumoMensual: [
        { mes: "Ene", horasVendidas: 100, horasConsumidas: 94 },
        { mes: "Feb", horasVendidas: 100, horasConsumidas: 98 },
        { mes: "Mar", horasVendidas: 100, horasConsumidas: 95 },
      ],
      consumoPorPersona: [
        { persona: PERSONAS.ana,    asignacionId: "mock-c1", horasVendidas: 60,  horasTotalesAsignadas: 60,  horasConsumidas: 54,  consumoPorMes: [{ mes: "Ene", mesNum: 1, anio: 2025, horasConsumidas: 18, horasVendidas: 15, horaId: "mock-h33" }, { mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 20, horasVendidas: 15, horaId: "mock-h34" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 16, horasVendidas: 15, horaId: "mock-h35" }] },
        { persona: PERSONAS.miguel, asignacionId: "mock-c2", horasVendidas: 160, horasTotalesAsignadas: 160, horasConsumidas: 155, consumoPorMes: [{ mes: "Ene", mesNum: 1, anio: 2025, horasConsumidas: 52, horasVendidas: 40, horaId: "mock-h36" }, { mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 54, horasVendidas: 40, horaId: "mock-h37" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 49, horasVendidas: 40, horaId: "mock-h38" }] },
        { persona: PERSONAS.laura,  asignacionId: "mock-c3", horasVendidas: 80,  horasTotalesAsignadas: 80,  horasConsumidas: 78,  consumoPorMes: [{ mes: "Ene", mesNum: 1, anio: 2025, horasConsumidas: 24, horasVendidas: 27, horaId: "mock-h39" }, { mes: "Feb", mesNum: 2, anio: 2025, horasConsumidas: 24, horasVendidas: 27, horaId: "mock-h40" }, { mes: "Mar", mesNum: 3, anio: 2025, horasConsumidas: 30, horasVendidas: 27, horaId: "mock-h41" }] },
      ],
    },
    hitos: [
      { id: "h1", nombre: "Relevamiento de procesos", fecha: "2025-01-15", descripcion: "Mapeo completo de los procesos actuales de RRHH y definición del alcance de automatización." },
      { id: "h2", nombre: "Módulo onboarding", fecha: "2025-02-14", descripcion: "Sistema de onboarding automatizado con flujo de aprobaciones y generación de documentación." },
      { id: "h3", nombre: "Módulos licencias y evaluación", fecha: "2025-03-14", descripcion: "Gestión de licencias con calendario y módulo de evaluación 360." },
      { id: "h4", nombre: "Entrega final", fecha: "2025-03-31", descripcion: "Cierre del proyecto, documentación técnica y capacitación al equipo de RRHH." },
    ],
    riesgos: [
      { id: "r1", riesgo: "Resistencia al cambio por parte del equipo de RRHH", estado: "mitigado", impacto: "medio", mitigacion: "Se realizaron 3 sesiones de capacitación y se designaron 2 champions internos para adopción del sistema." },
      { id: "r2", riesgo: "Complejidad en la integración con el ERP existente", estado: "mitigado", impacto: "alto", mitigacion: "Se utilizó middleware de integración con reintentos automáticos. Todas las pruebas de integración aprobadas." },
    ],
  },
];

export function getProyecto(id: string): Proyecto | undefined {
  return PROYECTOS.find((p) => p.id === id);
}
