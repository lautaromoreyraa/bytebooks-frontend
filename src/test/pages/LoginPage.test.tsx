import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import { login } from "../../api/auth";
import { guardarCatalogo, leerCatalogoVencido, invalidarCatalogo } from "../../lib/cacheDeCatalogo";
import { renderConRutas } from "../fixture/render";
import { unLibro, unaCategoria } from "../fixture/catalogo";

vi.mock("../../api/auth");

const RUTAS = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<p>El catálogo</p>} />
    <Route path="/favoritos" element={<p>Mis favoritos</p>} />
  </Routes>
);

async function ingresar() {
  await userEvent.type(screen.getByLabelText("Email"), "alguien@ejemplo.test");
  await userEvent.type(screen.getByLabelText("Contraseña"), "Local1234");
  await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    invalidarCatalogo();
    vi.mocked(login).mockResolvedValue({
      userId: "usuario-1",
      email: "alguien@ejemplo.test",
      accessToken: "un-token",
      tokenType: "Bearer",
      expiresIn: 1800,
      role: "ROLE_USER",
    });
  });

  it("vuelve a donde el usuario queria ir", async () => {
    renderConRutas(RUTAS, { ruta: "/login?returnTo=/favoritos" });

    await ingresar();

    expect(await screen.findByText("Mis favoritos")).toBeInTheDocument();
  });

  it("un returnTo que apunta afuera del sitio se ignora", async () => {
    // Hallazgo 15: `//otro-sitio` es la forma clasica del open redirect, porque
    // el navegador lo lee como una URL absoluta con el protocolo actual.
    renderConRutas(RUTAS, { ruta: "/login?returnTo=//otro-sitio.test" });

    await ingresar();

    expect(await screen.findByText("El catálogo")).toBeInTheDocument();
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("/");
  });

  it("guarda la sesion", async () => {
    renderConRutas(RUTAS, { ruta: "/login" });

    await ingresar();

    await screen.findByText("El catálogo");
    expect(localStorage.getItem("token")).toBe("un-token");
    expect(localStorage.getItem("role")).toBe("ROLE_USER");
  });

  it("iniciar sesion descarta el catalogo cacheado", async () => {
    // La API devuelve libros distintos segun el rol: el catalogo que se vio sin
    // sesion no sirve para la sesion nueva, ni al reves.
    guardarCatalogo([unLibro()], [unaCategoria()]);
    renderConRutas(RUTAS, { ruta: "/login" });

    await ingresar();

    await screen.findByText("El catálogo");
    expect(leerCatalogoVencido()).toBeNull();
  });

  it("una credencial equivocada no dice cual de las dos esta mal", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Credenciales invalidas"));

    renderConRutas(RUTAS, { ruta: "/login" });
    await ingresar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
  });

  it("valida en el cliente antes de mandar nada", async () => {
    renderConRutas(RUTAS, { ruta: "/login" });

    await userEvent.type(screen.getByLabelText("Email"), "no-es-un-email");
    await userEvent.type(screen.getByLabelText("Contraseña"), "algo");
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(screen.getByText(/formato válido/)).toBeInTheDocument();
    expect(vi.mocked(login)).not.toHaveBeenCalled();
  });
});
