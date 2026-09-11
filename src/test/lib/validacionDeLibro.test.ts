import { describe, it, expect } from "vitest";
import { validarLibro, LIMITE_SINOPSIS } from "../../lib/validacionDeLibro";

const VALIDO = {
  titulo: "Rayuela",
  autor: "Julio Cortázar",
  categoriaIds: ["una-categoria"],
  descripcion: "Una sinopsis.",
  anioPublicacion: "1963",
};

/**
 * Estas reglas corren antes de subir la portada a Cloudinary. Si dejan pasar
 * algo que la API rechaza, la imagen ya se subió y el formulario se pierde con
 * un 400.
 */
describe("validarLibro", () => {
  it("acepta un formulario completo", () => {
    expect(validarLibro(VALIDO)).toBeNull();
  });

  it("exige titulo, autor y al menos una categoria", () => {
    expect(validarLibro({ ...VALIDO, titulo: "   " })).toMatch(/obligatorios/);
    expect(validarLibro({ ...VALIDO, autor: "" })).toMatch(/obligatorios/);
    expect(validarLibro({ ...VALIDO, categoriaIds: [] })).toMatch(/obligatorios/);
  });

  it("rechaza un anio que no sean cuatro digitos", () => {
    for (const anio of ["195", "19633", "mil", "19a3"]) {
      expect(validarLibro({ ...VALIDO, anioPublicacion: anio })).toMatch(/cuatro dígitos/);
    }
  });

  it("acepta el anio vacio, porque es opcional", () => {
    expect(validarLibro({ ...VALIDO, anioPublicacion: "" })).toBeNull();
    expect(validarLibro({ ...VALIDO, anioPublicacion: "  " })).toBeNull();
  });

  it("rechaza una sinopsis mas larga que el limite de la API", () => {
    expect(validarLibro({ ...VALIDO, descripcion: "x".repeat(LIMITE_SINOPSIS) })).toBeNull();
    expect(validarLibro({ ...VALIDO, descripcion: "x".repeat(LIMITE_SINOPSIS + 1) }))
      .toMatch(new RegExp(String(LIMITE_SINOPSIS)));
  });
});
