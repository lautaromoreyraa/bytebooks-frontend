import { api } from "./client";
import type { Resena, Page } from "../types";

export function getResenas(libroId: string, page = 0): Promise<Page<Resena>> {
  return api.get(`/libros/${libroId}/resenas?page=${page}&size=10`);
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
