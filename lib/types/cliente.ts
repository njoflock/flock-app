export interface ClienteDB {
  id: string;
  nombre: string;
  logo: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ContactoClienteDB {
  id: string;
  cliente_id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}
