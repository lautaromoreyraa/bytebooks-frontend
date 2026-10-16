import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadImage } from "../../lib/cloudinary";

function responder(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

describe("uploadImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("pide la firma a la API y sube con ella, sin upload preset", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(responder(200, {
        firma: "abc123", marcaDeTiempo: 1700000000, apiKey: "clave", nombreDeLaNube: "nube", carpeta: "bytebooks",
      }))
      .mockResolvedValueOnce(responder(200, { secure_url: "https://res.cloudinary.com/nube/foto.jpg" }));

    const url = await uploadImage(new File(["x"], "foto.jpg", { type: "image/jpeg" }));

    expect(url).toBe("https://res.cloudinary.com/nube/foto.jpg");
    const [rutaDeFirma, opcionesDeFirma] = vi.mocked(fetch).mock.calls[0];
    expect(String(rutaDeFirma)).toMatch(/\/imagenes\/firma$/);
    expect(opcionesDeFirma?.method).toBe("POST");

    const [destino, opciones] = vi.mocked(fetch).mock.calls[1];
    expect(destino).toBe("https://api.cloudinary.com/v1_1/nube/image/upload");
    const cuerpo = opciones?.body as FormData;
    expect(cuerpo.get("signature")).toBe("abc123");
    expect(cuerpo.get("timestamp")).toBe("1700000000");
    expect(cuerpo.get("api_key")).toBe("clave");
    expect(cuerpo.get("folder")).toBe("bytebooks");
    expect(cuerpo.get("upload_preset")).toBeNull();
  });

  it("si la API no firma, no sube nada", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(responder(503, { status: 503, message: "Cloudinary no esta configurado" }));

    await expect(uploadImage(new File(["x"], "foto.jpg"))).rejects.toThrow(/Cloudinary no esta configurado/);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
