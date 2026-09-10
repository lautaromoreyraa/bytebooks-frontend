import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../../api/client";

/**
 * El cliente HTTP es el punto por el que pasan todas las pantallas, y donde
 * vivio el bug mas caro del repo: el `throw` con el mensaje de la API estaba
 * adentro de un `try` cuyo propio `catch` lo atrapaba, asi que los cinco
 * paneles de error mostraban el JSON crudo.
 */

function responder(status: number, cuerpo: string, tipo = "application/json") {
  return new Response(cuerpo, {
    status,
    headers: { "Content-Type": tipo },
  });
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("manda el token cuando hay sesion", async () => {
    localStorage.setItem("token", "un-token");
    vi.mocked(fetch).mockResolvedValue(responder(200, "[]"));

    await api.get("/libros");

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    expect((opciones?.headers as Record<string, string>).Authorization).toBe("Bearer un-token");
  });

  it("sin sesion no manda ninguna cabecera de autorizacion", async () => {
    vi.mocked(fetch).mockResolvedValue(responder(200, "[]"));

    await api.get("/libros");

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    expect((opciones?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("muestra el mensaje de la API y no el JSON crudo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(409, JSON.stringify({ status: 409, message: "Ya existe un libro con el titulo: Rayuela" }))
    );

    await expect(api.post("/libros", {})).rejects.toThrow("Ya existe un libro con el titulo: Rayuela");
  });

  it("prefiere el detalle por campo, que dice cual es el campo con problemas", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        400,
        JSON.stringify({
          status: 400,
          message: "Validacion fallida",
          errors: { anioPublicacion: "El anio de publicacion debe tener 4 digitos" },
        })
      )
    );

    // "Validacion fallida" no le sirve a nadie: lo util es el nombre del campo.
    await expect(api.post("/libros", {})).rejects.toThrow(/4 digitos/);
  });

  it("junta los errores cuando hay varios campos mal", async () => {
    vi.mocked(fetch).mockResolvedValue(
      responder(
        400,
        JSON.stringify({
          status: 400,
          errors: { titulo: "El titulo es obligatorio", autor: "El autor es obligatorio" },
        })
      )
    );

    await expect(api.post("/libros", {})).rejects.toThrow(/titulo.*autor|autor.*titulo/s);
  });

  it("con un cuerpo que no es JSON muestra lo que vino", async () => {
    vi.mocked(fetch).mockResolvedValue(responder(502, "Bad Gateway", "text/plain"));

    await expect(api.get("/libros")).rejects.toThrow("Bad Gateway");
  });

  it("con un cuerpo vacio muestra el codigo", async () => {
    vi.mocked(fetch).mockResolvedValue(responder(500, "", "text/plain"));

    await expect(api.get("/libros")).rejects.toThrow("Error 500");
  });

  it("un 401 avisa que la sesion vencio", async () => {
    // De esto depende el modal para volver a entrar: mientras la API respondia
    // 500 en vez de 401, la sesion vencida no se detectaba nunca.
    const escuchado = vi.fn();
    window.addEventListener("session-expired", escuchado);
    vi.mocked(fetch).mockResolvedValue(responder(401, ""));

    await expect(api.get("/usuarios/me/favoritos")).rejects.toThrow(/vencida|expirada/i);
    expect(escuchado).toHaveBeenCalledOnce();

    window.removeEventListener("session-expired", escuchado);
  });

  it("un 204 no intenta leer un cuerpo que no existe", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.delete("/resenas/una")).resolves.toBeUndefined();
  });

  it("el cuerpo de un POST viaja como JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(responder(201, "{}"));

    await api.post("/libros", { titulo: "Rayuela" });

    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(opciones?.method).toBe("POST");
    expect(opciones?.body).toBe(JSON.stringify({ titulo: "Rayuela" }));
  });
});
