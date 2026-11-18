
const ADMIN = "ROLE_ADMIN";
const MODERATOR = "ROLE_MODERATOR";

export function puedeEditarLibros(role: string | undefined): boolean {
  return role === ADMIN || role === MODERATOR;
}

export function puedeCrearLibros(role: string | undefined): boolean {
  return role === ADMIN;
}
