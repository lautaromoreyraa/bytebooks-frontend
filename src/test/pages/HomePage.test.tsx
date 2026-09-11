import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import {
  getLibros,
  previsualizarGoogleBooks,
  confirmarImportacion,
} from "../../api/libros";
import { getCategorias } from "../../api/categorias";
import { getFavoritos } from "../../api/usuarios";
import { invalidarCatalogo } from "../../lib/cacheDeCatalogo";
import { renderConRutas, iniciarSesion } from "../fixture/render";
import { unLibro, unaCategoria } from "../fixture/catalogo";

vi.mock("../../api/libros");
vi.mock("../../api/categorias");
vi.mock("../../api/usuarios");

const RUTAS = (
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
);

describe("HomePage", () => {
  beforeEach(() => {
    // El cache vive en un modulo: sin esto un test veria el catalogo del otro.
    invalidarCatalogo();
    vi.mocked(getCategorias).mockResolvedValue([unaCategoria()]);
    vi.mocked(getFavoritos).mockResolvedValue([]);
    vi.mocked(getLibros).mockResolvedValue([unLibro()]);
  });

  it("lista el catalogo", async () => {
    renderConRutas(RUTAS);

    expect(await screen.findByText("Rayuela")).toBeInTheDocument();
  });

  it("mientras reintenta no dice que la biblioteca esta vacia", async () => {
    /*
     * Hallazgo 14: el `return` del catch programaba el reintento pero el
     * `finally` apagaba el skeleton igual, asi que durante 400 ms se veia el
     * estado vacio entero —con el boton de "Agregar el primer libro"— antes de
     * que volviera el skeleton.
     */
    let resolverSegundo!: () => void;
    vi.mocked(getLibros)
      .mockRejectedValueOnce(new Error("se cayo la red"))
      .mockImplementationOnce(
        () =>
          new Promise((cumplir) => {
            resolverSegundo = () => cumplir([unLibro()]);
          })
      );

    renderConRutas(RUTAS);

    await waitFor(() => {
      expect(vi.mocked(getLibros)).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText("La biblioteca está vacía")).not.toBeInTheDocument();
    expect(screen.queryByText("No pudimos cargar el catálogo")).not.toBeInTheDocument();

    resolverSegundo();

    expect(await screen.findByText("Rayuela")).toBeInTheDocument();
  });

  it("si el reintento tambien falla, lo dice y ofrece volver a intentar", async () => {
    vi.mocked(getLibros).mockRejectedValue(new Error("se cayo la red"));

    renderConRutas(RUTAS);

    expect(await screen.findByText("No pudimos cargar el catálogo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("un catalogo realmente vacio si lo dice", async () => {
    vi.mocked(getLibros).mockResolvedValue([]);

    renderConRutas(RUTAS);

    expect(await screen.findByText("La biblioteca está vacía")).toBeInTheDocument();
  });

  it("importar desde Google Books recarga el catalogo", async () => {
    /*
     * Hallazgo 6: la importacion decia "Se importaron N libros correctamente" y
     * no tocaba el listado ni el cache. Los libros quedaban guardados y la
     * pantalla afirmaba lo contrario.
     */
    iniciarSesion("ROLE_ADMIN");
    vi.mocked(getLibros)
      .mockResolvedValueOnce([])
      .mockResolvedValue([unLibro({ titulo: "Importado de Google" })]);
    vi.mocked(previsualizarGoogleBooks).mockResolvedValue([
      {
        titulo: "Importado de Google",
        autor: "Alguien",
        descripcion: null,
        isbn: "9780000000001",
        anioPublicacion: "2001",
        editorial: null,
        portada: null,
      },
    ]);
    vi.mocked(confirmarImportacion).mockResolvedValue({
      query: "algo",
      encontrados: 1,
      guardados: 1,
      descartadosPorDuplicado: 0,
      descartadosPorDatosInvalidos: 0,
      descartadosPorError: 0,
    });

    renderConRutas(RUTAS);
    await screen.findByText("La biblioteca está vacía");

    await userEvent.click(screen.getByRole("button", { name: /Agregar libro/ }));
    // Todo lo del modal se busca adentro del modal: el buscador del catálogo
    // que quedó atrás tiene el mismo placeholder.
    const modal = within(screen.getByRole("dialog"));
    await userEvent.click(modal.getByRole("button", { name: "Google Books" }));
    await userEvent.type(modal.getByPlaceholderText(/Buscar por título o autor/), "algo");
    await userEvent.click(modal.getByRole("button", { name: "Buscar" }));

    await modal.findByText("Importado de Google");
    await userEvent.selectOptions(modal.getByRole("combobox"), "categoria-1");
    await userEvent.click(modal.getByRole("button", { name: /^Importar/ }));

    expect(await modal.findByText(/Se importaron 1 libro/)).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(getLibros)).toHaveBeenCalledTimes(2);
    });

    // Y al cerrar, el libro esta en la grilla y no hay que salir y volver.
    await userEvent.click(modal.getByRole("button", { name: "Listo" }));
    expect(await screen.findByText("Importado de Google")).toBeInTheDocument();
  });

  it("un moderador no ve el boton de agregar, porque crear es solo de admin", async () => {
    iniciarSesion("ROLE_MODERATOR");

    renderConRutas(RUTAS);
    await screen.findByText("Rayuela");

    expect(screen.queryByRole("button", { name: /Agregar libro/ })).not.toBeInTheDocument();
  });

  it("la busqueda ignora tildes y distingue el vacio por filtro del vacio real", async () => {
    renderConRutas(RUTAS);
    await screen.findByText("Rayuela");

    await userEvent.type(screen.getByLabelText("Buscar por título o autor"), "cortazar");
    expect(screen.getByText("Rayuela")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Buscar por título o autor"));
    await userEvent.type(screen.getByLabelText("Buscar por título o autor"), "zzz");
    expect(await screen.findByText("Ninguna coincidencia")).toBeInTheDocument();
  });
});
