import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import BookDetailPage from "../../pages/BookDetailPage";
import { getLibro, deleteLibro } from "../../api/libros";
import { getResenas, getResumenDeResenas, createResena } from "../../api/resenas";
import { getFavoritos } from "../../api/usuarios";
import {
  guardarCatalogo,
  leerCatalogoVencido,
  invalidarCatalogo,
} from "../../lib/cacheDeCatalogo";
import { renderConRutas, iniciarSesion } from "../fixture/render";
import { unLibro, unaCategoria, unaResena, unaPagina } from "../fixture/catalogo";

vi.mock("../../api/libros");
vi.mock("../../api/resenas");
vi.mock("../../api/usuarios");

const RUTAS = (
  <Routes>
    <Route path="/libros/:id" element={<BookDetailPage />} />
    <Route path="/" element={<p>El catálogo</p>} />
  </Routes>
);

function verLaFicha() {
  return renderConRutas(RUTAS, { ruta: "/libros/libro-1" });
}

describe("BookDetailPage", () => {
  beforeEach(() => {
    invalidarCatalogo();
    vi.mocked(getLibro).mockResolvedValue(unLibro());
    vi.mocked(getResenas).mockResolvedValue(unaPagina([unaResena()]));
    vi.mocked(getResumenDeResenas).mockResolvedValue({ promedio: 5, total: 1 });
    vi.mocked(getFavoritos).mockResolvedValue([]);
  });

  it("muestra la puntuacion que calcula la API", async () => {
    vi.mocked(getResumenDeResenas).mockResolvedValue({ promedio: 4.6, total: 11 });

    verLaFicha();

    expect(await screen.findByText("4.6")).toBeInTheDocument();
  });

  it("muestra la puntuacion aunque haya mas resenas que las de una pagina", async () => {
    /*
     * La regresion del hallazgo 5. El promedio se calculaba sobre las resenas
     * cargadas y solo se mostraba con todas presentes, asi que un libro con mas
     * de diez no mostraba ni estrellas ni promedio hasta clickear "Ver mas"
     * hasta el final. Se cambio un dato incorrecto por ningun dato.
     */
    const diez = Array.from({ length: 10 }, (_, i) =>
      unaResena({ id: `resena-${i}`, usuarioId: `usuario-${i}`, puntuacion: 5 })
    );
    vi.mocked(getResenas).mockResolvedValue(unaPagina(diez, 12));
    vi.mocked(getResumenDeResenas).mockResolvedValue({ promedio: 4.3, total: 12 });

    verLaFicha();

    expect(await screen.findByText("4.3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver más reseñas/ })).toBeInTheDocument();
  });

  it("un libro sin resenas no muestra promedio", async () => {
    vi.mocked(getResenas).mockResolvedValue(unaPagina([], 0));
    vi.mocked(getResumenDeResenas).mockResolvedValue({ promedio: null, total: 0 });

    verLaFicha();

    expect(await screen.findByText("Sin reseñas todavía")).toBeInTheDocument();
    expect(screen.queryByText(/reseñas$/)).not.toBeInTheDocument();
  });

  it("si el resumen falla no se inventa un promedio con lo que haya cargado", async () => {
    vi.mocked(getResumenDeResenas).mockRejectedValue(new Error("500"));

    verLaFicha();

    await screen.findByRole("heading", { name: "Rayuela", level: 1 });
    expect(screen.queryByText("5.0")).not.toBeInTheDocument();
  });

  it("al publicar una resena vuelve a pedir el promedio, no lo recalcula", async () => {
    iniciarSesion();
    vi.mocked(createResena).mockResolvedValue(
      unaResena({ id: "resena-nueva", puntuacion: 1, comentario: "No me gustó" })
    );
    vi.mocked(getResumenDeResenas)
      .mockResolvedValueOnce({ promedio: 5, total: 1 })
      .mockResolvedValueOnce({ promedio: 3, total: 2 });

    verLaFicha();
    await screen.findByText("5.0");

    await userEvent.click(screen.getByRole("button", { name: "Publicar reseña" }));

    expect(await screen.findByText("3.0")).toBeInTheDocument();
  });

  it("borrar el libro deja el catalogo cacheado sin el y vuelve a la home", async () => {
    /*
     * Hallazgo 9. El borrado no tocaba el cache, asi que volver a la home
     * mostraba el libro y clickearlo llevaba a "No encontramos este libro".
     * Ademas navigate(-1) no hacia nada si la ficha se habia abierto por link
     * directo: el admin quedaba parado en el libro que acababa de borrar.
     */
    iniciarSesion("ROLE_ADMIN");
    guardarCatalogo([unLibro()], [unaCategoria()]);
    vi.mocked(deleteLibro).mockResolvedValue(undefined);

    verLaFicha();
    await screen.findByRole("heading", { name: "Rayuela", level: 1 });

    await userEvent.click(screen.getByRole("button", { name: "Opciones del libro" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() => {
      expect(screen.getByTestId("ubicacion")).toHaveTextContent("/");
    });
    expect(screen.getByText("El catálogo")).toBeInTheDocument();
    expect(leerCatalogoVencido()).toBeNull();
  });

  it("un usuario comun no ve el menu de administracion", async () => {
    iniciarSesion("ROLE_USER");

    verLaFicha();
    await screen.findByRole("heading", { name: "Rayuela", level: 1 });

    expect(screen.queryByRole("button", { name: "Opciones del libro" })).not.toBeInTheDocument();
  });
});
