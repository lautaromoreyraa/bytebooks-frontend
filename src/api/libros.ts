import { api } from "./client";
import type { GoogleBookCandidate, ImportacionResult, Libro} from "../types";

export interface CreateLibroPayload {
  titulo: string;
  autor: string;
  descripcion?: string;
  categoriaIds: string[];
  editorial?: string;
  anioPublicacion?: string;
  estadoLibro: "DISPONIBLE" | "OCULTO";
  portada?: string;
}

export function getLibros(): Promise<Libro[]> {
  return api.get(`/libros`);
}

export function getLibro(id: string): Promise<Libro> {
  return api.get(`/libros/${id}`);
}

export function createLibro(data: CreateLibroPayload): Promise<Libro> {
  return api.post("/libros", data);
}

export function updateLibro(id: string, data: CreateLibroPayload): Promise<Libro> {
  return api.put(`/libros/${id}`, data);
}

export function deleteLibro(id: string): Promise<void> {
  return api.delete(`/libros/${id}`);
}

export function previsualizarGoogleBooks(query: string): Promise<GoogleBookCandidate[]> {
  return api.get(`/admin/libros/import/previsualizar?query=${encodeURIComponent(query)}`);
}

export function confirmarImportacion(data: {
  libros: GoogleBookCandidate[];
  categoriaId: string;
}): Promise<ImportacionResult> {
  return api.post("/admin/libros/import/confirmar", data);
}
