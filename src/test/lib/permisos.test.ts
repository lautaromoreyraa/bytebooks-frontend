import { describe, it, expect } from "vitest";
import { puedeCrearLibros, puedeEditarLibros } from "../../lib/permisos";

/**
 * Estas dos funciones espejan SecurityConfig. Si se separan, un moderador ve el
 * boton de "Agregar libro", llena el formulario, sube la portada y recien ahi
 * recibe un 403.
 */
describe("permisos", () => {
  it("crear libros es solo de admin", () => {
    expect(puedeCrearLibros("ROLE_ADMIN")).toBe(true);
    expect(puedeCrearLibros("ROLE_MODERATOR")).toBe(false);
    expect(puedeCrearLibros("ROLE_USER")).toBe(false);
    expect(puedeCrearLibros(undefined)).toBe(false);
  });

  it("editar y borrar tambien lo puede un moderador", () => {
    expect(puedeEditarLibros("ROLE_ADMIN")).toBe(true);
    expect(puedeEditarLibros("ROLE_MODERATOR")).toBe(true);
    expect(puedeEditarLibros("ROLE_USER")).toBe(false);
    expect(puedeEditarLibros(undefined)).toBe(false);
  });
});
