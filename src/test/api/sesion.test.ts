import { describe, expect, it } from "vitest";
import { borrarSesionGuardadaEnElNavegador } from "../../api/sesion";

describe("sesion", () => {
  it("borra la sesion que quedo guardada en el navegador de antes", () => {
    localStorage.setItem("token", "token-viejo");
    localStorage.setItem("userId", "u");
    localStorage.setItem("email", "e@ejemplo.test");
    localStorage.setItem("role", "ROLE_USER");
    localStorage.setItem("otra-cosa", "se queda");

    borrarSesionGuardadaEnElNavegador();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
    expect(localStorage.getItem("email")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("otra-cosa")).toBe("se queda");
  });
});
