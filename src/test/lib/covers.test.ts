import { describe, it, expect } from "vitest";
import { getOpenLibraryCover } from "../../lib/covers";

describe("getOpenLibraryCover", () => {
  it("sin isbn no hay portada de Open Library", () => {
    expect(getOpenLibraryCover(null)).toBeNull();
  });

  it("pide default=false, que es lo que hace fallar a un isbn que no tienen", () => {
    // Sin ese parametro responden 200 con una imagen en blanco de 43 bytes: el
    // onError de la portada no se dispara y la tarjeta queda vacia en vez de
    // caer al `portada` guardado.
    const url = getOpenLibraryCover("9788437604572");
    expect(url).toContain("9788437604572");
    expect(url).toContain("default=false");
  });
});
