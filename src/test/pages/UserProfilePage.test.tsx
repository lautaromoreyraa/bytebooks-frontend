import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useNavigate } from "react-router-dom";
import UserProfilePage from "../../pages/UserProfilePage";
import { getUsuario, getFavoritosDeUsuario, getFavoritos } from "../../api/usuarios";
import { renderConRutas } from "../fixture/render";
import { unLibro } from "../fixture/catalogo";
import type { UsuarioPerfil } from "../../types";

vi.mock("../../api/usuarios");

function unPerfil(cambios: Partial<UsuarioPerfil> = {}): UsuarioPerfil {
  return {
    id: "usuario-a",
    nombre: "Ana",
    apellido: "Pérez",
    fotoPerfil: null,
    descripcion: null,
    ...cambios,
  };
}

/** Una promesa que resuelve cuando el test lo decide. */
function promesaControlada<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((cumplir) => {
    resolver = cumplir;
  });
  return { promesa, resolver };
}

function IrA({ ruta, texto }: { ruta: string; texto: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(ruta)}>{texto}</button>;
}

const RUTAS = (
  <>
    <IrA ruta="/usuarios/usuario-b" texto="Ir al perfil de Beto" />
    <Routes>
      <Route path="/usuarios/:id" element={<UserProfilePage />} />
    </Routes>
  </>
);

describe("UserProfilePage", () => {
  beforeEach(() => {
    vi.mocked(getFavoritosDeUsuario).mockResolvedValue([]);
    vi.mocked(getFavoritos).mockResolvedValue([]);
  });

  it("muestra el perfil pedido", async () => {
    vi.mocked(getUsuario).mockResolvedValue(unPerfil());

    renderConRutas(RUTAS, { ruta: "/usuarios/usuario-a" });

    expect(await screen.findByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
  });

  it("al cambiar de perfil no deja en pantalla el anterior", async () => {
    // Hallazgo 12: el efecto no volvia a poner `loading` en true, asi que ir de
    // /usuarios/A a /usuarios/B dejaba el nombre y el avatar de A hasta que
    // respondia B.
    const beto = promesaControlada<UsuarioPerfil>();
    vi.mocked(getUsuario).mockImplementation((id: string) =>
      id === "usuario-a" ? Promise.resolve(unPerfil()) : beto.promesa
    );

    renderConRutas(RUTAS, { ruta: "/usuarios/usuario-a" });
    await screen.findByRole("heading", { name: "Ana Pérez" });

    await userEvent.click(screen.getByRole("button", { name: "Ir al perfil de Beto" }));

    expect(screen.queryByRole("heading", { name: "Ana Pérez" })).not.toBeInTheDocument();

    beto.resolver(unPerfil({ id: "usuario-b", nombre: "Beto", apellido: "López" }));

    expect(await screen.findByRole("heading", { name: "Beto López" })).toBeInTheDocument();
  });

  it("una respuesta que llega tarde no pisa el perfil que se esta viendo", async () => {
    const ana = promesaControlada<UsuarioPerfil>();
    vi.mocked(getUsuario).mockImplementation((id: string) =>
      id === "usuario-a"
        ? ana.promesa
        : Promise.resolve(unPerfil({ id: "usuario-b", nombre: "Beto", apellido: "López" }))
    );

    renderConRutas(RUTAS, { ruta: "/usuarios/usuario-a" });
    await userEvent.click(screen.getByRole("button", { name: "Ir al perfil de Beto" }));
    await screen.findByRole("heading", { name: "Beto López" });

    // La respuesta de A llega despues de haber cambiado de perfil.
    ana.resolver(unPerfil());

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Beto López" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Ana Pérez" })).not.toBeInTheDocument();
  });

  it("los favoritos tambien se vuelven a pedir al cambiar de perfil", async () => {
    vi.mocked(getUsuario).mockResolvedValue(unPerfil());
    vi.mocked(getFavoritosDeUsuario).mockImplementation((id: string) =>
      Promise.resolve(id === "usuario-a" ? [unLibro({ titulo: "Rayuela" })] : [])
    );

    renderConRutas(RUTAS, { ruta: "/usuarios/usuario-a" });
    expect(await screen.findByText("Rayuela")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ir al perfil de Beto" }));

    await waitFor(() => {
      expect(screen.queryByText("Rayuela")).not.toBeInTheDocument();
    });
    expect(vi.mocked(getFavoritosDeUsuario)).toHaveBeenCalledWith("usuario-b");
  });

  it("un perfil que no existe lo dice", async () => {
    vi.mocked(getUsuario).mockRejectedValue(new Error("404"));

    renderConRutas(RUTAS, { ruta: "/usuarios/usuario-a" });

    expect(await screen.findByText("No encontramos este perfil")).toBeInTheDocument();
  });
});
