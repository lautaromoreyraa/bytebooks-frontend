export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface Libro {
  id: string;
  isbn: string | null;
  titulo: string;
  autor: string;
  descripcion: string | null;
  categorias: Categoria[];
  editorial: string | null;
  anioPublicacion: string | null;
  estadoLibro: "DISPONIBLE" | "OCULTO";
  portada: string | null;
}

export interface Resena {
  id: string;
  libroId: string;
  usuarioId: string;
  nombreUsuario: string;
  comentario: string | null;
  puntuacion: number;
  fechaResena: string;
}

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  apellido: string;
  fotoPerfil: string | null;
  descripcion: string | null;
}

export interface AuthResponse {
  userId: string;
  email: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role?: string;
}

export interface GoogleBookCandidate {
  titulo: string;
  autor: string;
  descripcion: string | null;
  isbn: string | null;
  anioPublicacion: string | null;
  editorial: string | null;
  portada: string | null;
}

export interface ImportacionResult {
  query: string;
  encontrados: number;
  guardados: number;
  descartadosPorDuplicado: number;
  descartadosPorDatosInvalidos: number;
  descartadosPorError: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
}
