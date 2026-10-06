export type EstadoCliente = "activo" | "inactivo";

export interface Interlocutor {
  id: string;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface ClienteCompleto {
  id: string;
  nombre: string;
  estado: EstadoCliente;
  interlocutores: Interlocutor[];
}

export const CLIENTES: ClienteCompleto[] = [
  {
    id: "c1",
    nombre: "Banco Nacional",
    estado: "activo",
    interlocutores: [
      { id: "i1", nombre: "Rodrigo Vargas", cargo: "Gerente de Tecnología", email: "r.vargas@banconacional.cl", telefono: "+56 9 8123 4567" },
      { id: "i2", nombre: "Camila Pinto", cargo: "Jefa de Proyectos", email: "c.pinto@banconacional.cl", telefono: "+56 9 7654 3210" },
    ],
  },
  {
    id: "c2",
    nombre: "Retail Prime",
    estado: "activo",
    interlocutores: [
      { id: "i3", nombre: "Felipe Mora", cargo: "Director de E-Commerce", email: "f.mora@retailprime.com", telefono: "+56 9 9234 5678" },
    ],
  },
  {
    id: "c3",
    nombre: "Grupo Industrial Sur",
    estado: "activo",
    interlocutores: [
      { id: "i4", nombre: "Patricia Soto", cargo: "Gerenta de RRHH", email: "p.soto@grupoindsur.cl", telefono: "+56 9 6543 2109" },
      { id: "i5", nombre: "Andrés Fuentes", cargo: "Subgerente TI", email: "a.fuentes@grupoindsur.cl", telefono: "+56 9 5432 1098" },
      { id: "i6", nombre: "Daniela Rojas", cargo: "Analista de Proyectos", email: "d.rojas@grupoindsur.cl", telefono: "+56 9 4321 0987" },
    ],
  },
  {
    id: "c4",
    nombre: "Salud Conecta",
    estado: "inactivo",
    interlocutores: [
      { id: "i7", nombre: "Marcelo Ibáñez", cargo: "CTO", email: "m.ibanez@saludconecta.cl", telefono: "+56 9 3210 9876" },
    ],
  },
];

export function getCliente(id: string): ClienteCompleto | undefined {
  return CLIENTES.find(c => c.id === id);
}
