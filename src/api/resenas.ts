import { api } from "./client";
import type { Resena, ResumenDeResenas, Page } from "../types";

export function getResenas(libroId: string, page = 0): Promise<Page<Resena>> {
  return api.get(`/libros/${libroId}/resenas?page=${page}&size=10`);
}

/** El promedio no se deduce de la primera pagina: lo calcula la base sobre
 *  todas las resenas del libro. */
export function getResumenDeResenas(libroId: string): Promise<ResumenDeResenas> {
  return api.get(`/libros/${libroId}/resenas/resumen`);
}

export function createResena(
  libroId: string,
  body: { comentario: string; puntuacion: number }
): Promise<Resena> {
  return api.post(`/libros/${libroId}/resenas`, body);
}

export function deleteResena(resenaId: string): Promise<void> {
  return api.delete(`/resenas/${resenaId}`);
}
