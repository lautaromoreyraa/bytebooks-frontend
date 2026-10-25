import { describe, it, expect, beforeEach, vi } from "vitest";
import { register } from "../../api/auth";

/**
 * El token del desafío viaja en una cabecera y no en el cuerpo: la API lo
 * verifica en un filtro, antes de leer el formulario.
 */

const datos = { nombre: "Camila", apellido: "Sosa", email: "c@ejemplo.test", password: "Local1234" };

function cabeceras(): Record<string, string> {
  const [, opciones] = vi.mocked(fetch).mock.calls[0];
  return opciones?.headers as Record<string, string>;
}

describe("register", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue(
      new Response("{}", { status: 201, headers: { "Content-Type": "application/json" } })
    );
  });

  it("manda el token del desafio en Cf-Turnstile-Response", async () => {
    await register(datos, "tok-123");

    expect(cabeceras()["Cf-Turnstile-Response"]).toBe("tok-123");
    expect(cabeceras()["Content-Type"]).toBe("application/json");
  });

  it("sin token no manda la cabecera", async () => {
    await register(datos, null);

    expect(cabeceras()["Cf-Turnstile-Response"]).toBeUndefined();
  });
});
