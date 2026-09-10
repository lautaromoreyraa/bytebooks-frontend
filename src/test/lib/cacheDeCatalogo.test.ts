import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  guardarCatalogo,
  invalidarCatalogo,
  leerCatalogo,
  leerCatalogoVencido,
} from "../../lib/cacheDeCatalogo";
import { unLibro, unaCategoria } from "../fixture/catalogo";

/**
 * El cache es un modulo con estado global, asi que cada test lo vacia antes de
 * empezar; si no, el orden de los archivos cambiaria el resultado.
 */
describe("cacheDeCatalogo", () => {
  beforeEach(() => {
    invalidarCatalogo();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    invalidarCatalogo();
  });

  it("vacio no devuelve nada", () => {
    expect(leerCatalogo()).toBeNull();
    expect(leerCatalogoVencido()).toBeNull();
  });

  it("devuelve lo guardado mientras esta fresco", () => {
    guardarCatalogo([unLibro()], [unaCategoria()]);

    vi.advanceTimersByTime(29_000);

    expect(leerCatalogo()?.libros).toHaveLength(1);
  });

  it("a los 30 segundos deja de estar fresco", () => {
    guardarCatalogo([unLibro()], [unaCategoria()]);

    vi.advanceTimersByTime(30_000);

    expect(leerCatalogo()).toBeNull();
  });

  it("lo vencido sigue disponible como red para cuando la API no responde", () => {
    guardarCatalogo([unLibro({ titulo: "Rayuela" })], [unaCategoria()]);

    vi.advanceTimersByTime(60_000);

    expect(leerCatalogo()).toBeNull();
    expect(leerCatalogoVencido()?.libros[0].titulo).toBe("Rayuela");
  });

  it("invalidar borra hasta la copia vencida", () => {
    // Es lo que se llama al iniciar y cerrar sesion: el catalogo depende del
    // rol, y una copia vieja mostraria los libros ocultos a quien ya salio.
    guardarCatalogo([unLibro()], [unaCategoria()]);

    invalidarCatalogo();

    expect(leerCatalogo()).toBeNull();
    expect(leerCatalogoVencido()).toBeNull();
  });
});
