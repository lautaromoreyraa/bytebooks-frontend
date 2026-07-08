import { api } from "./client";
import type { Libro, UsuarioPerfil } from "../types";

export function getUsuario(id: string): Promise<UsuarioPerfil> {
  return api.get(`/usuarios/${id}`);
}

export function updatePerfil(data: {
  fotoPerfil?: string;
  descripcion?: string;
}): Promise<UsuarioPerfil> {
  return api.put("/usuarios/me/perfil", data);
}

export function getFavoritos(): Promise<Libro[]> {
  return api.get("/usuarios/me/favoritos");
}

export function getFavoritosDeUsuario(id: string): Promise<Libro[]> {
  return api.get(`/usuarios/${id}/favoritos`);
}

export function addFavorito(libroId: string): Promise<void> {
  return api.post(`/usuarios/me/favoritos/${libroId}`, {});
}

export function removeFavorito(libroId: string): Promise<void> {
  return api.delete(`/usuarios/me/favoritos/${libroId}`);
}
