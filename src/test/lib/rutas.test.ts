import { describe, it, expect } from "vitest";
import { rutaInternaSegura } from "../../lib/rutas";

/**
 * `returnTo` lo escribe quien arma el enlace al login, asi que es una entrada
 * hostil: lo que se prueba es que nada que el navegador pueda leer como un
 * origen distinto sobreviva.
 */
describe("rutaInternaSegura", () => {
  it("deja pasar una ruta interna", () => {
    expect(rutaInternaSegura("/favoritos")).toBe("/favoritos");
    expect(rutaInternaSegura("/libros/abc?ver=1")).toBe("/libros/abc?ver=1");
  });

  it("descarta la doble barra, que el navegador lee como otro sitio", () => {
    expect(rutaInternaSegura("//otro-sitio.test")).toBe("/");
    expect(rutaInternaSegura("//otro-sitio.test/robar")).toBe("/");
  });

  it("descarta la barra invertida, que algunos navegadores normalizan a //", () => {
    expect(rutaInternaSegura("/\\otro-sitio.test")).toBe("/");
  });

  it("descarta una URL absoluta y cualquier esquema", () => {
    expect(rutaInternaSegura("https://otro-sitio.test")).toBe("/");
    expect(rutaInternaSegura("javascript:alert(1)")).toBe("/");
    expect(rutaInternaSegura("data:text/html,<script>")).toBe("/");
  });

  it("descarta una ruta relativa, que depende de donde se este parado", () => {
    expect(rutaInternaSegura("favoritos")).toBe("/");
  });

  it("sin valor devuelve el destino por defecto", () => {
    expect(rutaInternaSegura(null)).toBe("/");
    expect(rutaInternaSegura("")).toBe("/");
    expect(rutaInternaSegura(null, "/libros")).toBe("/libros");
  });
});
