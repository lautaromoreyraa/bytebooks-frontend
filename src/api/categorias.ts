import { api } from "./client";
import type { Categoria } from "../types";

export function getCategorias(): Promise<Categoria[]> {
  return api.get(`/categorias`);
}
